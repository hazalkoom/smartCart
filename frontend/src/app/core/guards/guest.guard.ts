import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect logged-in admins/owners to admin dashboard, others to home
  const user = authService.currentUser$.value;
  if (user?.role === 'admin' || user?.role === 'owner') {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/']);
  }
  return false;
};
