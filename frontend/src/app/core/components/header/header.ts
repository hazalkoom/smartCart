import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth'; // Check this path (auth.ts or auth.service.ts)
import { CartService } from '../../services/cart'; // Check this path (cart.ts or cart.service.ts)

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {

  isLoggedIn: boolean = false;
  cartCount: number = 0;
  userName: string = ''; // Holds the user's name

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
        // If logged in, fetch their cart data immediately
        this.cartService.getCart().subscribe();
      } else {
        // If logged out, reset local state
        this.cartCount = 0;
        this.userName = '';
      }
    });
    this.subscriptions.push(authSub);

    // 2. Subscribe to user profile (To get the Name)
    const userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.firstName;
      }
    });
    this.subscriptions.push(userSub);

    // 3. Subscribe to cart count (To update the badge)
    const cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
    this.subscriptions.push(cartSub);

    // 4. Initial Check
    // If we refreshed the page and still have a token, ensure cart is loaded
    if (this.authService.isAuthenticated()) {
      this.cartService.getCart().subscribe();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}