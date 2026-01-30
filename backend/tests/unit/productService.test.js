jest.mock('../../src/models/productModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/models/categoryModel', () => ({
  findById: jest.fn(),
}));

const Product = require('../../src/models/productModel');
const Category = require('../../src/models/categoryModel');

const productService = require('../../src/services/productService');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts (filters)', () => {
    it("constructs low-stock query when stockStatus is 'low'", async () => {
      Product.countDocuments.mockResolvedValue(0);

      const chain = {
        populate: jest.fn(() => chain),
        limit: jest.fn(() => chain),
        skip: jest.fn(() => chain),
        sort: jest.fn().mockResolvedValue([]),
      };

      Product.find.mockReturnValue(chain);

      await productService.getAllProducts({ stockStatus: 'low', page: 1, limit: 10 });

      const expectedQuery = {
        isDeleted: { $ne: true },
        stock: { $lt: 10, $gt: 0 },
      };

      expect(Product.countDocuments).toHaveBeenCalledWith(expectedQuery);
      expect(Product.find).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('updateProduct (costPrice selection)', () => {
    it("explicitly selects '+costPrice' when fetching product", async () => {
      const productDoc = {
        _id: 'prod-1',
        sku: 'SKU1',
        categoryId: { toString: () => 'cat-1' },
        name: 'P',
        description: 'D',
        price: 10,
        costPrice: 2,
        stock: 5,
        save: jest.fn(async function () {
          return this;
        }),
      };

      const selectMock = jest.fn().mockResolvedValue(productDoc);
      Product.findById.mockReturnValue({ select: selectMock });

      const result = await productService.updateProduct('prod-1', { name: 'New' });

      expect(Product.findById).toHaveBeenCalledWith('prod-1');
      expect(selectMock).toHaveBeenCalledWith('+costPrice');
      expect(result.name).toBe('New');
      expect(productDoc.save).toHaveBeenCalled();
    });
  });

  describe('deleteProduct (soft delete)', () => {
    it('sets isDeleted and renames SKU and slug to avoid collisions', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const productDoc = {
        _id: 'prod-1',
        isDeleted: false,
        sku: 'ABC',
        slug: 'abc',
        save: jest.fn(async function () {
          return this;
        }),
      };

      Product.findById.mockResolvedValue(productDoc);

      const result = await productService.deleteProduct('prod-1');

      expect(Product.findById).toHaveBeenCalledWith('prod-1');
      expect(productDoc.isDeleted).toBe(true);
      expect(productDoc.sku).toBe('ABC-DELETED-1234567890');
      expect(productDoc.slug).toBe('abc-deleted-1234567890');
      expect(productDoc.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Product moved to trash (Soft Deleted)' });
    });
  });
});
