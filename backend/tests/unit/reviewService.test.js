jest.mock('../../src/models/reviewModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  calcAverageRatings: jest.fn(),
}));

jest.mock('../../src/models/productModel', () => ({
  findById: jest.fn(),
}));

const Review = require('../../src/models/reviewModel');
const Product = require('../../src/models/productModel');

const reviewService = require('../../src/services/reviewService');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('creates a review when product exists and no prior review exists', async () => {
      Product.findById.mockResolvedValue({ _id: 'prod-1' });
      Review.findOne.mockResolvedValue(null);

      const created = { _id: 'rev-1', productId: 'prod-1', userId: 'user-1' };
      Review.create.mockResolvedValue(created);

      const result = await reviewService.createReview('user-1', {
        productId: 'prod-1',
        rating: 5,
        title: 'Nice',
        comment: 'Great',
      });

      expect(Product.findById).toHaveBeenCalledWith('prod-1');
      expect(Review.findOne).toHaveBeenCalledWith({
        userId: 'user-1',
        productId: 'prod-1',
      });
      expect(Review.create).toHaveBeenCalledWith({
        userId: 'user-1',
        productId: 'prod-1',
        rating: 5,
        title: 'Nice',
        comment: 'Great',
      });

      // Current implementation does NOT update averages on create; only on update/delete middleware.
      expect(Review.calcAverageRatings).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe('updateReview', () => {
    it('updates review fields and saves successfully', async () => {
      const review = {
        _id: 'rev-1',
        userId: { toString: () => 'user-1' },
        productId: 'prod-1',
        rating: 3,
        title: 'Old',
        comment: 'Old',
        save: jest.fn(async function () {
          return this;
        }),
      };

      Review.findById.mockResolvedValue(review);

      const result = await reviewService.updateReview('user-1', 'rev-1', {
        rating: 4,
        title: 'New',
      });

      expect(Review.findById).toHaveBeenCalledWith('rev-1');
      expect(review.save).toHaveBeenCalled();
      expect(Review.calcAverageRatings).not.toHaveBeenCalled();
      expect(result.rating).toBe(4);
      expect(result.title).toBe('New');
    });

    it("throws 403 when user attempts to update a review they didn't write", async () => {
      const review = {
        _id: 'rev-1',
        userId: { toString: () => 'owner-user' },
      };

      Review.findById.mockResolvedValue(review);

      await expect(
        reviewService.updateReview('attacker-user', 'rev-1', { rating: 5 })
      ).rejects.toMatchObject({ statusCode: 403, message: 'Not authorized to update this review' });

      expect(Review.calcAverageRatings).not.toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it("throws 403 when user attempts to delete a review they didn't write (and not admin/owner)", async () => {
      const review = {
        _id: 'rev-1',
        userId: { toString: () => 'owner-user' },
      };

      Review.findById.mockResolvedValue(review);

      await expect(
        reviewService.deleteReview('attacker-user', 'customer', 'rev-1')
      ).rejects.toMatchObject({ statusCode: 403, message: 'Not authorized to delete this review' });

      expect(Review.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
