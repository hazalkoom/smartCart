const errorHandler = (err, req, res, next) => {
  // Log the error for the developer
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errorCode = 'SERVER_ERROR';

  // --- Handle Specific Mongoose Errors ---

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }

  // Mongoose Duplicate Key (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    message = `Duplicate field value entered: ${field}`;
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  }

  // --- Handle Specific Auth Errors ---

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
  
  if (err.message === 'Invalid credentials' || err.message === 'User not found') {
    statusCode = 401;
    errorCode = 'INVALID_CREDENTIALS';
  }
  
  if (err.message === 'User already exists') {
    statusCode = 400;
    errorCode = 'USER_EXISTS';
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