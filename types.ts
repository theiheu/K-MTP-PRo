export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Status = 'Đang chờ xử lý' | 'Đã hoàn thành';

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

export type UserRole = 'requester' | 'manager';

export interface User {
  name: string;
  role: UserRole;
  zone?: string; // Khu vực chính của người yêu cầu
}