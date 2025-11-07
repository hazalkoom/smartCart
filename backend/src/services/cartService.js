const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

class CartService {
    async _getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], subtotal: 0 });
    }
    // We populate the product details to work with them
    return cart.populate('items.productId', 'name slug images');
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
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await this._getOrCreateCart(userId);

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
    return cart;
  }

  async removeItemFromCart(userId, itemId) {
    const cart = await this._getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new Error('Item not found in cart');
    }

    // Mongoose helper to remove a sub-document
    item.deleteOne();

    this._recalculateCart(cart);
    await cart.save();
    return cart;
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