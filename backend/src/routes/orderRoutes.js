const express = require('express');
const { protect, authorize, requireEmailVerification } = require('../middleware/authMiddleware');
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

// Apply protection to all routes
router.use(protect);

router.route('/my').get(getMyOrders);
router.route('/').post(requireEmailVerification, orderCreateValidationRules, validate, createOrder);
router.route('/:id').get(getOrderById);
router.route('/').get(authorize('admin', 'owner'), getAllOrders);
router.route('/:id/status').patch(authorize('admin', 'owner'), orderStatusValidationRules, validate, updateOrderStatus);
router.post(
  '/:id/pay',
  requireEmailVerification,
  payOrderValidationRules,   // 1. Check Input Rules
  validate,                  // 2. Check for Validation Errors
  payOrder                   // 3. Execute Logic
);

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================


/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - street
 *         - city
 *         - country
 *       properties:
 *         street:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         country:
 *           type: string
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         name:
 *           type: string
 *         quantity:
 *           type: integer
 *         price:
 *           type: number
 *         cost:
 *           type: number
 *           description: Historic cost at time of purchase (Owner view)
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         orderNumber:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         shipping:
 *           type: number
 *         total:
 *           type: number
 *         status:
 *           type: string
 *           enum: [Pending, Paid, Shipped, Delivered, Cancelled]
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, fawry, cash]
 *         isPaid:
 *           type: boolean
 *         paidAt:
 *           type: string
 *           format: date-time
 *     OrderInput:
 *       type: object
 *       required:
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, fawry, cash]
 *           default: cash
 *     PayOrderInput:
 *       type: object
 *       required:
 *         - paymentMethod
 *       properties:
 *         paymentMethod:
 *           type: string
 *           enum: [card, wallet, fawry]
 *         mobileNumber:
 *           type: string
 *           description: Required if paymentMethod is 'wallet'
 *           example: "01012345678"
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order processing and management
 */

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of own orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates an order from the user's current Cart.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input or Empty Cart
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin/Owner)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all system orders
 *       403:
 *         description: Not authorized (Admin/Owner only)
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin/Owner)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid, Shipped, Delivered, Cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Not authorized
 */

/**
 * @swagger
 * /orders/{id}/pay:
 *   post:
 *     summary: Initiate Payment (Paymob)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayOrderInput'
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 iframeUrl:
 *                   type: string
 *                   description: URL for Card payments
 *                 redirectUrl:
 *                   type: string
 *                   description: URL for Wallet payments
 *       400:
 *         description: Invalid payment method or missing phone number
 */