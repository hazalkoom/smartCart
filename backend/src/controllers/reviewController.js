const reviewService = require('../services/reviewService');
const asyncHandler = require('../utils/asyncHandler');

const createReview = asyncHandler(async (req, res, next) => {
  if (!req.body.productId && req.params.productId) {
    req.body.productId = req.params.productId;
  }

  const review = await reviewService.createReview(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: review,
  });
});

const getProductReviews = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId || req.query.productId;
  
  const reviews = await reviewService.getReviewsByProduct(productId);

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

const updateReview = asyncHandler(async (req, res, next) => {
  const review = await reviewService.updateReview(
    req.user._id, 
    req.params.id, 
    req.body
  );

  res.status(200).json({
    success: true,
    data: review,
  });
});

const deleteReview = asyncHandler(async (req, res, next) => {
  await reviewService.deleteReview(
    req.user._id,
    req.user.role,
    req.params.id
  );

  res.status(204).json({
    success: true,
    data: null,
  });
});

module.exports = {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview
}