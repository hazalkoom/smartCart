import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { Cart } from '../../core/interfaces/cart';
import { ShippingAddress } from '../../core/interfaces/order';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {
  
  cart: Cart | null = null;
  isLoading: boolean = true;
  isProcessing: boolean = false;
  error: string = '';
  shippingCost: number = 5.00;

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

  // --- NEW: Payment Data ---
  paymentMethod: 'card' | 'wallet' | 'fawry' = 'card';
  mobileNumber: string = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cart = res.data;
          if (!this.cart.items || this.cart.items.length === 0) {
            this.router.navigate(['/cart']);
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

  placeOrder() {
    // 1. Basic Validation
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

    // 2. Create Order
    this.orderService.createOrder(this.shippingAddress).subscribe({
      next: (orderRes: any) => {
        const orderId = orderRes?.data?._id || orderRes?.order?._id || orderRes?._id;

        if (orderRes.success && orderId) {
          // 3. Initiate Paymob Payment
          this.orderService.payOrder(orderId, {
            paymentMethod: this.paymentMethod,
            mobileNumber: this.mobileNumber
          }).subscribe({
            next: (payRes: any) => {
              this.isProcessing = false;
              this.cartService.getCart().subscribe(); // Refresh cart
              
              console.log('🔥 BACKEND PAYMENT RESPONSE:', payRes);

              // Hunt for the URL aggressively
              const paymentUrl = payRes?.url || 
                                 payRes?.data?.url || 
                                 payRes?.data?.iframeUrl || 
                                 payRes?.data?.redirectUrl || 
                                 payRes?.iframeUrl || 
                                 payRes?.redirectUrl;

              const fawryCode = payRes?.billReference || payRes?.data?.billReference;

              if (paymentUrl) {
                window.location.href = paymentUrl;
              } else if (fawryCode) {
                alert(`Your Fawry Reference Code is: ${fawryCode}`);
                this.router.navigate(['/account']);
              } else {
                alert('Order placed successfully, but frontend could not find the payment URL. Check F12 Console.');
                this.router.navigate(['/account']);
              }
            },
            error: (payErr) => {
              this.isProcessing = false;
              console.error('Payment Error:', payErr);
              this.error = 'Order created, but payment connection failed. You can pay later from your account.';
              setTimeout(() => this.router.navigate(['/account']), 3000);
            }
          });
        } else {
          this.isProcessing = false;
          this.cartService.getCart().subscribe();
          alert('Order placed successfully! Please visit your account to complete payment.');
          this.router.navigate(['/account']);
        }
      },
      error: (err) => {
        console.error('Order Creation Error:', err);
        this.isProcessing = false;
        this.error = err.error?.error?.message || err.error?.message || 'Failed to place order.';
      }
    });
  }
}