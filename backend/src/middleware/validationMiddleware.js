const { body, validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const validate = asyncHandler((req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }


  const extractedErrorMessages = errors.array().map((err) => err.msg);

  res.status(400);
  throw new Error(extractedErrorMessages.join(', '));
});

const categoryValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isString()
    .withMessage('Category name must be a string')
    .isLength({ max: 50 })
    .withMessage('Category name cannot be more than 50 characters')
    .trim(),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
    .trim(),
];

const productValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .isLength({ max: 100 })
    .withMessage('Product name cannot be more than 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description cannot be more than 2000 characters')
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isString()
    .trim()
    .toUpperCase(),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isString()
    .custom((value) => { // Custom validator to check for a valid MongoDB ID
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Category ID format');
      }
      return true;
    }),
];

const productUpdateValidationRules = [
  body('name')
    .optional() // This is the change
    .isString()
    .isLength({ max: 100 })
    .withMessage('Product name cannot be more than 100 characters')
    .trim(),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description cannot be more than 2000 characters')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('sku')
    .optional()
    .isString()
    .trim()
    .toUpperCase(),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  body('categoryId')
    .optional()
    .isString()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Category ID format');
      }
      return true;
    }),
];

const cartItemValidationRules = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isString()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Product ID format');
      }
      return true;
    }),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const cartQtyValidationRules = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const orderCreateValidationRules = [
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
];

const orderStatusValidationRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .isIn(['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'])
    .withMessage('Invalid order status'),
];

const reviewValidationRules = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) throw new Error('Invalid Product ID format');
      return true;
    }),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('title')
    .optional()
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('comment')
    .optional()
    .isString().withMessage('Comment must be a string')
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

const reviewUpdateValidationRules = [
  body('rating')
    .optional() // Change: Optional for updates
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('title')
    .optional()
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('comment')
    .optional()
    .isString().withMessage('Comment must be a string')
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  // We DO NOT allow updating productId or userId, so we don't validate them here.
];

const payOrderValidationRules = [
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['card', 'wallet', 'fawry'])
    .withMessage('Invalid payment method. Accepted values: card, wallet, fawry'),

  body('mobileNumber')
    .optional()
    .matches(/^01[0125][0-9]{8}$/)
    .withMessage('Invalid Egyptian mobile number. Must start with 010, 011, 012, or 015 followed by 8 digits'),
];

module.exports = {
  validate,
  categoryValidationRules,
  productValidationRules,
  productUpdateValidationRules,
  cartItemValidationRules,
  cartQtyValidationRules,
  orderCreateValidationRules,
  orderStatusValidationRules,
  reviewValidationRules,
  reviewUpdateValidationRules,
  payOrderValidationRules,
};