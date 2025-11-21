export interface User {
    _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin' | 'owner';
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
  message?: string;
}