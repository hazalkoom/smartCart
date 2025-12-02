import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse, OrdersResponse, ShippingAddress } from '../interfaces/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Points to /api/v1/orders
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // POST /api/v1/orders
  // Sends the address to create a new order
  createOrder(shippingAddress: ShippingAddress): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, { shippingAddress });
  }

  // GET /api/v1/orders/my
  // Fetches the logged-in user's history
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.apiUrl}/my`);
  }

  // GET /api/v1/orders/:id
  // Fetches a single order details
  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${id}`);
  }
}