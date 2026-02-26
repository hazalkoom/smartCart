import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { Cart as CartInterface, CartItem } from '../../core/interfaces/cart';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit, OnDestroy {
  cart: CartInterface | null = null;
  isLoading: boolean = true;
  error: string = '';
  isUpdating: { [itemId: string]: boolean } = {};
  shippingCost: number = 5.00; // Fixed shipping cost
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if user is authenticated
      const authSub = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
          return;
        }
        // Load cart when authenticated
        this.loadCart();
      });
      this.subscriptions.push(authSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart(): void {
    this.isLoading = true;
    this.error = '';
    
    const cartSub = this.cartService.getCart().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cart = response.data;
        } else {
          this.error = 'Failed to load cart';
        }
        this.isLoading = false;
      },
      error: (err) => {
        if (!environment.production) console.error('Error loading cart:', err);
        this.error = err.error?.message || 'Failed to load cart. Please try again.';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(cartSub);
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (!this.cart || !item._id) return;
    
    // Validate quantity
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    // Check stock availability
    if (item.productId && typeof item.productId === 'object' && 'stock' in item.productId) {
      const product = item.productId as any;
      if (newQuantity > product.stock) {
        this.error = `Only ${product.stock} items available in stock`;
        return;
      }
    }

    // If quantity hasn't changed, don't update
    if (newQuantity === item.quantity) {
      return;
    }

    this.isUpdating[item._id] = true;
    this.error = '';

    const updateSub = this.cartService.updateItemQuantity(item._id, newQuantity).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cart = response.data;
        }
        this.isUpdating[item._id] = false;
      },
      error: (err) => {
        if (!environment.production) console.error('Error updating quantity:', err);
        this.error = err.error?.message || 'Failed to update quantity. Please try again.';
        this.isUpdating[item._id] = false;
        // Reload cart to get correct state
        this.loadCart();
      }
    });
    this.subscriptions.push(updateSub);
  }

  removeItem(itemId: string): void {
    if (!this.cart) return;

    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    this.isUpdating[itemId] = true;
    this.error = '';

    const removeSub = this.cartService.removeItem(itemId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cart = response.data;
        }
        this.isUpdating[itemId] = false;
      },
      error: (err) => {
        if (!environment.production) console.error('Error removing item:', err);
        this.error = err.error?.message || 'Failed to remove item. Please try again.';
        this.isUpdating[itemId] = false;
        // Reload cart to get correct state
        this.loadCart();
      }
    });
    this.subscriptions.push(removeSub);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity(item, item.quantity - 1);
    }
  }

  increaseQuantity(item: CartItem): void {
    const maxStock = this.getProductStock(item);
    if (item.quantity < maxStock) {
      this.updateQuantity(item, item.quantity + 1);
    }
  }

  getTotal(): number {
    if (!this.cart) return 0;
    // Free shipping if subtotal >= 100
    const shipping = this.cart.subtotal >= 100 ? 0 : this.shippingCost;
    return this.cart.subtotal + shipping;
}

  getProductName(item: CartItem): string {
    if (item.productId && typeof item.productId === 'object' && 'name' in item.productId) {
      return (item.productId as any).name;
    }
    return 'Unknown Product';
  }

  getProductImage(item: CartItem): string {
    if (item.productId && typeof item.productId === 'object' && 'images' in item.productId) {
      const images = (item.productId as any).images;
      if (images && images.length > 0) {
        return images[0];
      }
    }
    return 'assets/images/default.png'; // Ensure this image exists or change path
  }

  getProductSlug(item: CartItem): string {
    if (item.productId && typeof item.productId === 'object' && 'slug' in item.productId) {
      return (item.productId as any).slug;
    }
    return '';
  }

  getProductStock(item: CartItem): number {
    if (item.productId && typeof item.productId === 'object' && 'stock' in item.productId) {
      return (item.productId as any).stock;
    }
    return 999; // Default max if stock not available
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  proceedToCheckout(): void {
    if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
      this.error = 'Your cart is empty';
      return;
    }
    this.router.navigate(['/checkout']);
  }
}