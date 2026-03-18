jest.mock('../../src/models/cartModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/productModel', () => ({
  findById: jest.fn(),
}));

const Cart = require('../../src/models/cartModel');
const Product = require('../../src/models/productModel');
const redisClient = require('../../src/utils/redisClient');
const { cartQueue } = require('../../src/workers/queueSetup');

const cartService = require('../../src/services/cartService');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue('0');
  });

  const makeCart = ({ items = [], subtotal = 0 } = {}) => {
    const cart = {
      items,
      subtotal,
      save: jest.fn(async () => cart),
      populate: jest.fn(async () => cart),
    };

    // minimal mongoose-like helpers
    cart.items.id = jest.fn();

    return cart;
  };

  it('Math Integrity: recalculates subtotal as sum(price * quantity)', () => {
    const cart = makeCart({
      items: [
        { price: 10.5, quantity: 2 },
        { price: 3, quantity: 4 },
      ],
    });

    cartService._recalculateCart(cart);
    expect(cart.subtotal).toBe(10.5 * 2 + 3 * 4);
  });

  it('Logic: adding an item that already exists merges quantities', async () => {
    const productId = 'prod-1';
    Product.findById.mockResolvedValue({ _id: productId, price: 10, stock: 100 });

    const cart = makeCart({
      items: [{ productId: { _id: { toString: () => productId } }, quantity: 2, price: 10 }],
    });

    Cart.findOne.mockResolvedValue(cart);

    const result = await cartService.addItemToCart('user-1', productId, 3);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(5);
    expect(cart.save).toHaveBeenCalled();
    expect(cart.subtotal).toBe(10 * 5);
    expect(redisClient.incrby).toHaveBeenCalledWith(`locked_stock:${productId}`, 3);
    expect(cartQueue.add).toHaveBeenCalledWith(
      'expireCartItem',
      { userId: 'user-1', productId, quantity: 3 },
      { delay: 10 * 60 * 1000 }
    );
  });

  it('Stock: throws when attempting to add more quantity than available', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod-2', price: 10, stock: 2 });
    const addPromise = cartService.addItemToCart('user-1', 'prod-2', 3);

    await expect(addPromise).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'INSUFFICIENT_STOCK',
    });
    await expect(addPromise).rejects.toHaveProperty(
      'message',
      expect.stringContaining('Over-selling prevented')
    );
  });

  it('Edge Case: throws when quantity is 0', async () => {
    await expect(cartService.addItemToCart('user-1', 'prod-1', 0)).rejects.toThrow(
      'Quantity must be at least 1'
    );
  });

  it('Edge Case: throws when quantity is negative', async () => {
    await expect(cartService.addItemToCart('user-1', 'prod-1', -2)).rejects.toThrow(
      'Quantity must be at least 1'
    );
  });

  // --- #37: addItemToCart validation tests ---

  it('Validation: throws when product is not found', async () => {
    Product.findById.mockResolvedValue(null);

    await expect(cartService.addItemToCart('user-1', 'nonexistent', 1)).rejects.toThrow(
      'Product not found'
    );
  });

  it('Validation: throws when adding duplicate item exceeds stock', async () => {
    const productId = 'prod-dup';
    Product.findById.mockResolvedValue({ _id: productId, price: 25, stock: 5 });
    redisClient.get.mockResolvedValue('3');

    const cart = makeCart({
      items: [{ productId: { _id: { toString: () => productId } }, quantity: 3, price: 25 }],
    });
    Cart.findOne.mockResolvedValue(cart);

    await expect(cartService.addItemToCart('user-1', productId, 4)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'INSUFFICIENT_STOCK',
    });
  });

  it('Logic: creates a new cart when none exists and adds the item', async () => {
    const productId = 'prod-new';
    Product.findById.mockResolvedValue({ _id: productId, price: 50, stock: 10 });

    // No existing cart — findOne returns null
    Cart.findOne.mockResolvedValue(null);

    const newCart = makeCart({ items: [], subtotal: 0 });
    // Simulate cart.populate returning itself with populated data
    newCart.items.push = jest.fn(function (item) {
      Array.prototype.push.call(newCart.items, item);
    });
    Cart.create.mockResolvedValue(newCart);
    // populate for _getOrCreateCart
    newCart.populate.mockResolvedValue(newCart);

    const result = await cartService.addItemToCart('user-1', productId, 2);

    expect(Cart.create).toHaveBeenCalledWith({ userId: 'user-1', items: [], subtotal: 0 });
    expect(result.save).toHaveBeenCalled();
  });

  // --- #41: getCart / removeItem / clearCart tests ---

  describe('getCart', () => {
    it('returns existing cart for user', async () => {
      const cart = makeCart({ items: [{ price: 10, quantity: 1 }], subtotal: 10 });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);

      const result = await cartService.getCart('user-1');

      expect(Cart.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(result).toBe(cart);
    });

    it('creates a new cart when user has none', async () => {
      Cart.findOne.mockResolvedValue(null);

      const newCart = makeCart({ items: [], subtotal: 0 });
      Cart.create.mockResolvedValue(newCart);
      newCart.populate.mockResolvedValue(newCart);

      const result = await cartService.getCart('user-1');

      expect(Cart.create).toHaveBeenCalledWith({ userId: 'user-1', items: [], subtotal: 0 });
      expect(result).toBe(newCart);
    });
  });

  describe('updateItemQuantity', () => {
    it('throws when quantity is less than 1', async () => {
      await expect(cartService.updateItemQuantity('user-1', 'item-1', 0)).rejects.toThrow(
        'Quantity must be at least 1'
      );
    });

    it('throws when item is not found in cart', async () => {
      const cart = makeCart({ items: [] });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(null);

      await expect(cartService.updateItemQuantity('user-1', 'item-99', 2)).rejects.toThrow(
        'Item not found in cart'
      );
    });

    it('throws when new quantity exceeds stock', async () => {
      const item = { _id: 'item-1', productId: 'prod-1', quantity: 1, price: 10 };
      const cart = makeCart({ items: [item] });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(item);

      Product.findById.mockResolvedValue({ _id: 'prod-1', stock: 3 });
      redisClient.get.mockResolvedValue('2');

      await expect(cartService.updateItemQuantity('user-1', 'item-1', 5)).rejects.toMatchObject({
        statusCode: 409,
        errorCode: 'INSUFFICIENT_STOCK',
      });
    });

    it('locks only the quantity delta and schedules expiration when increasing quantity', async () => {
      const item = { _id: 'item-1', productId: 'prod-1', quantity: 2, price: 10 };
      const cart = makeCart({ items: [item] });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(item);

      Product.findById.mockResolvedValue({ _id: 'prod-1', stock: 20 });
      redisClient.get.mockResolvedValue('0');

      await cartService.updateItemQuantity('user-1', 'item-1', 5);

      expect(redisClient.incrby).toHaveBeenCalledWith('locked_stock:prod-1', 3);
      expect(cartQueue.add).toHaveBeenCalledWith(
        'expireCartItem',
        { userId: 'user-1', productId: 'prod-1', quantity: 3 },
        { delay: 10 * 60 * 1000 }
      );
      expect(item.quantity).toBe(5);
      expect(cart.save).toHaveBeenCalled();
    });

    it('releases only the quantity delta when reducing quantity', async () => {
      const item = { _id: 'item-1', productId: 'prod-1', quantity: 5, price: 10 };
      const cart = makeCart({ items: [item] });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(item);

      Product.findById.mockResolvedValue({ _id: 'prod-1', stock: 20 });

      await cartService.updateItemQuantity('user-1', 'item-1', 2);

      expect(redisClient.decrby).toHaveBeenCalledWith('locked_stock:prod-1', 3);
      expect(cartQueue.add).not.toHaveBeenCalled();
      expect(item.quantity).toBe(2);
      expect(cart.save).toHaveBeenCalled();
    });
  });

  describe('removeItemFromCart', () => {
    it('removes the item and recalculates subtotal', async () => {
      const item = {
        _id: 'item-1',
        productId: { _id: 'prod-1' },
        quantity: 2,
        price: 15,
        deleteOne: jest.fn(),
      };
      const remainingItem = { price: 10, quantity: 1 };
      const cart = makeCart({ items: [item, remainingItem], subtotal: 40 });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(item);

      const result = await cartService.removeItemFromCart('user-1', 'item-1');

      expect(item.deleteOne).toHaveBeenCalled();
      expect(cart.save).toHaveBeenCalled();
      expect(redisClient.decrby).toHaveBeenCalledWith('locked_stock:prod-1', 2);
      expect(result).toBe(cart);
    });

    it('throws when item is not found in cart', async () => {
      const cart = makeCart({ items: [] });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);
      cart.items.id.mockReturnValue(null);

      await expect(cartService.removeItemFromCart('user-1', 'item-99')).rejects.toThrow(
        'Item not found in cart'
      );
    });
  });

  describe('clearCart', () => {
    it('empties the items array and sets subtotal to 0', async () => {
      const cart = makeCart({
        items: [{ productId: { _id: 'prod-1' }, price: 10, quantity: 2 }],
        subtotal: 20,
      });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);

      const result = await cartService.clearCart('user-1');

      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(cart.save).toHaveBeenCalled();
      expect(redisClient.decrby).toHaveBeenCalledWith('locked_stock:prod-1', 2);
    });

    it('releases lock for every item in the cart before clearing', async () => {
      const cart = makeCart({
        items: [
          { productId: { _id: 'prod-1' }, price: 10, quantity: 2 },
          { productId: { _id: 'prod-2' }, price: 5, quantity: 4 },
        ],
        subtotal: 40,
      });
      Cart.findOne.mockResolvedValue(cart);
      cart.populate.mockResolvedValue(cart);

      await cartService.clearCart('user-1');

      expect(redisClient.decrby).toHaveBeenNthCalledWith(1, 'locked_stock:prod-1', 2);
      expect(redisClient.decrby).toHaveBeenNthCalledWith(2, 'locked_stock:prod-2', 4);
      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
    });
  });
});
