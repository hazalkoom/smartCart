import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Product } from '../../core/interfaces/product';
import { Subscription } from 'rxjs';
import { Category } from '../../core/interfaces/category';
import { environment } from '../../../environments/environment';

declare var AOS: any;

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  
  allProducts: Product[] = [];
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  categoryProducts: Product[] = [];
  selectedCategory: string = 'all';
  isLoading: boolean = true;
  bestSellingProduct: Product | null = null;
  // --- NEW: Slider Variables ---
  heroProducts: Product[] = [];
  currentSlide: number = 0;

  private readonly catalogLimit = 200;
  private readonly featuredCount = 8;
  private readonly categoryPreviewCount = 8;
  private readonly heroCount = 3;
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init();
    }
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    const catSub = this.categoryService.getCategories().subscribe({
      next: (res) => { this.categories = res.data; }
    });
    this.subscriptions.push(catSub);

    const prodSub = this.productService.getProducts({ limit: this.catalogLimit }).subscribe({
      next: (res) => {
        this.allProducts = res.data;
        const shuffledProducts = this.getShuffledProducts(this.allProducts);
        this.featuredProducts = shuffledProducts.slice(0, this.featuredCount);
        this.categoryProducts = shuffledProducts.slice(0, this.categoryPreviewCount);
        this.heroProducts = shuffledProducts.slice(0, this.heroCount);
        
        if (shuffledProducts.length > 0) {
          this.bestSellingProduct = shuffledProducts[0];
        }

        this.isLoading = false;
        this.refreshAnimations();
      },
      error: (err) => {
        if (!environment.production) console.error(err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(prodSub);
  }

  onTabChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    
    if (categoryId === 'all') {
      this.categoryProducts = this.getShuffledProducts(this.allProducts).slice(0, this.categoryPreviewCount);
    } else {
      const filteredProducts = this.allProducts.filter((product) => this.getCategoryId(product) === categoryId);
      this.categoryProducts = this.getShuffledProducts(filteredProducts).slice(0, this.categoryPreviewCount);
    }

    this.refreshAnimations();
  }

  refreshAnimations() {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 100);
    }
  }

  private getCategoryId(product: Product): string | null {
    if (!product.categoryId) {
      return null;
    }

    if (typeof product.categoryId === 'string') {
      return product.categoryId;
    }

    return product.categoryId._id;
  }

  private getShuffledProducts(products: Product[]): Product[] {
    const shuffled = [...products];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }

  // --- NEW: Slider Logic ---
  nextSlide() {
    if (this.currentSlide < this.heroProducts.length - 1) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0; // Loop back to start
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.heroProducts.length - 1; // Loop to end
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
        if (!environment.production) console.error('Error adding to cart:', err);
        // Don't redirect - let ErrorInterceptor handle auth errors
        // Only show error if it's not an auth error (ErrorInterceptor will handle logout)
        if (err.status !== 401 && err.status !== 403) {
          alert('Failed to add item to cart. Please try again.');
        }
      }
    });
  }

}