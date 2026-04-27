import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { Product } from '../../core/interfaces/product';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistItems: Product[] = [];
  isLoading: boolean = true;
  error: string = '';
  wishlistProcessing: Set<string> = new Set<string>();

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.error = '';

    const sub = this.authService.getWishlist().subscribe({
      next: (res) => {
        const data = res?.data || [];
        this.wishlistItems = data.filter((item: any) => item && typeof item === 'object' && item._id);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!environment.production) console.error('Error loading wishlist:', err);
        this.error = 'Failed to load wishlist. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.push(sub);
  }

  removeFromWishlist(productId: string): void {
    if (this.wishlistProcessing.has(productId)) {
      return;
    }
    this.wishlistProcessing.add(productId);

    const sub = this.authService.toggleWishlist(productId).subscribe({
      next: () => {
        this.wishlistItems = this.wishlistItems.filter((item) => item._id !== productId);
        this.wishlistProcessing.delete(productId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!environment.production) console.error('Error removing wishlist item:', err);
        alert('Could not update wishlist. Please try again.');
        this.wishlistProcessing.delete(productId);
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.push(sub);
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
