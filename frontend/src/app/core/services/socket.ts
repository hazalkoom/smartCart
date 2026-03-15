import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';

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
  
  // Loudspeakers for the components
  private paymentSuccessSubject = new Subject<SocketEvent>();
  public paymentSuccess$ = this.paymentSuccessSubject.asObservable();

  private adminOrderPaidSubject = new Subject<SocketEvent>();
  public adminOrderPaid$ = this.adminOrderPaidSubject.asObservable();

  private orderStatusChangedSubject = new Subject<SocketEvent>();
  public orderStatusChanged$ = this.orderStatusChangedSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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
  }

  joinUserRoom(userId: string): void {
    if (this.socket) {
      this.currentRoomUserId = userId;
      if (!this.socket.connected) {
        this.socket.connect();
      }
      this.socket.emit('joinRoom', userId);
      console.log(`[SOCKET] Joined private room for user: ${userId}`);
    }
  }

  joinAdminRoom(): void {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      this.socket.emit('joinRoom', 'admin_room');
      console.log(`[SOCKET] Joined admin_room`);
    }
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