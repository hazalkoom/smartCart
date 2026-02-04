const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  productValidationRules,
  productUpdateValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *           description: URL-friendly name
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           description: Selling price
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (Unique)
 *         stock:
 *           type: integer
 *           description: Quantity available
 *         categoryId:
 *           type: string
 *           description: ID of the parent category
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         featured:
 *           type: boolean
 *         rating:
 *           type: number
 *           description: Average rating (0-5)
 *         reviewCount:
 *           type: integer
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - costPrice
 *         - sku
 *         - stock
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           example: Gaming Laptop
 *         description:
 *           type: string
 *           example: High performance laptop with RTX 4090
 *         price:
 *           type: number
 *           example: 2500.00
 *         costPrice:
 *           type: number
 *           description: The cost to the shop (Hidden from public)
 *           example: 1800.00
 *         sku:
 *           type: string
 *           example: LAP-001-GM
 *         stock:
 *           type: integer
 *           example: 50
 *         categoryId:
 *           type: string
 *           example: 60d5ecb8b487343510843d12
 *         featured:
 *           type: boolean
 *           example: true
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://example.com/laptop1.jpg"]
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by Category ID
 *     responses:
 *       200:
 *         description: List of products
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
 *                     $ref: '#/components/schemas/Product'
 */
router.route('/').get(getAllProducts);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     summary: Get single product by Slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.route('/:slug').get(getProduct);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product (Admin/Owner)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or duplicate SKU
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an Admin/Owner
 */
router.route('/').post(protect, authorize('admin', 'owner'), productValidationRules, validate, createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (Admin/Owner)
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete product (Owner Only)
 *     description: Permanently deletes a product. Only the Store Owner can perform this.
 *     tags: [Products]
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
 *         description: Product deleted
 *       403:
 *         description: Forbidden (Admins cannot delete, only Owner)
 *       404:
 *         description: Product not found
 */
router.route('/:id').put(protect, authorize('admin', 'owner'), productUpdateValidationRules, validate, updateProduct);

// --- OWNER ONLY: Permanent Delete ---
router.route('/:id').delete(protect, authorize('owner'), deleteProduct);

module.exports = router;