import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../core/services/order';
import { UserService } from '../../core/services/user';
import { forkJoin, Subscription } from 'rxjs';

interface Order {
  _id: string;
  userId: any;
  status: string;
  total?: number;
  totalPrice?: number;
  createdAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Stats
  totalRevenue: number = 0;
  totalOrders: number = 0;
  totalUsers: number = 0;
  pendingOrders: number = 0;
  recentOrders: Order[] = [];

  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = forkJoin({
      orders: this.orderService.getAllOrders(),
      users: this.userService.getAllUsers({ page: 1, limit: 1 })
    }).subscribe({
      next: (result: any) => {
        const orders = result.orders.data || [];
        const usersCount = result.users.count ?? (result.users.data || []).length;

        // Calculate stats
        this.totalOrders = orders.length;
        this.totalUsers = usersCount;
        this.totalRevenue = this.calculateRevenue(orders);
        this.pendingOrders = orders.filter((o: Order) => o.status === 'Pending').length;

        // Get recent 5 orders
        this.recentOrders = orders.slice(0, 5);

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboard data:', error);
        this.errorMessage = error?.error?.message || 'Failed to load dashboard data';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  private calculateRevenue(orders: Order[]): number {
    return orders
      .filter(o => o.status === 'Paid' || o.status === 'Shipped' || o.status === 'Delivered')
      .reduce((sum, order) => sum + ((order.total || order.totalPrice) || 0), 0);
  }

  getCustomerName(order: Order): string {
    if (order.userId && typeof order.userId === 'object') {
      return `${order.userId.firstName} ${order.userId.lastName}`;
    }
    return 'N/A';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
