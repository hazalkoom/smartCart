const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

// --- HELPER FUNCTIONS ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const generateOrderNumber = () => {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

class OrderService {
  // --- UPGRADED: Create Order with Cost Snapshot ---
  async createOrder(user, shippingAddress) {
    const MAX_RETRIES = 10;
    let attempt = 0;

    while (true) {
      const session = await mongoose.startSession();
      
      try {
        session.startTransaction();

        // 1. Get Cart
        const cart = await Cart.findOne({ userId: user._id });
        if (!cart || cart.items.length === 0) {
          throw { statusCode: 400, message: 'Cart is empty' };
        }

        // 2. Fetch Products WITH Cost Price (Owner Analytics)
        const productIds = cart.items.map(item => item.productId);
        // We explicitly select '+costPrice' because it is hidden by default
        const products = await Product.find({ _id: { $in: productIds } }).select('+costPrice');
        
        const productMap = new Map();
        products.forEach(p => productMap.set(p._id.toString(), p));

        const orderItems = [];
        let subtotal = 0;
        const bulkOps = [];

        for (const item of cart.items) {
          const product = productMap.get(item.productId.toString());

          if (!product) throw { statusCode: 404, message: `Product not found: ${item.productId}` };
          
          if (product.stock < item.quantity) {
            throw { statusCode: 400, message: `Insufficient stock for ${product.name}` };
          }

          // SNAPSHOT: We save the cost NOW. If supplier price changes later,
          // this historic order data remains accurate.
          orderItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            cost: product.costPrice || 0, // <--- SAVED FOR OWNER
            image: product.images[0]
          });

          subtotal += product.price * item.quantity;

          // Decrease Stock
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $inc: { stock: -item.quantity, purchases: item.quantity } }
            }
          });
        }

        // 3. Update Inventory
        await Product.bulkWrite(bulkOps, { session });

        // 4. Create Order
        const tax = 0; 
        const shipping = 50; // Flat rate for now
        const total = subtotal + tax + shipping;
        const orderNumber = generateOrderNumber();

        const order = await Order.create([{
          userId: user._id,
          orderNumber,
          items: orderItems,
          shippingAddress,
          subtotal,
          tax,
          shipping,
          total,
          paymentMethod: 'card', 
          status: 'Pending'
        }], { session });

        // 5. Clear Cart
        await Cart.deleteOne({ userId: user._id }, { session });

        await session.commitTransaction();
        return order[0];

      } catch (error) {
        await session.abortTransaction();
        
        // Retry logic for transient DB errors
        const isTransient = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
        const isWriteConflict = error.message && error.message.includes('Write conflict');

        if ((isTransient || isWriteConflict) && attempt < MAX_RETRIES) {
          attempt++;
          const delay = randomInt(200, 1000); 
          await sleep(delay);
          continue; 
        }
        throw error;
      } finally {
        session.endSession();
      }
    }
  }

  // --- UPGRADED: Strict Status Flow & Restocking ---
  async updateOrderStatus(orderId, newStatus) {
    const order = await Order.findById(String(orderId));
    if (!order) throw new Error('Order not found');

    const currentStatus = order.status;

    const allowedTransitions = {
      Pending: ['Paid', 'Cancelled'],
      Paid: ['Shipped', 'Cancelled'],
      Shipped: ['Delivered'],
      Delivered: [],
      Cancelled: [],
    };

    if (newStatus === currentStatus) {
      return order;
    }

    const allowedNext = allowedTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      const allowedText = allowedNext.length > 0 ? allowedNext.join(' or ') : 'none';
      throw {
        statusCode: 400,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed next status: ${allowedText}.`,
      };
    }

    // 2. Cancellation Logic (Restock Items) — wrapped in a transaction
    // If cancelling a non-cancelled order, give items back to inventory
    if (newStatus === 'Cancelled' && currentStatus !== 'Cancelled') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const bulkOps = order.items.map(item => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: item.quantity, purchases: -item.quantity } }
          }
        }));
        await Product.bulkWrite(bulkOps, { session });

        order.status = newStatus;
        await order.save({ session });

        await session.commitTransaction();
        return order;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    // 3. Update Status & Timestamps
    order.status = newStatus;
    if (newStatus === 'Paid') {
      order.paidAt = Date.now();
      order.isPaid = true;
    }
    if (newStatus === 'Shipped') order.shippedAt = Date.now();
    if (newStatus === 'Delivered') order.deliveredAt = Date.now();

    await order.save();
    return order;
  }

  async getMyOrders(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  }

  async getOrderById(userId, userRole, orderId) {
    const order = await Order.findById(String(orderId)).populate('items.productId', 'slug');
    
    // Authorization Check
    if (!order) throw { statusCode: 404, message: 'Order not found' };
    
    const isAuthorized = userRole === 'admin' || userRole === 'owner' || order.userId.toString() === userId;
    if (!isAuthorized) {
      throw { statusCode: 403, message: 'Not authorized to view this order' };
    }

    return order;
  }

  async getAllOrders() {
    return await Order.find()
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 });
  }
}

module.exports = new OrderService();