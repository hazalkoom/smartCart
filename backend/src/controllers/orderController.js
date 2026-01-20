const OrderService = require('../services/orderService');
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};