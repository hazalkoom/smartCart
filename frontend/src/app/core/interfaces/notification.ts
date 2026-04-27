export type NotificationType = 'payment-success' | 'admin-order-paid' | 'order-status-changed';

export interface AppNotification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: NotificationType;
  orderId?: string;
  status?: string;
}