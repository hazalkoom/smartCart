import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { OrderService } from '../../core/services/order';
import { User } from '../../core/interfaces/user';
import { Order } from '../../core/interfaces/order';
import { environment } from '../../../environments/environment';

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
  activeTab: 'profile' | 'orders' | 'addresses' = 'profile';
  
  // --- New Edit State Variables ---
  isEditing: boolean = false;
  editData = { firstName: '', lastName: '', email: '' };
  updateMessage: string = '';
  // --------------------------------

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const authSub = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
          return;
        }
        this.loadUserData();
      });
      this.subscriptions.push(authSub);

      const userSub = this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
          // Initialize edit form with current data
          this.resetEditData();
        }
      });
      this.subscriptions.push(userSub);

      const querySub = this.route.queryParamMap.subscribe((params) => {
        const tab = params.get('tab');
        if (tab === 'orders' || tab === 'addresses' || tab === 'profile') {
          this.activeTab = tab;
        }
      });
      this.subscriptions.push(querySub);
    }
  }

  setActiveTab(tab: 'profile' | 'orders' | 'addresses'): void {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- New Toggle Function ---
  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.updateMessage = '';
    this.errorMessage = '';
    
    // If canceling, revert data back to original user data
    if (!this.isEditing) {
      this.resetEditData();
    }
  }

  // --- New Helper to Reset Form Data ---
  private resetEditData() {
    if (this.user) {
      this.editData = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email
      };
    }
  }

  // --- New Update Function ---
  onUpdateProfile() {
    this.updateMessage = '';
    this.errorMessage = '';

    this.authService.updateProfile(this.editData).subscribe({
      next: (res) => {
        if (res.success) {
          this.isEditing = false; // Exit edit mode
          this.updateMessage = 'Profile updated successfully!';
          
          // Clear message after 3 seconds
          setTimeout(() => this.updateMessage = '', 3000);
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update profile';
        this.errorMessage = errorMsg;
      }
    });
  }

  private loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const profileSub = this.authService.getUserProfile().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.resetEditData(); // Ensure form is ready
        } else {
          this.errorMessage = 'Failed to load user profile';
        }
      },
      error: (error) => {
        if (!environment.production) console.error('Error fetching user profile:', error);
        const errorMsg = error.error?.message || 'Failed to load user profile';
        this.errorMessage = errorMsg;
      }
    });
    this.subscriptions.push(profileSub);

    const ordersSub = this.orderService.getMyOrders().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.orders = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        if (!environment.production) console.error('Error fetching orders:', error);
        this.isLoading = false;
        // We don't block the page if orders fail, just log it
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
  
  getInitials(): string {
    if (!this.user) return '?';
    const first = this.user.firstName?.charAt(0) || '';
    const last = this.user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  getDeliveredOrdersCount(): number {
    return this.orders.filter(order => 
      order.status.toLowerCase() === 'delivered'
    ).length;
  }

  getPendingOrdersCount(): number {
    return this.orders.filter(order => 
      order.status.toLowerCase() === 'pending' || 
      order.status.toLowerCase() === 'paid'
    ).length;
  }

  getTotalSpent(): string {
    const total = this.orders.reduce((sum, order) => sum + order.total, 0);
    return total.toFixed(2);
  }
}