jest.mock('../../src/models/notificationModel', () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
}));

const Notification = require('../../src/models/notificationModel');
const {
  clearMyNotifications,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require('../../src/controllers/notificationController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('notificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMyNotifications returns sorted notifications with default limit', async () => {
    const notifications = [{ _id: 'n2' }, { _id: 'n1' }];
    const lean = jest.fn().mockResolvedValue(notifications);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    Notification.find.mockReturnValue({ sort });

    const req = { user: { _id: 'user-1' }, query: {} };
    const res = makeRes();
    const next = jest.fn();

    await getMyNotifications(req, res, next);

    expect(Notification.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(limit).toHaveBeenCalledWith(50);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 2, data: notifications });
  });

  it('getMyNotifications caps limit at 200', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    Notification.find.mockReturnValue({ sort });

    const req = { user: { _id: 'user-1' }, query: { limit: '999' } };
    const res = makeRes();
    const next = jest.fn();

    await getMyNotifications(req, res, next);

    expect(limit).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMyNotifications falls back to default for invalid limits', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    Notification.find.mockReturnValue({ sort });

    const req = { user: { _id: 'user-1' }, query: { limit: '-5' } };
    const res = makeRes();
    const next = jest.fn();

    await getMyNotifications(req, res, next);

    expect(limit).toHaveBeenCalledWith(50);
  });

  it('markNotificationAsRead updates owned notification', async () => {
    const updated = { _id: 'n1', userId: 'user-1', read: true };
    Notification.findOneAndUpdate.mockResolvedValue(updated);

    const req = { user: { _id: 'user-1' }, params: { id: 'n1' } };
    const res = makeRes();
    const next = jest.fn();

    await markNotificationAsRead(req, res, next);

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'n1', userId: 'user-1' },
      { $set: { read: true } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('markNotificationAsRead returns 404 when notification not found', async () => {
    Notification.findOneAndUpdate.mockResolvedValue(null);

    const req = { user: { _id: 'user-1' }, params: { id: 'missing' } };
    const res = makeRes();
    const next = jest.fn();

    await markNotificationAsRead(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Notification not found');
  });

  it('markAllNotificationsAsRead updates only unread notifications for caller', async () => {
    Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const req = { user: { _id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();

    await markAllNotificationsAsRead(req, res, next);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      { userId: 'user-1', read: false },
      { $set: { read: true } }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 3 });
  });

  it('clearMyNotifications deletes only caller notifications', async () => {
    Notification.deleteMany.mockResolvedValue({ deletedCount: 4 });

    const req = { user: { _id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();

    await clearMyNotifications(req, res, next);

    expect(Notification.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 4 });
  });
});