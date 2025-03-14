// src/api/controllers/selection-controller.ts
import { Request, Response } from 'express';
import { SelectionService } from '../../selection/selection-service';
import { ApplicationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class SelectionController {
  constructor(private selectionService: SelectionService) {}
  
  /**
   * Get selection status for a context
   */
  async getSelectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { contextId } = req.params;
      
      if (!contextId) {
        throw new ApplicationError('Context ID is required', 400);
      }
      
      const status = await this.selectionService.getSelectionStatus(contextId);
      
      res.json(status);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Add content to a context
   */
  async addContentToContext(req: Request, res: Response): Promise<void> {
    try {
      const { contextId } = req.params;
      const { contentId, relevance } = req.body;
      
      if (!contextId) {
        throw new ApplicationError('Context ID is required', 400);
      }
      
      if (!contentId) {
        throw new ApplicationError('Content ID is required', 400);
      }
      
      await this.selectionService.addContentToContext(
        contextId,
        contentId,
        relevance
      );
      
      res.json({
        message: 'Content added to context successfully'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Remove content from a context
   */
  async removeContentFromContext(req: Request, res: Response): Promise<void> {
    try {
      const { contextId, contentId } = req.params;
      
      if (!contextId) {
        throw new ApplicationError('Context ID is required', 400);
      }
      
      if (!contentId) {
        throw new ApplicationError('Content ID is required', 400);
      }
      
      await this.selectionService.removeContentFromContext(contextId, contentId);
      
      res.json({
        message: 'Content removed from context successfully'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Update content relevance in a context
   */
  async updateContentRelevance(req: Request, res: Response): Promise<void> {
    try {
      const { contextId, contentId } = req.params;
      const { relevance } = req.body;
      
      if (!contextId) {
        throw new ApplicationError('Context ID is required', 400);
      }
      
      if (!contentId) {
        throw new ApplicationError('Content ID is required', 400);
      }
      
      if (relevance === undefined || relevance < 0 || relevance > 1) {
        throw new ApplicationError('Relevance must be a number between 0 and 1', 400);
      }
      
      await this.selectionService.updateContentRelevance(
        contextId,
        contentId,
        relevance
      );
      
      res.json({
        message: 'Content relevance updated successfully'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Suggest relevant content for a context
   */
  async suggestRelevantContent(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, contextId } = req.params;
      const { query, options } = req.body;
      
      if (!projectId) {
        throw new ApplicationError('Project ID is required', 400);
      }
      
      if (!query) {
        throw new ApplicationError('Query is required', 400);
      }
      
      const suggestions = await this.selectionService.suggestRelevantContent(
        projectId,
        query,
        contextId,
        options
      );
      
      res.json(suggestions);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Find similar content
   */
  async findSimilarContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const { limit, projectId } = req.query;
      
      if (!contentId) {
        throw new ApplicationError('Content ID is required', 400);
      }
      
      const similar = await this.selectionService.findSimilarContent(
        contentId,
        limit ? parseInt(limit.toString()) : undefined,
        projectId ? projectId.toString() : undefined
      );
      
      res.json(similar);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Error handler helper
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof ApplicationError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode
      });
      return;
    }
    
    logger.error('Selection controller error', { error: error.message });
    
    res.status(500).json({
      error: 'An unexpected error occurred',
      statusCode: 500
    });
  }
}