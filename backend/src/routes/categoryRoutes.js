const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  categoryValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();


router.route('/').get(getAllCategories);


router.route('/:slug').get(getCategoryBySlug);


router.route('/').post(protect, authorize('admin', 'owner'), categoryValidationRules, validate, createCategory);


router.route('/:id')
  .put(protect, authorize('admin', 'owner'), categoryValidationRules, validate, updateCategory)
  .delete(protect, authorize('admin', 'owner'), deleteCategory);

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================


/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Name of the category
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name (auto-generated)
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Electronics
 *         description:
 *           type: string
 *           example: Gadgets, phones, and laptops
 *         imageUrl:
 *           type: string
 *           example: https://example.com/image.png
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management (Public & Admin)
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
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
 *                     $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     summary: Get single category by Slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: The category slug (e.g. 'smart-phones')
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category (Admin/Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an Admin/Owner
 */

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (Admin/Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Delete category (Admin/Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */