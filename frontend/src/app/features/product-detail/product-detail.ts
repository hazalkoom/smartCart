import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CartAnimationService } from '../../core/services/cart-animation.service';
import { AuthService } from '../../core/services/auth';
import { ReviewService } from '../../core/services/review';
import { Subscription } from 'rxjs';
import { Product } from '../../core/interfaces/product';
import { Review } from '../../core/interfaces/review';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit, OnDestroy {

  product: Product | null = null;
  
  // State for UI
  selectedImage: string = '';
  quantity: number = 1;
  activeTab: string = 'description'; // Simple variable for tabs
  
  isLoading: boolean = true;
  isAddingToCart: boolean = false;
  error: string = '';
  showLoginPrompt: boolean = false;
  private subscriptions: Subscription[] = [];
  private wishlistIds: Set<string> = new Set<string>();

  // Reviews state
  reviews: Review[] = [];
  reviewsLoading: boolean = false;
  reviewForm = { rating: 0, title: '', comment: '' };
  hoverRating: number = 0;
  isSubmittingReview: boolean = false;
  reviewError: string = '';
  reviewSuccess: string = '';
  currentUserId: string = '';
  currentUserRole: string = '';
  editingReview: Review | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private cartAnimationService: CartAnimationService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe((user: any) => {
      const rawWishlist = user?.wishlist || [];
      const normalized = rawWishlist
        .map((item: any) => (typeof item === 'string' ? item : item?._id))
        .filter((id: string | undefined) => !!id);
      this.wishlistIds = new Set<string>(normalized);
      this.currentUserId = user?._id || '';
      this.currentUserRole = user?.role || '';
    });
    this.subscriptions.push(userSub);

    // Listen to URL changes
    const paramSub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      }
    });
    this.subscriptions.push(paramSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProduct(slug: string) {
    this.isLoading = true;
    this.error = '';
    this.reviewError = '';
    this.reviewSuccess = '';
    this.productService.getProduct(slug).subscribe({
      next: (res) => {
        this.product = res.data;
        // Set default image safely
        this.selectedImage = (this.product.images && this.product.images.length > 0) 
          ? this.product.images[0] 
          : 'assets/images/placeholder.jpg';
        this.isLoading = false;
        this.loadReviews();
      },
      error: (err) => {
        if (!environment.production) console.error(err);
        this.error = 'Product not found';
        this.isLoading = false;
      }
    });
  }

  loadReviews() {
    if (!this.product) return;
    this.reviewsLoading = true;
    this.reviewService.getProductReviews(this.product._id).subscribe({
      next: (res) => {
        this.reviews = res.data;
        this.reviewsLoading = false;
      },
      error: (err) => {
        if (!environment.production) console.error('Failed to load reviews:', err);
        this.reviewsLoading = false;
      }
    });
  }

  refreshReviewState() {
    if (!this.product) return;

    this.loadReviews();
    this.productService.getProduct(this.product.slug).subscribe({
      next: (res) => {
        this.product = res.data;
      },
      error: (err) => {
        if (!environment.production) console.error('Failed to refresh product rating:', err);
      }
    });
  }

  hasUserReviewed(): boolean {
    return this.reviews.some(r => r.userId?._id === this.currentUserId);
  }

  setReviewRating(rating: number) {
    this.reviewForm.rating = rating;
  }

  submitReview() {
    if (!this.product || this.reviewForm.rating === 0 || !this.reviewForm.title.trim() || !this.reviewForm.comment.trim()) {
      this.reviewError = 'Please fill in all fields and select a rating.';
      return;
    }
    this.isSubmittingReview = true;
    this.reviewError = '';
    this.reviewSuccess = '';

    this.reviewService.createReview({
      productId: this.product._id,
      rating: this.reviewForm.rating,
      title: this.reviewForm.title.trim(),
      comment: this.reviewForm.comment.trim()
    }).subscribe({
      next: () => {
        this.reviewSuccess = 'Review submitted successfully!';
        this.reviewForm = { rating: 0, title: '', comment: '' };
        this.isSubmittingReview = false;
        this.refreshReviewState();
      },
      error: (err) => {
        this.reviewError = err.error?.message || err.error?.error?.message || 'Failed to submit review.';
        this.reviewSuccess = '';
        this.isSubmittingReview = false;
      }
    });
  }

  deleteReview(reviewId: string) {
    this.reviewError = '';
    this.reviewSuccess = '';
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.reviewSuccess = 'Review deleted successfully.';
        this.refreshReviewState();
      },
      error: (err) => {
        this.reviewError = err.error?.message || err.error?.error?.message || 'Failed to delete review.';
        if (!environment.production) console.error('Error deleting review:', err);
      }
    });
  }

  canDeleteReview(review: Review): boolean {
    return review.userId?._id === this.currentUserId || this.currentUserRole === 'admin' || this.currentUserRole === 'owner';
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
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
    let startX = 0;
    let startY = 0;
    if (isPlatformBrowser(this.platformId)) {
      startX = window.innerWidth / 2;
      startY = window.innerHeight / 2;
    }
    
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
        if (!environment.production) console.error(err);
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

  isInWishlist(): boolean {
    return !!this.product?._id && this.wishlistIds.has(this.product._id);
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.product) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.toggleWishlist(this.product._id).subscribe({
      next: (res) => {
        const updatedWishlist = res?.data || [];
        const normalized = updatedWishlist
          .map((item: any) => (typeof item === 'string' ? item : item?._id))
          .filter((id: string | undefined) => !!id);
        this.wishlistIds = new Set<string>(normalized);
      },
      error: (err) => {
        if (!environment.production) console.error('Error toggling wishlist:', err);
        alert('Failed to update wishlist. Please try again.');
      }
    });
  }
}