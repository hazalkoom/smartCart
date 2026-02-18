import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoutePersistenceService {
  private lastRoute: string = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeRouteTracking();
  }

  private initializeRouteTracking(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.saveLastRoute(event.urlAfterRedirects);
      });

    // Load and restore last route on initialization
    const savedRoute = this.getLastRoute();
    if (savedRoute && !this.isCurrentRoute(savedRoute)) {
      // Only restore if it's an admin route and not the current route
      if (savedRoute.includes('/admin')) {
        setTimeout(() => {
          this.router.navigateByUrl(savedRoute).catch(() => {
            // If navigation fails, stay on current route
          });
        }, 500);
      }
    }
  }

  private saveLastRoute(route: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lastRoute', route);
      this.lastRoute = route;
    }
  }

  private getLastRoute(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('lastRoute') || '';
    }
    return '';
  }

  private isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }
}
