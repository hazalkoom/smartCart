const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/notificationModel');

const parseLimit = (input) => {
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(parsed, 200);
};

const getMyNotifications = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit);

  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    count: result.modifiedCount || 0,
  });
});

const clearMyNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ userId: req.user._id });

  res.status(200).json({
    success: true,
    count: result.deletedCount || 0,
  });
});

module.exports = {
  clearMyNotifications,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};