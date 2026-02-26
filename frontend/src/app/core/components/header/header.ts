import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {

  isLoggedIn: boolean = false;
  cartCount: number = 0;
  userName: string = '';
  mobileMenuOpen: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to authentication state
    const authSub = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      
      if (loggedIn) {
        this.cartService.getCart().subscribe();
      } else {
        this.cartCount = 0;
        this.userName = '';
      }
    });
    this.subscriptions.push(authSub);

    // 2. Subscribe to user profile
    const userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.firstName;
      }
    });
    this.subscriptions.push(userSub);

    // 3. Subscribe to cart count
    const cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
    this.subscriptions.push(cartSub);

    // 4. Initial Check
    if (this.authService.isAuthenticated()) {
      this.cartService.getCart().subscribe();
    }
  }

  // Search logic: Receives the value directly from the HTML
  onSearch(term: string): void {
    console.log('Search clicked. Term:', term); 
    
    if (term && term.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { keyword: term.trim() } 
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onLogout(): void {
    this.mobileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}