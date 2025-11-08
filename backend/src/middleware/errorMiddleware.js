const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errorCode = 'SERVER_ERROR';

  // --- Mongoose Errors ---
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    message = `Duplicate field value entered: ${field}`;
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  }

  // --- Auth Errors ---
  if (err.message === 'Not authorized, token failed') {
    statusCode = 401;
    errorCode = 'TOKEN_INVALID';
  }
  
  if (err.message === 'Not authorized, no token') {
    statusCode = 401;
    errorCode = 'TOKEN_MISSING';
  }
  
  if (err.message.includes('not authorized to access this route')) {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  }
  if (err.message === 'Invalid credentials') {
    statusCode = 401;
    errorCode = 'INVALID_CREDENTIALS';
  }
  if (err.message === 'User already exists') {
    statusCode = 400;
    errorCode = 'USER_EXISTS';
  }
  
  if (err.message === 'Category not found') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }
  if (err.message === 'A category with this name already exists') {
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
  }


  if (err.message === 'Product not found') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }
  if (err.message === 'A product with this SKU already exists') {
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
  }

  if (err.message === 'Item not found in cart') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }
  if (err.message.startsWith('Insufficient stock')) {
    statusCode = 400;
    errorCode = 'INSUFFICIENT_STOCK';
  }
  if (err.message === 'Your cart is empty') {
    statusCode = 400;
    errorCode = 'CART_EMPTY';
  }
  if (err.message === 'Order not found') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }


  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  });
};

module.exports = {
  errorHandler,
};