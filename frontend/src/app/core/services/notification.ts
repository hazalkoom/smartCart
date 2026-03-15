import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, distinctUntilChanged, map } from 'rxjs';
import { SocketService } from './socket';
import { AppNotification, NotificationType } from '../interfaces/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  readonly unreadCount$ = this.notifications$.pipe(
    map((notifications) => notifications.filter((notification) => !notification.read).length),
    distinctUntilChanged()
  );

  private readonly newNotificationSubject = new Subject<AppNotification>();
  readonly newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.socketService.paymentSuccess$.subscribe((event) => {
      this.pushNotification('payment-success', event);
    });

    this.socketService.adminOrderPaid$.subscribe((event) => {
      this.pushNotification('admin-order-paid', event);
    });

    this.socketService.orderStatusChanged$.subscribe((event) => {
      this.pushNotification('order-status-changed', event);
    });
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map((notification) => {
      if (notification.id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });

    this.notificationsSubject.next(notifications);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map((notification) => ({
      ...notification,
      read: true
    }));

    this.notificationsSubject.next(notifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  private pushNotification(
    type: NotificationType,
    event: { message: string; orderId?: string; status?: string }
  ): void {
    const notification: AppNotification = {
      id: this.generateNotificationId(),
      message: event.message,
      timestamp: Date.now(),
      read: false,
      type,
      orderId: event.orderId,
      status: event.status
    };

    this.notificationsSubject.next([notification, ...this.notificationsSubject.value]);
    this.newNotificationSubject.next(notification);
  }

  private generateNotificationId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}