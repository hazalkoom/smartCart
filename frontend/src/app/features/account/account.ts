import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  activeTab: 'profile' | 'orders' | 'addresses' = 'profile';
  
  // --- Edit State Variables ---
  isEditing: boolean = false;
  editData = { firstName: '', lastName: '', email: '' };
  updateMessage: string = '';

  // --- REAL ADDRESS STATE ---
  isAddingAddress: boolean = false;
  addressErrorMessage: string = '';
  addressSuccessMessage: string = '';
  
  newAddress: any = {
    alias: 'Home',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const routeSub = this.route.fragment.subscribe(frag => {
      if (frag === 'orders') this.activeTab = 'orders';
      else if (frag === 'addresses') this.activeTab = 'addresses';
      else this.activeTab = 'profile';
    });
    this.subscriptions.push(routeSub);

    const authSub = this.authService.currentUser$.subscribe({
      next: (userData) => {
        this.user = userData;
        if (this.user) {
          this.editData = { 
            firstName: this.user.firstName, 
            lastName: this.user.lastName, 
            email: this.user.email 
          };
          this.fetchOrders();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load user profile.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(authSub);
  }

  fetchOrders(): void {
    const ordersSub = this.orderService.getMyOrders().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.orders = response.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(ordersSub);
  }

  // --- PROFILE METHODS ---
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.updateMessage = '';
    if (!this.isEditing && this.user) {
      this.editData = { 
        firstName: this.user.firstName, 
        lastName: this.user.lastName, 
        email: this.user.email 
      };
    }
  }

  saveProfile(): void {
    this.authService.updateProfile(this.editData).subscribe({
      next: (res) => {
        this.updateMessage = 'Profile updated successfully!';
        this.isEditing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update profile.';
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  // --- ADDRESS METHODS ---
  saveAddress(): void {
    this.addressErrorMessage = '';
    this.addressSuccessMessage = '';

    if (!this.newAddress.street || !this.newAddress.city || !this.newAddress.country || !this.newAddress.postalCode || !this.newAddress.alias) {
      this.addressErrorMessage = 'Please fill out all required fields (*).';
      return;
    }

    this.authService.addAddress(this.newAddress).subscribe({
      next: (res) => {
        this.addressSuccessMessage = 'Address successfully saved to database!';
        this.isAddingAddress = false;
        // Reset form
        this.newAddress = { alias: 'Home', street: '', city: '', state: '', postalCode: '', country: '', isDefault: false };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addressErrorMessage = err.error?.message || 'Failed to save address.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteAddress(addressId: string): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.authService.deleteAddress(addressId).subscribe({
        next: () => {
          this.addressSuccessMessage = 'Address removed.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.addressErrorMessage = 'Failed to delete address.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // --- HELPER METHODS ---
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    return this.orders.filter(order => order.status.toLowerCase() === 'delivered').length;
  }

  getPendingOrdersCount(): number {
    return this.orders.filter(order => order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'paid').length;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}