const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { reviewValidationRules, reviewUpdateValidationRules, validate } = require('../middleware/validationMiddleware');

const router = express.Router({ mergeParams: true });

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