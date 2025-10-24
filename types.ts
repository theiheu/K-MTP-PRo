
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
