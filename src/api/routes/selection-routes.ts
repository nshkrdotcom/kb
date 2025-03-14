// src/api/routes/selection-routes.ts
import express from 'express';
import { SelectionController } from '../controllers/selection-controller';
import { authMiddleware } from '../middlewares/auth';

const createSelectionRoutes = (selectionController: SelectionController) => {
  const router = express.Router();
  
  // All routes require authentication
  router.use(authMiddleware());
  
  // Get selection status
  router.get(
    '/contexts/:contextId/status',
    selectionController.getSelectionStatus.bind(selectionController)
  );
  
  // Add content to context
  router.post(
    '/contexts/:contextId/content',
    selectionController.addContentToContext.bind(selectionController)
  );
  
  // Remove content from context
  router.delete(
    '/contexts/:contextId/content/:contentId',
    selectionController.removeContentFromContext.bind(selectionController)
  );
  
  // Update content relevance
  router.put(
    '/contexts/:contextId/content/:contentId/relevance',
    selectionController.updateContentRelevance.bind(selectionController)
  );
  
  // Suggest relevant content
  router.post(
    '/projects/:projectId/suggestions',
    selectionController.suggestRelevantContent.bind(selectionController)
  );
  
  // Suggest relevant content for a context
  router.post(
    '/projects/:projectId/contexts/:contextId/suggestions',
    selectionController.suggestRelevantContent.bind(selectionController)
  );
  
  // Find similar content
  router.get(
    '/content/:contentId/similar',
    selectionController.findSimilarContent.bind(selectionController)
  );
  
  return router;
};

export default createSelectionRoutes;