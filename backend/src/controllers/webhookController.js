const Order = require('../models/orderModel');
const { validateHmac } = require('../utils/paymobHmac');
const asyncHandler = require('../utils/asyncHandler');

const handlePaymobWebhook = asyncHandler(async (req, res) => {
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
    console.log(`Paymob Transaction Failed: ${data.id}`);
    // Return 200 to acknowledge receipt so Paymob stops retrying, but don't update DB
    return res.status(200).send();
  }

  // 4. Idempotency & Order Retrieval
  const orderId = data.merchant_order_id;
  const order = await Order.findById(orderId);

  if (!order) {
    console.error(`Paymob Webhook: Order not found (ID: ${orderId})`);
    // Return 200 to stop Paymob retries
    return res.status(200).send();
  }

  // Idempotency Check: If already paid, stop.
  if (order.isPaid) {
    return res.status(200).send();
  }

  // 5. Atomic Update
  // We use findOneAndUpdate to prevent race conditions
  await Order.findOneAndUpdate(
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

  res.status(200).send();
});

module.exports = { handlePaymobWebhook };