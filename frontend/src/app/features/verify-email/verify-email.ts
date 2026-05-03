import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.route.snapshot.paramMap.get('token');
      
      if (!token) {
        this.status = 'error';
        this.message = 'Verification token is missing. Please check your email link.';
        this.cdr.detectChanges();
        return;
      }

      this.authService.verifyEmail(token).subscribe({
        next: (response) => {
          this.status = 'success';
          this.message = response.message || 'Email verified successfully. You now have full access.';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.status = 'error';
          this.message = error.message || 'Invalid or expired verification token.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
