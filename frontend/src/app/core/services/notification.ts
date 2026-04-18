import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, distinctUntilChanged, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SocketService } from './socket';
import { AppNotification, NotificationType } from '../interfaces/notification';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

interface NotificationApiItem {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: NotificationType;
  orderId?: string;
  status?: string;
}

interface NotificationApiListResponse {
  success: boolean;
  count: number;
  data: NotificationApiItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();
  private activeUserId: string | null = null;

  readonly unreadCount$ = this.notifications$.pipe(
    map((notifications) => notifications.filter((notification) => !notification.read).length),
    distinctUntilChanged()
  );

  private readonly newNotificationSubject = new Subject<AppNotification>();
  readonly newNotification$ = this.newNotificationSubject.asObservable();

  constructor(
    private socketService: SocketService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.socketService.paymentSuccess$.subscribe((event) => {
      this.pushNotification('payment-success', event);
    });

    this.socketService.adminOrderPaid$.subscribe((event) => {
      const role = this.authService.currentUser$.value?.role;
      if (role === 'admin' || role === 'owner') {
        this.loadNotifications();
        return;
      }

      this.pushNotification('admin-order-paid', event);
    });

    this.socketService.orderStatusChanged$.subscribe((event) => {
      this.pushNotification('order-status-changed', event);
    });

    this.authService.currentUser$.subscribe((user) => {
      const nextUserId = user?._id || null;
      if (!nextUserId) {
        this.activeUserId = null;
        this.notificationsSubject.next([]);
        return;
      }

      if (this.activeUserId === nextUserId) {
        return;
      }

      this.activeUserId = nextUserId;
      this.loadNotifications();
    });
  }

  markAsRead(notificationId: string): void {
    const previous = this.notificationsSubject.value;
    const notifications = previous.map((notification) => {
      if (notification.id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });

    this.notificationsSubject.next(notifications);

    if (!this.activeUserId) {
      return;
    }

    this.http.patch(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(catchError(() => {
        this.notificationsSubject.next(previous);
        return of(null);
      }))
      .subscribe();
  }

  markAllAsRead(): void {
    const previous = this.notificationsSubject.value;
    const notifications = previous.map((notification) => ({
      ...notification,
      read: true
    }));

    this.notificationsSubject.next(notifications);

    if (!this.activeUserId) {
      return;
    }

    this.http.patch(`${this.apiUrl}/read-all`, {})
      .pipe(catchError(() => {
        this.notificationsSubject.next(previous);
        return of(null);
      }))
      .subscribe();
  }

  clearAll(): void {
    const previous = this.notificationsSubject.value;
    this.notificationsSubject.next([]);

    if (!this.activeUserId) {
      return;
    }

    this.http.delete(this.apiUrl)
      .pipe(catchError(() => {
        this.notificationsSubject.next(previous);
        return of(null);
      }))
      .subscribe();
  }

  loadNotifications(): void {
    if (!this.activeUserId) {
      this.notificationsSubject.next([]);
      return;
    }

    this.http.get<NotificationApiListResponse>(`${this.apiUrl}?limit=100`)
      .pipe(catchError(() => of({ success: false, count: 0, data: [] })))
      .subscribe((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          return;
        }

        const mapped = response.data.map((item) => this.mapApiItem(item));
        this.notificationsSubject.next(mapped);
      });
  }

  private pushNotification(
    type: NotificationType,
    event: {
      notificationId?: string;
      message: string;
      orderId?: string;
      status?: string;
      timestamp?: number;
    }
  ): void {
    const notificationId = event.notificationId || this.generateNotificationId();
    if (this.notificationsSubject.value.some((notification) => notification.id === notificationId)) {
      return;
    }

    const notification: AppNotification = {
      id: notificationId,
      message: event.message,
      timestamp: event.timestamp || Date.now(),
      read: false,
      type,
      orderId: event.orderId,
      status: event.status
    };

    this.notificationsSubject.next([notification, ...this.notificationsSubject.value]);
    this.newNotificationSubject.next(notification);
  }

  private mapApiItem(item: NotificationApiItem): AppNotification {
    const parsed = Date.parse(item.createdAt);

    return {
      id: item._id,
      message: item.message,
      timestamp: Number.isNaN(parsed) ? Date.now() : parsed,
      read: item.read,
      type: item.type,
      orderId: item.orderId,
      status: item.status,
    };
  }

  private generateNotificationId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}