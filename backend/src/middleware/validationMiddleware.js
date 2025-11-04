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

module.exports = {
  validate,
  categoryValidationRules,
};