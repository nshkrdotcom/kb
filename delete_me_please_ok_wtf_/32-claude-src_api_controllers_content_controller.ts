// src/api/controllers/content-controller.ts
import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../../services/content-service';
import { validateContent } from '../validators/content-validator';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * Controller for content-related endpoints
 */
export class ContentController {
  constructor(private contentService: ContentService) {}
  
  /**
   * Get content item by ID with its data
   */
  async getContentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const contentItem = await this.contentService.getContentWithData(id);
      
      return res.json({ content: contentItem });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a text content item
   */
  async createTextContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, title, text, creatorId, tags, metadata } = req.body;
      
      // Validate request body
      const validationError = validateContent({
        projectId,
        title,
        content: text,
        contentType: 'text',
        creatorId
      });
      
      if (validationError) {
        throw new ApplicationError(validationError, 400);
      }
      
      const contentItem = await this.contentService.createTextContent(
        projectId,
        title,
        text,
        creatorId,
        tags,
        metadata
      );
      
      return res.status(201).json({ content: contentItem });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a code content item
   */
  async createCodeContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, title, code, language, creatorId, tags, metadata } = req.body;
      
      // Validate request body
      const validationError = validateContent({
        projectId,
        title,
        content: code,
        contentType: 'code',
        language,
        creatorId
      });
      
      if (validationError) {
        throw new ApplicationError(validationError, 400);
      }
      
      const contentItem = await this.contentService.createCodeContent(
        projectId,
        title,
        code,
        language,
        creatorId,
        tags,
        metadata
      );
      
      return res.status(201).json({ content: contentItem });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create an image content item
   */
  async createImageContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, title, creatorId, tags, metadata } = req.body;
      const file = req.file;
      
      if (!file) {
        throw new ApplicationError('Image file is required', 400);
      }
      
      // Validate request body
      const validationError = validateContent({
        projectId,
        title,
        contentType: 'image',
        creatorId
      });
      
      if (validationError) {
        throw new ApplicationError(validationError, 400);
      }
      
      const contentItem = await this.contentService.createImageContent(
        projectId,
        title,
        file.buffer,
        file.mimetype,
        creatorId,
        tags,
        metadata
      );
      
      return res.status(201).json({ content: contentItem });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Find similar content
   */
  async findSimilarContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit, projectId } = req.query;
      
      const limitValue = limit ? parseInt(limit as string) : 10;
      
      const similarContent = await this.contentService.findSimilarContent(
        id,
        limitValue,
        projectId as string
      );
      
      return res.json({ similarContent });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Search content
   */
  async searchContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, query, contentType, limit } = req.query;
      
      if (!projectId) {
        throw new ApplicationError('Project ID is required', 400);
      }
      
      const options = {
        limit: limit ? parseInt(limit as string) : 10,
        contentTypes: contentType ? [(contentType as string)] : undefined
      };
      
      const results = await this.contentService.contentRepository.searchContent(
        projectId as string,
        query as string,
        options
      );
      
      return res.json({ results });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get content tags
   */
  async getContentTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const content = await this.contentService.contentRepository.findById(id);
      if (!content) {
        throw new ApplicationError(`Content with ID ${id} not found`, 404);
      }
      
      const tags = await this.contentService.contentRepository.getTags(id);
      
      return res.json({ tags });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add tag to content
   */
  async addTagToContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tagId } = req.body;
      
      if (!tagId) {
        throw new ApplicationError('Tag ID is required', 400);
      }
      
      const content = await this.contentService.contentRepository.findById(id);
      if (!content) {
        throw new ApplicationError(`Content with ID ${id} not found`, 404);
      }
      
      const tag = await this.contentService.tagRepository.findById(tagId);
      if (!tag) {
        throw new ApplicationError(`Tag with ID ${tagId} not found`, 404);
      }
      
      const success = await this.contentService.contentRepository.addTag(id, tagId);
      
      return res.json({ success, contentId: id, tagId });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Remove tag from content
   */
  async removeTagFromContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, tagId } = req.params;
      
      const content = await this.contentService.contentRepository.findById(id);
      if (!content) {
        throw new ApplicationError(`Content with ID ${id} not found`, 404);
      }
      
      const success = await this.contentService.contentRepository.removeTag(id, tagId);
      
      return res.json({ success, contentId: id, tagId });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new version of content
   */
  async createContentVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const content = await this.contentService.contentRepository.findById(id);
      if (!content) {
        throw new ApplicationError(`Content with ID ${id} not found`, 404);
      }
      
      const newVersion = await this.contentService.contentRepository.createVersion(id);
      
      return res.json({ 
        contentId: id, 
        previousVersion: content.version,
        newVersion 
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get content version history
   */
  async getContentVersionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const content = await this.contentService.contentRepository.findById(id);
      if (!content) {
        throw new ApplicationError(`Content with ID ${id} not found`, 404);
      }
      
      const versionHistory = await this.contentService.contentRepository.getVersionHistory(id);
      
      return res.json({ versionHistory });
    } catch (error) {
      next(error);
    }
  }
}