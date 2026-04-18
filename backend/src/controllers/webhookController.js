const Order = require('../models/orderModel');
const Product = require('../models/productModel'); // NEW
const { validateHmac } = require('../utils/paymobHmac');
const asyncHandler = require('../utils/asyncHandler');
const socket = require('../utils/socket');
const redisClient = require('../utils/redisClient'); // NEW
const { persistAndEmitUserNotification, persistAdminNotification } = require('../services/notificationService');
const cleanLog = (val) => (val ? String(val).replace(/\n|\r/g, "") : "");
const handlePaymobWebhook = asyncHandler(async (req, res) => {

  if (req.body.type !== 'TRANSACTION') {
    return res.status(200).send();
  }
  // 1. Extract Data
  const hmacSent = req.query.hmac;
  const data = req.body.obj;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  if (!data) {
    // If request body is empty or malformed
    return res.status(400).send('Invalid Request Body');
  }

  // 2. Security: Validate HMAC Signature
  const isValid = validateHmac(data, hmacSent, hmacSecret);

  if (!isValid) {
    console.error('⚠️ Paymob Webhook: HMAC Validation Failed!');
    // Return 403 Forbidden to reject the request
    return res.status(403).json({ message: 'Invalid HMAC signature' });
  }

  // 3. Check Success Status
  // Paymob sends success: true/false
  if (data.success !== true) {
    console.log(`Paymob Transaction Failed: ${cleanLog(data.id)}`);
    // Return 200 to acknowledge receipt so Paymob stops retrying, but don't update DB
    return res.status(200).send();
  }

  // 4. Idempotency & Order Retrieval
  const rawMerchantOrderId =
    (data.order && typeof data.order === 'object' && data.order.merchant_order_id) ||
    data.merchant_order_id;
  
  if (!rawMerchantOrderId) {
      console.error('Paymob Webhook: merchant_order_id is missing from payload', cleanLog(JSON.stringify(data)));
      return res.status(200).send(); 
  }

  const orderId = rawMerchantOrderId.split('_')[0];  // Extract the real MongoDB ID

  const order = await Order.findById(orderId);

  if (!order) {
    console.error(`Paymob Webhook: Order not found (Parsed ID: ${cleanLog(orderId)})`);
    return res.status(200).send();
  }

  // Idempotency Check: If already paid, stop.
  if (order.isPaid) {
    return res.status(200).send();
  }

  // 5. Atomic Update
  // We use findOneAndUpdate to prevent race conditions
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    {
      $set: {
        isPaid: true,
        paidAt: Date.now(),
        status: 'Paid',
        paymentResult: data, // Save the full Paymob transaction object
      },
    },
    { new: true }
  );

  // --- NEW: PERMANENT INVENTORY CLEANUP ---
  try {
    const orderForInventory = updatedOrder || order;
    const orderItems = Array.isArray(orderForInventory.items) ? orderForInventory.items : [];

    for (const item of orderItems) {
      const productId = item.productId || item.product;
      if (!productId) continue;

      // 1. Permanently reduce the actual MongoDB stock and increase purchases
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -item.quantity, purchases: item.quantity }
      });
      
      // 2. Erase the temporary Redis hold so the math stays correct
      await redisClient.decrby(`locked_stock:${productId}`, item.quantity);
    }
    console.log(`📦 [INVENTORY] Stock permanently updated and locks released for Order ${cleanLog(orderId)}`);
  } catch (err) {
    console.error('❌ [INVENTORY ERROR] Failed to update stock/locks:', cleanLog(err.message));
  }

  await persistAndEmitUserNotification({
    userId: order.userId,
    type: 'payment-success',
    eventName: 'paymentSuccess',
    orderId: order._id,
    message: 'Payment Successful! Your order is confirmed.',
  });

  await persistAdminNotification({
    type: 'admin-order-paid',
    orderId: order._id,
    message: `New Payment Received for Order ${orderId}`,
  });

  try {
    const io = socket.getIO();
    io.to('admin_room').emit('adminOrderPaid', {
      orderId: order._id,
      message: `New Payment Received for Order ${orderId}`,
      timestamp: Date.now(),
    });
    
    console.log(`[SOCKET] Live notification fired to user room: ${cleanLog(order.userId)}`);
  } catch (err) {
    console.error('[SOCKET ERROR] Failed to emit adminOrderPaid:', cleanLog(err.message));
  }
  // ----------------------------------------

  res.status(200).send();
});

module.exports = { handlePaymobWebhook };