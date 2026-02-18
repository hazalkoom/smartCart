import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class OwnerGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return false;
    }

    const currentUser = this.authService.currentUser$.value;
    if (currentUser) {
      const allowed = currentUser.role === 'owner';
      if (!allowed) {
        this.router.navigate(['/']);
      }
      return allowed;
    }

    return this.authService.getUserProfile().pipe(
      map((user) => {
        const allowed = !!user && user.role === 'owner';
        if (!allowed) {
          this.router.navigate(['/']);
        }
        return allowed;
      }),
      catchError(() => {
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}
