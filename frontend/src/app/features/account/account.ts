import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { OrderService } from '../../core/services/order';
import { User } from '../../core/interfaces/user';
import { Order } from '../../core/interfaces/order';

@Component({
  selector: 'app-account',
  standalone: false,
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit, OnDestroy {
  user: User | null = null;
  orders: Order[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if user is logged in
      const authSub = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if (!isLoggedIn) {
          // Redirect to login if not authenticated
          this.router.navigate(['/login']);
          return;
        }
        // Fetch user profile and orders
        this.loadUserData();
      });
      this.subscriptions.push(authSub);

      // Subscribe to current user updates
      const userSub = this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
        }
      });
      this.subscriptions.push(userSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Fetch user profile
    const profileSub = this.authService.getUserProfile().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
        } else {
          this.errorMessage = 'Failed to load user profile';
        }
        // Don't set isLoading to false here - wait for orders
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        const errorMsg = error.error?.message || error.error?.error?.message || 'Failed to load user profile';
        this.errorMessage = errorMsg;
        // Still try to load orders even if profile fails
      }
    });
    this.subscriptions.push(profileSub);

    // Fetch order history
    const ordersSub = this.orderService.getMyOrders().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.orders = response.data;
        } else {
          if (!this.errorMessage) {
            this.errorMessage = 'Failed to load order history';
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        const errorMsg = error.error?.message || error.error?.error?.message || 'Failed to load order history';
        if (!this.errorMessage) {
          this.errorMessage = errorMsg;
        } else {
          // Append order error if profile error already exists
          this.errorMessage += ' | ' + errorMsg;
        }
        this.isLoading = false;
      }
    });
    this.subscriptions.push(ordersSub);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getOrderStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'shipped') return 'shipped';
    if (statusLower === 'delivered') return 'delivered';
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'paid') return 'paid';
    if (statusLower === 'cancelled') return 'cancelled';
    return '';
  }
}
