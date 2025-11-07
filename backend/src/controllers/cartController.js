const CartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  // req.user.id is provided by the 'protect' middleware
  const cart = await CartService.getCart(req.user.id);
  
  res.status(200).json({
    success: true,
    data: cart,
  });
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  const cart = await CartService.addItemToCart(userId, productId, quantity);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item added to cart',
  });
});

const updateItemQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  const cart = await CartService.updateItemQuantity(userId, itemId, quantity);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item quantity updated',
  });
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  const cart = await CartService.removeItemFromCart(userId, itemId);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item removed from cart',
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await CartService.clearCart(userId);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart cleared',
  });
});

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
};