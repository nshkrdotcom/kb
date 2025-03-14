// src/api/validators/context-validator.ts
import Joi from 'joi';
import { commonValidators } from './common-validators';

export const contextValidators = {
  // Create context validation
  createContext: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000),
    projectId: commonValidators.uuidParam
  }),
  
  // Update context validation
  updateContext: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    metadata: Joi.object().unknown(true)
  }).min(1),
  
  // Context content selection validation
  selectContent: Joi.object({
    itemIds: Joi.array().items(commonValidators.uuidParam).required(),
    selected: Joi.boolean().required()
  }),
  
  // Context content relevance validation
  updateRelevance: Joi.object({
    relevance: Joi.number().min(0).max(1).required()
  })
};