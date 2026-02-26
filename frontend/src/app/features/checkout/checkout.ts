import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { AuthService } from '../../core/services/auth';
import { Cart } from '../../core/interfaces/cart';
import { Subscription } from 'rxjs';
import { ShippingAddress } from '../../core/interfaces/order';
import { User } from '../../core/interfaces/user';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  
  cart: Cart | null = null;
  isLoading: boolean = true;
  isProcessing: boolean = false;
  error: string = '';
  shippingCost: number = 5.00;

  // Order Success State
  orderPlaced: boolean = false;
  placedOrderId: string = '';
  isPaymentProcessing: boolean = false;

  // Form Data
  shippingAddress: ShippingAddress = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  };
  firstName: string = '';
  lastName: string = '';
  saveInfo: boolean = true;
  currentUser: User | null = null;

  // --- NEW: Payment Data ---
  paymentMethod: 'card' | 'wallet' | 'fawry' = 'card';
  mobileNumber: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const profileSub = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.firstName = user.firstName || '';
        this.lastName = user.lastName || '';
        this.applySavedDefaultAddress();
      }
    });
    this.subscriptions.push(profileSub);

    this.authService.getUserProfile().subscribe();
    this.loadCart();
  }

  private getAddressStorageKey(): string {
    const userId = this.currentUser?._id || 'guest';
    return `smartcart_saved_addresses_${userId}`;
  }

  private applySavedDefaultAddress(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.getAddressStorageKey());
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || saved.length === 0) {
        return;
      }

      const defaultAddress = saved.find((address: any) => address.isDefault) || saved[0];
      this.shippingAddress = {
        street: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zip: defaultAddress.zip || '',
        country: defaultAddress.country || ''
      };
    } catch {
      // ignore malformed localStorage payload
    }
  }

  private saveCurrentAddressForNextTime(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentUser?._id || !this.saveInfo) {
      return;
    }

    const normalizedAddress = {
      street: this.shippingAddress.street?.trim() || '',
      city: this.shippingAddress.city?.trim() || '',
      state: this.shippingAddress.state?.trim() || '',
      zip: this.shippingAddress.zip?.trim() || '',
      country: this.shippingAddress.country?.trim() || ''
    };

    if (!normalizedAddress.street || !normalizedAddress.city || !normalizedAddress.country) {
      return;
    }

    try {
      const key = this.getAddressStorageKey();
      const raw = localStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(existing) ? existing : [];

      const duplicateIndex = list.findIndex((address: any) =>
        (address.street || '').trim().toLowerCase() === normalizedAddress.street.toLowerCase() &&
        (address.city || '').trim().toLowerCase() === normalizedAddress.city.toLowerCase() &&
        (address.state || '').trim().toLowerCase() === normalizedAddress.state.toLowerCase() &&
        (address.zip || '').trim().toLowerCase() === normalizedAddress.zip.toLowerCase() &&
        (address.country || '').trim().toLowerCase() === normalizedAddress.country.toLowerCase()
      );

      if (duplicateIndex === -1) {
        list.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          label: `Address ${list.length + 1}`,
          ...normalizedAddress,
          isDefault: list.length === 0
        });
      }

      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // ignore localStorage persistence errors
    }
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cart = res.data;
          if (!this.cart.items || this.cart.items.length === 0) {
            // Cart is empty, redirect to cart page
            this.router.navigate(['/cart']);
            return;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cart details';
        this.isLoading = false;
      }
    });
  }

  getTotal(): number {
    if (!this.cart) return 0;
    const shipping = this.cart.subtotal >= 100 ? 0 : this.shippingCost;
    return this.cart.subtotal + shipping;
  }

  placeOrder(form: any) {
    // 0. Check if cart has items
    if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
      this.error = 'Your cart is empty. Please add items before placing an order.';
      setTimeout(() => this.router.navigate(['/products']), 2000);
      return;
    }

    // 1. Check form validity
    if (form && !form.valid) {
      this.error = 'Please fill in all required fields correctly.';
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    // 2. Basic Validation
    if (!this.shippingAddress.street || !this.shippingAddress.city || !this.shippingAddress.country) {
      this.error = 'Please fill in all required address fields.';
      return;
    }

    if ((this.paymentMethod === 'wallet' || this.paymentMethod === 'fawry') && !this.mobileNumber) {
      this.error = 'Mobile number is required for Wallet and Fawry payments.';
      return;
    }

    this.isProcessing = true;
    this.error = '';
    this.saveCurrentAddressForNextTime();

    // 3. Create Order Only
    this.orderService.createOrder(this.shippingAddress).subscribe({
      next: (orderRes: any) => {
        // Backend returns { success: true, data: {...order} }
        const orderId = orderRes?.data?._id;

        if (orderRes.success && orderId) {
          this.isProcessing = false;
          this.placedOrderId = orderId;
          this.orderPlaced = true;
          
          // Refresh cart to reflect it's now empty
          this.cartService.getCart().subscribe({
            next: (cartRes) => {
              this.cart = cartRes.data;
            }
          });
        } else {
          this.isProcessing = false;
          this.error = 'Failed to create order. Please try again.';
        }
      },
      error: (err) => {
        this.isProcessing = false;
        
        // Provide helpful error messages
        if (err.error?.message === 'Cart is empty') {
          this.error = 'Your cart is empty. Please add items to your cart before placing an order.';
          setTimeout(() => this.router.navigate(['/products']), 2000);
        } else {
          this.error = err.error?.error?.message || 
                       err.error?.message || 
                       err.message || 
                       'Failed to place order. Please check all required fields.';
        }
      }
    });
  }

  completePaymentNow() {
    if (!this.placedOrderId) {
      this.error = 'Order ID not found. Please try again.';
      return;
    }

    // Validate mobile number if wallet or fawry is selected
    if ((this.paymentMethod === 'wallet' || this.paymentMethod === 'fawry')) {
      if (!this.mobileNumber || !this.mobileNumber.trim()) {
        this.error = 'Mobile number is required for Wallet and Fawry payments.';
        return;
      }
      
      // Validate Egyptian mobile format: 01[0125]XXXXXXXX
      const mobileRegex = /^01[0125][0-9]{8}$/;
      if (!mobileRegex.test(this.mobileNumber.trim())) {
        this.error = 'Invalid mobile number. Must be Egyptian format: 010/011/012/015 followed by 8 digits (e.g., 01012345678)';
        return;
      }
    }

    this.isPaymentProcessing = true;
    this.error = '';

    // Prepare payment data - only include mobileNumber if it has a value
    const paymentData: any = {
      paymentMethod: this.paymentMethod
    };
    
    if (this.mobileNumber && this.mobileNumber.trim()) {
      paymentData.mobileNumber = this.mobileNumber.trim();
    }

    // Initiate Paymob Payment
    this.orderService.payOrder(this.placedOrderId, paymentData).subscribe({
      next: (payRes: any) => {
        this.isPaymentProcessing = false;

        // Hunt for the URL aggressively
        const paymentUrl = payRes?.url || 
                           payRes?.data?.url || 
                           payRes?.data?.iframeUrl || 
                           payRes?.data?.redirectUrl || 
                           payRes?.iframeUrl || 
                           payRes?.redirectUrl;

        const fawryCode = payRes?.billReference || payRes?.data?.billReference;

        if (paymentUrl) {
          if (isPlatformBrowser(this.platformId)) {
            window.location.href = paymentUrl;
          }
        } else if (fawryCode) {
          alert(`Your Fawry Reference Code is: ${fawryCode}`);
          this.router.navigate(['/account']);
        } else {
          alert('Could not find payment URL. Check console or visit your account.');
          this.router.navigate(['/account']);
        }
      },
      error: (payErr) => {
        this.isPaymentProcessing = false;
        
        // Extract detailed error message
        const errorMsg = payErr.error?.message || 
                         payErr.error?.error?.message || 
                         payErr.message || 
                         'Payment connection failed';
        
        this.error = `${errorMsg}. You can pay later from your account.`;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  goToMyOrders() {
    this.router.navigate(['/account']);
  }
}