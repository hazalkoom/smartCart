const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

class ProductService {
  async createProduct(productData) {
    const { name, description, price, costPrice, sku, stock, categoryId } = productData;

    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      throw new Error('A product with this SKU already exists');
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const product = await Product.create({
      name,
      description,
      price,
      costPrice: costPrice || 0,
      sku,
      stock,
      categoryId,
    });

    return product;
  }

  async getAllProducts(query) {
    const { keyword, category, stockStatus, page = 1, limit = 10 } = query;

    let dbQuery = { isDeleted: { $ne: true } };

    if (keyword) {
      dbQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (category) {
      dbQuery.categoryId = category;
    }

    if (stockStatus === 'low') {
      dbQuery.stock = { $lt: 10, $gt: 0 };
    } else if (stockStatus === 'out') {
      dbQuery.stock = 0;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const count = await Product.countDocuments(dbQuery);
    const products = await Product.find(dbQuery)
      .populate('categoryId', 'name slug')
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

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
    const { name, description, price, costPrice, sku, stock, categoryId } = updateData;

    // --- FIX: Explicitly select '+costPrice' so it doesn't get lost ---
    const product = await Product.findById(productId).select('+costPrice');
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (sku && sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingSku) {
        throw new Error('A product with this SKU already exists');
      }
      product.sku = sku;
    }

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
    product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
    product.stock = stock !== undefined ? stock : product.stock;

    const updatedProduct = await product.save();
    return updatedProduct;
  }

  async deleteProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    product.isDeleted = true;
    
    // Release the SKU so it can be reused
    product.sku = `${product.sku}-DELETED-${Date.now()}`;
    product.slug = `${product.slug}-deleted-${Date.now()}`;

    await product.save();
    
    return { message: 'Product moved to trash (Soft Deleted)' };
  }
}

module.exports = new ProductService();