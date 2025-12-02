import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          // Only clear auth state if it's NOT an auth endpoint
          // Auth endpoints (login, register) can return 401 for invalid credentials
          const isAuthEndpoint = req.url.includes('/auth/login') || 
                                 req.url.includes('/auth/register');
          
          // Don't logout on /auth/me failures - let components handle it
          const isAuthMeEndpoint = req.url.includes('/auth/me');
          
          if (!isAuthEndpoint && !isAuthMeEndpoint) {
            // For non-auth endpoints, 401 means token is invalid/expired
            // Only logout on specific token-related errors, not all 401s
            const errorMessage = (error.error?.message || error.error?.error?.message || '').toLowerCase();
            const isTokenError = errorMessage.includes('token failed') || 
                               errorMessage.includes('not authorized, token') ||
                               errorMessage.includes('token expired') ||
                               errorMessage.includes('invalid token');
            
            // Only logout if it's clearly a token authentication issue
            if (isTokenError) {
              // Use Injector to lazily get AuthService to avoid circular dependency
              const authService = this.injector.get(AuthService);
              authService.logout();
            }
            // Otherwise, let the component handle the 401 error (might be a business logic issue)
          }
        }

        // Re-throw the error so components can handle it
        return throwError(() => error);
      })
    );
  }
}

