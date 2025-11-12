import { supabase } from '../lib/supabase';
import type {
  Product,
  Variant,
  Category,
  Zone,
  RequisitionForm,
  GoodsReceiptNote,
  DeliveryNote,
  User,
  CartItem,
} from '../types';

// =====================================================
// PRODUCTS SERVICE
// =====================================================

export const productsService = {
  async getAll(): Promise<Product[]> {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, icon),
        variants(*)
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // Transform data to match Product interface
    return (products || []).map((p: any) => ({
      id: parseInt(p.id, 10),
      name: p.name,
      description: p.description || '',
      images: p.images || [],
      category: p.category?.name || '',
      options: p.options || [],
      variants: (p.variants || []).map((v: any) => ({
        id: parseInt(v.id, 10),
        attributes: v.attributes || {},
        stock: v.stock || 0,
        price: v.price,
        images: v.images,
        unit: v.unit,
      })),
    }));
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    // First, get category_id from category name
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', product.category)
      .single();

    // Insert product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        images: product.images,
        category_id: category?.id,
        options: product.options,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Insert variants
    const variantsToInsert = product.variants.map((v) => ({
      product_id: newProduct.id,
      attributes: v.attributes,
      stock: v.stock,
      price: v.price,
      images: v.images,
      unit: v.unit,
    }));

    const { data: newVariants, error: variantsError } = await supabase
      .from('variants')
      .insert(variantsToInsert)
      .select();

    if (variantsError) throw variantsError;

    return {
      id: parseInt(newProduct.id, 10),
      name: newProduct.name,
      description: newProduct.description || '',
      images: newProduct.images || [],
      category: product.category,
      options: newProduct.options || [],
      variants: (newVariants || []).map((v: any) => ({
        id: parseInt(v.id, 10),
        attributes: v.attributes || {},
        stock: v.stock || 0,
        price: v.price,
        images: v.images,
        unit: v.unit,
      })),
    };
  },

  async update(product: Product): Promise<void> {
    // Get category_id
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', product.category)
      .single();

    // Update product
    const { error: productError } = await supabase
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        images: product.images,
        category_id: category?.id,
        options: product.options,
      })
      .eq('id', product.id.toString());

    if (productError) throw productError;

    // Delete old variants
    await supabase.from('variants').delete().eq('product_id', product.id.toString());

    // Insert new variants
    const variantsToInsert = product.variants.map((v) => ({
      id: v.id.toString(),
      product_id: product.id.toString(),
      attributes: v.attributes,
      stock: v.stock,
      price: v.price,
      images: v.images,
      unit: v.unit,
    }));

    const { error: variantsError } = await supabase
      .from('variants')
      .insert(variantsToInsert);

    if (variantsError) throw variantsError;
  },

  async delete(productId: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId.toString());

    if (error) throw error;
  },

  async updateVariantStock(variantId: number, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('variants')
      .update({ stock: newStock })
      .eq('id', variantId.toString());

    if (error) throw error;
  },

  async delete(formId: string): Promise<void> {
    // First, delete associated items to be safe, in case cascading delete isn't set up.
    const { error: itemsError } = await supabase
      .from('requisition_items')
      .delete()
      .eq('requisition_id', formId);

    if (itemsError) throw itemsError;

    // Then, delete the form itself
    const { error: formError } = await supabase
      .from('requisition_forms')
      .delete()
      .eq('id', formId);

    if (formError) throw formError;
  },
};

