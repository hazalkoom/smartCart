jest.mock('../../src/models/cartModel', () => ({
  findOne: jest.fn(),
}));

const Cart = require('../../src/models/cartModel');
const redisClient = require('../../src/utils/redisClient');
const { persistAndEmitUserNotification } = require('../../src/services/notificationService');
const { __mockWorkerInstances } = require('bullmq');

jest.mock('../../src/services/notificationService', () => ({
  persistAndEmitUserNotification: jest.fn(),
}));

require('../../src/workers/cartWorker');

describe('cartWorker', () => {
  const getProcessor = () => {
    const worker = __mockWorkerInstances[0];
    return worker.processor;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes unpaid item, releases lock, and persists orderStatusChanged notification', async () => {
    const cart = {
      items: [
        { productId: { toString: () => 'prod-1' }, quantity: 2, price: 10 },
        { productId: { toString: () => 'prod-2' }, quantity: 1, price: 7 },
      ],
      subtotal: 27,
      save: jest.fn(async () => cart),
    };

    Cart.findOne.mockResolvedValue(cart);

    const processJob = getProcessor();
    await processJob({ data: { userId: 'user-1', productId: 'prod-1', quantity: 2 } });

    expect(Cart.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotal).toBe(7);
    expect(cart.save).toHaveBeenCalled();
    expect(redisClient.decrby).toHaveBeenCalledWith('locked_stock:prod-1', 2);
    expect(persistAndEmitUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'order-status-changed',
        eventName: 'orderStatusChanged',
        status: 'Expired',
      })
    );
  });

  it('does nothing when cart is not found', async () => {
    Cart.findOne.mockResolvedValue(null);

    const processJob = getProcessor();
    await processJob({ data: { userId: 'user-1', productId: 'prod-1', quantity: 2 } });

    expect(redisClient.decrby).not.toHaveBeenCalled();
    expect(persistAndEmitUserNotification).not.toHaveBeenCalled();
  });

  it('does nothing when item is already gone from cart', async () => {
    const cart = {
      items: [{ productId: { toString: () => 'prod-2' }, quantity: 1, price: 7 }],
      subtotal: 7,
      save: jest.fn(async () => cart),
    };

    Cart.findOne.mockResolvedValue(cart);

    const processJob = getProcessor();
    await processJob({ data: { userId: 'user-1', productId: 'prod-1', quantity: 2 } });

    expect(cart.save).not.toHaveBeenCalled();
    expect(redisClient.decrby).not.toHaveBeenCalled();
    expect(persistAndEmitUserNotification).not.toHaveBeenCalled();
  });
});
