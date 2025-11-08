const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  orderCreateValidationRules,
  orderStatusValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);


router.route('/my').get(getMyOrders);

router.route('/').post(orderCreateValidationRules, validate, createOrder);

router.route('/:id').get(getOrderById);


router.route('/').get(authorize('admin', 'owner'), getAllOrders);

router.route('/:id/status').patch(authorize('admin', 'owner'), orderStatusValidationRules, validate, updateOrderStatus);

module.exports = router;