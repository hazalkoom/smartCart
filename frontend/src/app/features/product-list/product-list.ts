import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Subscription } from 'rxjs';
import { Product } from '../../core/interfaces/product';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit, OnDestroy {
  
  products: Product[] = [];
  categories: any[] = [];
  
  isLoading: boolean = true;
  error: string = '';
  
  // --- FILTER STATE ---
  searchTerm: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedCategories: string[] = [];
  stockStatus: string = '';
  sortOption: string = 'newest';
  
  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  pages: number[] = [];

  private subscriptions: Subscription[] = [];
  private wishlistIds: Set<string> = new Set<string>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
    this.loadWishlistState();

    // URL-Driven State: React to query parameter changes
    const routeSub = this.route.queryParams.subscribe(params => {
      this.searchTerm = params['keyword'] || '';
      this.minPrice = params['minPrice'] ? Number(params['minPrice']) : null;
      this.maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      this.stockStatus = params['stockStatus'] || '';
      this.sortOption = params['sort'] || 'newest';
      this.currentPage = params['page'] ? Number(params['page']) : 1;
      
      if (params['category']) {
        this.selectedCategories = params['category'].split(',');
      } else {
        this.selectedCategories = [];
      }
      
      this.fetchProducts();
    });
    this.subscriptions.push(routeSub);
  }

  fetchCategories(): void {
    // Fetch directly to avoid requiring a separate CategoryService for this file
    this.http.get<{success: boolean, data: any[]}>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        if (res.success) this.categories = res.data;
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadWishlistState(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      if (user && user.wishlist) {
        const normalized = user.wishlist.map((item: any) => typeof item === 'string' ? item : item?._id).filter(id => !!id);
        this.wishlistIds = new Set<string>(normalized);
      } else {
        this.wishlistIds = new Set<string>();
      }
    });
    this.subscriptions.push(userSub);
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.error = '';

    // Build params for the backend based on current URL state
    const params: any = {
      page: this.currentPage,
      limit: 12
    };

    if (this.searchTerm) params.keyword = this.searchTerm;
    if (this.minPrice !== null) params.minPrice = this.minPrice;
    if (this.maxPrice !== null) params.maxPrice = this.maxPrice;
    if (this.stockStatus) params.stockStatus = this.stockStatus;
    if (this.sortOption) params.sort = this.sortOption;
    if (this.selectedCategories.length > 0) params.category = this.selectedCategories.join(',');

    // Fallback in case your ProductService method is named getProducts vs getAllProducts
    const fetchMethod = this.productService.getProducts || (this.productService as any).getAllProducts;

    fetchMethod.call(this.productService, params).subscribe({
      next: (res: any) => {
        this.products = res.data || [];
        this.totalItems = res.total || 0;
        this.totalPages = res.pages || 1;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Failed to load products. ' + (err.error?.message || '');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- FILTER UI ACTIONS ---

  applyFilters(): void {
    const queryParams: any = {};
    
    if (this.searchTerm) queryParams.keyword = this.searchTerm;
    if (this.minPrice !== null) queryParams.minPrice = this.minPrice;
    if (this.maxPrice !== null) queryParams.maxPrice = this.maxPrice;
    if (this.stockStatus) queryParams.stockStatus = this.stockStatus;
    if (this.sortOption !== 'newest') queryParams.sort = this.sortOption;
    if (this.selectedCategories.length > 0) queryParams.category = this.selectedCategories.join(',');
    
    queryParams.page = 1; // Reset to first page on filter change

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedCategories = [];
    this.stockStatus = '';
    this.sortOption = 'newest';
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  toggleCategory(categoryId: string): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.applyFilters();
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  getCategoryName(categoryId: string): string {
    const cat = this.categories.find(c => c._id === categoryId);
    return cat ? cat.name : categoryId;
  }

  onSortChange(event: any): void {
    this.sortOption = event.target.value;
    this.applyFilters();
  }

  onStockChange(status: string): void {
    this.stockStatus = status;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page },
      queryParamsHandling: 'merge'
    });
  }

  // --- CART & WISHLIST ---

  addToCart(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const button = target.closest('.cart-btn') as HTMLElement;
    const rect = button?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    this.cartAnimationService.triggerAnimation({
      productId: product._id,
      productImage: product.images && product.images.length > 0 ? product.images[0] : 'assets/images/default.png',
      productName: product.name,
      startX,
      startY
    });

    this.cartService.addItemToCart(product._id, 1).subscribe({
      error: (err) => {
        if (!environment.production) console.error('Error adding to cart:', err);
      }
    });
  }

  isInWishlist(product: Product): boolean {
    return !!product?._id && this.wishlistIds.has(product._id);
  }

  toggleWishlist(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.toggleWishlist(product._id).subscribe({
      next: (res) => {
        const updatedWishlist = res?.data || [];
        const normalized = updatedWishlist.map((item: any) => typeof item === 'string' ? item : item?._id).filter((id: string) => !!id);
        this.wishlistIds = new Set<string>(normalized);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}