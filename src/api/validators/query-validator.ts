// src/api/validators/query-validator.ts
 import Joi from 'joi';
 
 /**
  * Validation schemas for query-related requests
  */
 export const queryValidator = {
   /**
    * Schema for LLM query
    */
   query: Joi.object({
     query: Joi.string()
       .required()
       .min(1)
       .max(32000)
       .messages({
         'string.empty': 'Query cannot be empty',
         'string.min': 'Query must be at least 1 character long',
         'string.max': 'Query cannot exceed 32000 characters',
         'any.required': 'Query is required'
       }),
     
     contextId: Joi.string()
       .uuid()
       .messages({
         'string.guid': 'Context ID must be a valid UUID'
       }),
     
     projectId: Joi.string()
       .uuid()
       .required()
       .messages({
         'string.guid': 'Project ID must be a valid UUID',
         'any.required': 'Project ID is required'
       }),
     
     systemPrompt: Joi.string()
       .max(4000)
       .messages({
         'string.max': 'System prompt cannot exceed 4000 characters'
       }),
     
     provider: Joi.string()
       .messages({
         'string.base': 'Provider must be a string'
       }),
     
     model: Joi.string()
       .messages({
         'string.base': 'Model must be a string'
       }),
     
     saveResponse: Joi.boolean()
       .default(true)
       .messages({
         'boolean.base': 'Save response must be a boolean'
       }),
     
     responseContextId: Joi.string()
       .uuid()
       .messages({
         'string.guid': 'Response context ID must be a valid UUID'
       }),
     
     temperature: Joi.number()
       .min(0)
       .max(2)
       .messages({
         'number.base': 'Temperature must be a number',
         'number.min': 'Temperature must be at least 0',
         'number.max': 'Temperature cannot exceed 2'
       }),
     
     maxTokens: Joi.number()
       .integer()
       .min(1)
       .max(32000)
       .messages({
         'number.base': 'Max tokens must be a number',
         'number.integer': 'Max tokens must be an integer',
         'number.min': 'Max tokens must be at least 1',
         'number.max': 'Max tokens cannot exceed 32000'
       }),
     
     includedContentIds: Joi.array()
       .items(
         Joi.string()
           .uuid()
           .messages({
             'string.guid': 'Each included content ID must be a valid UUID'
           })
       )
       .messages({
         'array.base': 'Included content IDs must be an array'
       })
   })
 };



//  // src/api/validators/query-validator.ts
// import Joi from 'joi';
// import { commonValidators } from './common-validators';

// export const queryValidators = {
//   // Query request validation
//   query: Joi.object({
//     query: Joi.string().min(1).required(),
//     contextId: commonValidators.uuidParam,
//     options: Joi.object({
//       modelId: Joi.string(),
//       temperature: Joi.number().min(0).max(1),
//       maxTokens: Joi.number().integer().min(1).max(10000),
//       includeMetadata: Joi.boolean(),
//       stream: Joi.boolean()
//     })
//   }),
  
//   // Suggest content validation
//   suggestContent: Joi.object({
//     query: Joi.string().min(1).required(),
//     options: Joi.object({
//       maxItems: Joi.number().integer().min(1).max(50),
//       maxTokens: Joi.number().integer().min(1),
//       contentTypes: Joi.array().items(Joi.string().valid('text', 'code', 'image', 'list')),
//       sortBy: Joi.string().valid('relevance', 'recency', 'title', 'type'),
//       sortDirection: Joi.string().valid('asc', 'desc')
//     })
//   })
// };