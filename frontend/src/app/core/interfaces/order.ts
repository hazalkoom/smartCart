export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
}

export interface OrderItem {
  _id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentId?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  data: Order[];
}

