import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { Product } from '../../core/interfaces/product';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {

  product: Product | null = null;
  
  // State for UI
  selectedImage: string = '';
  quantity: number = 1;
  activeTab: string = 'description'; // Simple variable for tabs
  
  isLoading: boolean = true;
  isAddingToCart: boolean = false;
  error: string = '';
  showLoginPrompt: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Listen to URL changes
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  loadProduct(slug: string) {
    this.isLoading = true;
    this.productService.getProduct(slug).subscribe({
      next: (res) => {
        this.product = res.data;
        // Set default image safely
        this.selectedImage = (this.product.images && this.product.images.length > 0) 
          ? this.product.images[0] 
          : 'assets/images/placeholder.jpg';
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Product not found';
        this.isLoading = false;
      }
    });
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  // The "Angular Way" to handle tabs (no document.querySelector needed)
  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  addToCart(event?: Event) {
    if (!this.product) return;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.showLoginPrompt = true;
      return;
    }
    
    this.isAddingToCart = true;
    this.error = '';
    this.showLoginPrompt = false;

    // Get button position for animation if event is provided
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    
    if (event) {
      const button = event.target as HTMLElement;
      const rect = button.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    // Trigger animation
    this.cartAnimationService.triggerAnimation({
      productId: this.product._id,
      productImage: this.product.images && this.product.images.length > 0 ? this.product.images[0] : 'assets/images/default.png',
      productName: this.product.name,
      startX,
      startY
    });

    // Correctly passing ID and subscribing to the Observable
    this.cartService.addItemToCart(this.product._id, this.quantity).subscribe({
      next: (res) => {
        // Success - item added to cart
        this.isAddingToCart = false;
        // Animation is handled by CartAnimationService
      },
      error: (err) => {
        console.error(err);
        this.isAddingToCart = false;
        
        // Check if it's an authentication error
        if (err.status === 401 || err.status === 403) {
          this.showLoginPrompt = true;
          this.error = 'You must be logged in to add items to your cart.';
        } else {
          // Other errors (stock, network, etc.)
          const errorMsg = err.error?.message || err.error?.error?.message || 'Failed to add to cart. Please try again.';
          this.error = errorMsg;
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  dismissLoginPrompt() {
    this.showLoginPrompt = false;
    this.error = '';
  }
}