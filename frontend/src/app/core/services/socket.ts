import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import type { Socket } from 'socket.io-client';

interface SocketEvent {
  orderId: string;
  message: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket?: Socket;
  private currentRoomUserId: string | null = null;
  private socketInitPromise: Promise<void> | null = null;
  
  // Loudspeakers for the components
  private paymentSuccessSubject = new Subject<SocketEvent>();
  public paymentSuccess$ = this.paymentSuccessSubject.asObservable();

  private adminOrderPaidSubject = new Subject<SocketEvent>();
  public adminOrderPaid$ = this.adminOrderPaidSubject.asObservable();

  private orderStatusChangedSubject = new Subject<SocketEvent>();
  public orderStatusChanged$ = this.orderStatusChangedSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    void this.ensureSocket();
  }

  private async ensureSocket(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.socket || this.socketInitPromise) {
      return this.socketInitPromise ?? Promise.resolve();
    }

    this.socketInitPromise = import('socket.io-client')
      .then(({ io }) => {
        this.socket = io(environment.socketUrl, {
          withCredentials: true
        });

        this.socket.on('connect', () => {
          if (this.currentRoomUserId) {
            this.socket?.emit('joinRoom', this.currentRoomUserId);
          }
        });

        // Listeners
        this.socket.on('paymentSuccess', (data: SocketEvent) => {
          console.log('✅ [SOCKET] Payment success received:', data);
          this.paymentSuccessSubject.next(data);
        });

        this.socket.on('adminOrderPaid', (data: SocketEvent) => {
          console.log('🔔 [SOCKET] Admin notification received:', data);
          this.adminOrderPaidSubject.next(data);
        });

        this.socket.on('orderStatusChanged', (data: SocketEvent) => {
          console.log('📦 [SOCKET] Order status changed:', data);
          this.orderStatusChangedSubject.next(data);
        });
      })
      .catch((error) => {
        this.socketInitPromise = null;
        if (!environment.production) {
          console.error('Failed to initialize socket client:', error);
        }
      });

    return this.socketInitPromise;
  }

  joinUserRoom(userId: string): void {
    this.currentRoomUserId = userId;

    void this.ensureSocket().then(() => {
      if (!this.socket) {
        return;
      }

      if (!this.socket.connected) {
        this.socket.connect();
      }

      this.socket.emit('joinRoom', userId);
      console.log(`[SOCKET] Joined private room for user: ${userId}`);
    });
  }

  joinAdminRoom(): void {
    void this.ensureSocket().then(() => {
      if (!this.socket) {
        return;
      }

      if (!this.socket.connected) {
        this.socket.connect();
      }

      this.socket.emit('joinRoom', 'admin_room');
      console.log(`[SOCKET] Joined admin_room`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.currentRoomUserId = null;
      this.socket.disconnect();
    }
  }

  notifyPaymentSuccessLocally(data: SocketEvent): void {
    this.paymentSuccessSubject.next(data);
  }
}