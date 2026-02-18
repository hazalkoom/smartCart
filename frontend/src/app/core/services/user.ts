import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(params: { page?: number; limit?: number; role?: string } = {}): Observable<UsersResponse> {
    const httpParams = new URLSearchParams();
    if (params.page) httpParams.set('page', params.page.toString());
    if (params.limit) httpParams.set('limit', params.limit.toString());
    if (params.role) httpParams.set('role', params.role);

    const query = httpParams.toString();
    const url = query ? `${this.apiUrl}?${query}` : this.apiUrl;
    return this.http.get<UsersResponse>(url);
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  updateUserRole(id: string, role: string): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, { role });
  }

  deleteUser(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: { firstName: string; lastName: string; email: string; role: string; password: string }): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, userData);
  }

  updateUser(id: string, userData: { firstName?: string; lastName?: string; email?: string; role?: string }): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, userData);
  }
}
