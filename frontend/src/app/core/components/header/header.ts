import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {

  authReady: boolean = false;
  isLoggedIn: boolean = false;
  hasAuthenticatedSession: boolean = false;
  showGuestLinks: boolean = true;
  isAdmin: boolean = false;
  cartCount: number = 0;
  wishlistCount: number = 0;
  userName: string = '';
  mobileMenuOpen: boolean = false;
  searchOpen: boolean = false;
  searchQuery: string = '';
  isScrolled: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.updateScrollState();
    this.refreshAuthState();

    const authReadySub = this.authService.authReady$.subscribe((ready) => {
      this.authReady = ready;
      this.refreshAuthState(this.authService.currentUser$.value, this.authService.isLoggedIn$.value);
    });
    this.subscriptions.push(authReadySub);

    // 1. Subscribe to authentication state
    const authSub = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.refreshAuthState(this.authService.currentUser$.value, loggedIn);
      
      if (this.hasAuthenticatedSession) {
        this.cartService.getCart().subscribe();
      } else {
        this.cartCount = 0;
        this.userName = '';
      }
    });
    this.subscriptions.push(authSub);

    // 2. Subscribe to user profile
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.refreshAuthState(user, this.authService.isLoggedIn$.value);
    });
    this.subscriptions.push(userSub);

    // 3. Subscribe to cart count
    const cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
    this.subscriptions.push(cartSub);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  get userInitials(): string {
    if (!this.userName) {
      return 'SC';
    }

    return this.userName.slice(0, 2).toUpperCase();
  }

  // Search logic: Receives the value directly from the HTML
  onSearch(term: string): void {
    if (term && term.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { keyword: term.trim() } 
      });
    }
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  submitSearch(): void {
    this.onSearch(this.searchQuery);
    this.closeMobileMenu();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(): void {
    this.mobileMenuOpen = false;
    this.searchOpen = false;
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  private updateScrollState(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 12;
    }
  }

  private refreshAuthState(
    user: User | null = this.authService.currentUser$.value,
    loggedIn: boolean = this.authService.isLoggedIn$.value
  ): void {
    const hasSession = loggedIn || this.authService.isAuthenticated() || !!user;

    this.isLoggedIn = hasSession;
    this.hasAuthenticatedSession = hasSession;
    this.showGuestLinks = !hasSession;

    if (!user) {
      this.isAdmin = false;
      this.wishlistCount = 0;

      if (!hasSession) {
        this.userName = '';
      }

      return;
    }

    this.userName = user.firstName;
    this.isAdmin = user.role === 'admin' || user.role === 'owner';

    const normalizedWishlist = (user.wishlist || [])
      .map((item: any) => typeof item === 'string' ? item : item?._id)
      .filter((id: string | undefined) => !!id);

    this.wishlistCount = normalizedWishlist.length;
  }
}