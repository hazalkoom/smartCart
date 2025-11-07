const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  cartItemValidationRules,
  cartQtyValidationRules,
} = require('../middleware/validationMiddleware');
const {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
} = require('../controllers/cartController');

const router = express.Router();


router.use(protect);


router.route('/')
  .get(getCart)
  .delete(clearCart);


router.route('/items')
  .post(cartItemValidationRules, validate, addItemToCart);


router.route('/items/:itemId')
  .put(cartQtyValidationRules, validate, updateItemQuantity)
  .delete(removeItemFromCart);

module.exports = router;