const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Public Route
router.get('/', reviewController.getProductReviews);
// Protected Routes
router.use(protect);


router.post('/', authorize('customer'), reviewController.createReview);

router
  .route('/:id')
  .patch(authorize('customer', 'admin'), reviewController.updateReview)
  .delete(authorize('customer', 'admin', 'owner'), reviewController.deleteReview);

module.exports = router;