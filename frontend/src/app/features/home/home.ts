import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CategoryService } from '../../core/services/category';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Product } from '../../core/interfaces/product';
import { Category } from '../../core/interfaces/category';

declare var AOS: any;

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
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

    this.categoryService.getCategories().subscribe({
      next: (res) => { this.categories = res.data; }
    });

    this.productService.getProducts().subscribe({
      next: (res) => {
        this.allProducts = res.data;
        this.featuredProducts = res.data.slice(0, 4);
        this.categoryProducts = res.data;
        this.heroProducts = res.data.slice(0, 3);
        
        if (res.data.length > 0) {
          this.bestSellingProduct = res.data[0];
        }

        this.isLoading = false;
        this.refreshAnimations();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onTabChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    
    if (categoryId === 'all') {
      this.categoryProducts = this.allProducts;
    } else {
      this.categoryProducts = this.allProducts.filter(p => p.categoryId && p.categoryId._id === categoryId);
    }

    this.refreshAnimations();
  }

  refreshAnimations() {
    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 100);
    }
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