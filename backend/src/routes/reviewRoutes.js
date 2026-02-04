const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, reviewValidationRules, reviewUpdateValidationRules } = require('../middleware/validationMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Public Route
router.get('/', reviewController.getProductReviews);

// Protected Routes
router.use(protect);

router.post('/', authorize('customer'), reviewValidationRules, validate, reviewController.createReview);

router
  .route('/:id')
  .patch(authorize('customer', 'admin'), reviewUpdateValidationRules, validate, reviewController.updateReview)
  .delete(authorize('customer', 'admin', 'owner'), reviewController.deleteReview);

module.exports = router;

// =========================================================================
//  SWAGGER DOCUMENTATION
// =========================================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique Review ID
 *         productId:
 *           type: string
 *           description: ID of the product being reviewed
 *         userId:
 *           type: string
 *           description: ID of the user who wrote the review
 *         rating:
 *           type: integer
 *           description: Rating between 1 and 5
 *         title:
 *           type: string
 *           description: Short summary of the review
 *         comment:
 *           type: string
 *           description: Full review text
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ReviewInput:
 *       type: object
 *       required:
 *         - productId
 *         - rating
 *         - title
 *         - comment
 *       properties:
 *         productId:
 *           type: string
 *           example: "64c9e7..."
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         title:
 *           type: string
 *           example: "Excellent Product!"
 *         comment:
 *           type: string
 *           example: "I loved the battery life and the screen quality."
 *     ReviewUpdateInput:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         title:
 *           type: string
 *           example: "Good, but could be better"
 *         comment:
 *           type: string
 *           example: "After 1 week, the battery life is slightly less than expected."
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews and ratings
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get reviews
 *     description: Retrieve all reviews or filter by product.
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter reviews for a specific product
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
 *         description: List of reviews
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
 *                     $ref: '#/components/schemas/Review'
 *   post:
 *     summary: Create a review (Customer only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: User already reviewed this product
 *       403:
 *         description: Only customers can write reviews
 */

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/ReviewUpdateInput'
 *     responses:
 *       200:
 *         description: Review updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       403:
 *         description: Not authorized to update this review
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted
 *       403:
 *         description: Not authorized
 */