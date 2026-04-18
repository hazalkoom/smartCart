const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  clearMyNotifications,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.route('/').get(getMyNotifications).delete(clearMyNotifications);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

module.exports = router;