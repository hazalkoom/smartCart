jest.mock('../../src/models/orderModel', () => ({
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/models/cartModel', () => ({
  findOne: jest.fn(),
  deleteOne: jest.fn(),
}));

jest.mock('../../src/models/productModel', () => ({
  find: jest.fn(),
  bulkWrite: jest.fn(),
}));

jest.mock('mongoose', () => ({
  startSession: jest.fn(),
}));

const Order = require('../../src/models/orderModel');
const Cart = require('../../src/models/cartModel');
const Product = require('../../src/models/productModel');
const mongoose = require('mongoose');

const orderService = require('../../src/services/orderService');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder (transaction + retry)', () => {
    it('retries when the first commitTransaction fails with a Write conflict', async () => {
      const commitErr = new Error('Write conflict');

      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest
          .fn()
          .mockRejectedValueOnce(commitErr)
          .mockResolvedValueOnce(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn(),
      };

      mongoose.startSession
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(session);

      const user = { _id: 'user-1' };

      const cart = {
        items: [{ productId: 'prod-1', quantity: 2 }],
      };

      Cart.findOne.mockResolvedValue(cart);
      Cart.deleteOne.mockResolvedValue(undefined);

      const products = [
        {
          _id: 'prod-1',
          name: 'P1',
          price: 10,
          stock: 10,
          costPrice: 3,
          images: ['img'],
        },
      ];

      const selectMock = jest.fn().mockResolvedValue(products);
      Product.find.mockReturnValue({ select: selectMock });
      Product.bulkWrite.mockResolvedValue(undefined);

      const createdOrderDoc = { _id: 'order-1', status: 'Pending' };
      Order.create
        .mockResolvedValueOnce([createdOrderDoc])
        .mockResolvedValueOnce([createdOrderDoc]);

      const result = await orderService.createOrder(user, {
        street: 'S',
        city: 'C',
        country: 'EG',
      });

      expect(mongoose.startSession).toHaveBeenCalledTimes(2);
      expect(session.commitTransaction).toHaveBeenCalledTimes(2);
      expect(session.abortTransaction).toHaveBeenCalledTimes(1);
      expect(result).toBe(createdOrderDoc);

      // The flow should have been attempted twice.
      expect(Cart.findOne).toHaveBeenCalledTimes(2);
      expect(Product.bulkWrite).toHaveBeenCalledTimes(2);
      expect(Order.create).toHaveBeenCalledTimes(2);
      expect(Cart.deleteOne).toHaveBeenCalledTimes(2);
    });

    it('decrements stock via bulkWrite with negative quantities', async () => {
      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(session);

      const user = { _id: 'user-1' };
      const cart = {
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      };

      Cart.findOne.mockResolvedValue(cart);
      Cart.deleteOne.mockResolvedValue(undefined);

      const products = [
        {
          _id: 'prod-1',
          name: 'P1',
          price: 10,
          stock: 10,
          costPrice: 2,
          images: ['img'],
        },
        {
          _id: 'prod-2',
          name: 'P2',
          price: 5,
          stock: 10,
          costPrice: 1,
          images: ['img2'],
        },
      ];

      Product.find.mockReturnValue({ select: jest.fn().mockResolvedValue(products) });
      Product.bulkWrite.mockResolvedValue(undefined);

      Order.create.mockResolvedValue([{ _id: 'order-1' }]);

      await orderService.createOrder(user, { street: 'S', city: 'C', country: 'EG' });

      const [bulkOps, options] = Product.bulkWrite.mock.calls[0];
      expect(options).toEqual({ session });

      expect(bulkOps).toEqual([
        {
          updateOne: {
            filter: { _id: 'prod-1' },
            update: { $inc: { stock: -2, purchases: 2 } },
          },
        },
        {
          updateOne: {
            filter: { _id: 'prod-2' },
            update: { $inc: { stock: -1, purchases: 1 } },
          },
        },
      ]);
    });

    it('calculates tax/shipping/total based on current business rules (tax=0, shipping=50)', async () => {
      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn(),
      };

      mongoose.startSession.mockResolvedValue(session);

      const user = { _id: 'user-1' };
      Cart.findOne.mockResolvedValue({
        items: [{ productId: 'prod-1', quantity: 2 }],
      });

      Product.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            _id: 'prod-1',
            name: 'P1',
            price: 10,
            stock: 10,
            costPrice: 2,
            images: ['img'],
          },
        ]),
      });

      Product.bulkWrite.mockResolvedValue(undefined);
      Cart.deleteOne.mockResolvedValue(undefined);
      Order.create.mockResolvedValue([{ _id: 'order-1' }]);

      await orderService.createOrder(user, { street: 'S', city: 'C', country: 'EG' });

      const createPayload = Order.create.mock.calls[0][0][0];
      expect(createPayload.subtotal).toBe(20);
      expect(createPayload.tax).toBe(0);
      expect(createPayload.shipping).toBe(50);
      expect(createPayload.total).toBe(70);
    });
  });

  describe('updateOrderStatus (strict flow)', () => {
    it("throws when trying to set Shipped while status isn't Paid", async () => {
      Order.findById.mockResolvedValue({
        _id: 'order-1',
        status: 'Pending',
        items: [],
        save: jest.fn(),
      });

      await expect(orderService.updateOrderStatus('order-1', 'Shipped')).rejects.toEqual({
        statusCode: 400,
        message: 'Invalid status transition from Pending to Shipped. Allowed next status: Paid or Cancelled.',
      });

      expect(Order.findById).toHaveBeenCalledWith('order-1');
    });
  });
});
