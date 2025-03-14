// src/selection/selection-service.ts
import { ContentItem, ContentType, Context } from '../types/core';
import { SelectionStatus, ScoringFactors } from '../types/optimization';
import { ContentService } from '../services/content-service';
import { ContextService } from '../services/context-service';
import { RelevanceScorer } from './relevance-scorer';
import { countTokens } from '../utils/token-counter';
import { ApplicationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Options for selection operations
 */
export interface SelectionOptions {
  maxItems?: number;
  maxTokens?: number;
  contentTypes?: ContentType[];
  sortBy?: 'relevance' | 'recency' | 'title' | 'type';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Service for user-driven content selection
 */
export class SelectionService {
  constructor(
    private contentService: ContentService,
    private contextService: ContextService,
    private relevanceScorer: RelevanceScorer
  ) {}
  
  /**
   * Get selection status for a context
   */
  async getSelectionStatus(contextId: string): Promise<SelectionStatus> {
    logger.info('Getting selection status', { contextId });
    
    try {
      // Get the context
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // Get context content
      const contentItems = await this.contextService.getContextContent(contextId);
      
      // Calculate token usage
      let totalTokens = 0;
      const breakdown: Record<ContentType, number> = {
        [ContentType.TEXT]: 0,
        [ContentType.CODE]: 0,
        [ContentType.IMAGE]: 0
      };
      
      for (const item of contentItems) {
        // If tokens aren't already calculated, we need to get the full content
        if (!item.tokens) {
          const fullItem = await this.contentService.getContentWithData(item.id);
          if (fullItem.content) {
            if (typeof fullItem.content === 'string') {
              item.tokens = await countTokens(fullItem.content);
            } else if (fullItem.content && typeof fullItem.content === 'object') {
              if ('code' in fullItem.content) {
                item.tokens = await countTokens(fullItem.content.code);
              } else if ('text' in fullItem.content) {
                item.tokens = await countTokens(fullItem.content.text);
              }
            }
          }
        }
        
        if (item.tokens) {
          totalTokens += item.tokens;
          
          // Update breakdown
          if (breakdown[item.contentType] !== undefined) {
            breakdown[item.contentType] += item.tokens;
          }
        }
      }
      
      // Assume a reasonable token limit if not set
      const tokenLimit = context.metadata?.tokenLimit || 100000;
      
      return {
        contextId,
        totalTokens: tokenLimit,
        usedTokens: totalTokens,
        remainingTokens: tokenLimit - totalTokens,
        selectedItems: contentItems.length,
        totalItems: contentItems.length,
        breakdown
      };
    } catch (error: any) {
      logger.error('Error getting selection status', {
        contextId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to get selection status', 500, error);
    }
  }
  
  /**
   * Add content to a context
   */
  async addContentToContext(
    contextId: string,
    contentId: string,
    relevance?: number
  ): Promise<void> {
    logger.info('Adding content to context', { contextId, contentId });
    
    try {
      // Verify context exists
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // Verify content exists
      const content = await this.contentService.getContentWithData(contentId);
      if (!content) {
        throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
      }
      
      // Add content to context
      await this.contextService.addContentToContext(contextId, contentId, {
        relevance,
        selectedByUser: true
      });
      
      logger.info('Content added to context', { contextId, contentId });
    } catch (error: any) {
      logger.error('Error adding content to context', {
        contextId,
        contentId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to add content to context', 500, error);
    }
  }
  
  /**
   * Remove content from a context
   */
  async removeContentFromContext(
    contextId: string,
    contentId: string
  ): Promise<void> {
    logger.info('Removing content from context', { contextId, contentId });
    
    try {
      // Verify context exists
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // Remove content from context
      await this.contextService.removeContentFromContext(contextId, contentId);
      
      logger.info('Content removed from context', { contextId, contentId });
    } catch (error: any) {
      logger.error('Error removing content from context', {
        contextId,
        contentId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to remove content from context', 500, error);
    }
  }
  
  /**
   * Update content relevance in a context
   */
  async updateContentRelevance(
    contextId: string,
    contentId: string,
    relevance: number
  ): Promise<void> {
    logger.info('Updating content relevance', { contextId, contentId, relevance });
    
    try {
      // Validate relevance score
      if (relevance < 0 || relevance > 1) {
        throw new ApplicationError('Relevance must be between 0 and 1', 400);
      }
      
      // Verify context exists
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // Update relevance
      await this.contextService.updateContentRelevance(contextId, contentId, relevance);
      
      logger.info('Content relevance updated', { contextId, contentId, relevance });
    } catch (error: any) {
      logger.error('Error updating content relevance', {
        contextId,
        contentId,
        relevance,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to update content relevance', 500, error);
    }
  }
  
  /**
   * Suggest relevant content for a context and query
   */
  async suggestRelevantContent(
    projectId: string,
    query: string,
    contextId?: string,
    options: SelectionOptions = {}
  ): Promise<{ content: ContentItem; relevance: number }[]> {
    logger.info('Suggesting relevant content', { projectId, query, contextId });
    
    try {
      // Default options
      const opts: SelectionOptions = {
        maxItems: 10,
        maxTokens: 10000,
        contentTypes: [ContentType.TEXT, ContentType.CODE],
        sortBy: 'relevance',
        sortDirection: 'desc',
        ...options
      };
      
      // Get all available content for the project
      let availableContent = await this.contentService.getContentForProject(projectId);
      
      // Filter by content type if specified
      if (opts.contentTypes && opts.contentTypes.length > 0) {
        availableContent = availableContent.filter(
          item => opts.contentTypes!.includes(item.contentType)
        );
      }
      
      // If context is specified, exclude content already in that context
      if (contextId) {
        const contextContent = await this.contextService.getContextContent(contextId);
        const contextContentIds = new Set(contextContent.map(item => item.id));
        availableContent = availableContent.filter(
          item => !contextContentIds.has(item.id)
        );
      }
      
      // Score content relevance
      const contentIds = availableContent.map(item => item.id);
      const relevanceScores = await this.relevanceScorer.batchScoreContent(
        contentIds,
        query
      );
      
      // Combine content with relevance scores
      const scoredContent = availableContent
        .map(content => ({
          content,
          relevance: relevanceScores.get(content.id) || 0
        }))
        .filter(({ relevance }) => relevance > 0.1); // Filter out low relevance items
      
      // Sort content
      if (opts.sortBy === 'relevance') {
        scoredContent.sort((a, b) => {
          return opts.sortDirection === 'asc'
            ? a.relevance - b.relevance
            : b.relevance - a.relevance;
        });
      } else if (opts.sortBy === 'recency') {
        scoredContent.sort((a, b) => {
          const dateA = a.content.createdAt?.getTime() || 0;
          const dateB = b.content.createdAt?.getTime() || 0;
          return opts.sortDirection === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        });
      } else if (opts.sortBy === 'title') {
        scoredContent.sort((a, b) => {
          return opts.sortDirection === 'asc'
            ? a.content.title.localeCompare(b.content.title)
            : b.content.title.localeCompare(a.content.title);
        });
      } else if (opts.sortBy === 'type') {
        scoredContent.sort((a, b) => {
          return opts.sortDirection === 'asc'
            ? a.content.contentType.localeCompare(b.content.contentType)
            : b.content.contentType.localeCompare(a.content.contentType);
        });
      }
      
      // Limit results
      const limitedResults = scoredContent.slice(0, opts.maxItems);
      
      logger.info('Content suggestions generated', {
        projectId,
        query,
        suggestedItems: limitedResults.length
      });
      
      return limitedResults;
    } catch (error: any) {
      logger.error('Error suggesting relevant content', {
        projectId,
        query,
        contextId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to suggest relevant content', 500, error);
    }
  }
  
  /**
   * Find similar content to a specific content item
   */
  async findSimilarContent(
    contentId: string,
    limit: number = 5,
    projectId?: string
  ): Promise<{ content: ContentItem; relevance: number }[]> {
    logger.info('Finding similar content', { contentId, limit, projectId });
    
    try {
      // Get the specified content item
      const contentItem = await this.contentService.getContentWithData(contentId);
      if (!contentItem) {
        throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
      }
      
      // Use content service to find similar content based on vector embeddings
      const similarContent = await this.contentService.findSimilarContent(
        contentId,
        limit,
        projectId || contentItem.projectId
      );
      
      // Map to return format
      const result = await Promise.all(
        similarContent.map(async ({ contentId, score }) => {
          const content = await this.contentService.getContentWithData(contentId);
          return {
            content,
            relevance: score
          };
        })
      );
      
      logger.info('Similar content found', {
        contentId,
        similarItems: result.length
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error finding similar content', {
        contentId,
        limit,
        projectId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to find similar content', 500, error);
    }
  }
}