jest.mock('../../src/models/cartModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/productModel', () => ({
  findById: jest.fn(),
}));

const Cart = require('../../src/models/cartModel');
const Product = require('../../src/models/productModel');

const cartService = require('../../src/services/cartService');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('Stock: throws when attempting to add more quantity than available', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod-2', price: 10, stock: 2 });

    await expect(cartService.addItemToCart('user-1', 'prod-2', 3)).rejects.toThrow(
      'Insufficient stock'
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
});
