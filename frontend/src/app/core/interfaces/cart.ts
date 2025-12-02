import { Product } from './product';

export interface CartItem {
  _id: string;
  productId: Product; // Populated product
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
}

export interface CartResponse {
  success: boolean;
  data: Cart;
  message?: string;
}