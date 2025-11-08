const OrderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  const userId = req.user.id;

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required');
  }

  const order = await OrderService.createOrder(userId, shippingAddress);

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully',
  });
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

  const order = await OrderService.getOrderById(userId, id);

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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};