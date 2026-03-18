jest.mock('../../src/services/cartService', () => ({
  getCart: jest.fn(),
  addItemToCart: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItemFromCart: jest.fn(),
  clearCart: jest.fn(),
}));

const CartService = require('../../src/services/cartService');
const {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
} = require('../../src/controllers/cartController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('cartController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCart returns the user cart', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();
    const cart = { items: [], subtotal: 0 };
    CartService.getCart.mockResolvedValue(cart);

    await getCart(req, res, next);

    expect(CartService.getCart).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: cart });
  });

  it('addItemToCart calls service and returns success response', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 2 } };
    const res = makeRes();
    const next = jest.fn();
    const cart = { items: [{ productId: 'prod-1', quantity: 2 }], subtotal: 20 };
    CartService.addItemToCart.mockResolvedValue(cart);

    await addItemToCart(req, res, next);

    expect(CartService.addItemToCart).toHaveBeenCalledWith('user-1', 'prod-1', 2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: cart,
      message: 'Item added to cart',
    });
  });

  it('updateItemQuantity calls service with user, item id and quantity', async () => {
    const req = { user: { id: 'user-1' }, params: { itemId: 'item-1' }, body: { quantity: 3 } };
    const res = makeRes();
    const next = jest.fn();
    const cart = { items: [{ _id: 'item-1', quantity: 3 }], subtotal: 30 };
    CartService.updateItemQuantity.mockResolvedValue(cart);

    await updateItemQuantity(req, res, next);

    expect(CartService.updateItemQuantity).toHaveBeenCalledWith('user-1', 'item-1', 3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: cart,
      message: 'Item quantity updated',
    });
  });

  it('removeItemFromCart calls service and returns response', async () => {
    const req = { user: { id: 'user-1' }, params: { itemId: 'item-1' } };
    const res = makeRes();
    const next = jest.fn();
    const cart = { items: [], subtotal: 0 };
    CartService.removeItemFromCart.mockResolvedValue(cart);

    await removeItemFromCart(req, res, next);

    expect(CartService.removeItemFromCart).toHaveBeenCalledWith('user-1', 'item-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: cart,
      message: 'Item removed from cart',
    });
  });

  it('clearCart calls service and returns response', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();
    const cart = { items: [], subtotal: 0 };
    CartService.clearCart.mockResolvedValue(cart);

    await clearCart(req, res, next);

    expect(CartService.clearCart).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: cart, message: 'Cart cleared' });
  });
});
