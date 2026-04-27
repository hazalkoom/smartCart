import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { NotificationService } from '../../services/notification';
import { AppNotification } from '../../interfaces/notification';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBellComponent {
  @Input() variant: 'customer' | 'admin' = 'customer';

  isOpen = false;

  readonly notifications$;
  readonly unreadCount$;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  markAsRead(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
  }

  clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.clearAll();
  }

  getNotificationTitle(notification: AppNotification): string {
    if (notification.type === 'admin-order-paid') {
      return 'Payment Received';
    }

    if (notification.type === 'order-status-changed') {
      return 'Order Updated';
    }

    return 'Payment Success';
  }

  getNotificationIcon(notification: AppNotification): string {
    if (notification.type === 'admin-order-paid') {
      return 'bi-cash-stack';
    }

    if (notification.type === 'order-status-changed') {
      return 'bi-truck';
    }

    return 'bi-check2-circle';
  }

  trackById(_: number, notification: AppNotification): string {
    return notification.id;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.isOpen = false;
  }
}