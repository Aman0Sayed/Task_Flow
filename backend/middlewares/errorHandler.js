// middlewares/errorHandler.js
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack || err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyValue || err.keyPattern || {});
    const message = duplicatedFields.length > 0
      ? `Duplicate value for: ${duplicatedFields.join(', ')}`
      : 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  const message = Array.isArray(error.message)
    ? error.message.join(', ')
    : (error.message || 'Server Error');

  res.status(error.statusCode || 500).json({
    success: false,
    message,
    error: message
  });
};

module.exports = errorHandler;

