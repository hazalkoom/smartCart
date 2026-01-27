const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  orderCreateValidationRules,
  orderStatusValidationRules,
  payOrderValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  payOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);


router.route('/my').get(getMyOrders);

router.route('/').post(orderCreateValidationRules, validate, createOrder);

router.route('/:id').get(getOrderById);


router.route('/').get(authorize('admin', 'owner'), getAllOrders);

router.route('/:id/status').patch(authorize('admin', 'owner'), orderStatusValidationRules, validate, updateOrderStatus);

router.post(
  '/:id/pay',
  protect,                   // 1. Check Auth
  payOrderValidationRules,   // 2. Check Input Rules
  validate,                  // 3. Check for Validation Errors
  payOrder                   // 4. Execute Logic
);

module.exports = router;