import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart, CartResponse } from '../interfaces/cart';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private readonly CART_STORAGE_KEY = 'smartcart_cart';

  // This holds the live count of items in the cart
  // Components (like Header) can subscribe to this to update the badge
  public cartCount$ = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check initial cart count on load (if user is logged in)
    // Note: This will be called from HeaderComponent when user logs in
    // to avoid circular dependency issues
  }

  // Save cart to localStorage
  private saveCartToStorage(cart: Cart): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.warn('Failed to save cart to localStorage:', error);
      }
    }
  }

  // Get cart from localStorage
  getCartFromStorage(): Cart | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(this.CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn('Failed to load cart from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Clear cart from localStorage
  clearCartFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.CART_STORAGE_KEY);
    }
  }

  // GET /api/v1/cart
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap(response => {
        this.updateCartCount(response.data);
        this.saveCartToStorage(response.data);
      })
    );
  }

  // POST /api/v1/cart/items
  addItemToCart(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}/items`, { productId, quantity }).pipe(
      tap(response => {
        this.updateCartCount(response.data);
        this.saveCartToStorage(response.data);
      })
    );
  }

  // PUT /api/v1/cart/items/:itemId
  updateItemQuantity(itemId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
      tap(response => {
        this.updateCartCount(response.data);
        this.saveCartToStorage(response.data);
      })
    );
  }

  // DELETE /api/v1/cart/items/:itemId
  removeItem(itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(response => {
        this.updateCartCount(response.data);
        this.saveCartToStorage(response.data);
      })
    );
  }

  // DELETE /api/v1/cart
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(this.apiUrl).pipe(
      tap(response => {
        this.updateCartCount(response.data);
        this.clearCartFromStorage();
      })
    );
  }

  // Helper to calculate total items and update the subject
  private updateCartCount(cart: Cart) {
    if (cart && cart.items) {
      const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      this.cartCount$.next(count);
    } else {
      this.cartCount$.next(0);
    }
  }
}