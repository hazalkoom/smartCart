const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// Escape special regex characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ProductService {
  async resolveCategoryTokensToIds(categoryFilter) {
    if (!categoryFilter || typeof categoryFilter !== 'string') {
      return [];
    }

    const tokens = categoryFilter
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return [];
    }

    const objectIds = [];
    const slugTokens = [];

    for (const token of tokens) {
      if (mongoose.Types.ObjectId.isValid(token)) {
        objectIds.push(new mongoose.Types.ObjectId(token));
      } else {
        slugTokens.push(token.toLowerCase());
      }
    }

    if (slugTokens.length === 0) {
      return objectIds;
    }

    const slugMatches = await Category.find({
      slug: { $in: slugTokens },
    }).select('_id');

    return [
      ...objectIds,
      ...slugMatches.map((category) => category._id),
    ];
  }

  async createProduct(productData) {
    const { name, description, price, costPrice, sku, stock, categoryId, images } = productData;

    const existingSku = await Product.findOne({ sku: String(sku).toUpperCase() });
    if (existingSku) {
      throw new Error('A product with this SKU already exists');
    }

    const category = await Category.findById(String(categoryId));
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
      images: Array.isArray(images) ? images.filter((url) => typeof url === 'string' && url.trim()) : [],
    });

    return product;
  }

  // ==========================================
  // NEW: AGGREGATION PIPELINE ENGINE
  // ==========================================
  async getAllProducts(query) {
    const {
      keyword,
      category,     // Can be IDs or slugs, comma-separated
      minPrice,
      maxPrice,
      minRating,
      stockStatus,  // 'in', 'out', 'low'
      sort,         // 'price_asc', 'price_desc', 'top_rated', 'newest'
      page = 1,
      limit = 10
    } = query;

    const matchStage = { isDeleted: { $ne: true } };

    // 1. Keyword Regex Matching
    if (keyword) {
      const safeKeyword = escapeRegex(keyword);
      matchStage.$or = [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { sku: { $regex: safeKeyword, $options: 'i' } },
      ];
    }

    // 2. Faceted Category Filtering
    if (category) {
      const categoryIds = await this.resolveCategoryTokensToIds(category);

      if (categoryIds.length > 0) {
        matchStage.categoryId = { $in: categoryIds };
      } else {
        // If an invalid category filter is provided, return no results.
        matchStage.categoryId = { $in: [] };
      }
    }

    // 3. Price Range Slider Filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage.price = {};
      if (minPrice !== undefined) matchStage.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) matchStage.price.$lte = Number(maxPrice);
    }

    // 4. Rating Filtering
    if (minRating !== undefined) {
      matchStage.rating = { $gte: Number(minRating) };
    }

    // 5. Stock Status Logic
    if (stockStatus === 'low') {
      matchStage.stock = { $lt: 10, $gt: 0 };
    } else if (stockStatus === 'out') {
      matchStage.stock = 0;
    } else if (stockStatus === 'in') {
      matchStage.stock = { $gt: 0 };
    }

    // 6. Sorting Control
    let sortStage = { createdAt: -1 }; // Default: Newest
    if (sort === 'price_asc') sortStage = { price: 1 };
    if (sort === 'price_desc') sortStage = { price: -1 };
    if (sort === 'top_rated') sortStage = { rating: -1 };

    // 7. Pagination Setup
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // --- EXECUTE PIPELINE ---
    const pipeline = [
      { $match: matchStage },
      // Emulate Mongoose Populate for Category
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryObj'
        }
      },
      {
        $unwind: {
          path: '$categoryObj',
          preserveNullAndEmptyArrays: true
        }
      },
      // Reformat the category object and exclude sensitive/hidden data
      {
        $set: {
          categoryId: {
            _id: '$categoryObj._id',
            name: '$categoryObj.name',
            slug: '$categoryObj.slug'
          }
        }
      },
      // Exclude the temporary lookup array and sensitive/hidden data
      {
        $unset: ['categoryObj', 'costPrice', 'isDeleted', '__v']
      },
      { $sort: sortStage },
      // Run Count and Data extraction simultaneously
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }]
        }
      }
    ];

    const [result] = await Product.aggregate(pipeline);

    const total = result.metadata.length > 0 ? result.metadata[0].total : 0;
    const products = result.data;

    return {
      products,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  }

  async getProductById(productId) {
    return await Product.findById(String(productId)).populate('categoryId', 'name slug');
  }

  async getProductBySlug(slug) {
    return await Product.findOne({ slug: String(slug) }).populate('categoryId', 'name slug');
  }

  async updateProduct(productId, updateData) {
    const { name, description, price, costPrice, sku, stock, categoryId, images } = updateData;

    const product = await Product.findById(String(productId)).select('+costPrice');
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (sku && sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: String(sku).toUpperCase() });
      if (existingSku) {
        throw new Error('A product with this SKU already exists');
      }
      product.sku = sku;
    }

    if (categoryId && categoryId.toString() !== product.categoryId.toString()) {
      const category = await Category.findById(String(categoryId));
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
    if (images !== undefined) {
      product.images = Array.isArray(images) ? images.filter((url) => typeof url === 'string' && url.trim()) : [];
    }

    const updatedProduct = await product.save();
    return updatedProduct;
  }

  async deleteProduct(productId) {
    const product = await Product.findById(String(productId));

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