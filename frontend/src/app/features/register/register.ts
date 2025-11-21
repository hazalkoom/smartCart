import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css', // Angular 17+ uses 'styleUrl' (singular)
})
export class Register {
  
  // Form variables
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';

  // State variables
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Keep this for SSR safety
  ) {}

  onSubmit(): void {
    // 1. Basic Validation
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // 2. Call the API
    const userData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data.token) {
          
          // SSR CHECK: Only save token if we are in the browser
          if (isPlatformBrowser(this.platformId)) {
            this.authService.saveToken(response.data.token);
          }
          
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}