import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        // --- Network error (server unreachable / offline / CORS) ---
        if (error.status === 0) {
          if (!environment.production) {
            console.error('Network error — verify your connection or server status');
          }
          // Let component handle it
          return throwError(() => error);
        }

        // --- 401 Unauthorized ---
        if (error.status === 401) {
          const isAuthEndpoint = req.url.includes('/auth/login') || 
                                 req.url.includes('/auth/register');
          const isAuthMeEndpoint = req.url.includes('/auth/me');
          
          if (!isAuthEndpoint && !isAuthMeEndpoint) {
            const errorMessage = (error.error?.message || error.error?.error?.message || '').toLowerCase();
            const isTokenError = errorMessage.includes('token failed') || 
                               errorMessage.includes('not authorized, token') ||
                               errorMessage.includes('token expired') ||
                               errorMessage.includes('invalid token');
            
            if (isTokenError) {
              const authService = this.injector.get(AuthService);
              authService.logout();
            }
          }
        }

        // --- 403 Forbidden ---
        if (error.status === 403) {
          const router = this.injector.get(Router);
          router.navigate(['/']);
        }

        // --- 500+ Server errors ---
        if (error.status >= 500) {
          if (!environment.production) {
            console.error(`Server error ${error.status}:`, error.message);
          }
        }

        return throwError(() => error);
      })
    );
  }
}

