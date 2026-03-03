export interface Address {
  _id?: string;
  alias: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string; // Backend uses postalCode, not zip!
  country: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'user' | 'admin' | 'owner';
  token?: string;
  createdAt?: string;
  addresses?: Address[];
  wishlist?: any[];
}

export interface AuthResponse {
  success: boolean;
  data: User & { token: string }; 
  message?: string;
}