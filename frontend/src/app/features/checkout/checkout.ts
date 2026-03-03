import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { AuthService } from '../../core/services/auth';
import { Cart } from '../../core/interfaces/cart';
import { Subscription } from 'rxjs';
import { User, Address } from '../../core/interfaces/user';
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
  shippingAddress: any = {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  };
  
  firstName: string = '';
  lastName: string = '';
  currentUser: User | null = null;

  // --- REAL ADDRESS STATE ---
  savedAddresses: Address[] = [];
  selectedAddressId: string = 'new';

  // --- Payment Data ---
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
        
        // Load real addresses from DB
        this.savedAddresses = user.addresses || [];
        
        // Auto-select default address if exists
        if (this.savedAddresses.length > 0) {
          const defaultAddr = this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0];
          if(defaultAddr && defaultAddr._id) {
            this.selectAddress(defaultAddr._id);
          }
        }
      }
    });
    this.subscriptions.push(profileSub);

    this.authService.getUserProfile().subscribe();
    this.loadCart();
  }

  selectAddress(addressId: string) {
    this.selectedAddressId = addressId;
    if (addressId === 'new') {
      this.shippingAddress = { street: '', city: '', state: '', postalCode: '', country: '' };
    } else {
      const addr = this.savedAddresses.find(a => a._id === addressId);
      if (addr) {
        this.shippingAddress = {
          street: addr.street,
          city: addr.city,
          state: addr.state || '',
          postalCode: addr.postalCode,
          country: addr.country
        };
      }
    }
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cart = res.data;
          if (!this.cart.items || this.cart.items.length === 0) {
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
    if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
      this.error = 'Your cart is empty. Please add items before placing an order.';
      setTimeout(() => this.router.navigate(['/products']), 2000);
      return;
    }

    if (form && !form.valid) {
      this.error = 'Please fill in all required fields correctly.';
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      return;
    }

    if (!this.shippingAddress.street || !this.shippingAddress.city || !this.shippingAddress.country || !this.shippingAddress.postalCode) {
      this.error = 'Please fill in all required address fields.';
      return;
    }

    if ((this.paymentMethod === 'wallet' || this.paymentMethod === 'fawry') && !this.mobileNumber) {
      this.error = 'Mobile number is required for Wallet and Fawry payments.';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    this.orderService.createOrder(this.shippingAddress).subscribe({
      next: (orderRes: any) => {
        const orderId = orderRes?.data?._id;
        if (orderRes.success && orderId) {
          this.isProcessing = false;
          this.placedOrderId = orderId;
          this.orderPlaced = true;
          
          this.cartService.getCart().subscribe({
            next: (cartRes) => this.cart = cartRes.data
          });
        } else {
          this.isProcessing = false;
          this.error = 'Failed to create order. Please try again.';
        }
      },
      error: (err) => {
        this.isProcessing = false;
        if (err.error?.message === 'Cart is empty') {
          this.error = 'Your cart is empty. Please add items to your cart before placing an order.';
          setTimeout(() => this.router.navigate(['/products']), 2000);
        } else {
          this.error = err.error?.error?.message || err.error?.message || err.message || 'Failed to place order.';
        }
      }
    });
  }

  completePaymentNow() {
    if (!this.placedOrderId) {
      this.error = 'Order ID not found. Please try again.';
      return;
    }

    if ((this.paymentMethod === 'wallet' || this.paymentMethod === 'fawry')) {
      if (!this.mobileNumber || !this.mobileNumber.trim()) {
        this.error = 'Mobile number is required for Wallet and Fawry payments.';
        return;
      }
      
      const mobileRegex = /^01[0125][0-9]{8}$/;
      if (!mobileRegex.test(this.mobileNumber.trim())) {
        this.error = 'Invalid mobile number. Must be Egyptian format.';
        return;
      }
    }

    this.isPaymentProcessing = true;
    this.error = '';

    const paymentData: any = { paymentMethod: this.paymentMethod };
    if (this.mobileNumber && this.mobileNumber.trim()) {
      paymentData.mobileNumber = this.mobileNumber.trim();
    }

    this.orderService.payOrder(this.placedOrderId, paymentData).subscribe({
      next: (payRes: any) => {
        this.isPaymentProcessing = false;

        const paymentUrl = payRes?.url || payRes?.data?.url || payRes?.data?.iframeUrl || payRes?.data?.redirectUrl || payRes?.iframeUrl || payRes?.redirectUrl;
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
        const errorMsg = payErr.error?.message || payErr.error?.error?.message || payErr.message || 'Payment connection failed';
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