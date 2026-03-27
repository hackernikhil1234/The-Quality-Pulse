const logger = require('../utils/logger');

const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    return next();
  } catch (error) {
    logger.warn(`Schema validation failed on ${req.method} ${req.originalUrl}`);

    return res.status(400).json({
      success: false,
      message: 'Invalid data submitted. Zod validation blocked the request.',
      errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
      }))
    });
  }
};

module.exports = validateRequest;
