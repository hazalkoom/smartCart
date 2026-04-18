jest.mock('../../src/models/notificationModel', () => ({
  create: jest.fn(),
  insertMany: jest.fn(),
}));

jest.mock('../../src/models/userModel', () => ({
  find: jest.fn(),
}));

const Notification = require('../../src/models/notificationModel');
const User = require('../../src/models/userModel');
const socket = require('../../src/utils/socket');
const {
  mapNotificationEvent,
  persistAdminNotification,
  persistAndEmitUserNotification,
} = require('../../src/services/notificationService');

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mapNotificationEvent maps id, orderId and timestamp contract correctly', () => {
    const source = {
      _id: { toString: () => 'notif-1' },
      orderId: { toString: () => 'order-1' },
      status: 'Paid',
      message: 'Payment received',
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
    };

    const event = mapNotificationEvent(source);

    expect(event).toEqual({
      notificationId: 'notif-1',
      orderId: 'order-1',
      status: 'Paid',
      message: 'Payment received',
      timestamp: new Date('2026-04-18T10:00:00.000Z').getTime(),
    });
  });

  it('persistAndEmitUserNotification writes notification and emits to user room', async () => {
    const created = {
      _id: { toString: () => 'notif-1' },
      orderId: { toString: () => 'order-1' },
      status: 'Shipped',
      message: 'Order shipped',
      createdAt: new Date('2026-04-18T11:00:00.000Z'),
    };
    Notification.create.mockResolvedValue(created);

    const result = await persistAndEmitUserNotification({
      userId: 'user-1',
      type: 'order-status-changed',
      eventName: 'orderStatusChanged',
      orderId: 'order-1',
      status: 'Shipped',
      message: 'Order shipped',
    });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'order-status-changed',
        orderId: 'order-1',
        status: 'Shipped',
        message: 'Order shipped',
      })
    );
    expect(socket.__mockSocketTo).toHaveBeenCalledWith('user-1');
    expect(socket.__mockSocketEmit).toHaveBeenCalledWith(
      'orderStatusChanged',
      expect.objectContaining({ notificationId: 'notif-1', orderId: 'order-1', status: 'Shipped' })
    );
    expect(result).toBe(created);
  });

  it('persistAndEmitUserNotification supports object ids with _id key', async () => {
    const created = {
      _id: { toString: () => 'notif-2' },
      message: 'x',
      createdAt: new Date(),
    };
    Notification.create.mockResolvedValue(created);

    await persistAndEmitUserNotification({
      userId: { _id: 'user-2' },
      type: 'payment-success',
      eventName: 'paymentSuccess',
      message: 'done',
    });

    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-2' }));
    expect(socket.__mockSocketTo).toHaveBeenCalledWith('user-2');
  });

  it('persistAndEmitUserNotification still returns created data when socket fails', async () => {
    const created = {
      _id: { toString: () => 'notif-3' },
      message: 'x',
      createdAt: new Date(),
    };
    Notification.create.mockResolvedValue(created);
    socket.getIO.mockImplementation(() => {
      throw new Error('socket down');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await persistAndEmitUserNotification({
      userId: 'user-3',
      type: 'payment-success',
      eventName: 'paymentSuccess',
      message: 'ok',
    });

    expect(Notification.create).toHaveBeenCalled();
    expect(result).toBe(created);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('persistAdminNotification inserts one notification per admin/owner', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'admin-1' }, { _id: 'owner-1' }]),
      }),
    });
    Notification.insertMany.mockResolvedValue([{ _id: 'n1' }, { _id: 'n2' }]);

    const result = await persistAdminNotification({
      type: 'admin-order-paid',
      message: 'Payment received',
      orderId: 'order-1',
    });

    expect(User.find).toHaveBeenCalledWith({ role: { $in: ['admin', 'owner'] } });
    expect(Notification.insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({ userId: 'admin-1', type: 'admin-order-paid', orderId: 'order-1' }),
        expect.objectContaining({ userId: 'owner-1', type: 'admin-order-paid', orderId: 'order-1' }),
      ],
      { ordered: false }
    );
    expect(result).toHaveLength(2);
  });

  it('persistAdminNotification returns empty list when no admin users found', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await persistAdminNotification({
      type: 'admin-order-paid',
      message: 'Payment received',
    });

    expect(Notification.insertMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});