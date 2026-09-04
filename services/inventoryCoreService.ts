import { supabase } from '../lib/supabase';
import type {
  CreateDefectiveReturnInput,
  CreateDisposalInput,
  CreateInventoryDocumentInput,
  CreateRepairIssueInput,
  CreateRepairReturnInput,
  CreateStockAdjustmentInput,
  CreateStockIssueInput,
  CreateStockReceiptInput,
  DocumentEvent,
  InventoryDocument,
  InventoryDocumentItem,
  LegacyStockReconciliationRow,
  LowStockItem,
  PostStockMovementInput,
  StockBalance,
  StockMovement,
  Supplier,
  Warehouse,
} from '../types/inventory';

type DbRow = Record<string, any>;

const emptyMetadata = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const mapSupplier = (row: DbRow): Supplier => ({
  id: row.id,
  name: row.name,
  phone: row.phone ?? undefined,
  address: row.address ?? undefined,
  notes: row.notes ?? undefined,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapWarehouse = (row: DbRow): Warehouse => ({
  id: row.id,
  name: row.name,
  type: row.type,
  zoneId: row.zone_id ?? undefined,
  notes: row.notes ?? undefined,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapInventoryDocumentItem = (row: DbRow): InventoryDocumentItem => ({
  id: row.id,
  documentId: row.document_id,
  productId: row.product_id,
  variantId: row.variant_id,
  quantityRequested: row.quantity_requested == null ? undefined : Number(row.quantity_requested),
  quantityApproved: row.quantity_approved == null ? undefined : Number(row.quantity_approved),
  quantityIssued: row.quantity_issued == null ? undefined : Number(row.quantity_issued),
  quantityReceived: row.quantity_received == null ? undefined : Number(row.quantity_received),
  unit: row.unit ?? row.variant?.unit ?? undefined,
  unitPrice: row.unit_price == null ? undefined : Number(row.unit_price),
  batchCode: row.batch_code ?? undefined,
  expiryDate: row.expiry_date ?? undefined,
  condition: row.condition,
  purposeType: row.purpose_type ?? undefined,
  reason: row.reason ?? undefined,
  notes: row.notes ?? undefined,
  displayOrder: row.display_order ?? 0,
  metadata: emptyMetadata(row.metadata),
  legacyTable: row.legacy_table ?? undefined,
  legacyId: row.legacy_id ?? undefined,
  createdAt: row.created_at,
  productName: row.product?.name,
  variantAttributes: row.variant?.attributes ?? undefined,
});

const mapDocumentEvent = (row: DbRow): DocumentEvent => ({
  id: row.id,
  documentId: row.document_id,
  eventType: row.event_type,
  actorId: row.actor_id ?? undefined,
  actorName: row.actor_name ?? undefined,
  fromStatus: row.from_status ?? undefined,
  toStatus: row.to_status ?? undefined,
  notes: row.notes ?? undefined,
  metadata: emptyMetadata(row.metadata),
  createdAt: row.created_at,
});

const mapInventoryDocument = (row: DbRow): InventoryDocument => ({
  id: row.id,
  documentCode: row.document_code,
  documentType: row.document_type,
  status: row.status,
  sourceLocationId: row.source_location_id ?? undefined,
  destinationLocationId: row.destination_location_id ?? undefined,
  supplierId: row.supplier_id ?? undefined,
  zoneId: row.zone_id ?? undefined,
  requesterId: row.requester_id ?? undefined,
  requesterName: row.requester_name ?? undefined,
  createdBy: row.created_by ?? undefined,
  approvedBy: row.approved_by ?? undefined,
  fulfilledBy: row.fulfilled_by ?? undefined,
  receivedBy: row.received_by ?? undefined,
  documentDate: row.document_date,
  neededBy: row.needed_by ?? undefined,
  approvedAt: row.approved_at ?? undefined,
  fulfilledAt: row.fulfilled_at ?? undefined,
  receivedAt: row.received_at ?? undefined,
  cancelledAt: row.cancelled_at ?? undefined,
  notes: row.notes ?? undefined,
  metadata: emptyMetadata(row.metadata),
  legacyTable: row.legacy_table ?? undefined,
  legacyId: row.legacy_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: (row.inventory_document_items || []).map(mapInventoryDocumentItem),
  events: (row.document_events || []).map(mapDocumentEvent),
});

const mapStockMovement = (row: DbRow): StockMovement => ({
  id: row.id,
  documentId: row.document_id,
  documentItemId: row.document_item_id ?? undefined,
  movementType: row.movement_type,
  productId: row.product_id,
  variantId: row.variant_id,
  sourceLocationId: row.source_location_id ?? undefined,
  destinationLocationId: row.destination_location_id ?? undefined,
  sourceState: row.source_state ?? undefined,
  destinationState: row.destination_state ?? undefined,
  quantity: Number(row.quantity),
  batchCode: row.batch_code ?? undefined,
  expiryDate: row.expiry_date ?? undefined,
  unitCost: row.unit_cost == null ? undefined : Number(row.unit_cost),
  occurredAt: row.occurred_at,
  createdBy: row.created_by ?? undefined,
  notes: row.notes ?? undefined,
  metadata: emptyMetadata(row.metadata),
  createdAt: row.created_at,
  productName: row.product?.name,
  variantAttributes: row.variant?.attributes ?? undefined,
  unit: row.variant?.unit ?? undefined,
});

const mapStockBalance = (row: DbRow): StockBalance => ({
  id: row.id,
  warehouseId: row.warehouse_id,
  productId: row.product_id,
  variantId: row.variant_id,
  balanceState: row.balance_state,
  batchCode: row.batch_code ?? undefined,
  expiryDate: row.expiry_date ?? undefined,
  quantity: Number(row.quantity),
  updatedAt: row.updated_at,
  productName: row.product?.name,
  variantAttributes: row.variant?.attributes ?? undefined,
  unit: row.variant?.unit ?? undefined,
});

const mapLowStockItem = (row: DbRow): LowStockItem => ({
  warehouseId: row.warehouse_id,
  warehouseName: row.warehouse_name,
  productId: row.product_id,
  productName: row.product_name,
  variantId: row.variant_id,
  variantAttributes: row.variant_attributes ?? {},
  sku: row.sku ?? undefined,
  unit: row.unit ?? undefined,
  itemType: row.item_type,
  minStock: Number(row.min_stock),
  maxStock: row.max_stock == null ? undefined : Number(row.max_stock),
  availableQuantity: Number(row.available_quantity),
  suggestedPurchaseQuantity: Number(row.suggested_purchase_quantity),
  updatedAt: row.updated_at,
});

const mapLegacyStockReconciliationRow = (row: DbRow): LegacyStockReconciliationRow => ({
  productId: row.product_id,
  productName: row.product_name,
  variantId: row.variant_id,
  variantAttributes: row.variant_attributes ?? {},
  sku: row.sku ?? undefined,
  unit: row.unit ?? undefined,
  legacyVariantStock: Number(row.legacy_variant_stock),
  coreAvailableStock: Number(row.core_available_stock),
  stockDifference: Number(row.stock_difference),
});

const documentSelect = `
  *,
  inventory_document_items(
    *,
    product:products(id, name),
    variant:variants(id, attributes, unit)
  ),
  document_events(*)
`;

export const suppliersCoreService = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSupplier);
  },

  async create(input: Pick<Supplier, 'name'> & Partial<Pick<Supplier, 'phone' | 'address' | 'notes'>>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: input.name,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSupplier(data);
  },
};

export const warehousesCoreService = {
  async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapWarehouse);
  },

  async getMainWarehouse(): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('type', 'main')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapWarehouse(data) : null;
  },
};

