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
      // This error will be caught by our middleware and turned into a 404
      throw new Error('Category not found'); 
    }

    const product = await Product.create({
      name,
      description,
      price,
      sku,
      stock,
      categoryId,
      // The 'pre-save' hook in the model will auto-generate the slug
    });

    return product;
    }

    async getAllProducts(query) {
    // This is a complex query. We'll start simple and build on it.
    // For now, it just gets all products.
    // Later, we'll add filtering, search, sorting, and pagination here.
    
    const products = await Product.find()
      .populate('categoryId', 'name slug') // Show category name/slug
      .sort({ createdAt: -1 }); // Sort by newest first

    return {
      products,
      total: products.length,
      page: 1,
      pages: 1,
    };
  }

  async getProductBySlug(slug) {
    // Find by slug and also populate the category info
    const product = await Product.findOne({ slug }).populate(
      'categoryId',
      'name slug'
    );

    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async updateProduct(productId, updatedData) {
    const { name, description, price, sku, stock, categoryId } = updatedData;

    // 1. Find the product
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // 2. Check for SKU conflict (if SKU is being changed)
    if (sku && sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingSku) {
        throw new Error('A product with this SKU already exists');
      }
      product.sku = sku;
    }

    // 3. Check if new Category ID is valid
    if (categoryId && categoryId.toString() !== product.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      product.categoryId = categoryId;
    }

    // 4. Update other fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    
    // The 'pre-save' hook will auto-update slug if name changes
    const updatedProduct = await product.save();
    return updatedProduct;
  }

  /**
   * @desc    Delete a product by its ID
   * @param   {string} productId - The MongoDB _id
   * @returns {void}
   */
  async deleteProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Later, we might add logic to check if this product
    // is in any customer orders before deleting.
    await product.deleteOne();
  }

  
}

module.exports = new ProductService();