// =====================================================
// CATEGORIES SERVICE
// =====================================================

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((c: any) => ({
      name: c.name,
      icon: c.icon || '',
    }));
  },

  async create(category: Category): Promise<void> {
    const { error } = await supabase.from('categories').insert({
      name: category.name,
      icon: category.icon,
    });

    if (error) throw error;
  },

  async update(originalName: string, category: Category): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        icon: category.icon,
      })
      .eq('name', originalName);

    if (error) throw error;
  },

  async delete(categoryName: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('name', categoryName);

    if (error) throw error;
  },

  async reorder(categories: Category[]): Promise<void> {
    const updates = categories.map((cat, index) => ({
      name: cat.name,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('name', update.name);
    }
  },
};

// =====================================================
// ZONES SERVICE
// =====================================================

export const zonesService = {
  async getAll(): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((z: any) => ({
      id: z.id,
      name: z.name,
      description: z.description || '',
      createdAt: z.created_at,
    }));
  },

  async create(zone: Omit<Zone, 'id' | 'createdAt'>): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert({
        name: zone.name,
        description: zone.description,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      createdAt: data.created_at,
    };
  },

  async update(id: string, zone: Omit<Zone, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase
      .from('zones')
      .update({
        name: zone.name,
        description: zone.description,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('zones').delete().eq('id', id);

    if (error) throw error;
  },
};

// =====================================================
// REQUISITIONS SERVICE
// =====================================================

export const requisitionsService = {
  async getAll(): Promise<RequisitionForm[]> {
    const { data: forms, error: formsError } = await supabase
      .from('requisition_forms')
      .select(`
        *,
        requisition_items(
          *,
          product:products(*),
          variant:variants(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (formsError) throw formsError;

    // Transform data to match RequisitionForm interface
    return (forms || []).map((f: any) => ({
      id: f.id,
      requesterName: f.requester_name,
      zone: f.zone,
      purpose: f.purpose,
      status: f.status,
      createdAt: f.created_at,
      fulfilledBy: f.fulfilled_by,
      fulfilledAt: f.fulfilled_at,
      fulfillmentNotes: f.fulfillment_notes,
      items: (f.requisition_items || []).map((item: any) => ({
        product: {
          id: parseInt(item.product.id, 10),
          name: item.product.name,
          description: item.product.description || '',
          images: item.product.images || [],
          category: '', // Will be populated if needed
          options: item.product.options || [],
          variants: [],
        },
        variant: {
          id: parseInt(item.variant.id, 10),
          attributes: item.variant.attributes || {},
          stock: item.variant.stock || 0,
          price: item.variant.price,
          images: item.variant.images,
          unit: item.variant.unit,
        },
        quantity: item.quantity,
      })),
    }));
  },

  async create(form: Omit<RequisitionForm, 'id' | 'createdAt'>): Promise<RequisitionForm> {
    // Insert requisition form
    const { data: newForm, error: formError } = await supabase
      .from('requisition_forms')
      .insert({
        requester_name: form.requesterName,
        zone: form.zone,
        purpose: form.purpose,
        status: form.status,
      })
      .select()
      .single();

    if (formError) throw formError;

    // Insert requisition items
    const itemsToInsert = form.items.map((item) => ({
      requisition_id: newForm.id,
      product_id: item.product.id.toString(),
      variant_id: item.variant.id.toString(),
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('requisition_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return {
      id: newForm.id,
      requesterName: newForm.requester_name,
      zone: newForm.zone,
      purpose: newForm.purpose,
      status: newForm.status,
      createdAt: newForm.created_at,
      items: form.items,
    };
  },

  async update(form: RequisitionForm): Promise<void> {
    // 1. Update the main form details, including the creation date
    const { error: formError } = await supabase
      .from('requisition_forms')
      .update({
        requester_name: form.requesterName,
        zone: form.zone,
        purpose: form.purpose,
        status: form.status,
        created_at: form.createdAt, // Allow admin to change creation date
      })
      .eq('id', form.id);

    if (formError) throw formError;

    // 2. Delete all old items to prevent conflicts
    const { error: deleteError } = await supabase
      .from('requisition_items')
      .delete()
      .eq('requisition_id', form.id);

    if (deleteError) throw deleteError;

    // 3. Insert the new list of items
    if (form.items.length > 0) {
      const itemsToInsert = form.items.map((item) => ({
        requisition_id: form.id,
        product_id: item.product.id.toString(),
        variant_id: item.variant.id.toString(),
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('requisition_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }
  },

  async fulfill(
    formId: string,
    details: { notes: string; fulfillerName: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('requisition_forms')
      .update({
        status: 'Đã hoàn thành',
        fulfilled_by: details.fulfillerName,
        fulfillment_notes: details.notes,
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', formId);

    if (error) throw error;
  },
};

// =====================================================
// RECEIPTS SERVICE
// =====================================================

export const receiptsService = {
  async getAll(): Promise<GoodsReceiptNote[]> {
    const { data: receipts, error: receiptsError } = await supabase
      .from('goods_receipt_notes')
      .select(`
        *,
        receipt_items(
          *,
          product:products(*),
          variant:variants(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (receiptsError) throw receiptsError;

    return (receipts || []).map((r: any) => ({
      id: r.id,
      supplier: r.supplier,
      notes: r.notes,
      createdBy: r.created_by,
      createdAt: r.created_at,
      linkedRequisitionIds: r.linked_requisition_ids || [],
      items: (r.receipt_items || []).map((item: any) => ({
        variantId: parseInt(item.variant_id, 10),
        productId: parseInt(item.product_id, 10),
        quantity: item.quantity,
        productName: item.product?.name,
        variantAttributes: item.variant?.attributes,
        unit: item.variant?.unit,
      })),
    }));
  },

  async create(receipt: Omit<GoodsReceiptNote, 'id' | 'createdAt'>): Promise<GoodsReceiptNote> {
    // Insert receipt
    const { data: newReceipt, error: receiptError } = await supabase
      .from('goods_receipt_notes')
      .insert({
        supplier: receipt.supplier,
        notes: receipt.notes,
        created_by: receipt.createdBy,
        linked_requisition_ids: receipt.linkedRequisitionIds || [],
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // Insert receipt items
    const itemsToInsert = receipt.items.map((item) => ({
      receipt_id: newReceipt.id,
      product_id: item.productId.toString(),
      variant_id: item.variantId.toString(),
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return {
      id: newReceipt.id,
      supplier: newReceipt.supplier,
      notes: newReceipt.notes,
      createdBy: newReceipt.created_by,
      createdAt: newReceipt.created_at,
      linkedRequisitionIds: newReceipt.linked_requisition_ids || [],
      items: receipt.items,
    };
  },
};

// =====================================================
// DELIVERY NOTES SERVICE
// =====================================================

export const deliveryNotesService = {
  async getAll(): Promise<DeliveryNote[]> {
    const { data: notes, error: notesError } = await supabase
      .from('delivery_notes')
      .select(`
        *,
        delivery_items(
          *,
          product:products(*),
          variant:variants(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (notesError) throw notesError;

    return (notes || []).map((n: any) => ({
      id: n.id,
      receiptId: n.receipt_id,
      shipperId: n.shipper_id,
      status: n.status,
      createdBy: n.created_by,
      createdAt: n.created_at,
      verifiedBy: n.verified_by,
      verifiedAt: n.verified_at,
      verificationNotes: n.verification_notes,
      rejectionReason: n.rejection_reason,
      hasIssues: n.has_issues,
      tags: n.tags,
      priority: n.priority,
      expectedDeliveryDate: n.expected_delivery_date,
      lastModified: n.last_modified,
      batchId: n.batch_id,
      processingDuration: n.processing_duration,
      items: (n.delivery_items || []).map((item: any) => ({
        variantId: parseInt(item.variant_id, 10),
        productId: parseInt(item.product_id, 10),
        quantity: item.quantity,
        actualQuantity: item.actual_quantity,
        qualityIssue: item.quality_issue,
        issueNotes: item.issue_notes,
        expectedDeliveryDate: item.expected_delivery_date,
        receivedDate: item.received_date,
        condition: item.condition,
        damageDescription: item.damage_description,
        replacementNeeded: item.replacement_needed,
        qualityChecks: item.quality_checks,
        trackingInfo: item.tracking_info,
        productName: item.product?.name,
        variantAttributes: item.variant?.attributes,
        unit: item.variant?.unit,
      })),
    }));
  },

  async create(note: Omit<DeliveryNote, 'id' | 'createdAt'>): Promise<DeliveryNote> {
    // Insert delivery note
    const { data: newNote, error: noteError } = await supabase
      .from('delivery_notes')
      .insert({
        receipt_id: note.receiptId,
        shipper_id: note.shipperId,
        status: note.status || 'pending',
        created_by: note.createdBy,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Insert delivery items
    const itemsToInsert = note.items.map((item) => ({
      delivery_note_id: newNote.id,
      product_id: item.productId.toString(),
      variant_id: item.variantId.toString(),
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('delivery_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return {
      id: newNote.id,
      receiptId: newNote.receipt_id,
      shipperId: newNote.shipper_id,
      status: newNote.status,
      createdBy: newNote.created_by,
      createdAt: newNote.created_at,
      items: note.items,
    };
  },

  async verify(noteId: string, verifierName: string, notes: string = ''): Promise<void> {
    const { error } = await supabase
      .from('delivery_notes')
      .update({
        status: 'verified',
        verified_by: verifierName,
        verification_notes: notes,
        verified_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (error) throw error;
  },

  async reject(noteId: string, verifierName: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_notes')
      .update({
        status: 'rejected',
        verified_by: verifierName,
        verification_notes: reason,
        rejection_reason: reason,
        verified_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (error) throw error;
  },
};

// =====================================================
// USERS SERVICE
// =====================================================

export const usersService = {
  async getByName(name: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zone: data.zone,
    };
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        role: user.role,
        zone: user.zone,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zone: data.zone,
    };
  },
};

