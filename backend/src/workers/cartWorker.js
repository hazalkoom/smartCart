const { Worker } = require('bullmq');
const redisClient = require('../utils/redisClient');
const Cart = require('../models/cartModel');
const { persistAndEmitUserNotification } = require('../services/notificationService');

const cartWorker = new Worker('cart-expiration', async (job) => {
  const { userId, productId, quantity } = job.data;
  console.log(`⏰ [WORKER] Waking up! Checking cart expiration for User: ${userId}, Product: ${productId}`);

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return;

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      console.log(`✅ [WORKER] Item ${productId} no longer in cart. Lock is handled elsewhere.`);
      return;
    }

    cart.items.splice(itemIndex, 1);

    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.price * item.quantity;
    });
    cart.subtotal = subtotal;

    await cart.save();

    await redisClient.decrby(`locked_stock:${productId}`, quantity);
    console.log(`🔓 [WORKER] Cart Expired. Released lock for ${quantity} of Product ${productId}`);

    await persistAndEmitUserNotification({
      userId,
      type: 'order-status-changed',
      eventName: 'orderStatusChanged',
      status: 'Expired',
      message: 'You took too long to checkout! The item has been removed from your cart and given to someone else.',
    });

  } catch (error) {
    console.error(`❌ [WORKER ERROR] Failed to process cart expiration:`, error.message);
  }
}, { 
  connection: redisClient,
  // --- UPSTASH FREE TIER SAVERS ---
  stalledInterval: 300000, 
  lockDuration: 60000,     
  removeOnComplete: { count: 10 }, 
  removeOnFail: { count: 10 },
  drainDelay: 120
});

cartWorker.on('completed', (job) => {
  console.log(`⚙️ [BULLMQ] Job ${job.id} completed successfully`);
});

cartWorker.on('failed', (job, err) => {
  console.error(`❌ [BULLMQ] Job ${job.id} failed:`, err.message);
});



module.exports = cartWorker;