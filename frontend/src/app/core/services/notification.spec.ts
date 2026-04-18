import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject, Subject } from 'rxjs';

import { NotificationService } from './notification';
import { SocketService } from './socket';
import { AuthService } from './auth';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const paymentSuccessSubject = new Subject<any>();
  const adminOrderPaidSubject = new Subject<any>();
  const orderStatusChangedSubject = new Subject<any>();
  const currentUserSubject = new BehaviorSubject<any>(null);

  const socketServiceMock = {
    paymentSuccess$: paymentSuccessSubject.asObservable(),
    adminOrderPaid$: adminOrderPaidSubject.asObservable(),
    orderStatusChanged$: orderStatusChangedSubject.asObservable(),
  };

  const authServiceMock = {
    currentUser$: currentUserSubject,
    currentUser: currentUserSubject,
  };

  const getLatestNotifications = (): any[] => {
    let latest: any[] = [];
    const sub = service.notifications$.subscribe((value) => {
      latest = value;
    });
    sub.unsubscribe();
    return latest;
  };

  beforeEach(() => {
    currentUserSubject.next(null);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        { provide: SocketService, useValue: socketServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads persisted notifications when a user session starts', () => {
    currentUserSubject.next({ _id: 'user-1', role: 'customer' });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/notifications'));
    req.flush({
      success: true,
      count: 1,
      data: [
        {
          _id: 'n1',
          type: 'payment-success',
          message: 'Payment successful',
          read: false,
          createdAt: '2026-04-18T10:00:00.000Z',
        },
      ],
    });

    const notifications = getLatestNotifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].id).toBe('n1');
    expect(notifications[0].type).toBe('payment-success');
  });

  it('deduplicates realtime notifications by notificationId', () => {
    paymentSuccessSubject.next({
      notificationId: 'dup-1',
      message: 'Payment successful',
      timestamp: Date.now(),
    });
    paymentSuccessSubject.next({
      notificationId: 'dup-1',
      message: 'Payment successful duplicate',
      timestamp: Date.now(),
    });

    const notifications = getLatestNotifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].id).toBe('dup-1');
  });

  it('markAsRead rolls back if backend request fails', () => {
    currentUserSubject.next({ _id: 'user-1', role: 'customer' });
    httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/notifications')).flush({
      success: true,
      count: 0,
      data: [],
    });

    orderStatusChangedSubject.next({
      notificationId: 'n-read',
      message: 'Order updated',
      status: 'Shipped',
      timestamp: Date.now(),
    });

    service.markAsRead('n-read');
    let notifications = getLatestNotifications();
    expect(notifications[0].read).toBeTrue();

    const req = httpMock.expectOne((r) => r.method === 'PATCH' && r.url.includes('/notifications/n-read/read'));
    req.flush({ success: false }, { status: 500, statusText: 'Server Error' });

    notifications = getLatestNotifications();
    expect(notifications[0].read).toBeFalse();
  });

  it('markAllAsRead and clearAll keep local state when backend succeeds', () => {
    currentUserSubject.next({ _id: 'user-1', role: 'customer' });
    httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/notifications')).flush({
      success: true,
      count: 0,
      data: [],
    });

    paymentSuccessSubject.next({ notificationId: 'n1', message: 'ok', timestamp: Date.now() });
    paymentSuccessSubject.next({ notificationId: 'n2', message: 'ok2', timestamp: Date.now() });

    service.markAllAsRead();
    httpMock.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/notifications/read-all')).flush({ success: true, count: 2 });

    let notifications = getLatestNotifications();
    expect(notifications.every((n) => n.read)).toBeTrue();

    service.clearAll();
    httpMock.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/notifications')).flush({ success: true, count: 2 });

    notifications = getLatestNotifications();
    expect(notifications.length).toBe(0);
  });

  it('clears notifications on logout/session clear', () => {
    paymentSuccessSubject.next({ notificationId: 'n-logout', message: 'x', timestamp: Date.now() });
    expect(getLatestNotifications().length).toBe(1);

    currentUserSubject.next(null);
    expect(getLatestNotifications()).toEqual([]);
  });

  it('admin realtime event refreshes from API instead of adding transient item', () => {
    currentUserSubject.next({ _id: 'admin-1', role: 'admin' });
    httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/notifications')).flush({ success: true, count: 0, data: [] });

    adminOrderPaidSubject.next({ message: 'new payment' });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/notifications'));
    req.flush({
      success: true,
      count: 1,
      data: [
        {
          _id: 'admin-n1',
          type: 'admin-order-paid',
          message: 'new payment',
          read: false,
          createdAt: '2026-04-18T10:00:00.000Z',
        },
      ],
    });

    const notifications = getLatestNotifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].id).toBe('admin-n1');
  });
});