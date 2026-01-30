const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

class ProductService {
  async createProduct(productData) {
    const { name, description, price, sku, stock, categoryId } = productData;

    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      throw new Error('A product with this SKU already exists');
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Cost is not passed here yet (will be added when you update Product Controller/Model for Owner)
    const product = await Product.create({
      name,
      description,
      price,
      sku,
      stock,
      categoryId,
    });

    return product;
  }

  // --- UPGRADED: Cockpit Filters & Pagination ---
  async getAllProducts(query) {
    const { keyword, category, stockStatus, page = 1, limit = 10 } = query;

    // 1. Base Query: Hide deleted products
    let dbQuery = { isDeleted: { $ne: true } };

    // 2. Search Filter (Name or SKU)
    if (keyword) {
      dbQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 3. Category Filter
    if (category) {
      dbQuery.categoryId = category;
    }

    // 4. Stock Status Filter
    if (stockStatus === 'low') {
      // Low stock is defined as less than 10 but greater than 0
      dbQuery.stock = { $lt: 10, $gt: 0 };
    } else if (stockStatus === 'out') {
      dbQuery.stock = 0;
    }

    // 5. Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute Queries
    const count = await Product.countDocuments(dbQuery);
    const products = await Product.find(dbQuery)
      .populate('categoryId', 'name slug')
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 }); // Newest first

    return {
      products,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
    };
  }

  async getProductById(productId) {
    return await Product.findById(productId).populate('categoryId', 'name slug');
  }

  async getProductBySlug(slug) {
    return await Product.findOne({ slug }).populate('categoryId', 'name slug');
  }

  async updateProduct(productId, updateData) {
    const { name, description, price, sku, stock, categoryId } = updateData;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check SKU conflict
    if (sku && sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingSku) {
        throw new Error('A product with this SKU already exists');
      }
      product.sku = sku;
    }

    // Check Category validity
    if (categoryId && categoryId.toString() !== product.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      product.categoryId = categoryId;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;

    const updatedProduct = await product.save();
    return updatedProduct;
  }

  // --- UPGRADED: Soft Delete ---
  async deleteProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Instead of remove(), we hide it.
    product.isDeleted = true;
    await product.save();
    
    return { message: 'Product moved to trash (Soft Deleted)' };
  }
}

module.exports = new ProductService();