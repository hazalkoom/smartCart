const Notification = require('../models/notificationModel');
const socket = require('../utils/socket');
const User = require('../models/userModel');

const cleanLog = (val) => (val ? String(val).replace(/\n|\r/g, '') : '');

const toObjectIdLike = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'object' && value._id) {
    return value._id;
  }

  return value;
};

const mapNotificationEvent = (notification) => ({
  notificationId: notification._id.toString(),
  orderId: notification.orderId ? notification.orderId.toString() : undefined,
  status: notification.status,
  message: notification.message,
  timestamp: notification.createdAt.getTime(),
});

const persistAndEmitUserNotification = async ({
  userId,
  type,
  eventName,
  message,
  orderId,
  status,
}) => {
  const normalizedUserId = toObjectIdLike(userId);
  const normalizedOrderId = toObjectIdLike(orderId);

  const notification = await Notification.create({
    userId: normalizedUserId,
    type,
    message,
    orderId: normalizedOrderId,
    status,
  });

  try {
    const io = socket.getIO();
    io.to(String(normalizedUserId)).emit(eventName, mapNotificationEvent(notification));
  } catch (err) {
    console.error(`[SOCKET ERROR] Failed to emit ${cleanLog(eventName)}:`, cleanLog(err.message));
  }

  return notification;
};

const persistAdminNotification = async ({
  type,
  message,
  orderId,
  status,
}) => {
  const normalizedOrderId = toObjectIdLike(orderId);
  const adminUsers = await User.find({ role: { $in: ['admin', 'owner'] } }).select('_id').lean();

  if (!adminUsers.length) {
    return [];
  }

  const payload = adminUsers.map((user) => ({
    userId: user._id,
    type,
    message,
    orderId: normalizedOrderId,
    status,
  }));

  return Notification.insertMany(payload, { ordered: false });
};

const persistAndEmitAdminNotification = async ({
  type,
  eventName,
  message,
  orderId,
  status,
}) => {
  const notifications = await persistAdminNotification({
    type,
    message,
    orderId,
    status,
  });

  try {
    const io = socket.getIO();
    io.to('admin_room').emit(eventName, {
      orderId: orderId ? String(toObjectIdLike(orderId)) : undefined,
      status,
      message,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(`[SOCKET ERROR] Failed to emit ${cleanLog(eventName)}:`, cleanLog(err.message));
  }

  return notifications;
};

module.exports = {
  mapNotificationEvent,
  persistAndEmitUserNotification,
  persistAdminNotification,
  persistAndEmitAdminNotification,
};