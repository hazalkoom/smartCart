jest.mock('../../src/models/orderModel', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/services/orderService', () => ({
  createOrder: jest.fn(),
  getMyOrders: jest.fn(),
  getOrderById: jest.fn(),
  getAllOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

jest.mock('../../src/services/paymobService', () => ({
  initiatePayment: jest.fn(),
}));

jest.mock('../../src/services/notificationService', () => ({
  persistAndEmitUserNotification: jest.fn(),
}));

const Order = require('../../src/models/orderModel');
const OrderService = require('../../src/services/orderService');
const { persistAndEmitUserNotification } = require('../../src/services/notificationService');

const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} = require('../../src/controllers/orderController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('orderController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createOrder returns 201 with order payload', async () => {
    const req = {
      user: { _id: 'user-1', id: 'user-1' },
      body: { shippingAddress: { street: 'S', city: 'C', country: 'EG' } },
    };
    const res = makeRes();
    const next = jest.fn();
    const order = { _id: 'order-1' };

    OrderService.createOrder.mockResolvedValue(order);

    await createOrder(req, res, next);

    expect(OrderService.createOrder).toHaveBeenCalledWith(req.user, req.body.shippingAddress);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: order });
  });

  it('getMyOrders returns 200 with count and orders', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();
    const orders = [{ _id: 'order-1' }, { _id: 'order-2' }];

    OrderService.getMyOrders.mockResolvedValue(orders);

    await getMyOrders(req, res, next);

    expect(OrderService.getMyOrders).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 2, data: orders });
  });

  it('updateOrderStatus emits orderStatusChanged socket event to the user room', async () => {
    const req = { params: { id: 'order-1' }, body: { status: 'Shipped' } };
    const res = makeRes();
    const next = jest.fn();
    const order = { _id: 'order-1', userId: { toString: () => 'user-1' } };

    OrderService.updateOrderStatus.mockResolvedValue(order);

    await updateOrderStatus(req, res, next);

    expect(OrderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'Shipped');
    expect(persistAndEmitUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: order.userId,
        type: 'order-status-changed',
        eventName: 'orderStatusChanged',
        orderId: 'order-1',
        status: 'Shipped',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: order,
      message: 'Order status updated to Shipped',
    });
  });

  it('updateOrderStatus returns validation error when status is missing', async () => {
    const req = { params: { id: 'order-1' }, body: {} };
    const res = makeRes();
    const next = jest.fn();

    await updateOrderStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Status is required');
    expect(OrderService.updateOrderStatus).not.toHaveBeenCalled();
  });
});