export const inventoryDocumentsCoreService = {
  async getAll(): Promise<InventoryDocument[]> {
    const { data, error } = await supabase
      .from('inventory_documents')
      .select(documentSelect)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapInventoryDocument);
  },

  async getByType(documentType: string): Promise<InventoryDocument[]> {
    const { data, error } = await supabase
      .from('inventory_documents')
      .select(documentSelect)
      .eq('document_type', documentType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapInventoryDocument);
  },

  async getById(id: string): Promise<InventoryDocument> {
    const { data, error } = await supabase
      .from('inventory_documents')
      .select(documentSelect)
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapInventoryDocument(data);
  },

  async createDraft(input: CreateInventoryDocumentInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc(
      'create_inventory_document',
      {
        p_document_type: input.documentType,
        p_status: input.status || 'draft',
        p_source_location_id: input.sourceLocationId,
        p_destination_location_id: input.destinationLocationId,
        p_supplier_id: input.supplierId,
        p_zone_id: input.zoneId,
        p_requester_id: input.requesterId,
        p_requester_name: input.requesterName,
        p_created_by: input.createdBy,
        p_document_date: documentDate,
        p_needed_by: input.neededBy,
        p_notes: input.notes,
        p_metadata: input.metadata || {},
        p_items: input.items,
        p_legacy_table: input.legacyTable,
        p_legacy_id: input.legacyId,
      }
    );

    if (error) throw error;
    return this.getById(documentId);
  },

  async updateStatus(
    id: string,
    status: string,
    actorId?: string,
    notes?: string
  ): Promise<InventoryDocument> {
    const current = await this.getById(id);
    const { error: updateError } = await supabase
      .from('inventory_documents')
      .update({
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : current.approvedAt,
        fulfilled_at: status === 'issued' ? new Date().toISOString() : current.fulfilledAt,
        received_at: status === 'received' ? new Date().toISOString() : current.receivedAt,
        cancelled_at: status === 'cancelled' ? new Date().toISOString() : current.cancelledAt,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    const { error: eventError } = await supabase
      .from('document_events')
      .insert({
        document_id: id,
        event_type: 'status_changed',
        actor_id: actorId,
        from_status: current.status,
        to_status: status,
        notes,
      });

    if (eventError) throw eventError;
    return this.getById(id);
  },

  async createStockReceipt(input: CreateStockReceiptInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_stock_receipt', {
      p_supplier_id: input.supplierId,
      p_supplier_name: input.supplierName,
      p_destination_location_id: input.destinationLocationId,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createStockIssue(input: CreateStockIssueInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_stock_issue', {
      p_source_location_id: input.sourceLocationId,
      p_zone_id: input.zoneId,
      p_requester_name: input.requesterName,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
      p_allow_negative: input.allowNegative || false,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createStockAdjustment(input: CreateStockAdjustmentInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_stock_adjustment', {
      p_warehouse_id: input.warehouseId,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
      p_allow_negative: input.allowNegative ?? true,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createDefectiveReturn(input: CreateDefectiveReturnInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_defective_return', {
      p_warehouse_id: input.warehouseId,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createRepairIssue(input: CreateRepairIssueInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_repair_issue', {
      p_warehouse_id: input.warehouseId,
      p_destination_location_id: input.destinationLocationId,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createRepairReturn(input: CreateRepairReturnInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_repair_return', {
      p_warehouse_id: input.warehouseId,
      p_source_location_id: input.sourceLocationId,
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
    });

    if (error) throw error;
    return this.getById(documentId);
  },

  async createDisposal(input: CreateDisposalInput): Promise<InventoryDocument> {
    const documentDate = input.documentDate || new Date().toISOString().slice(0, 10);
    const { data: documentId, error } = await supabase.rpc('create_disposal', {
      p_warehouse_id: input.warehouseId,
      p_source_state: input.sourceState || 'defective',
      p_created_by: input.createdBy,
      p_created_by_name: input.createdByName,
      p_document_date: documentDate,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_items: input.items,
      p_legacy_table: input.legacyTable,
      p_legacy_id: input.legacyId,
    });

    if (error) throw error;
    return this.getById(documentId);
  },
};

export const stockCoreService = {
  async postMovement(input: PostStockMovementInput): Promise<string> {
    const { data, error } = await supabase.rpc('post_stock_movement', {
      p_document_id: input.documentId,
      p_document_item_id: input.documentItemId,
      p_movement_type: input.movementType,
      p_product_id: input.productId,
      p_variant_id: input.variantId,
      p_quantity: input.quantity,
      p_source_location_id: input.sourceLocationId,
      p_destination_location_id: input.destinationLocationId,
      p_source_state: input.sourceState,
      p_destination_state: input.destinationState,
      p_batch_code: input.batchCode,
      p_expiry_date: input.expiryDate,
      p_unit_cost: input.unitCost,
      p_created_by: input.createdBy,
      p_notes: input.notes,
      p_metadata: input.metadata || {},
      p_allow_negative: input.allowNegative || false,
    });

    if (error) throw error;
    return data;
  },

  async rebuildBalances(): Promise<void> {
    const { error } = await supabase.rpc('rebuild_stock_balances');
    if (error) throw error;
  },

  async getBalances(): Promise<StockBalance[]> {
    const { data, error } = await supabase
      .from('stock_balances')
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapStockBalance);
  },

  async getVariantMovements(variantId: string): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `)
      .eq('variant_id', variantId)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapStockMovement);
  },

  async getRecentMovements(limit = 80): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name),
        variant:variants(id, attributes, unit)
      `)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapStockMovement);
  },

  async getLowStockItems(): Promise<LowStockItem[]> {
    const { data, error } = await supabase
      .from('low_stock_items')
      .select('*')
      .order('available_quantity', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapLowStockItem);
  },

  async getLegacyStockReconciliation(): Promise<LegacyStockReconciliationRow[]> {
    const { data, error } = await supabase
      .from('inventory_legacy_stock_reconciliation')
      .select('*')
      .neq('stock_difference', 0)
      .order('product_name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapLegacyStockReconciliationRow);
  },
};
