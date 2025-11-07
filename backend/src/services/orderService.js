const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const { generateOrderNumber } = require('../utils/orderNumberUtil');
const mongoose = require('mongoose');

class OrderService {
    async createOrder(userId, shippingAddress) {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    const stockErrors = [];
    for (const item of cart.items) {
      const product = item.productId;
      if (product.stock < item.quantity) {
        stockErrors.push(`Insufficient stock for ${product.name}`);
      }
    }
    if (stockErrors.length > 0) {
      throw new Error(stockErrors.join(', '));
    }

    const orderItems = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      quantity: item.quantity,
      price: item.price,
      image: item.productId.images[0] || null,
    }));

    const subtotal = cart.subtotal;
    const tax = 0;
    const shipping = 0;
    const total = subtotal + tax + shipping;

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      subtotal,
      tax,
      shipping,
      total,
      status: 'Pending', // Will be "Paid" after Stripe
    });

    // Decrease stock (this must be transactional)
    // We start a Mongoose session for an "all or nothing" operation
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of cart.items) {
        await Product.updateOne(
          { _id: item.productId._id },
          { $inc: { stock: -item.quantity, purchases: item.quantity } },
          { session }
        );
      }
      
      cart.items = [];
      cart.subtotal = 0;
      await cart.save({ session });
      
      // If all operations succeed, commit the transaction
      await session.commitTransaction();
    } catch (error) {
      // If any operation fails, roll back all changes
      await session.abortTransaction();
      throw new Error(`Order processing failed: ${error.message}`);
    } finally {
      session.endSession();
    }

    return order;
  }

  async getMyOrders(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  }

  async getOrderById(userId, orderId) {
    const order = await Order.findById(orderId).populate(
      'items.productId',
      'slug'
    );

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new Error('Order not found'); 
    }

    return order;
  }

  async getAllOrders() {
    return await Order.find().populate('userId', 'email firstName lastName').sort({ createdAt: -1 });
  }

  async updateOrderStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    
    // Set status dates
    if (status === 'Paid') order.paidAt = Date.now();
    if (status === 'Shipped') order.shippedAt = Date.now();
    if (status === 'Delivered') order.deliveredAt = Date.now();

    await order.save();
    return order;
  }
}

module.exports = new OrderService();