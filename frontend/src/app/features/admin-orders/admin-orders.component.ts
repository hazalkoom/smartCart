import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../core/services/order';
import { Order } from '../../core/interfaces/order';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-orders',
  standalone: false,
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  allOrders: Order[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  Math = Math;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalOrders: number = 0;
  
  private readonly statusTransitions: Record<Order['status'], Order['status'][]> = {
    Pending: ['Paid', 'Cancelled'],
    Paid: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: [],
  };
  private subscriptions: Subscription[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get totalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const sub = this.orderService.getAllOrders().subscribe({
      next: (response) => {
        this.allOrders = response.data || [];
        this.totalOrders = this.allOrders.length;
        this.applyPagination();
        this.isLoading = false;
      },
      error: (error) => {
        if (!environment.production) console.error('Error fetching orders:', error);
        this.errorMessage = error?.error?.message || 'Failed to load orders';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.orders = this.allOrders.slice(start, end);
  }

  changeStatus(orderId: string, newStatus: string): void {
    if (!newStatus) return;

    const sub = this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = `Order status updated to "${newStatus}"`;
        setTimeout(() => this.successMessage = '', 3000);
        // Update locally without re-fetch
        const order = this.allOrders.find(o => o._id === orderId);
        if (order) order.status = newStatus as any;
        this.applyPagination();
      },
      error: (error) => {
        if (!environment.production) console.error('Error updating status:', error);
        const backendMessage = error?.error?.message;
        this.errorMessage = backendMessage || 'Failed to update order status. Please follow Pending → Paid → Shipped → Delivered.';
      }
    });
    this.subscriptions.push(sub);
  }

  onStatusChange(event: Event, order: Order): void {
    const target = event.target as HTMLSelectElement;
    const requestedStatus = target.value as Order['status'];
    const validationError = this.getStatusTransitionError(order.status, requestedStatus);

    if (validationError) {
      this.errorMessage = validationError;
      target.value = order.status;
      return;
    }

    this.changeStatus(order._id, requestedStatus);
  }

  getAllowedStatusOptions(currentStatus: Order['status']): Order['status'][] {
    const allowedNext = this.statusTransitions[currentStatus] || [];
    return [currentStatus, ...allowedNext];
  }

  private getStatusTransitionError(currentStatus: Order['status'], requestedStatus: Order['status']): string {
    if (requestedStatus === currentStatus) {
      return '';
    }

    const allowedNext = this.statusTransitions[currentStatus] || [];
    if (allowedNext.includes(requestedStatus)) {
      return '';
    }

    const allowedText = allowedNext.length > 0 ? allowedNext.join(' or ') : 'none';
    return `Invalid status transition from ${currentStatus} to ${requestedStatus}. Allowed next status: ${allowedText}.`;
  }

  getCustomerName(order: Order): string {
    if (!order.userId) return 'N/A';
    if (typeof order.userId === 'object' && 'firstName' in order.userId) {
      const user = order.userId as any;
      return `${user.firstName} ${user.lastName}`;
    }
    return order.userId.toString();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'bg-warning text-dark';
      case 'Paid':
        return 'bg-info';
      case 'Shipped':
        return 'bg-primary';
      case 'Delivered':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}

