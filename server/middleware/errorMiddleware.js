const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose Bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  // Handle duplicate key error
  if (err.code === 11000) {
    message = 'Duplicate field value entered in database';
    statusCode = 400;
  }

  logger.error(`[${req.method}] ${req.originalUrl} - ${message}`, {
    error: err.stack,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found API Route - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
