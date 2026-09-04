export interface ChildComponent {
  variantId: string;
  quantity: number;
}

export interface VariantBatch {
  id: string;
  variantId: string;
  batchCode?: string;
  expiryDate?: string;
  stock: number;
  createdAt: string;
}

export interface Variant {
  id: string;
  attributes: { [key: string]: string };
  stock: number;
  defective_stock?: number;
  repairing_stock?: number;
  batches?: VariantBatch[];
  price?: number;
  images?: string[];
  unit?: string;
  components?: ChildComponent[];
  sku?: string;
}

export type InventoryTransactionType = 'RETURN' | 'RETURN_DEFECTIVE' | 'REPAIR_EXPORT' | 'REPAIR_IMPORT' | 'DISPOSAL';

export interface InventoryTransactionItem {
  variantId: string;
  quantity: number;
  reason?: string;
  productId?: string;
  exchangedAt?: string;
  defectDescription?: string;
  repairNeeds?: string;
  defectImages?: string[];
  sourceRequisitionId?: string;
  // For display
  productName?: string;
  variantAttributes?: { [key: string]: string };
  unit?: string;
}

export interface InventoryTransaction {
  id: string;
  type: InventoryTransactionType;
  status: string;
  items: InventoryTransactionItem[];
  createdBy: string;
  createdAt: string;
  notes?: string;
  referenceId?: string;
}

export type RequisitionPurposeType = 'regular_use' | 'exchange' | 'farm_repair' | 'supplement' | 'other';

export interface RequisitionGroup {
  id: string;
  requisitionId?: string;
  name: string;
  purposeType: RequisitionPurposeType;
  notes?: string;
  neededBy?: string;
  displayOrder: number;
}

export type DefectiveItemState = 'waiting_repair' | 'sent_to_repair' | 'repaired' | 'disposed';

export interface DefectiveItem {
  id: string;
  sourceRequisitionId?: string;
  sourceRequisitionItemId?: string;
  productId: string;
  variantId: string;
  quantity: number;
  exchangedAt?: string;
  defectStatus: string;
  defectDescription?: string;
  repairNeeds?: string;
  images: string[];
  currentState: DefectiveItemState;
  createdBy: string;
  createdAt: string;
  productName?: string;
  variantAttributes?: { [key: string]: string };
  unit?: string;
}

export type RepairBatchStatus = 'draft' | 'sent' | 'partially_returned' | 'completed' | 'cancelled';

export interface RepairBatchItem {
  id: string;
  repairBatchId: string;
  defectiveItemId: string;
  variantId: string;
  quantitySent: number;
  quantityReturned: number;
  quantityDisposed: number;
  returnNotes?: string;
  returnedAt?: string;
  defectiveItem?: DefectiveItem;
  productName?: string;
  variantAttributes?: { [key: string]: string };
  unit?: string;
}

export interface RepairBatch {
  id: string;
  code: string;
  repairVendor?: string;
  sentAt: string;
  expectedReturnAt?: string;
  status: RepairBatchStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: RepairBatchItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[]; // General images, can be overridden by variant
  category: string;
  options: string[]; // e.g., ["Màu sắc", "Kích cỡ"]
  variants: Variant[];
}

export interface Category {
  name: string;
  icon: string; // Sẽ lưu trữ dưới dạng Base64 data URL
}

export interface CartItem {
  product: Product;
  variant: Variant;
  quantity: number;
  groupId?: string;
  groupName?: string;
  purposeType?: RequisitionPurposeType;
  groupNotes?: string;
  neededBy?: string;
  isExchange?: boolean;
  defectNotes?: string;
  defectDescription?: string;
  repairNeeds?: string;
  exchangedAt?: string;
  defectImages?: string[];
}

export type Status = "Đang chờ xử lý" | "Đã duyệt yêu cầu" | "Đã hoàn thành" | "Đã huỷ";

export interface RequisitionForm {
  id: string;
  requesterName: string;
  zone: string;
  purpose: string;
  groups?: RequisitionGroup[];
  items: CartItem[];
  status: Status;
  createdAt: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  fulfillmentNotes?: string;
  receivedBy?: string;
  receivedAt?: string;
  receiveNotes?: string;
}

export type UserRole = "requester" | "manager" | "auditor";

