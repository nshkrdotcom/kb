// src/api/middlewares/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { config } from '../../config/app-config';

/**
 * Global error handling middleware
 */
export function errorHandlerMiddleware(
  err: Error | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error status and message
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails: any = undefined;
  
  // Log the error
  const logMeta = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id
  };
  
  // Handle different error types
  if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    
    // Include validation errors if present (for ValidationError)
    if (err instanceof ValidationError) {
      errorDetails = err.validationErrors;
    }
    
    // Log with appropriate level based on status code
    if (statusCode >= 500) {
      logger.error(`Server error: ${err.message}`, {
        ...logMeta,
        stack: err.stack,
        originalError: err.originalError
      });
    } else if (statusCode >= 400) {
      logger.warn(`Client error: ${err.message}`, {
        ...logMeta,
        details: errorDetails
      });
    }
  } else {
    // For unexpected errors, log with stack trace
    logger.error(`Unexpected error: ${err.message}`, {
      ...logMeta,
      stack: err.stack
    });
  }
  
  // Prepare the response
  const errorResponse = {
    error: errorMessage,
    statusCode,
    ...(errorDetails && { details: errorDetails }),
    // Only include stack trace in development mode
    ...(config.environment === 'development' && 
        !(err instanceof ApplicationError) && { stack: err.stack }),
    path: req.path
  };
  
  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Catch-all for unhandled errors in async routes
 */
export function asyncHandler(fn: Function) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}