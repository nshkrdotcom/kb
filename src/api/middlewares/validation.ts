// // src/api/middlewares/validation.ts
//  import { Request, Response, NextFunction } from 'express';
//  import Joi from 'joi';
//  import logger from '../../utils/logger';
 
//  /**
//   * Middleware to validate request data against a Joi schema
//   * 
//   * @param schema Joi schema to validate against
//   * @param property Request property to validate ('body', 'query', 'params')
//   */
//  export function validateRequest(
//    schema: Joi.Schema,
//    property: 'body' | 'query' | 'params' = 'body'
//  ) {
//    return (req: Request, res: Response, next: NextFunction) => {
//      const { error, value } = schema.validate(req[property], {
//        abortEarly: false,
//        stripUnknown: true,
//        errors: {
//          wrap: {
//            label: false
//          }
//        }
//      });
 
//      if (!error) {
//        // Update the request with validated data
//        req[property] = value;
//        return next();
//      }
 
//      // Format validation errors
//      const errors = error.details.reduce((acc: Record<string, string>, detail) => {
//        const key = detail.path.join('.');
//        acc[key] = detail.message;
//        return acc;
//      }, {});
 
//      logger.debug('Validation error', { 
//        path: req.path, 
//        property, 
//        errors
//      });
 
//      return res.status(400).json({
//        error: 'Validation failed',
//        errors,
//        status: 400
//      });
//    };
//  }
 
//  /**
//   * Validate a value against a schema (for use outside of middleware)
//   * 
//   * @param schema Joi schema to validate against
//   * @param value Value to validate
//   * @returns Validated value or throws error
//   */
//  export function validate<T>(schema: Joi.Schema, value: any): T {
//    const { error, value: validatedValue } = schema.validate(value, {
//      abortEarly: false,
//      stripUnknown: true
//    });
 
//    if (error) {
//      const message = error.details.map(detail => detail.message).join(', ');
//      throw new Error(`Validation error: ${message}`);
//    }
 
//    return validatedValue as T;
//  }


 // src/api/middlewares/validation.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';
import { ValidationError } from '../../utils/errors';

/**
 * Validator middleware factory that takes a Joi schema
 */
export function validateRequest(schema: Joi.ObjectSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get data based on request method
    let data: any;
    
    if (req.method === 'GET') {
      data = req.query;
    } else if (req.body && Object.keys(req.body).length > 0) {
      data = req.body;
    } else {
      data = {};
    }
    
    // Validate the data against the schema
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: ''
        }
      }
    });
    
    if (error) {
      // Format the validation errors
      const errorDetails = error.details.map(detail => ({
        path: detail.path.join('.'),
        message: detail.message
      }));
      
      // Throw a validation error
      throw new ValidationError('Validation failed', errorDetails);
    }
    
    // Update the request data with the validated and sanitized data
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    // Continue to the next middleware/handler
    next();
  };
}

/**
 * Create a custom validation schema with specific rules
 */
export function createCustomValidator(
  baseSchema: Joi.ObjectSchema,
  customValidation: (value: any) => { error?: string, value?: any }
): Joi.ObjectSchema {
  return baseSchema.custom((value, helpers) => {
    const result = customValidation(value);
    
    if (result.error) {
      return helpers.error(result.error);
    }
    
    return result.value || value;
  });
}