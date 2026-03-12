import { Component, Inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth'; 

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
  encapsulation: ViewEncapsulation.None,
})
export class Register {
  
  // Form variables
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  // State variables
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  acceptTerms: boolean = false;
  passwordStrength: number = 0;
  passwordStrengthLabel: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Listen to password changes for strength calculation
  }

  onPasswordChange(): void {
    if (!this.password) {
      this.passwordStrength = 0;
      this.passwordStrengthLabel = '';
      return;
    }

    let strength = 0;
    
    // Check length
    if (this.password.length >= 8) strength += 25;
    if (this.password.length >= 12) strength += 10;
    
    // Check for uppercase
    if (/[A-Z]/.test(this.password)) strength += 20;
    
    // Check for lowercase
    if (/[a-z]/.test(this.password)) strength += 20;
    
    // Check for numbers
    if (/\d/.test(this.password)) strength += 15;
    
    // Check for special characters
    if (/[@$!%*?&]/.test(this.password)) strength += 10;

    this.passwordStrength = Math.min(strength, 100);
    
    if (this.passwordStrength < 40) {
      this.passwordStrengthLabel = 'Weak';
    } else if (this.passwordStrength < 75) {
      this.passwordStrengthLabel = 'Medium';
    } else {
      this.passwordStrengthLabel = 'Strong';
    }
  }

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
        if (response.success && response.data?.token) {
          // Token is already saved by AuthService.register()
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error?.message || error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}