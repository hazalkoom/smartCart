import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // 1. Added ActivatedRoute
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
export class ProductListComponent implements OnInit {
  
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
    private route: ActivatedRoute, // 2. Injected ActivatedRoute
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }

    // 3. Listen for URL changes (Search & Filters)
    this.route.queryParams.subscribe(params => {
      this.loadProducts(params);
    });
  }

  // 4. Accept params (default to empty object)
  loadProducts(params: any = {}): void {
    this.isLoading = true;
    
    // Pass params to the service (Backend handles ?keyword=...)
    this.productService.getProducts(params).subscribe({
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

    // Get button position for animation
    let button = event.target as HTMLElement;
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
        if (err.status !== 401 && err.status !== 403) {
          alert('Failed to add item to cart. Please try again.');
        }
      }
    });
  }
}