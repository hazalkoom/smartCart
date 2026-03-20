const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const redisClient = require('../utils/redisClient');
const { cartQueue } = require('../workers/queueSetup');
const cleanLog = (val) => String(val).replace(/[\r\n]+/g, '');

class CartService {
  _buildStockConflictError(message) {
    return {
      statusCode: 409,
      errorCode: 'INSUFFICIENT_STOCK',
      message,
    };
  }

  async _getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId: String(userId) });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], subtotal: 0 });
    }
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
    if (quantity < 1) throw new Error('Quantity must be at least 1');
    
    const product = await Product.findById(String(productId));
    if (!product) throw new Error('Product not found');

    // 1. THE BOUNCER: Check Redis for how many are currently locked in other carts
    const lockedStockStr = await redisClient.get(`locked_stock:${productId}`);
    const lockedStock = lockedStockStr ? parseInt(lockedStockStr, 10) : 0;
    
    // 2. The Real Availability Calculation
    const availableStock = product.stock - lockedStock;

    if (availableStock < quantity) {
      throw this._buildStockConflictError(
        `Over-selling prevented: Only ${availableStock} items available. The rest are reserved in other checkouts.`
      );
    }

    const cart = await this._getOrCreateCart(userId);
    const existingItem = cart.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.price,
      });
    }

    // 3. THE LOCK: Instantly reserve this quantity in Redis so nobody else can claim it
    await redisClient.incrby(`locked_stock:${productId}`, quantity);

    this._recalculateCart(cart);
    await cart.save();

    // 4. THE TICKING CLOCK: Tell BullMQ to wake up in exactly 10 minutes to verify if this was paid
    await cartQueue.add(
      'expireCartItem',
      { userId, productId, quantity },
      { delay: 10 * 60 * 1000 } // 10 minutes in milliseconds
    );

    console.log(`🔒 [LOCK] User ${cleanLog(userId)} reserved ${cleanLog(quantity)} of Product ${cleanLog(productId)}`);

    return cart.populate('items.productId', 'name slug images price stock');
  }

  async updateItemQuantity(userId, itemId, quantity) {
    if (quantity < 1) throw new Error('Quantity must be at least 1');

    const cart = await this._getOrCreateCart(userId);
    const item = cart.items.id(itemId);
    if (!item) throw new Error('Item not found in cart');

    const product = await Product.findById(String(item.productId._id));
    if (!product) throw new Error('Product associated with this item no longer exists');

    // Calculate the difference. Are they adding more to the cart, or removing some?
    const quantityDifference = quantity - item.quantity;

    if (quantityDifference > 0) {
      // They want MORE. We must check the bouncer again.
      const lockedStockStr = await redisClient.get(`locked_stock:${product._id}`);
      const lockedStock = lockedStockStr ? parseInt(lockedStockStr, 10) : 0;
      const availableStock = product.stock - lockedStock;

      if (availableStock < quantityDifference) {
        throw this._buildStockConflictError(
          `Over-selling prevented: Only ${availableStock} items available. The rest are reserved in other checkouts.`
        );
      }
      
      // Lock the additional items and start a new timer
      await redisClient.incrby(`locked_stock:${product._id}`, quantityDifference);
      await cartQueue.add(
        'expireCartItem',
        { userId, productId: product._id, quantity: quantityDifference },
        { delay: 10 * 60 * 1000 }
      );
    } else if (quantityDifference < 0) {
      // They reduced the quantity. We release the lock for the removed items instantly!
      await redisClient.decrby(`locked_stock:${product._id}`, Math.abs(quantityDifference));
    }

    item.quantity = quantity;
    this._recalculateCart(cart);
    await cart.save();
    return cart.populate('items.productId', 'name slug images price stock');
  }

  async removeItemFromCart(userId, itemId) {
    const cart = await this._getOrCreateCart(userId);
    const item = cart.items.id(itemId);

    if (!item) throw new Error('Item not found in cart');

    // UNLOCK: The user removed it manually, so we instantly release the inventory back to the public
    await redisClient.decrby(`locked_stock:${item.productId._id}`, item.quantity);
    console.log(`🔓 [UNLOCK] User ${cleanLog(userId)} released ${cleanLog(item.quantity)} of Product ${cleanLog(item.productId._id)}`);

    item.deleteOne();
    this._recalculateCart(cart);
    await cart.save();
    return cart.populate('items.productId', 'name slug images price stock');
  }

  async clearCart(userId) {
    const cart = await this._getOrCreateCart(userId);
    
    // UNLOCK ALL: Loop through the cart and release everything
    for (const item of cart.items) {
      await redisClient.decrby(`locked_stock:${item.productId._id}`, item.quantity);
    }
    
    cart.items = [];
    cart.subtotal = 0;
    
    await cart.save();
    return cart;
  }
}

module.exports = new CartService();