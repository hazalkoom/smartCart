const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

class CartService {
  async _getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], subtotal: 0 });
    }
    // We populate the product details to work with them
    return cart.populate('items.productId', 'name slug images price stock');
  }

  _recalculateCart(cart) {
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.price * item.quantity;
    });
    cart.subtotal = subtotal;
    return subtotal;
  }

  async getCart(userId) {
    return this._getOrCreateCart(userId);
  }

  async addItemToCart(userId, productId, quantity) {
    // 1. Get the product to check stock and price
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // 2. Get the user's cart
    const cart = await this._getOrCreateCart(userId);

    // 3. Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new Error('Insufficient stock for updated quantity');
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.price,
      });
    }

    this._recalculateCart(cart);
    await cart.save();
    return cart.populate('items.productId', 'name slug images price stock');
  }

  async updateItemQuantity(userId, itemId, quantity) {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const cart = await this._getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new Error('Item not found in cart');
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error('Product associated with this item no longer exists');
    }
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    item.quantity = quantity;
    this._recalculateCart(cart);
    await cart.save();
    return cart.populate('items.productId', 'name slug images price stock');
  }

  async removeItemFromCart(userId, itemId) {
    const cart = await this._getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.deleteOne();

    this._recalculateCart(cart);
    await cart.save();
    return cart.populate('items.productId', 'name slug images price stock');
  }

  async clearCart(userId) {
    const cart = await this._getOrCreateCart(userId);
    
    cart.items = [];
    cart.subtotal = 0;
    
    await cart.save();
    return cart;
  }
}

module.exports = new CartService();