const Order = require('../models/orderModel'); // Import Order Model
const OrderService = require('../services/orderService');
const paymobService = require('../services/paymobService'); // Import Paymob Service
const asyncHandler = require('../utils/asyncHandler');

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const createOrder = catchAsync(async (req, res, next) => {
  try {
    const order = await OrderService.createOrder(req.user, req.body.shippingAddress);

    res.status(201).json({
      status: 'success',
      data: { order },
    });
  } catch (err) {
    // LOG THE ERROR: This is how we debug the 500s
    console.error("🔥 ORDER CONTROLLER ERROR:", err.message);

    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
      status: statusCode === 500 ? 'error' : 'fail',
      message: err.message || 'Server Error',
    });
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await OrderService.getMyOrders(req.user.id);

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const userRole = req.user.role;
  const order = await OrderService.getOrderById(userId, userRole, id);

  res.status(200).json({
    success: true,
    data: order,
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await OrderService.getAllOrders();

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const order = await OrderService.updateOrderStatus(id, status);

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order status updated',
  });
});


const payOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, mobileNumber } = req.body;
  const orderId = req.params.id;

  // Step 1: Lookup
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Step 2: Security (Ownership Check)
  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to pay for this order');
  }

  // Step 3: State Check
  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  // Step 4: Wallet Logic (Phone Number)
  if (paymentMethod === 'wallet') {
    if (mobileNumber) {
      // Case A: User provided a new number in the request
      req.user.mobileNumber = mobileNumber; 
    } else if (!req.user.mobileNumber) {
      // Case B: No number in request AND no number in DB profile
      res.status(400);
      throw new Error('Mobile number is required for Wallet payments. Please provide it or save it to your profile.');
    }
    // Case C: User didn't provide number, but has one in DB. Service uses that.
  }

  // Step 5: Call Service
  try {
    const paymentResponse = await paymobService.initiatePayment(req.user, order, paymentMethod);

    res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error('Payment Initiation Failed:', error.message);
    
    // Graceful error handling
    if (error.message.includes('Paymob') || error.message.includes('unavailable')) {
      res.status(502);
      throw new Error('Payment gateway is currently unavailable. Please try again later.');
    }
    
    // Default server error
    res.status(500);
    throw error;
  }
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  payOrder,
};