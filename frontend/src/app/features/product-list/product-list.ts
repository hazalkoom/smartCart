import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Product } from '../../core/interfaces/product';

declare var AOS: any;

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  
  // Data variables
  products: Product[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {

    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }

    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
        this.isLoading = false;

        if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
          setTimeout(() => {
            AOS.refresh(); 
          }, 100);
        }
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again later.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  addToCart(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get button position for animation - handle clicks on icon or button
    let button = event.target as HTMLElement;
    // If clicked on icon, get the parent button
    if (button.tagName === 'I' || button.classList.contains('icon')) {
      button = button.closest('button') as HTMLElement || button;
    }
    const rect = button.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Trigger animation
    this.cartAnimationService.triggerAnimation({
      productId: product._id,
      productImage: product.images && product.images.length > 0 ? product.images[0] : 'assets/images/default.png',
      productName: product.name,
      startX,
      startY
    });

    // Add to cart
    this.cartService.addItemToCart(product._id, 1).subscribe({
      next: () => {
        // Animation and cart update handled by service
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        // Don't redirect - let ErrorInterceptor handle auth errors
        // Only show error if it's not an auth error (ErrorInterceptor will handle logout)
        if (err.status !== 401 && err.status !== 403) {
          alert('Failed to add item to cart. Please try again.');
        }
      }
    });
  }
}