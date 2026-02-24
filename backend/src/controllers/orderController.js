const Order = require('../models/orderModel');
const OrderService = require('../services/orderService');
const paymobService = require('../services/paymobService'); 
const asyncHandler = require('../utils/asyncHandler');

// Helper: Sanitize Order for Non-Owners
const sanitizeOrderForAdmin = (order) => {
  const orderObj = order.toObject ? order.toObject() : order;
  // Remove sensitive cost info from every item
  if (orderObj.items) {
    orderObj.items = orderObj.items.map(item => {
      const { cost, ...safeItem } = item; 
      return safeItem;
    });
  }
  return orderObj;
};

const createOrder = asyncHandler(async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.user, req.body.shippingAddress);
    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("🔥 ORDER CONTROLLER ERROR:", err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
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
  const order = await OrderService.getOrderById(req.user.id, req.user.role, req.params.id);
  
  // Security: Hide costs if user is NOT Owner
  let responseOrder = order;
  if (req.user.role !== 'owner') {
    responseOrder = sanitizeOrderForAdmin(order);
  }

  res.status(200).json({
    success: true,
    data: responseOrder,
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  // 1. Get All Orders
  const orders = await OrderService.getAllOrders();

  // 2. Filter Data based on Role
  let responseOrders = orders;
  
  // If Admin (not Owner), strip out cost prices
  if (req.user.role !== 'owner') {
    responseOrders = orders.map(order => sanitizeOrderForAdmin(order));
  }

  res.status(200).json({
    success: true,
    count: responseOrders.length,
    data: responseOrders,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  // Calls Service which enforces: Paid -> Shipped -> Delivered
  const order = await OrderService.updateOrderStatus(id, status);

  res.status(200).json({
    success: true,
    data: order,
    message: `Order status updated to ${status}`,
  });
});

const payOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, mobileNumber } = req.body;
  const orderId = req.params.id;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to pay for this order');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  if (paymentMethod === 'wallet') {
    if (mobileNumber) {
      req.user.mobileNumber = mobileNumber; 
    } else if (!req.user.mobileNumber) {
      res.status(400);
      throw new Error('Mobile number is required for Wallet payments.');
    }
  }

  try {
    const paymentResponse = await paymobService.initiatePayment(req.user, order, paymentMethod);
    res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error('Payment Initiation Failed:', error.message);
    if (error.message.includes('Paymob') || error.message.includes('unavailable')) {
      res.status(502);
      throw new Error('Payment gateway is currently unavailable.');
    }
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