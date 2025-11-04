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
  
  // --- START: NEW CATEGORY ERROR FIXES ---
  if (err.message === 'Category not found') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }
  if (err.message === 'A category with this name already exists') {
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
  }
  // --- END: NEW CATEGORY ERROR FIXES ---

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