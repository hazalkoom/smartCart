import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { User } from '../../core/interfaces/user';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrls: ['../../../assets/admin/css/templatemo-daynight-style.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isOwner: boolean = false;
  userInitial: string = '';
  adminMobileMenuOpen: boolean = false;
  adminCurrentYear = new Date().getFullYear();
  private subscription: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Subscribe to current user
    this.subscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.isOwner = user.role === 'owner';
        this.userInitial = (user.firstName?.charAt(0) || 'U').toUpperCase();
      } else {
        this.currentUser = null;
        this.isOwner = false;
        this.userInitial = '';
      }
    });

    // Keep admin shell fully Angular-driven; legacy theme script mutates DOM
    // outside Angular lifecycle and can delay view updates until user interaction.
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleAdminMobileMenu(): void {
    this.adminMobileMenuOpen = !this.adminMobileMenuOpen;
  }

  closeAdminMobileMenu(): void {
    this.adminMobileMenuOpen = false;
  }

  logout(): void {
    this.closeAdminMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
