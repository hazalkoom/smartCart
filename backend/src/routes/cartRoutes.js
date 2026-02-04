const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  cartItemValidationRules,
  cartQtyValidationRules,
} = require('../middleware/validationMiddleware');
const {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
} = require('../controllers/cartController');

const router = express.Router();

// Apply protection to all cart routes
router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.route('/items')
  .post(cartItemValidationRules, validate, addItemToCart);

router.route('/items/:itemId')
  .put(cartQtyValidationRules, validate, updateItemQuantity)
  .delete(removeItemFromCart);

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product
 *         quantity:
 *           type: integer
 *           description: Quantity selected
 *         price:
 *           type: number
 *           description: Price at the time of adding
 *         _id:
 *           type: string
 *           description: Unique ID of this item inside the cart
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         subtotal:
 *           type: number
 *           description: Total price of all items
 *     CartItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           example: "64c9e7..."
 *         quantity:
 *           type: integer
 *           example: 2
 *     CartQtyInput:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           example: 5
 */

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping Cart Management
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *   delete:
 *     summary: Clear the entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemInput'
 *     responses:
 *       200:
 *         description: Item added/updated in cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Product not found
 *       400:
 *         description: Insufficient stock
 */

/**
 * @swagger
 * /cart/items/{itemId}:
 *   put:
 *     summary: Update item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Item ID (not Product ID) inside the cart array
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartQtyInput'
 *     responses:
 *       200:
 *         description: Quantity updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Item not found in cart
 *   delete:
 *     summary: Remove single item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific Item ID (not Product ID) inside the cart array
 *     responses:
 *       200:
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 */