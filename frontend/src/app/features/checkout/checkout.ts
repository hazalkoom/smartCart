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
  // Helper fields for the form (not sent to API directly, but useful)
  firstName: string = '';
  lastName: string = '';

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
    // We need the cart to show the summary
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cart = res.data;
          
          // Redirect if cart is empty
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
    return (this.cart?.subtotal || 0) + this.shippingCost;
  }

  placeOrder() {
    // 1. Basic Validation
    if (!this.shippingAddress.street || !this.shippingAddress.city || !this.shippingAddress.country) {
      this.error = 'Please fill in all required address fields.';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // 2. Create Order
    this.orderService.createOrder(this.shippingAddress).subscribe({
      next: (res) => {
        this.isProcessing = false;
        if (res.success) {
          // 3. Success! Redirect to Account page (or a Thank You page)
          // We can also clear the local cart state if needed, 
          // but the backend already clears the DB cart.
          // Refreshing the cart service is a good idea:
          this.cartService.getCart().subscribe(); 
          
          alert('Order placed successfully!');
          this.router.navigate(['/account']);
        }
      },
      error: (err) => {
        console.error(err);
        this.isProcessing = false;
        this.error = err.error?.error?.message || 'Failed to place order. Please try again.';
      }
    });
  }
}