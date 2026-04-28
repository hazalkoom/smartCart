import { Component, ViewEncapsulation, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  encapsulation: ViewEncapsulation.None,
})
export class ResetPassword implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  passwordStrength: number = 0;
  passwordStrengthLabel: string = '';
  passwordStrengthColor: string = '';
  
  passwordRequirements = {
    minLength: false,      // 7+ chars
    hasUpperCase: false,   // [A-Z]
    hasNumber: false       // [0-9]
  };

  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Extract token from URL: /reset-password/:token
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
    }
  }

  onPasswordChange(): void {
    // Check each requirement in real-time
    this.passwordRequirements = {
      minLength: this.password.length >= 7,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasNumber: /\d/.test(this.password)
    };

    // Calculate strength score
    const metCount = Object.values(this.passwordRequirements).filter(v => v).length;
    const allMet = Object.values(this.passwordRequirements).every(v => v);

    if (!this.password) {
      this.passwordStrength = 0;
      this.passwordStrengthLabel = '';
      this.passwordStrengthColor = '';
    } else if (allMet) {
      this.passwordStrength = 100;
      this.passwordStrengthLabel = 'Strong';
      this.passwordStrengthColor = 'strong';
    } else if (metCount >= 2) {
      this.passwordStrength = 66;
      this.passwordStrengthLabel = 'Medium';
      this.passwordStrengthColor = 'medium';
    } else if (metCount >= 1) {
      this.passwordStrength = 33;
      this.passwordStrengthLabel = 'Weak';
      this.passwordStrengthColor = 'weak';
    } else {
      this.passwordStrength = 0;
      this.passwordStrengthLabel = 'Very Weak';
      this.passwordStrengthColor = 'very-weak';
    }
  }

  isPasswordValid(): boolean {
    const allMet = Object.values(this.passwordRequirements).every(v => v);
    return allMet && this.password === this.confirmPassword && this.password.length > 0;
  }

  onSubmit(): void {
    // Validate password strength requirements
    if (!this.isPasswordValid()) {
      this.errorMessage = 'Password does not meet all requirements';
      return;
    }

    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid reset link';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        // Auto-logged in, redirect to home
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrengthColor === 'strong') return 'strength-strong';
    if (this.passwordStrengthColor === 'medium') return 'strength-medium';
    if (this.passwordStrengthColor === 'weak') return 'strength-weak';
    return 'strength-very-weak';
  }
}
