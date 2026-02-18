import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Client-side initialization if needed
    }
  }

  onLogin() {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Check if login was successful
        if (response.success && response.data?.token) {
          console.log('Login successful', response);
          const role = response.data?.role || this.authService.currentUser$.value?.role;
          if (role === 'admin' || role === 'owner') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          // Login failed but no error was thrown
          this.errorMessage = response.message || 'Login failed. Please check your credentials.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login failed', error);
        // Handle different error formats
        const errorMsg = error.error?.message || 
                        error.error?.error?.message || 
                        error.message || 
                        'Login failed. Please check your credentials.';
        this.errorMessage = errorMsg;
        this.isLoading = false;
      }
    });
  }
}
