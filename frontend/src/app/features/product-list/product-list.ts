import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // 1. Added ActivatedRoute
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Subscription } from 'rxjs';
import { Product } from '../../core/interfaces/product';
import { environment } from '../../../environments/environment';

declare var AOS: any;

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit, OnDestroy {
  
  // Data variables
  products: Product[] = [];
  isLoading: boolean = true;
  error: string = '';
  searchTerm: string = '';
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  readonly pageSize = 12;
  private subscriptions: Subscription[] = [];

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
    const qpSub = this.route.queryParams.subscribe(params => {
      this.searchTerm = params['keyword'] || '';
      this.currentPage = Number(params['page']) > 0 ? Number(params['page']) : 1;
      this.loadProducts(params);
    });
    this.subscriptions.push(qpSub);

    const fragSub = this.route.fragment.subscribe((fragment) => {
      if (fragment === 'products-search-input' && isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          const searchInput = document.querySelector('.products-search-input') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
          }
        }, 0);
      }
    });
    this.subscriptions.push(fragSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSearch(): void {
    const keyword = this.searchTerm.trim();
    const queryParams: Record<string, string | number> = { page: 1 };

    if (keyword) {
      queryParams['keyword'] = keyword;
    }

    this.router.navigate(['/products'], {
      queryParams,
      queryParamsHandling: ''
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    const queryParams: Record<string, string | number> = { page };
    const keyword = this.searchTerm.trim();

    if (keyword) {
      queryParams['keyword'] = keyword;
    }

    this.router.navigate(['/products'], {
      queryParams,
      queryParamsHandling: ''
    });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  // 4. Accept params (default to empty object)
  loadProducts(params: any = {}): void {
    this.isLoading = true;

    const queryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      ...params,
    };
    
    // Pass params to the service (Backend handles ?keyword=...)
    this.productService.getProducts(queryParams).subscribe({
      next: (response) => {
        this.products = response.data;
        this.currentPage = response.page || this.currentPage;
        this.totalPages = response.pages || 1;
        this.totalItems = response.total || response.count || this.products.length;
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
        if (!environment.production) console.error(err);
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
        if (!environment.production) console.error('Error adding to cart:', err);
        if (err.status !== 401 && err.status !== 403) {
          alert('Failed to add item to cart. Please try again.');
        }
      }
    });
  }
}