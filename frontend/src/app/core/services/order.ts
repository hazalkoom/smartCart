import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse, OrdersResponse, ShippingAddress, PaymentRequest, PaymentResponse } from '../interfaces/order';

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

  // GET /api/v1/orders
  // Fetches all orders (admin)
  getAllOrders(page?: number, limit?: number): Observable<OrdersResponse> {
    const params: string[] = [];
    if (page !== undefined) params.push(`page=${page}`);
    if (limit !== undefined) params.push(`limit=${limit}`);

    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<OrdersResponse>(`${this.apiUrl}${query}`);
  }

  // PATCH /api/v1/orders/:id/status
  // Updates an order status (admin)
  updateOrderStatus(orderId: string, status: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiUrl}/${orderId}/status`, { status });
  }

  payOrder(orderId: string, paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/${orderId}/pay`, paymentData);
  }
}
