// src/api/validators/common-validators.ts
import Joi from 'joi';

/**
 * UUID validation pattern
 */
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Common validation schemas
 */
export const commonValidators = {
  // UUID parameter validation
  uuidParam: Joi.string().pattern(uuidPattern).required().messages({
    'string.pattern.base': 'Invalid ID format, must be a valid UUID',
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required'
  }),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),
  
  // Email validation
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  }),
  
  // Password validation
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  }),
  
  // Token validation
  token: Joi.string().required().messages({
    'string.empty': 'Token cannot be empty',
    'any.required': 'Token is required'
  })
};