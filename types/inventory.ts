export type WarehouseType = 'main' | 'zone' | 'repair_vendor';

export type InventoryItemType = 'consumable' | 'returnable' | 'repairable' | 'asset';

export type InventoryDocumentType =
  | 'stock_receipt'
  | 'stock_issue'
  | 'requisition'
  | 'return_to_warehouse'
  | 'defective_return'
  | 'repair_issue'
  | 'repair_return'
  | 'stock_audit'
  | 'stock_adjustment'
  | 'disposal';

export type InventoryDocumentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reserved'
  | 'partially_issued'
  | 'issued'
  | 'partially_received'
  | 'received'
  | 'counting'
  | 'posted'
  | 'completed'
  | 'cancelled';

export type StockMovementType =
  | 'IN'
  | 'OUT'
  | 'RESERVE'
  | 'UNRESERVE'
  | 'TRANSFER'
  | 'RETURN'
  | 'RETURN_DEFECTIVE'
  | 'REPAIR_OUT'
  | 'REPAIR_IN'
  | 'ADJUST'
  | 'DISPOSAL';

export type StockBalanceState =
  | 'available'
  | 'reserved'
  | 'issued'
  | 'defective'
  | 'repairing'
  | 'disposed';

export type InventoryItemCondition =
  | 'good'
  | 'defective'
  | 'damaged'
  | 'repaired'
  | 'disposed';

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  zoneId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDocument {
  id: string;
  documentCode: string;
  documentType: InventoryDocumentType;
  status: InventoryDocumentStatus | string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  supplierId?: string;
  zoneId?: string;
  requesterId?: string;
  requesterName?: string;
  createdBy?: string;
  approvedBy?: string;
  fulfilledBy?: string;
  receivedBy?: string;
  documentDate: string;
  neededBy?: string;
  approvedAt?: string;
  fulfilledAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  createdAt: string;
  updatedAt: string;
  items?: InventoryDocumentItem[];
  events?: DocumentEvent[];
}

export interface InventoryDocumentItem {
  id: string;
  documentId: string;
  productId: string;
  variantId: string;
  quantityRequested?: number;
  quantityApproved?: number;
  quantityIssued?: number;
  quantityReceived?: number;
  unit?: string;
  unitPrice?: number;
  batchCode?: string;
  expiryDate?: string;
  condition: InventoryItemCondition;
  purposeType?: string;
  reason?: string;
  notes?: string;
  displayOrder: number;
  metadata: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  createdAt: string;
  productName?: string;
  variantAttributes?: Record<string, string>;
}

export interface StockMovement {
  id: string;
  documentId: string;
  documentItemId?: string;
  movementType: StockMovementType;
  productId: string;
  variantId: string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  sourceState?: StockBalanceState;
  destinationState?: StockBalanceState;
  quantity: number;
  batchCode?: string;
  expiryDate?: string;
  unitCost?: number;
  occurredAt: string;
  createdBy?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  productName?: string;
  variantAttributes?: Record<string, string>;
  unit?: string;
}

export interface StockBalance {
  id: string;
  warehouseId: string;
  productId: string;
  variantId: string;
  balanceState: StockBalanceState;
  batchCode?: string;
  expiryDate?: string;
  quantity: number;
  updatedAt: string;
  productName?: string;
  variantAttributes?: Record<string, string>;
  unit?: string;
}

export interface LowStockItem {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  variantId: string;
  variantAttributes: Record<string, string>;
  sku?: string;
  unit?: string;
  itemType: InventoryItemType;
  minStock: number;
  maxStock?: number;
  availableQuantity: number;
  suggestedPurchaseQuantity: number;
  updatedAt: string;
}

export interface LegacyStockReconciliationRow {
  productId: string;
  productName: string;
  variantId: string;
  variantAttributes: Record<string, string>;
  sku?: string;
  unit?: string;
  legacyVariantStock: number;
  coreAvailableStock: number;
  stockDifference: number;
}

