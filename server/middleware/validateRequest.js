const logger = require('../utils/logger');
const { ZodError } = require('zod');

const validateRequest = (schema) => async (req, res, next) => {
  try {
    if (!schema) {
      throw new Error(`Validation schema is undefined! Check your route definitions.`);
    }

    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn(`Schema validation failed on ${req.method} ${req.originalUrl}`);
      const errorIssues = error.errors || error.issues || [];
      return res.status(400).json({
        success: false,
        message: 'Invalid data submitted. Zod validation blocked the request.',
        errors: errorIssues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Pass non-validation errors to the global error handler
    logger.error(`System error inside validation middleware: ${error.message}`, {
      error: error.stack,
    });
    return next(error);
  }
};

module.exports = validateRequest;
