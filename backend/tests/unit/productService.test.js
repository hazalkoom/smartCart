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

  // --- #38: createProduct unit tests ---
  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Laptop',
      description: 'A fine laptop',
      price: 999,
      costPrice: 500,
      sku: 'LAP-001',
      stock: 50,
      categoryId: 'cat-1',
      images: ['https://img.example.com/laptop.jpg'],
    };

    it('creates a product when SKU is unique and category exists', async () => {
      Product.findOne.mockResolvedValue(null); // no duplicate SKU
      Category.findById.mockResolvedValue({ _id: 'cat-1', name: 'Laptops' });

      const created = { _id: 'prod-new', ...validProductData };
      Product.create.mockResolvedValue(created);

      const result = await productService.createProduct(validProductData);

      expect(Product.findOne).toHaveBeenCalledWith({ sku: 'LAP-001' });
      expect(Category.findById).toHaveBeenCalledWith('cat-1');
      expect(Product.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it('throws when SKU already exists', async () => {
      Product.findOne.mockResolvedValue({ _id: 'existing', sku: 'LAP-001' });

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        'A product with this SKU already exists'
      );

      expect(Category.findById).not.toHaveBeenCalled();
      expect(Product.create).not.toHaveBeenCalled();
    });

    it('throws when category is not found', async () => {
      Product.findOne.mockResolvedValue(null);
      Category.findById.mockResolvedValue(null);

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        'Category not found'
      );

      expect(Product.create).not.toHaveBeenCalled();
    });

    it('filters out invalid image URLs', async () => {
      Product.findOne.mockResolvedValue(null);
      Category.findById.mockResolvedValue({ _id: 'cat-1' });

      const created = { _id: 'prod-filtered' };
      Product.create.mockResolvedValue(created);

      const data = { ...validProductData, images: ['valid.jpg', '', '  ', null, 42] };
      await productService.createProduct(data);

      const createCall = Product.create.mock.calls[0][0];
      expect(createCall.images).toEqual(['valid.jpg']);
    });
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
