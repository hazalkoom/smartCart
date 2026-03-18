const { Worker } = require('bullmq');
const redisClient = require('../utils/redisClient');
const Cart = require('../models/cartModel');
const socket = require('../utils/socket');

// The Worker listens to the exact same 'cart-expiration' queue we created earlier
const cartWorker = new Worker('cart-expiration', async (job) => {
  const { userId, productId, quantity } = job.data;
  console.log(`⏰ [WORKER] Waking up! Checking cart expiration for User: ${userId}, Product: ${productId}`);

  try {
    // 1. Find the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) return;

    // 2. Is the item still sitting in the cart?
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    // If the item is NO LONGER in the cart, it means they either:
    // A) Manually deleted it (which already unlocked it)
    // B) Converted the cart into an Order (checkout)
    // In both cases, the Executioner does nothing and goes back to sleep.
    if (itemIndex === -1) {
      console.log(`✅ [WORKER] Item ${productId} no longer in cart. Lock is handled elsewhere.`);
      return;
    }

    // 3. THE EXECUTION: The item is still sitting there unpaid after 10 minutes.
    // Rip it out of the MongoDB cart array.
    cart.items.splice(itemIndex, 1);

    // Recalculate the subtotal mathematically
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.price * item.quantity;
    });
    cart.subtotal = subtotal;

    await cart.save();

    // 4. UNLOCK INVENTORY: Tell Redis to release the hold so other people can buy it
    await redisClient.decrby(`locked_stock:${productId}`, quantity);
    console.log(`🔓 [WORKER] Cart Expired. Released lock for ${quantity} of Product ${productId}`);

    // 5. LIVE NOTIFICATION: Tell the idiot customer exactly what happened
    const io = socket.getIO();
    io.to(userId.toString()).emit('orderStatusChanged', { // Reusing your existing listener for simplicity
      orderId: 'CART_TIMEOUT',
      status: 'Expired',
      message: 'You took too long to checkout! The item has been removed from your cart and given to someone else.'
    });

  } catch (error) {
    console.error(`❌ [WORKER ERROR] Failed to process cart expiration:`, error.message);
  }
}, { connection: redisClient });

cartWorker.on('completed', (job) => {
  console.log(`⚙️ [BULLMQ] Job ${job.id} completed successfully`);
});

cartWorker.on('failed', (job, err) => {
  console.error(`❌ [BULLMQ] Job ${job.id} failed:`, err.message);
});

module.exports = cartWorker;