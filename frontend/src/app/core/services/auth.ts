import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, map, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../interfaces/user';
import { SocketService } from './socket';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject to track login state reactively
  public isLoggedIn$ = new BehaviorSubject<boolean>(false);
  
  // BehaviorSubject to track current user profile
  public currentUser$ = new BehaviorSubject<User | null>(null);
  public authReady$ = new BehaviorSubject<boolean>(false);
  private authInitPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentUser$.subscribe((user) => {
      if (user && user._id && this.isLoggedIn$.value) {
        // 1. Always join the personal user room
        this.socketService.joinUserRoom(user._id);
        
        // 2. If they are an admin/owner, put them in the VIP admin room too
        if (user.role === 'admin' || user.role === 'owner') {
          this.socketService.joinAdminRoom();
        }
      }
    });

    // Initialize auth state early for non-initializer code paths as well.
    this.initializeAuth();
  }

  initializeAuth(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      // Do NOT emit true on the server. If we do, SSR renders "Login / Sign Up",
      // causing a flash when the client boots and parses local storage.
      this.authReady$.next(false);
      return Promise.resolve();
    }

    if (this.authInitPromise) {
      return this.authInitPromise;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.isLoggedIn$.next(false);
      this.currentUser$.next(null);
      this.authReady$.next(true);
      this.authInitPromise = Promise.resolve();
      return this.authInitPromise;
    }

    this.isLoggedIn$.next(true);
    this.authInitPromise = firstValueFrom(this.getUserProfile())
      .then((user) => {
        if (user) {
          this.currentUser$.next(user);
        }
      })
      .catch(() => {
        // Keep token-based auth state; interceptor and protected routes handle invalid tokens.
      })
      .finally(() => {
        this.authReady$.next(true);
      });

    return this.authInitPromise;
  }

  // POST /api/v1/auth/register
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          this.saveToken(response.data.token);
          this.isLoggedIn$.next(true);
          // Update current user
          if (response.data) {
            this.currentUser$.next(response.data);
          }
          // Fetch full profile
          this.getUserProfile().subscribe();
        }
      })
    );
  }

  // POST /api/v1/auth/login
  login(loginData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          this.saveToken(response.data.token);
          this.isLoggedIn$.next(true);
          // Update current user
          if (response.data) {
            this.currentUser$.next(response.data);
          }
          // Fetch full profile
          this.getUserProfile().subscribe();
        }
      })
    );
  }

  // GET /api/v1/auth/me - Get current user profile
  getUserProfile(): Observable<User | null> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/me`).pipe(
      map(response => {
        if (response?.success && response?.data) {
          this.currentUser$.next(response.data);
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        // Don't clear auth state here - let error interceptor handle 401s
        // This allows components to handle errors gracefully
        return of(null);
      })
    );
  }

  // Update User Profile (Name, Email)
  updateProfile(data: { firstName: string; lastName: string; email?: string }): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/updatedetails`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update the current user state immediately
          this.currentUser$.next(response.data);
        }
      })
    );
  }

  toggleWishlist(productId: string): Observable<any> {
    return this.http.post<{success: boolean, data: any[]}>(`${this.apiUrl}/wishlist`, { productId }).pipe(
      tap(res => {
        if (res.success) {
          const user = this.currentUser$.value;
          if (user) {
            // Update state silently so UI reacts
            this.currentUser$.next({ ...user, wishlist: res.data });
          }
        }
      })
    );
  }

  getWishlist(): Observable<any> {
    return this.http.get<{success: boolean, data: any[]}>(`${this.apiUrl}/wishlist`);
  }

  // Addresses
  addAddress(addressData: any): Observable<any> {
    return this.http.post<{success: boolean, data: any[]}>(`${this.apiUrl}/addresses`, addressData).pipe(
      tap(res => {
        if (res.success && res.data) {
          const user = this.currentUser$.value;
          if (user) {
            // Immediately update the user state with the new addresses array
            this.currentUser$.next({ ...user, addresses: res.data });
          }
        }
      })
    );
  }

  deleteAddress(addressId: string): Observable<any> {
    return this.http.delete<{success: boolean, data: any[]}>(`${this.apiUrl}/addresses/${addressId}`).pipe(
      tap(res => {
        if (res.success && res.data) {
          const user = this.currentUser$.value;
          if (user) {
             // Immediately update the user state with the filtered array
            this.currentUser$.next({ ...user, addresses: res.data });
          }
        }
      })
    );
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Check if token exists in localStorage
  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  // Helper method for guards and components
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // Clear auth state (used internally)
  private clearAuthState(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.isLoggedIn$.next(false);
    this.currentUser$.next(null);
  }

  // Complete logout with state update and navigation
  logout(): void {
    this.socketService.disconnect();
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  // POST /api/v1/auth/forgot-password - Request password reset token
  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/forgot-password`, 
      { email }
    ).pipe(
      catchError((error) => {
        const errorMsg = error.error?.message || 'Failed to process request';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  // POST /api/v1/auth/reset-password/:token - Reset password with token (auto-logs in)
  resetPassword(token: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/reset-password/${token}`, 
      { password }
    ).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          this.saveToken(response.data.token);
          this.isLoggedIn$.next(true);
          this.currentUser$.next(response.data);
        }
      }),
      catchError((error) => {
        const errorMsg = error.error?.message || 'Failed to reset password';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}