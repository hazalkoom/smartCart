import { SocketService } from './socket';

describe('SocketService', () => {
  it('creates in non-browser platform without initializing socket client', () => {
    const service = new SocketService('server' as any);
    expect(service).toBeTruthy();
  });

  it('join and disconnect APIs are safe when socket is not initialized', () => {
    const service = new SocketService('server' as any);

    expect(() => service.joinUserRoom('user-1')).not.toThrow();
    expect(() => service.joinAdminRoom()).not.toThrow();
    expect(() => service.disconnect()).not.toThrow();
  });

  it('notifyPaymentSuccessLocally emits through payment stream', (done) => {
    const service = new SocketService('server' as any);

    service.paymentSuccess$.subscribe((event) => {
      expect(event.orderId).toBe('order-1');
      expect(event.message).toContain('Payment');
      done();
    });

    service.notifyPaymentSuccessLocally({ orderId: 'order-1', message: 'Payment successful' });
  });
});
