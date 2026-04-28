import { Component, ViewEncapsulation, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  encapsulation: ViewEncapsulation.None,
})
export class ForgotPassword {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showResetUrl: boolean = false;
  resetUrl: string = '';
  isDevMode: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check if we're in dev mode by checking environment or localStorage
    this.isDevMode = !isPlatformBrowser(this.platformId) || localStorage.getItem('devMode') === 'true';
  }

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.successMessage = response.message || 
          'If that email is registered, you will receive a password reset link.';
        
        // In dev mode, show the reset URL that was returned (for testing without email service)
        if (this.isDevMode) {
          this.showResetUrl = true;
          // Note: Backend returns reset token in dev mode. Frontend constructs the URL.
          // Example: `http://localhost:4200/reset-password/[token]`
          this.resetUrl = 'Check your email for the reset link, or ask your admin for the reset URL.';
        }

        this.email = '';
        this.isLoading = false;

        // Auto-redirect to login after 4 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 4000);
      },
      error: (error) => {
        this.errorMessage = error.message || 
          'Failed to process request. Please try again.';
        this.isLoading = false;
      }
    });
  }

  copyToClipboard(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.resetUrl).then(() => {
        alert('Reset URL copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy. Please copy manually.');
      });
    }
  }
}
