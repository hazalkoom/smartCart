import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmailComponent implements OnInit {
  status: 'verifying' | 'success' | 'error' = 'verifying';
  message: string = 'Verifying your email address...';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    
    if (!token) {
      this.status = 'error';
      this.message = 'Verification token is missing. Please check your email link.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.status = 'success';
        this.message = response.message || 'Email verified successfully. You now have full access.';
      },
      error: (error) => {
        this.status = 'error';
        this.message = error.message || 'Invalid or expired verification token.';
      }
    });
  }
}
