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
  InventoryAudit,
  InventoryAuditItem,
  InventoryTransaction,
  DefectiveItem,
  RepairBatch,
  RepairBatchStatus
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
        category:categories(name),
        variants(
          *,
          variant_batches(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // Transform data to match Product interface
    return (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      images: p.images || [],
      category: p.category?.name || '',
      options: p.options || [],
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        attributes: v.attributes || {},
        stock: v.stock || 0,
        defective_stock: v.defective_stock || 0,
        repairing_stock: v.repairing_stock || 0,
        price: v.price,
        images: v.images,
        unit: v.unit,
        sku: v.sku,
        min_stock: v.min_stock,
        max_stock: v.max_stock,
        item_type: v.item_type,
        batches: (v.variant_batches || []).map((b: any) => ({
          id: b.id,
          variantId: b.variant_id,
          batchCode: b.batch_code,
          expiryDate: b.expiry_date,
          stock: b.stock,
          createdAt: b.created_at
        }))
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
      defective_stock: v.defective_stock || 0,
      repairing_stock: v.repairing_stock || 0,
      price: v.price,
      images: v.images,
      unit: v.unit,
      sku: v.sku,
      min_stock: v.min_stock || 0,
      max_stock: v.max_stock,
      item_type: v.item_type || 'consumable',
    }));

    const { data: newVariants, error: variantsError } = await supabase
      .from('variants')
      .insert(variantsToInsert)
      .select();

    if (variantsError) throw variantsError;

    // Insert default batches for initial stock
    const batchesToInsert = newVariants
      .filter((v: any) => v.stock > 0)
      .map((v: any) => ({
        variant_id: v.id,
        batch_code: 'DEFAULT',
        stock: v.stock
      }));

    if (batchesToInsert.length > 0) {
      const { error: batchError } = await supabase
        .from('variant_batches')
        .insert(batchesToInsert);
      if (batchError) throw batchError;
    }

    return {
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description || '',
      images: newProduct.images || [],
      category: product.category,
      options: newProduct.options || [],
      variants: (newVariants || []).map((v: any) => ({
        id: v.id,
        attributes: v.attributes || {},
        stock: v.stock || 0,
        defective_stock: v.defective_stock || 0,
        repairing_stock: v.repairing_stock || 0,
        price: v.price,
        images: v.images,
        unit: v.unit,
        sku: v.sku,
        min_stock: v.min_stock,
        max_stock: v.max_stock,
        item_type: v.item_type,
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
      .eq('id', product.id);

    if (productError) throw productError;

    // Delete old variants
    await supabase.from('variants').delete().eq('product_id', product.id);

    // Insert new variants
    const variantsToInsert = product.variants.map((v) => ({
      id: v.id,
      product_id: product.id,
      attributes: v.attributes,
      stock: v.stock,
      defective_stock: v.defective_stock || 0,
      repairing_stock: v.repairing_stock || 0,
      price: v.price,
      images: v.images,
      unit: v.unit,
      sku: v.sku,
      min_stock: v.min_stock || 0,
      max_stock: v.max_stock,
      item_type: v.item_type || 'consumable',
    }));

    const { data: newVariants, error: variantsError } = await supabase
      .from('variants')
      .insert(variantsToInsert)
      .select();

    if (variantsError) throw variantsError;

    // We must restore batches for variants that had them, but since we deleted variants, batches cascade-deleted!
    // This is dangerous. Wait, we deleted variants then re-inserted them with the same IDs.
    // If variant_batches has ON DELETE CASCADE, they are gone.
    // Let's insert back the default batches if they were just set.
    const batchesToInsert = product.variants
      .flatMap(v => {
        if (v.batches && v.batches.length > 0) {
          return v.batches.map(b => ({
            variant_id: v.id,
            batch_code: b.batchCode || 'DEFAULT',
            expiry_date: b.expiryDate || null,
            stock: b.stock
          }));
        } else if (v.stock > 0) {
           return [{
             variant_id: v.id,
             batch_code: 'DEFAULT',
             stock: v.stock
           }];
        }
        return [];
      });

    if (batchesToInsert.length > 0) {
      await supabase.from('variant_batches').insert(batchesToInsert);
    }
  },

  async delete(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  },

  async updateVariantStock(variantId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('variants')
      .update({ stock: newStock })
      .eq('id', variantId);

    if (error) throw error;
  },

  async updateVariantDefectStock(variantId: string, defectiveStock: number, repairingStock: number): Promise<void> {
    const { error } = await supabase
      .from('variants')
      .update({ defective_stock: defectiveStock, repairing_stock: repairingStock })
      .eq('id', variantId);

    if (error) throw error;
  },

  async createOrUpdateBatch(variantId: string, quantity: number, batchCode?: string, expiryDate?: string): Promise<void> {
    const defaultBatchCode = batchCode || 'DEFAULT';

    // Check if batch exists
    let query = supabase.from('variant_batches').select('*').eq('variant_id', variantId).eq('batch_code', defaultBatchCode);
    if (expiryDate) {
      query = query.eq('expiry_date', expiryDate);
    } else {
      query = query.is('expiry_date', null);
    }

    const { data: existingBatches, error: findError } = await query;
    if (findError) throw findError;

    if (existingBatches && existingBatches.length > 0) {
      const batch = existingBatches[0];
      const { error: updateError } = await supabase
        .from('variant_batches')
        .update({ stock: batch.stock + quantity })
        .eq('id', batch.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('variant_batches')
        .insert({
          variant_id: variantId,
          batch_code: defaultBatchCode,
          expiry_date: expiryDate || null,
          stock: quantity
        });
      if (insertError) throw insertError;
    }
  },

  async getBatchesForVariant(variantId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('variant_batches')
      .select('*')
      .eq('variant_id', variantId)
      .gt('stock', 0)
      .order('expiry_date', { ascending: true, nullsFirst: false }); // nullsFirst false means no-expiry goes last

    if (error) throw error;
    return data || [];
  },

  async updateBatchStock(batchId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('variant_batches')
      .update({ stock: newStock })
      .eq('id', batchId);

    if (error) throw error;
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
    // 1. Get the category to delete
    const { data: categoryToDelete } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (!categoryToDelete) return;

    // 2. Ensure fallback category "Vật tư Khác" exists
    let { data: fallbackCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Vật tư Khác')
      .single();

    if (!fallbackCategory) {
      const { data: newFallback } = await supabase
        .from('categories')
        .insert({ name: 'Vật tư Khác', icon: '' })
        .select()
        .single();
      fallbackCategory = newFallback;
    }

    if (fallbackCategory) {
      // 3. Move all products to the fallback category
      await supabase
        .from('products')
        .update({ category_id: fallbackCategory.id })
        .eq('category_id', categoryToDelete.id);
    }

    // 4. Delete the target category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToDelete.id);

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
    let { data: forms, error: formsError } = await supabase
      .from('requisition_forms')
      .select(`
        *,
        requisition_groups(
          id,
          name,
          purpose_type,
          notes,
          needed_by,
          display_order
        ),
        requisition_items(
          id,
          quantity,
          group_id,
          is_exchange,
          defect_notes,
          defect_description,
          repair_needs,
          defect_exchanged_at,
          defect_images,
          product:products(id, name, description, images, options, category:categories(name)),
          variant:variants(id, attributes, stock, price, images, unit)
        )
      `)
      .order('created_at', { ascending: false });

    if (formsError) {
      console.warn('Không tải được nhóm mục đích phiếu yêu cầu, dùng dữ liệu phiếu cũ:', formsError);
      const fallback = await supabase
        .from('requisition_forms')
        .select(`
          *,
          requisition_items(
            id,
            quantity,
            is_exchange,
            defect_notes,
            defect_description,
            repair_needs,
            defect_exchanged_at,
            defect_images,
            product:products(id, name, description, images, options, category:categories(name)),
            variant:variants(id, attributes, stock, price, images, unit)
          )
        `)
        .order('created_at', { ascending: false });

      forms = fallback.data;
      formsError = fallback.error;
    }

    if (formsError) throw formsError;

    // Transform data to match RequisitionForm interface
    return (forms || []).map((f: any) => {
      const groups = (f.requisition_groups || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((group: any) => ({
          id: group.id,
          requisitionId: f.id,
          name: group.name,
          purposeType: group.purpose_type,
          notes: group.notes,
          neededBy: group.needed_by,
          displayOrder: group.display_order,
        }));

      return {
        id: f.id,
        requesterName: f.requester_name,
        zone: f.zone,
        purpose: f.purpose,
        status: f.status,
        createdAt: f.created_at,
        fulfilledBy: f.fulfilled_by,
        fulfilledAt: f.fulfilled_at,
        fulfillmentNotes: f.fulfillment_notes,
        receivedBy: f.received_by,
        receivedAt: f.received_at,
        receiveNotes: f.receive_notes,
        groups,
        items: (f.requisition_items || []).filter((item: any) => item.product && item.variant).map((item: any) => {
          const group = groups.find((entry: any) => entry.id === item.group_id);
          const purposeType = group?.purposeType;
          return {
        product: {
          id: item.product.id,
          name: item.product.name || '(Sản phẩm đã xóa)',
          description: item.product.description || '',
          images: item.product.images || [],
          category: item.product.category?.name || '',
          options: item.product.options || [],
          variants: [],
        },
        variant: {
          id: item.variant.id,
          attributes: item.variant.attributes || {},
          stock: item.variant.stock || 0,
          price: item.variant.price,
          images: item.variant.images,
          unit: item.variant.unit,
        },
        quantity: item.quantity,
        groupId: item.group_id,
        groupName: group?.name,
        purposeType,
        groupNotes: group?.notes,
        neededBy: group?.neededBy,
        isExchange: item.is_exchange,
        defectNotes: item.defect_notes,
        defectDescription: item.defect_description,
        repairNeeds: item.repair_needs,
        exchangedAt: item.defect_exchanged_at,
        defectImages: item.defect_images,
          };
        }),
      };
    });
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
        fulfilled_by: form.fulfilledBy,
        fulfilled_at: form.fulfilledAt,
        fulfillment_notes: form.fulfillmentNotes,
        received_by: form.receivedBy,
        received_at: form.receivedAt,
        receive_notes: form.receiveNotes,
      })
      .select()
      .single();

    if (formError) throw formError;

    const sourceGroups = form.groups && form.groups.length > 0
      ? form.groups
      : Array.from(new Map(form.items.map(item => [
          item.groupId || 'default',
          {
            id: item.groupId || 'default',
            name: item.groupName || 'Sử dụng thường ngày',
            purposeType: item.purposeType || 'regular_use',
            notes: item.groupNotes,
            neededBy: item.neededBy,
            displayOrder: 0,
          },
        ])).values());

    const { data: insertedGroups, error: groupsError } = await supabase
      .from('requisition_groups')
      .insert(sourceGroups.map((group, index) => ({
        requisition_id: newForm.id,
        name: group.name,
        purpose_type: group.purposeType,
        notes: group.notes,
        needed_by: group.neededBy,
        display_order: group.displayOrder ?? index,
      })))
      .select();

    if (groupsError) throw groupsError;

    const groupIdMap = new Map<string, string>();
    sourceGroups.forEach((group, index) => {
      if (insertedGroups?.[index]) {
        groupIdMap.set(group.id, insertedGroups[index].id);
      }
    });

    // Insert requisition items
    const itemsToInsert = form.items.map((item) => ({
      requisition_id: newForm.id,
      group_id: groupIdMap.get(item.groupId || 'default'),
      product_id: item.product.id,
      variant_id: item.variant.id,
      quantity: item.quantity,
      is_exchange: item.isExchange,
      defect_notes: item.defectNotes,
      defect_description: item.defectDescription,
      repair_needs: item.repairNeeds,
      defect_exchanged_at: item.exchangedAt,
      defect_images: item.defectImages,
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
      fulfilledBy: newForm.fulfilled_by,
      fulfilledAt: newForm.fulfilled_at,
      fulfillmentNotes: newForm.fulfillment_notes,
      receivedBy: newForm.received_by,
      receivedAt: newForm.received_at,
      receiveNotes: newForm.receive_notes,
      groups: insertedGroups?.map((group: any) => ({
        id: group.id,
        requisitionId: newForm.id,
        name: group.name,
        purposeType: group.purpose_type,
        notes: group.notes,
        neededBy: group.needed_by,
        displayOrder: group.display_order,
      })) || [],
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

    // 2. Delete all old items/groups to prevent conflicts
    const { error: deleteError } = await supabase
      .from('requisition_items')
      .delete()
      .eq('requisition_id', form.id);

    if (deleteError) throw deleteError;

    const { error: deleteGroupsError } = await supabase
      .from('requisition_groups')
      .delete()
      .eq('requisition_id', form.id);

    if (deleteGroupsError) throw deleteGroupsError;

    const sourceGroups = form.groups && form.groups.length > 0
      ? form.groups
      : Array.from(new Map(form.items.map(item => [
          item.groupId || 'default',
          {
            id: item.groupId || 'default',
            name: item.groupName || 'Sử dụng thường ngày',
            purposeType: item.purposeType || 'regular_use',
            notes: item.groupNotes,
            neededBy: item.neededBy,
            displayOrder: 0,
          },
        ])).values());

    const { data: insertedGroups, error: groupsError } = await supabase
      .from('requisition_groups')
      .insert(sourceGroups.map((group, index) => ({
        requisition_id: form.id,
        name: group.name,
        purpose_type: group.purposeType,
        notes: group.notes,
        needed_by: group.neededBy,
        display_order: group.displayOrder ?? index,
      })))
      .select();

    if (groupsError) throw groupsError;

    const groupIdMap = new Map<string, string>();
    sourceGroups.forEach((group, index) => {
      if (insertedGroups?.[index]) {
        groupIdMap.set(group.id, insertedGroups[index].id);
      }
    });

    // 3. Insert the new list of items
    if (form.items.length > 0) {
      const itemsToInsert = form.items.map((item) => ({
        requisition_id: form.id,
        group_id: groupIdMap.get(item.groupId || 'default'),
        product_id: item.product.id,
        variant_id: item.variant.id,
        quantity: item.quantity,
        is_exchange: item.isExchange,
        defect_notes: item.defectNotes,
        defect_description: item.defectDescription,
        repair_needs: item.repairNeeds,
        defect_exchanged_at: item.exchangedAt,
        defect_images: item.defectImages,
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
        status: 'Đã duyệt yêu cầu',
        fulfilled_by: details.fulfillerName,
        fulfillment_notes: details.notes,
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', formId);

    if (error) throw error;
  },

  async confirmReceipt(formId: string, receivedBy: string, receiveNotes: string): Promise<void> {
    const { error } = await supabase
      .from('requisition_forms')
      .update({
        status: 'Đã hoàn thành',
        received_by: receivedBy,
        receive_notes: receiveNotes,
        received_at: new Date().toISOString(),
      })
      .eq('id', formId);

    if (error) throw error;
  },

  async delete(formId: string): Promise<void> {
    // First, delete associated items to be safe
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
// RECEIPTS SERVICE
// =====================================================

export const receiptsService = {
  async getAll(): Promise<GoodsReceiptNote[]> {
    const { data: receipts, error: receiptsError } = await supabase
      .from('goods_receipt_notes')
      .select(`
        *,
        receipt_items(
          id,
          product_id,
          variant_id,
          quantity,
          product:products(id, name),
          variant:variants(id, attributes, unit)
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
        variantId: item.variant_id,
        productId: item.product_id,
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
      product_id: item.productId,
      variant_id: item.variantId,
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

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('goods_receipt_notes').delete().eq('id', id);
    if (error) throw error;
  },

  async update(id: string, updates: any): Promise<void> {
    const { error } = await supabase.from('goods_receipt_notes').update(updates).eq('id', id);
    if (error) throw error;
  }
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
          id,
          product_id,
          variant_id,
          quantity,
          actual_quantity,
          quality_issue,
          issue_notes,
          expected_delivery_date,
          received_date,
          condition,
          damage_description,
          replacement_needed,
          quality_checks,
          tracking_info,
          product:products(id, name),
          variant:variants(id, attributes, unit)
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
        variantId: item.variant_id,
        productId: item.product_id,
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
      product_id: item.productId,
      variant_id: item.variantId,
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
// INVENTORY AUDITS SERVICE
// =====================================================

export const inventoryAuditsService = {
  async getAll(): Promise<InventoryAudit[]> {
    const { data: audits, error } = await supabase
      .from('inventory_audits')
      .select(`
        *,
        inventory_audit_items(
          id,
          audit_id,
          product_id,
          variant_id,
          system_quantity,
          actual_quantity,
          reason,
          product:products(id, name),
          variant:variants(id, attributes)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (audits || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      notes: a.notes,
      createdBy: a.created_by,
      createdAt: a.created_at,
      completedAt: a.completed_at,
      items: (a.inventory_audit_items || []).map((item: any) => ({
        id: item.id,
        auditId: item.audit_id,
        productId: item.product_id,
        variantId: item.variant_id,
        systemQuantity: item.system_quantity,
        actualQuantity: item.actual_quantity,
        reason: item.reason,
        productName: item.product?.name,
        variantAttributes: item.variant?.attributes,
      })),
    }));
  },

  async create(audit: Omit<InventoryAudit, 'id' | 'createdAt' | 'items'>, items: Omit<InventoryAuditItem, 'id' | 'auditId'>[]): Promise<InventoryAudit> {
    const { data: newAudit, error: auditError } = await supabase
      .from('inventory_audits')
      .insert({
        title: audit.title,
        status: audit.status,
        notes: audit.notes,
        created_by: audit.createdBy,
      })
      .select()
      .single();

    if (auditError) throw auditError;

    const itemsToInsert = items.map(item => ({
      audit_id: newAudit.id,
      product_id: item.productId,
      variant_id: item.variantId,
      system_quantity: item.systemQuantity,
      actual_quantity: item.actualQuantity,
      reason: item.reason,
    }));

    const { error: itemsError } = await supabase
      .from('inventory_audit_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return this.getById(newAudit.id);
  },

  async getById(id: string): Promise<InventoryAudit> {
    const { data, error } = await supabase
      .from('inventory_audits')
      .select(`
        *,
        inventory_audit_items(
          id,
          audit_id,
          product_id,
          variant_id,
          system_quantity,
          actual_quantity,
          reason,
          product:products(id, name),
          variant:variants(id, attributes)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      status: data.status,
      notes: data.notes,
      createdBy: data.created_by,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      items: (data.inventory_audit_items || []).map((item: any) => ({
        id: item.id,
        auditId: item.audit_id,
        productId: item.product_id,
        variantId: item.variant_id,
        systemQuantity: item.system_quantity,
        actualQuantity: item.actual_quantity,
        reason: item.reason,
        productName: item.product?.name,
        variantAttributes: item.variant?.attributes,
      })),
    };
  },

  async updateItem(itemId: string, actualQuantity: number | null, reason: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_audit_items')
      .update({
        actual_quantity: actualQuantity,
        reason: reason,
      })
      .eq('id', itemId);

    if (error) throw error;
  },

  async complete(auditId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_audits')
      .update({
        status: 'Hoàn thành',
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId);

    if (error) throw error;
  },

  async update(auditId: string, updates: Partial<{ title: string, notes: string }>): Promise<void> {
    const { error } = await supabase
      .from('inventory_audits')
      .update(updates)
      .eq('id', auditId);
    if (error) throw error;
  },

  async delete(auditId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_audits')
      .delete()
      .eq('id', auditId);
    if (error) throw error;
  },
};

// =====================================================
// USERS SERVICE
// =====================================================

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      zone: u.zone,
      username: u.username,
      password: u.password,
    }));
  },

  async login(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found / wrong credentials
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zone: data.zone,
      username: data.username,
      password: data.password,
    };
  },

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
      username: data.username,
      password: data.password,
    };
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        role: user.role,
        zone: user.zone,
        username: user.username,
        password: user.password,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zone: data.zone,
      username: data.username,
      password: data.password,
    };
  },

  async update(id: string, user: Omit<User, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        name: user.name,
        role: user.role,
        zone: user.zone,
        username: user.username,
        password: user.password,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};




// =====================================================
// DEFECTIVE ITEMS AND REPAIR BATCHES SERVICE
// =====================================================

const mapDefectiveItem = (item: any): DefectiveItem => ({
  id: item.id,
  sourceRequisitionId: item.source_requisition_id,
  sourceRequisitionItemId: item.source_requisition_item_id,
  productId: item.product_id,
  variantId: item.variant_id,
  quantity: item.quantity,
  exchangedAt: item.exchanged_at,
  defectStatus: item.defect_status,
  defectDescription: item.defect_description,
  repairNeeds: item.repair_needs,
  images: item.images || [],
  currentState: item.current_state,
  createdBy: item.created_by,
  createdAt: item.created_at,
  productName: item.product?.name,
  variantAttributes: item.variant?.attributes,
  unit: item.variant?.unit,
});

export const defectiveItemsService = {
  async getAll(): Promise<DefectiveItem[]> {
    const { data, error } = await supabase
      .from('defective_items')
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDefectiveItem);
  },

  async createMany(items: Array<Omit<DefectiveItem, 'id' | 'createdAt'>>): Promise<DefectiveItem[]> {
    if (items.length === 0) return [];

    const { data, error } = await supabase
      .from('defective_items')
      .insert(items.map(item => ({
        source_requisition_id: item.sourceRequisitionId,
        source_requisition_item_id: item.sourceRequisitionItemId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        exchanged_at: item.exchangedAt,
        defect_status: item.defectStatus,
        defect_description: item.defectDescription,
        repair_needs: item.repairNeeds,
        images: item.images || [],
        current_state: item.currentState,
        created_by: item.createdBy,
      })))
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `);

    if (error) throw error;

    return (data || []).map(mapDefectiveItem);
  },

  async updateState(id: string, currentState: DefectiveItem['currentState']): Promise<void> {
    const { error } = await supabase
      .from('defective_items')
      .update({ current_state: currentState })
      .eq('id', id);

    if (error) throw error;
  },
};

export const repairBatchesService = {
  async getAll(): Promise<RepairBatch[]> {
    const { data, error } = await supabase
      .from('repair_batches')
      .select(`
        *,
        repair_batch_items(
          *,
          defective_item:defective_items(
            *,
            product:products(id, name),
            variant:variants(id, attributes, unit)
          ),
          variant:variants(id, attributes, unit)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((batch: any) => ({
      id: batch.id,
      code: batch.code,
      repairVendor: batch.repair_vendor,
      sentAt: batch.sent_at,
      expectedReturnAt: batch.expected_return_at,
      status: batch.status,
      notes: batch.notes,
      createdBy: batch.created_by,
      createdAt: batch.created_at,
      items: (batch.repair_batch_items || []).map((item: any) => ({
        id: item.id,
        repairBatchId: item.repair_batch_id,
        defectiveItemId: item.defective_item_id,
        variantId: item.variant_id,
        quantitySent: item.quantity_sent,
        quantityReturned: item.quantity_returned,
        quantityDisposed: item.quantity_disposed,
        returnNotes: item.return_notes,
        returnedAt: item.returned_at,
        defectiveItem: item.defective_item ? mapDefectiveItem(item.defective_item) : undefined,
        productName: item.defective_item?.product?.name,
        variantAttributes: item.variant?.attributes,
        unit: item.variant?.unit,
      })),
    }));
  },

  async create(batch: Omit<RepairBatch, 'id' | 'createdAt' | 'items'>, items: Array<{ defectiveItemId: string; variantId: string; quantitySent: number }>): Promise<RepairBatch> {
    const { data: newBatch, error: batchError } = await supabase
      .from('repair_batches')
      .insert({
        code: batch.code,
        repair_vendor: batch.repairVendor,
        sent_at: batch.sentAt,
        expected_return_at: batch.expectedReturnAt,
        status: batch.status,
        notes: batch.notes,
        created_by: batch.createdBy,
      })
      .select()
      .single();

    if (batchError) throw batchError;

    const { error: itemsError } = await supabase
      .from('repair_batch_items')
      .insert(items.map(item => ({
        repair_batch_id: newBatch.id,
        defective_item_id: item.defectiveItemId,
        variant_id: item.variantId,
        quantity_sent: item.quantitySent,
      })));

    if (itemsError) throw itemsError;

    const allBatches = await this.getAll();
    return allBatches.find(item => item.id === newBatch.id)!;
  },

  async updateItem(id: string, updates: { quantityReturned?: number; quantityDisposed?: number; returnNotes?: string; returnedAt?: string }): Promise<void> {
    const { error } = await supabase
      .from('repair_batch_items')
      .update({
        quantity_returned: updates.quantityReturned,
        quantity_disposed: updates.quantityDisposed,
        return_notes: updates.returnNotes,
        returned_at: updates.returnedAt,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async updateStatus(id: string, status: RepairBatchStatus): Promise<void> {
    const { error } = await supabase
      .from('repair_batches')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },
};

// =====================================================
// INVENTORY TRANSACTIONS SERVICE
// =====================================================

export const inventoryTransactionsService = {
  async getAll(): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items,
      createdBy: t.created_by,
      createdAt: t.created_at,
      notes: t.notes,
      referenceId: t.reference_id
    }));
  },

  async create(transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert({
        type: transaction.type,
        status: transaction.status,
        items: transaction.items,
        created_by: transaction.createdBy,
        notes: transaction.notes,
        reference_id: transaction.referenceId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      status: data.status,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
      createdBy: data.created_by,
      createdAt: data.created_at,
      notes: data.notes,
      referenceId: data.reference_id
    };
  }
};