export interface DocumentEvent {
  id: string;
  documentId: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  fromStatus?: string;
  toStatus?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InventoryDocumentItemInput {
  productId: string;
  variantId: string;
  quantityRequested?: number;
  quantityApproved?: number;
  quantityIssued?: number;
  quantityReceived?: number;
  unit?: string;
  unitPrice?: number;
  batchCode?: string;
  expiryDate?: string;
  condition?: InventoryItemCondition;
  purposeType?: string;
  reason?: string;
  notes?: string;
  displayOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateInventoryDocumentInput {
  documentType: InventoryDocumentType;
  status?: InventoryDocumentStatus | string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  supplierId?: string;
  zoneId?: string;
  requesterId?: string;
  requesterName?: string;
  createdBy?: string;
  documentDate?: string;
  neededBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  items: InventoryDocumentItemInput[];
}

export interface CreateStockReceiptInput {
  supplierId?: string;
  supplierName?: string;
  destinationLocationId?: string;
  createdBy?: string;
  createdByName?: string;
  documentDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  items: Array<InventoryDocumentItemInput & {
    quantity: number;
  }>;
}

export interface CreateStockIssueInput {
  sourceLocationId?: string;
  zoneId?: string;
  requesterName?: string;
  createdBy?: string;
  createdByName?: string;
  documentDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  allowNegative?: boolean;
  items: Array<InventoryDocumentItemInput & {
    quantity: number;
  }>;
}

export interface CreateStockAdjustmentInput {
  warehouseId?: string;
  createdBy?: string;
  createdByName?: string;
  documentDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  legacyTable?: string;
  legacyId?: string;
  allowNegative?: boolean;
  items: Array<InventoryDocumentItemInput & {
    adjustmentDelta: number;
  }>;
}

export interface PostStockMovementInput {
  documentId: string;
  documentItemId?: string;
  movementType: StockMovementType;
  productId: string;
  variantId: string;
  quantity: number;
  sourceLocationId?: string;
  destinationLocationId?: string;
  sourceState?: StockBalanceState;
  destinationState?: StockBalanceState;
  batchCode?: string;
  expiryDate?: string;
  unitCost?: number;
  createdBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  allowNegative?: boolean;
}

export interface InventoryMovementReportRow {
  productId: string;
  variantId: string;
  productName: string;
  variantAttributes: Record<string, string>;
  unit?: string;
  openingQuantity: number;
  receivedQuantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  defectiveQuantity: number;
  repairedQuantity: number;
  adjustedQuantity: number;
  closingQuantity: number;
}

export interface StockOnHandRow {
  warehouseId: string;
  warehouseName: string;
  warehouseType: WarehouseType;
  productId: string;
  productName: string;
  variantId: string;
  variantAttributes: Record<string, string>;
  sku?: string;
  unit?: string;
  itemType: InventoryItemType;
  minStock: number;
  maxStock?: number;
  balanceState: StockBalanceState;
  batchCode?: string;
  expiryDate?: string;
  quantity: number;
  updatedAt: string;
}

export interface StockCardEntry {
  balance: Array<{
    balanceState: StockBalanceState;
    quantity: number;
    warehouseId: string;
    batchCode?: string;
    expiryDate?: string;
  }>;
  movements: StockMovement[];
}

export const INVENTORY_DOCUMENT_TYPE_LABELS: Record<InventoryDocumentType, string> = {
  stock_receipt: 'Phiếu nhập kho',
  stock_issue: 'Phiếu xuất kho',
  requisition: 'Phiếu yêu cầu',
  return_to_warehouse: 'Phiếu trả kho',
  defective_return: 'Phiếu trả hàng hỏng',
  repair_issue: 'Phiếu xuất sửa chữa',
  repair_return: 'Phiếu nhập hàng đã sửa',
  stock_audit: 'Phiếu kiểm kê',
  stock_adjustment: 'Phiếu điều chỉnh',
  disposal: 'Phiếu thanh lý',
};

export const INVENTORY_DOCUMENT_STATUS_LABELS: Record<InventoryDocumentStatus, string> = {
  draft: 'Nháp',
  submitted: 'Đã gửi',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  reserved: 'Đã giữ hàng',
  partially_issued: 'Đã xuất một phần',
  issued: 'Đã xuất kho',
  partially_received: 'Đã nhận một phần',
  received: 'Đã nhận đủ',
  counting: 'Đang kiểm kê',
  posted: 'Đã ghi sổ',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const STOCK_BALANCE_STATE_LABELS: Record<StockBalanceState, string> = {
  available: 'Có thể cấp phát',
  reserved: 'Đã giữ cho phiếu',
  issued: 'Đã cấp cho khu',
  defective: 'Hàng hỏng',
  repairing: 'Đang sửa',
  disposed: 'Đã thanh lý',
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  IN: 'Nhập kho',
  OUT: 'Xuất kho',
  RESERVE: 'Giữ hàng',
  UNRESERVE: 'Hủy giữ hàng',
  TRANSFER: 'Chuyển kho',
  RETURN: 'Trả về kho',
  RETURN_DEFECTIVE: 'Trả hàng hỏng',
  REPAIR_OUT: 'Xuất đi sửa',
  REPAIR_IN: 'Nhập sau sửa',
  ADJUST: 'Điều chỉnh',
  DISPOSAL: 'Thanh lý',
};

export const INVENTORY_ITEM_TYPE_LABELS: Record<InventoryItemType, string> = {
  consumable: 'Dùng một lần',
  returnable: 'Có thể thu hồi',
  repairable: 'Có thể sửa chữa',
  asset: 'Tài sản',
};
