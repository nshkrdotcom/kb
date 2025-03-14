// src/api/routes/context-routes.ts
import express from 'express';
import { ContextController } from '../controllers/context-controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { contextValidator } from '../validators/context-validator';
import { container } from '../../config/container';

const router = express.Router();
const contextController = container.resolve<ContextController>('contextController');

/**
 * @route   GET /api/contexts/:id
 * @desc    Get a context by ID with its content
 * @access  Private
 */
router.get(
  '/:id',
  authenticate(),
  (req, res, next) => contextController.getContextById(req, res, next)
);

/**
 * @route   POST /api/contexts
 * @desc    Create a new context
 * @access  Private
 */
router.post(
  '/',
  authenticate(),
  validateRequest(contextValidator.createContext),
  (req, res, next) => contextController.createContext(req, res, next)
);

/**
 * @route   PUT /api/contexts/:id
 * @desc    Update a context
 * @access  Private
 */
router.put(
  '/:id',
  authenticate(),
  validateRequest(contextValidator.updateContext),
  (req, res, next) => contextController.updateContext(req, res, next)
);

/**
 * @route   POST /api/contexts/:id/content
 * @desc    Add content to a context
 * @access  Private
 */
router.post(
  '/:id/content',
  authenticate(),
  validateRequest(contextValidator.addContentToContext),
  (req, res, next) => contextController.addContentToContext(req, res, next)
);

/**
 * @route   DELETE /api/contexts/:id/content/:contentId
 * @desc    Remove content from a context
 * @access  Private
 */
router.delete(
  '/:id/content/:contentId',
  authenticate(),
  (req, res, next) => contextController.removeContentFromContext(req, res, next)
);

/**
 * @route   POST /api/contexts/relationships
 * @desc    Create a relationship between content items
 * @access  Private
 */
router.post(
  '/relationships',
  authenticate(),
  validateRequest(contextValidator.createContentRelationship),
  (req, res, next) => contextController.createContentRelationship(req, res, next)
);

/**
 * @route   GET /api/contexts/content/:id/related
 * @desc    Find related content
 * @access  Private
 */
router.get(
  '/content/:id/related',
  authenticate(),
  (req, res, next) => contextController.findRelatedContent(req, res, next)
);

/**
 * @route   POST /api/contexts/:id/optimize
 * @desc    Optimize a context
 * @access  Private
 */
router.post(
  '/:id/optimize',
  authenticate(),
  validateRequest(contextValidator.optimizeContext),
  (req, res, next) => contextController.optimizeContext(req, res, next)
);

/**
 * @route   POST /api/contexts/:id/clone
 * @desc    Clone a context
 * @access  Private
 */
router.post(
  '/:id/clone',
  authenticate(),
  validateRequest(contextValidator.cloneContext),
  (req, res, next) => contextController.cloneContext(req, res, next)
);

/**
 * @route   GET /api/contexts/projects/:projectId/hierarchy
 * @desc    Get context hierarchy for a project
 * @access  Private
 */
router.get(
  '/projects/:projectId/hierarchy',
  authenticate(),
  (req, res, next) => contextController.getContextHierarchy(req, res, next)
);

export default router;









// // src/api/routes/context-routes.ts
// import express from 'express';
// import { ContextController } from '../controllers/context-controller';
// import { validateRequest } from '../middlewares/validation';
// import { contextValidators } from '../validators/context-validator';
// import { commonValidators } from '../validators/common-validators';
// import { authMiddleware } from '../middlewares/auth';

// const createContextRoutes = (contextController: ContextController) => {
//   const router = express.Router();
  
//   // Apply authentication middleware to all routes
//   router.use(authMiddleware());
  
//   // Get contexts for a project
//   router.get(
//     '/project/:projectId', 
//     validateRequest(Joi.object({ projectId: commonValidators.uuidParam })),
//     contextController.getContextsForProject
//   );
  
//   // Get a context by ID
//   router.get(
//     '/:id', 
//     validateRequest(Joi.object({ id: commonValidators.uuidParam })),
//     contextController.getContextById
//   );
  
//   // Create a new context
//   router.post(
//     '/', 
//     validateRequest(contextValidators.createContext),
//     contextController.createContext
//   );
  
//   // Update a context
//   router.put(
//     '/:id', 
//     validateRequest(Joi.object({ id: commonValidators.uuidParam })),
//     validateRequest(contextValidators.updateContext),
//     contextController.updateContext
//   );
  
//   // Delete a context
//   router.delete(
//     '/:id', 
//     validateRequest(Joi.object({ id: commonValidators.uuidParam })),
//     contextController.deleteContext
//   );
  
//   // Get content items for a context
//   router.get(
//     '/:id/content', 
//     validateRequest(Joi.object({ id: commonValidators.uuidParam })),
//     contextController.getContextContent
//   );
  
//   // Add content to a context
//   router.post(
//     '/:id/content/:contentId', 
//     validateRequest(Joi.object({ 
//       id: commonValidators.uuidParam,
//       contentId: commonValidators.uuidParam,
//       metadata: Joi.object().unknown(true)
//     })),
//     contextController.addContentToContext
//   );
  
//   // Remove content from a context
//   router.delete(
//     '/:id/content/:contentId', 
//     validateRequest(Joi.object({ 
//       id: commonValidators.uuidParam,
//       contentId: commonValidators.uuidParam
//     })),
//     contextController.removeContentFromContext
//   );
  
//   // Update content relevance in a context
//   router.put(
//     '/:id/content/:contentId/relevance', 
//     validateRequest(Joi.object({ 
//       id: commonValidators.uuidParam,
//       contentId: commonValidators.uuidParam
//     })),
//     validateRequest(contextValidators.updateRelevance),
//     contextController.updateContentRelevance
//   );
  
//   return router;
// };

// export default createContextRoutes;