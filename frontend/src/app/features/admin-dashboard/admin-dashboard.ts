import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { OrderService } from '../../core/services/order';
import { UserService } from '../../core/services/user';
import { ProductService } from '../../core/services/product';
import { forkJoin, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  totalProducts: number = 0;
  recentOrders: Order[] = [];
  sparklinePath: string = '';

  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
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
      users: this.userService.getAllUsers({ page: 1, limit: 1 }),
      products: this.productService.getProducts({ page: 1, limit: 1 })
    }).subscribe({
      next: (result: any) => {
        const orders = result.orders.data || [];
        const usersCount = this.extractTotalCount(result.users);
        const productsCount = this.extractTotalCount(result.products);

        // Calculate stats
        this.totalOrders = orders.length;
        this.totalUsers = usersCount;
        this.totalProducts = productsCount;
        this.totalRevenue = this.calculateRevenue(orders);
        this.pendingOrders = orders.filter((o: Order) => o.status === 'Pending').length;
        this.sparklinePath = this.generateSparklinePath(orders);

        // Get recent 5 orders
        this.recentOrders = orders.slice(0, 5);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (!environment.production) console.error('Error loading dashboard data:', error);
        this.errorMessage = error?.error?.message || 'Failed to load dashboard data';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.push(sub);
  }

  private extractTotalCount(response: any): number {
    return response?.total ?? response?.count ?? response?.data?.length ?? 0;
  }

  private calculateRevenue(orders: Order[]): number {
    return orders
      .filter(o => o.status === 'Paid' || o.status === 'Shipped' || o.status === 'Delivered')
      .reduce((sum, order) => sum + ((order.total || order.totalPrice) || 0), 0);
  }

  private generateSparklinePath(orders: Order[]): string {
    const paidStatuses = new Set(['Paid', 'Shipped', 'Delivered']);
    const dayMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dayMap.set(date.toISOString().slice(0, 10), 0);
    }

    orders.forEach((order) => {
      if (!paidStatuses.has(order.status)) return;
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!dayMap.has(day)) return;
      dayMap.set(day, (dayMap.get(day) || 0) + ((order.total || order.totalPrice) || 0));
    });

    const values = Array.from(dayMap.values());
    const maxValue = Math.max(...values, 1);
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - (value / maxValue) * 26;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    });

    return points.length ? `M ${points.join(' L ')}` : '';
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
