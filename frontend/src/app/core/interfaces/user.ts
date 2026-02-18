export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'user' | 'admin' | 'owner';
  token?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: User & { token: string }; // Token is included in the data object
  message?: string;
}