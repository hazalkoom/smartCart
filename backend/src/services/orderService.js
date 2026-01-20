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
  async createOrder(user, shippingAddress) {
    // AGGRESSIVE RETRY CONFIGURATION
    const MAX_RETRIES = 10; // Try 10 times before giving up
    let attempt = 0;

    while (true) {
      const session = await mongoose.startSession();
      
      try {
        // STEP 1: PREPARE DATA (READS) - OUTSIDE TRANSACTION
        const cart = await Cart.findOne({ userId: user._id });
        if (!cart || cart.items.length === 0) {
          throw { statusCode: 400, message: 'Cart is empty' };
        }

        const productIds = cart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        
        const productMap = new Map();
        products.forEach(p => productMap.set(p._id.toString(), p));

        const orderItems = [];
        let subtotal = 0;
        const bulkOps = [];

        for (const item of cart.items) {
          const product = productMap.get(item.productId.toString());

          if (!product) throw { statusCode: 404, message: `Product ${item.productId} not found` };
          if (product.quantity < item.quantity) throw { statusCode: 400, message: `Insufficient stock for: ${product.name}` };

          const itemTotal = product.price * item.quantity;
          subtotal += itemTotal;

          orderItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.images && product.images.length > 0 ? product.images[0] : ''
          });

          bulkOps.push({
            updateOne: {
              filter: { _id: item.productId },
              update: { $inc: { quantity: -item.quantity } }
            }
          });
        }

        const total = subtotal;
        const orderNum = generateOrderNumber();

        // STEP 2: THE TRANSACTION (WRITES ONLY)
        session.startTransaction();

        await Product.bulkWrite(bulkOps, { session });

        const order = await Order.create([{
          userId: user._id,
          orderNumber: orderNum,
          items: orderItems,
          subtotal,
          total,
          tax: 0,
          shipping: 0,
          shippingAddress,
          paymentStatus: 'pending',
          status: 'Pending'
        }], { session });

        await Cart.findOneAndDelete({ userId: user._id }).session(session);

        await session.commitTransaction();
        session.endSession();
        return order[0];

      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();

        // Custom errors (400/404) should fail immediately
        if (error.statusCode) throw { statusCode: error.statusCode, message: error.message };

        // RETRY LOGIC
        const isTransient = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
        const isWriteConflict = error.message && error.message.includes('Write conflict');

        if ((isTransient || isWriteConflict) && attempt < MAX_RETRIES) {
          attempt++;
          // Wait longer to let the traffic clear (Exponential Backoff)
          const delay = randomInt(200, 1000); 
          console.warn(`⚠️ Write Conflict (Attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
          await sleep(delay);
          continue; 
        }

        throw error;
      }
    }
  }

  // --- Keep other methods ---
  async getMyOrders(userId) { return await Order.find({ userId }).sort({ createdAt: -1 }); }
  async getOrderById(userId, userRole, orderId) { 
    const order = await Order.findById(orderId).populate('items.productId', 'slug');
    if (!order || (userRole !== 'admin' && userRole !== 'owner' && order.userId.toString() !== userId)) throw new Error('Order not found');
    return order; 
  }
  async getAllOrders() { return await Order.find().populate('userId', 'email firstName lastName').sort({ createdAt: -1 }); }
  async updateOrderStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    order.status = status;
    if (status === 'Paid') order.paidAt = Date.now();
    if (status === 'Shipped') order.shippedAt = Date.now();
    if (status === 'Delivered') order.deliveredAt = Date.now();
    await order.save();
    return order;
  }
}

module.exports = new OrderService();