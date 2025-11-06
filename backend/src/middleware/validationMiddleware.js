const { body, validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = {
  validate,
  categoryValidationRules,
  productValidationRules,
};