const Review = require('../models/reviewModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel')

class ReviewService {
    async createReview(userId, reviewData) {
    const { productId, rating, title, comment } = reviewData;

    const product = await Product.findById(String(productId));
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Manual check (Still good to have)
    const existingReview = await Review.findOne({ 
      userId: userId.toString(), 
      productId: productId.toString() 
    });

    if (existingReview) {
      const error = new Error('You have already reviewed this product');
      error.statusCode = 400;
      throw error;
    }

    try {
      const review = await Review.create({
        userId,
        productId,
        rating,
        title,
        comment
      });
      return review;
    } catch (err) {
      // --- FIX: Catch Duplicate Key Error ---
      if (err.code === 11000) {
        const error = new Error('You have already reviewed this product');
        error.statusCode = 400;
        throw error;
      }
      throw err;
    }
  }

  async getReviewsByProduct(productId) {
    const reviews = await Review.find({ productId: String(productId) })
      .populate('userId', 'firstName lastName') // Show reviewer name
      .sort({ createdAt: -1 }); // Newest first

    return reviews;
  }

  async updateReview(userId, reviewId, updateData) {
    const review = await Review.findById(String(reviewId));

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.userId.toString() !== userId.toString()) {
      const error = new Error('Not authorized to update this review');
      error.statusCode = 403;
      throw error;
    }

    // Update fields
    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.comment !== undefined) review.comment = updateData.comment;

    await review.save();

    return review;
  }

  // 4. Delete Review (Only if you own it or are Admin)
  async deleteReview(userId, userRole, reviewId) {
    const review = await Review.findById(String(reviewId));

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    // Allow if Owner OR Admin OR User is the author
    const isOwner = review.userId.toString() === userId.toString();
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    if (!isOwner && !isAdmin) {
      const error = new Error('Not authorized to delete this review');
      error.statusCode = 403;
      throw error;
    }

    await Review.findByIdAndDelete(String(reviewId)); // This triggers .post('findOneAndDelete') middleware
    return { message: 'Review deleted successfully' };
  }

}

module.exports = new ReviewService();