export interface Zone {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface InventoryAuditItem {
  id: string;
  auditId: string;
  productId: string;
  variantId: string;
  systemQuantity: number;
  actualQuantity?: number;
  reason?: string;
  productName?: string;
  variantAttributes?: string;
}

export interface InventoryAudit {
  id: string;
  title: string;
  status: 'Đang kiểm kê' | 'Hoàn thành';
  notes?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  items: InventoryAuditItem[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  zone?: string; // Khu vực chính của người yêu cầu
  username?: string;
  password?: string;
}

// --- START: Thêm mới cho Phiếu Nhập Kho ---
export interface ReceiptItem {
  variantId: string;
  productId: string;
  quantity: number;
  batchCode?: string; // Optional batch identifier
  expiryDate?: string; // Optional expiry date (ISO string)
  // Dùng để hiển thị
  productName?: string;
  variantAttributes?: { [key: string]: string };
  unit?: string;
}

export interface GoodsReceiptNote {
  id: string;
  supplier: string;
  items: ReceiptItem[];
  createdAt: string;
  createdBy: string; // Tên người quản lý đã tạo
  notes?: string;
  linkedRequisitionIds?: string[]; // Lưu ID các phiếu yêu cầu đã được tự động cấp phát
}

export type AdminTab = "dashboard" | "products" | "categories" | "zones" | "users" | "deliveries" | "inventory_audits" | "defects" | "warehouse_core";

// --- START: Thêm mới cho Phiếu Giao Nhận ---
export type DeliveryStatus = "pending" | "verified" | "rejected";

export interface DeliveryFilter {
  status?: DeliveryStatus | "all";
  dateRange?: {
    start: string;
    end: string;
  };
  shipperId?: string;
  hasIssues?: boolean;
  priority?: "low" | "medium" | "high" | "all";
  tags?: string[];
  search?: string;
  batchId?: string;
}

export interface DeliverySortOptions {
  field: "createdAt" | "expectedDeliveryDate" | "priority" | "status";
  direction: "asc" | "desc";
}

export interface DeliveryHistory {
  timestamp: string;
  action: string;
  user: string;
  notes?: string;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    type?: string;
  };
}

export interface DeliveryVerification {
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
  itemChecks: {
    [itemId: string]: {
      actualQuantity: number;
      hasIssue: boolean;
      issueNote?: string;
      checkedBy: string;
      checkedAt: string;
    };
  };
}

export interface DeliveryStats {
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  withIssuesCount: number;
  completionRate: number;
  averageVerificationTime: number; // in minutes
}

export interface DeliveryNote {
  id: string;
  items: DeliveryItem[];
  receiptId: string; // Reference to the goods receipt note
  shipperId: string; // ID of the shipper delivering the items
  status: DeliveryStatus;
  createdBy: string; // User who created the delivery note
  createdAt: string; // Creation timestamp
  verifiedBy?: string; // User who verified/rejected the delivery
  verifiedAt?: string; // Verification/rejection timestamp
  verificationNotes?: string; // Notes from verification/rejection
  history?: DeliveryHistory[]; // Track changes and actions
  hasIssues?: boolean; // Flag for deliveries with quality issues
  rejectionReason?: string; // Reason for rejection if status is rejected
  tags?: string[]; // Custom tags for better organization
  priority?: "low" | "medium" | "high"; // Priority level
  expectedDeliveryDate?: string; // Expected delivery date
  lastModified?: string; // Last modification timestamp
  verification?: DeliveryVerification; // Detailed verification info
  batchId?: string; // For grouping related deliveries
  processingDuration?: number; // Time taken to process in minutes
  quality?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comments?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
}

export interface DeliveryItem {
  variantId: string;
  productId: string;
  quantity: number;
  actualQuantity?: number; // Actual quantity after verification
  qualityIssue?: boolean; // Whether there are quality issues
  issueNotes?: string; // Notes about quality issues if any
  // For display purposes
  productName?: string;
  variantAttributes?: { [key: string]: string };
  unit?: string;
  // Additional tracking fields
  expectedDeliveryDate?: string;
  receivedDate?: string;
  condition?: "good" | "damaged" | "partial";
  damageDescription?: string;
  replacementNeeded?: boolean;
  qualityChecks?: {
    visualInspection: boolean;
    measurementCheck?: boolean;
    functionalTest?: boolean;
    notes?: string;
  };
  trackingInfo?: {
    location?: string;
    status?: string;
    lastUpdate?: string;
  };
}
// Configuration types
export interface DeliveryConfig {
  autoVerification: {
    enabled: boolean;
    conditions: {
      maxQuantityDiff: number;
      requirePhotos: boolean;
      qualityCheckRequired: boolean;
    };
  };
  notifications: {
    email: boolean;
    inApp: boolean;
    slack?: boolean;
    recipients?: string[];
  };
  qualityControl: {
    requirePhotos: boolean;
    checklistItems: string[];
    minimumInspectionTime: number;
  };
  display: {
    defaultSort: DeliverySortOptions;
    defaultFilter: DeliveryFilter;
    columnsToShow: string[];
    enableBatchOperations: boolean;
  };
}

// --- END: Thêm mới cho Phiếu Giao Nhận ---
