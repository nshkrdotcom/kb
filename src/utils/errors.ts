// src/utils/errors.ts
/**
 * Base application error class
 */
export class ApplicationError extends Error {
    constructor(
      public message: string,
      public statusCode: number = 500,
      public originalError?: Error | any
    ) {
      super(message);
      this.name = this.constructor.name;
      
      // Ensures proper stack trace in Node.js
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  
    /**
     * Get error details for API responses
     */
    toJSON() {
      return {
        error: this.message,
        statusCode: this.statusCode,
      };
    }
  }
  
  /**
   * 400 Bad Request - Invalid input
   */
  export class ValidationError extends ApplicationError {
    constructor(
      message: string = 'Validation failed',
      public validationErrors: Record<string, string>[] | string[] = [],
      originalError?: Error
    ) {
      super(message, 400, originalError);
    }
  
    toJSON() {
      return {
        ...super.toJSON(),
        validationErrors: this.validationErrors
      };
    }
  }
  
  /**
   * 401 Unauthorized - Authentication failure
   */
  export class AuthenticationError extends ApplicationError {
    constructor(message: string = 'Authentication required', originalError?: Error) {
      super(message, 401, originalError);
    }
  }
  
  /**
   * 403 Forbidden - Authorization failure
   */
  export class ForbiddenError extends ApplicationError {
    constructor(message: string = 'Access denied', originalError?: Error) {
      super(message, 403, originalError);
    }
  }
  
  /**
   * 404 Not Found - Resource not found
   */
  export class NotFoundError extends ApplicationError {
    constructor(resource: string = 'Resource', originalError?: Error) {
      super(`${resource} not found`, 404, originalError);
    }
  }
  
  /**
   * 409 Conflict - Resource conflict
   */
  export class ConflictError extends ApplicationError {
    constructor(message: string = 'Resource conflict', originalError?: Error) {
      super(message, 409, originalError);
    }
  }
  
  /**
   * 429 Too Many Requests - Rate limiting
   */
  export class RateLimitError extends ApplicationError {
    constructor(message: string = 'Rate limit exceeded', originalError?: Error) {
      super(message, 429, originalError);
    }
  }
  
  /**
   * 500 Internal Server Error - Unexpected error
   */
  export class InternalServerError extends ApplicationError {
    constructor(message: string = 'Internal server error', originalError?: Error) {
      super(message, 500, originalError);
    }
  }
  
  /**
   * 503 Service Unavailable - External service failure
   */
  export class ServiceUnavailableError extends ApplicationError {
    constructor(service: string = 'External service', originalError?: Error) {
      super(`${service} is currently unavailable`, 503, originalError);
    }
  }