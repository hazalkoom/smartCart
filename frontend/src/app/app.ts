import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { RoutePersistenceService } from './core/services/route-persistence';
import { NotificationService } from './core/services/notification';
import { AppNotification } from './core/interfaces/notification';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  isAdminRoute = false;
  paymentToastVisible = false;
  paymentToastTitle = 'Notification';
  paymentToastMessage = '';
  paymentToastType: 'payment-success' | 'admin-order-paid' | 'order-status-changed' = 'payment-success';

  private toastHideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private routePersistence: RoutePersistenceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.updateLayoutRouteState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationStart | NavigationEnd => event instanceof NavigationStart || event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = event instanceof NavigationEnd ? event.urlAfterRedirects || event.url : event.url;
        this.updateLayoutRouteState(url);
      });

    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.showPaymentToast(notification);
      });
  }

  private updateLayoutRouteState(url: string): void {
    this.isAdminRoute = url.startsWith('/admin');
  }

  dismissPaymentToast(): void {
    this.paymentToastVisible = false;
    if (this.toastHideTimer) {
      clearTimeout(this.toastHideTimer);
      this.toastHideTimer = null;
    }
  }

  private showPaymentToast(notification: AppNotification): void {
    this.paymentToastType = notification.type;
    this.paymentToastTitle = this.getToastTitle(notification.type);
    this.paymentToastMessage = notification.message?.trim() || 'You have a new notification.';
    this.paymentToastVisible = true;

    if (this.toastHideTimer) {
      clearTimeout(this.toastHideTimer);
    }

    this.toastHideTimer = setTimeout(() => {
      this.paymentToastVisible = false;
      this.toastHideTimer = null;
    }, 5000);
  }

  private getToastTitle(type: AppNotification['type']): string {
    if (type === 'admin-order-paid') {
      return 'New Payment';
    }

    if (type === 'order-status-changed') {
      return 'Order Update';
    }

    return 'Payment Success';
  }

  ngOnDestroy(): void {
    if (this.toastHideTimer) {
      clearTimeout(this.toastHideTimer);
      this.toastHideTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
