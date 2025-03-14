// src/api/controllers/context-controller.ts
import { Request, Response, NextFunction } from 'express';
import { ContextService } from '../../services/context-service';
import { validateContext } from '../validators/context-validator';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * Controller for context-related endpoints
 */
export class ContextController {
  constructor(private contextService: ContextService) {}
  
  /**
   * Get a context by ID with its content
   */
  async getContextById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        relevanceThreshold,
        maxTokens,
        contentTypes
      } = req.query;
      
      // Parse selection options
      const options = {
        relevanceThreshold: relevanceThreshold ? parseFloat(relevanceThreshold as string) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens as string) : undefined,
        contentTypes: contentTypes ? (contentTypes as string).split(',') : undefined
      };
      
      const result = await this.contextService.getContextWithContent(id, options);
      
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new context
   */
  async createContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        projectId, 
        name, 
        description, 
        parentContextId, 
        creatorId,
        settings
      } = req.body;
      
      // Validate request body
      const validationError = validateContext(req.body);
      if (validationError) {
        throw new ApplicationError(validationError, 400);
      }
      
      // Create context
      const context = await this.contextService.contextRepository.create({
        projectId,
        name,
        description,
        parentContextId,
        creatorId,
        isActive: true,
        settings: settings || {}
      });
      
      // Create context node in Neo4j
      await this.contextService.graphRepository.createNode(
        ['Context'],
        {
          id: context.id,
          name: context.name,
          description: context.description,
          projectId: context.projectId,
          parentContextId: context.parentContextId
        }
      );
      
      // Create relationships
      await this.contextService.graphRepository.createRelationship(
        projectId,
        context.id,
        'HAS_CONTEXT',
        { isPrimary: !parentContextId }
      );
      
      if (parentContextId) {
        await this.contextService.graphRepository.createRelationship(
          parentContextId,
          context.id,
          'PARENT_OF',
          { createdAt: new Date().toISOString() }
        );
      }
      
      return res.status(201).json({ context });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a context
   */
  async updateContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, settings, isActive } = req.body;
      
      // Check if context exists
      const context = await this.contextService.contextRepository.findById(id);
      if (!context) {
        throw new ApplicationError(`Context with ID ${id} not found`, 404);
      }
      
      // Update context
      const updatedContext = await this.contextService.contextRepository.update(id, {
        name,
        description,
        settings,
        isActive
      });
      
      // Update in Neo4j as well
      await this.contextService.graphRepository.updateNode(
        id,
        {
          name,
          description,
          isActive
        }
      );
      
      return res.json({ context: updatedContext });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add content to a context
   */
  async addContentToContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { contentId, relevanceScore, position } = req.body;
      
      if (!contentId) {
        throw new ApplicationError('Content ID is required', 400);
      }
      
      const contextItem = await this.contextService.addContentToContext(
        id,
        contentId,
        relevanceScore,
        position
      );
      
      return res.status(201).json({ contextItem });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Remove content from a context
   */
  async removeContentFromContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, contentId } = req.params;
      
      const result = await this.contextService.removeContentFromContext(id, contentId);
      
      if (result) {
        return res.json({ success: true });
      } else {
        throw new ApplicationError(`Content with ID ${contentId} not found in context ${id}`, 404);
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a relationship between content items
   */
  async createContentRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const { sourceId, targetId, type, metadata } = req.body;
      
      if (!sourceId || !targetId || !type) {
        throw new ApplicationError('Source ID, target ID, and relationship type are required', 400);
      }
      
      const relationshipId = await this.contextService.createContentRelationship(
        sourceId,
        targetId,
        type,
        metadata
      );
      
      return res.status(201).json({
        relationshipId,
        sourceId,
        targetId,
        type,
        metadata
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Find related content
   */
  async findRelatedContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type } = req.query;
      
      const relatedContent = await this.contextService.findRelatedContent(
        id,
        type as any
      );
      
      return res.json({ relatedContent });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Optimize a context
   */
  async optimizeContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tokenBudget } = req.body;
      
      if (!tokenBudget || tokenBudget <= 0) {
        throw new ApplicationError('Valid token budget is required', 400);
      }
      
      const result = await this.contextService.optimizeContext(id, parseInt(tokenBudget as string));
      
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Clone a context
   */
  async cloneContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { targetProjectId, newName } = req.body;
      
      if (!targetProjectId) {
        throw new ApplicationError('Target project ID is required', 400);
      }
      
      const newContext = await this.contextService.cloneContext(
        id,
        targetProjectId,
        newName
      );
      
      return res.status(201).json({ context: newContext });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get context hierarchy
   */
  async getContextHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      
      const hierarchy = await this.contextService.getContextHierarchy(projectId);
      
      return res.json({ hierarchy });
    } catch (error) {
      next(error);
    }
  }
}


// // src/api/controllers/context-controller.ts
// import { Request, Response } from 'express';
// import { ContextService } from '../../services/context-service';
// import { asyncHandler } from '../middlewares/error-handler';
// import { NotFoundError } from '../../utils/errors';

// export class ContextController {
//   constructor(private contextService: ContextService) {}
  
//   /**
//    * Get all contexts for a project
//    */
//   getContextsForProject = asyncHandler(async (req: Request, res: Response) => {
//     const { projectId } = req.params;
//     const contexts = await this.contextService.getContextsForProject(projectId);
//     res.json(contexts);
//   });
  
//   /**
//    * Get a context by ID
//    */
//   getContextById = asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const context = await this.contextService.getContextById(id);
    
//     if (!context) {
//       throw new NotFoundError('Context');
//     }
    
//     res.json(context);
//   });
  
//   /**
//    * Create a new context
//    */
//   createContext = asyncHandler(async (req: Request, res: Response) => {
//     const context = await this.contextService.createContext(req.body);
//     res.status(201).json(context);
//   });
  
//   /**
//    * Update a context
//    */
//   updateContext = asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const updatedContext = await this.contextService.updateContext(id, req.body);
//     res.json(updatedContext);
//   });
  
//   /**
//    * Delete a context
//    */
//   deleteContext = asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     await this.contextService.deleteContext(id);
//     res.status(204).end();
//   });
  
//   /**
//    * Get content items for a context
//    */
//   getContextContent = asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const contentItems = await this.contextService.getContextContent(id);
//     res.json(contentItems);
//   });
  
//   /**
//    * Add content to a context
//    */
//   addContentToContext = asyncHandler(async (req: Request, res: Response) => {
//     const { id, contentId } = req.params;
//     await this.contextService.addContentToContext(id, contentId, req.body.metadata);
//     res.status(204).end();
//   });
  
//   /**
//    * Remove content from a context
//    */
//   removeContentFromContext = asyncHandler(async (req: Request, res: Response) => {
//     const { id, contentId } = req.params;
//     await this.contextService.removeContentFromContext(id, contentId);
//     res.status(204).end();
//   });
  
//   /**
//    * Update content relevance in a context
//    */
//   updateContentRelevance = asyncHandler(async (req: Request, res: Response) => {
//     const { id, contentId } = req.params;
//     const { relevance } = req.body;
//     await this.contextService.updateContentRelevance(id, contentId, relevance);
//     res.status(204).end();
//   });
// }