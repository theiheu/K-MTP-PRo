export interface ChildComponent {
  variantId: number;
  quantity: number;
}

export interface Variant {
  id: number;
  attributes: { [key: string]: string }; // e.g., { "Màu sắc": "Đen", "Kích cỡ": "L" }
  stock: number;
  price?: number;
  images?: string[]; // Specific images for this variant
  unit?: string;
  components?: ChildComponent[];
}

export interface Product {
  id: number;
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
}

export type Status = "Đang chờ xử lý" | "Đã hoàn thành";

export interface RequisitionForm {
  id: string;
  requesterName: string;
  zone: string;
  purpose: string;
  items: CartItem[];
  status: Status;
  createdAt: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  fulfillmentNotes?: string;
}

export type UserRole = "requester" | "manager";

export interface Zone {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  zone?: string; // Khu vực chính của người yêu cầu
}

// --- START: Thêm mới cho Phiếu Nhập Kho ---
export interface ReceiptItem {
  variantId: number;
  productId: number;
  quantity: number;
  // Dùng để hiển thị, không lưu vào localStorage
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

export type AdminTab = "products" | "categories" | "zones";
// --- END: Thêm mới cho Phiếu Nhập Kho ---
