import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject to track login state reactively
  public isLoggedIn$ = new BehaviorSubject<boolean>(false);
  
  // BehaviorSubject to track current user profile
  public currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize auth state from localStorage on service creation
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.isLoggedIn$.next(true);
        // Optionally fetch user profile on initialization
        // Don't clear auth state on error during initialization - let error interceptor handle it
        this.getUserProfile().subscribe({
          next: (user) => {
            if (user) {
              this.currentUser$.next(user);
            }
          },
          error: () => {
            // Silently fail during initialization - error interceptor will handle 401s
            // Only clear if token is definitely invalid (handled by error interceptor)
          }
        });
      }
    }
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
    this.clearAuthState();
    this.router.navigate(['/login']);
  }
}