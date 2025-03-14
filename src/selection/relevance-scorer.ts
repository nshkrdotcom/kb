// src/selection/relevance-scorer.ts
import { ContentService } from '../services/content-service';
import { VectorRepository } from '../repositories/interfaces';
import { ScoringFactors } from '../types/optimization';
import { ContentType } from '../types/core';
import { ApplicationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Service for scoring content relevance
 */
export class RelevanceScorer {
  // Default weights for different content types
  private defaultContentTypeWeights: Record<string, number> = {
    [ContentType.TEXT]: 1.0,
    [ContentType.CODE]: 1.2, // Prefer code slightly
    [ContentType.IMAGE]: 0.7 // Images less relevant for LLM context
  };
  
  constructor(
    private contentService: ContentService,
    private vectorRepository: VectorRepository
  ) {}
  
  /**
   * Score content relevance to a query
   */
  async scoreContentRelevance(
    contentId: string,
    query: string,
    additionalFactors: ScoringFactors = {}
  ): Promise<number> {
    logger.debug('Scoring content relevance', { contentId, query });
    
    try {
      // Get the content item
      const contentItem = await this.contentService.getContentWithData(contentId);
      
      if (!contentItem) {
        throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
      }
      
      // 1. Vector similarity score (semantic relevance)
      let vectorScore = 0.5; // Default if no embeddings
      
      if (contentItem.embeddingId) {
        // Get vector similarity
        vectorScore = await this.getVectorSimilarity(contentId, query);
      }
      
      // 2. Content type weight
      const contentTypeWeights = additionalFactors.contentTypeWeights || this.defaultContentTypeWeights;
      const contentTypeWeight = contentTypeWeights[contentItem.contentType] || 1.0;
      
      // 3. Recency factor
      const recencyFactor = additionalFactors.recency || 1.0;
      
      // 4. User interaction factor
      const userInteractionFactor = additionalFactors.userInteraction || 1.0;
      
      // 5. Manual relevance (if provided)
      const manualRelevance = additionalFactors.manualRelevance;
      
      // 6. Selected by user
      const selectedByUser = additionalFactors.selectedByUser === true;
      
      // Calculate final score
      let finalScore: number;
      
      if (selectedByUser) {
        // If user selected this content, give it high relevance
        finalScore = 0.9;
      } else if (manualRelevance !== undefined) {
        // If manual relevance is provided, use it as a strong signal
        finalScore = manualRelevance * 0.7 + vectorScore * 0.3;
      } else {
        // Otherwise, combine all factors
        finalScore = (
          vectorScore * 0.6 +           // 60% vector similarity
          contentTypeWeight * 0.2 +     // 20% content type weight
          recencyFactor * 0.1 +         // 10% recency
          userInteractionFactor * 0.1   // 10% user interaction
        );
      }
      
      // Ensure score is between 0 and 1
      finalScore = Math.max(0, Math.min(1, finalScore));
      
      logger.debug('Content relevance score', {
        contentId,
        score: finalScore,
        vectorScore,
        contentTypeWeight
      });
      
      return finalScore;
    } catch (error: any) {
      logger.error('Error scoring content relevance', {
        contentId,
        error: error.message
      });
      
      // In case of error, return a neutral score
      return 0.5;
    }
  }
  
  /**
   * Score multiple content items at once
   */
  async batchScoreContent(
    contentIds: string[],
    query: string,
    additionalFactors: ScoringFactors = {}
  ): Promise<Map<string, number>> {
    logger.debug('Batch scoring content relevance', {
      contentCount: contentIds.length,
      query
    });
    
    const scoreMap = new Map<string, number>();
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 20;
    
    for (let i = 0; i < contentIds.length; i += batchSize) {
      const batch = contentIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(contentId => 
        this.scoreContentRelevance(contentId, query, additionalFactors)
          .then(score => ({ contentId, score }))
          .catch(() => ({ contentId, score: 0.5 })) // Use neutral score on error
      );
      
      const results = await Promise.all(promises);
      
      // Add results to map
      for (const { contentId, score } of results) {
        scoreMap.set(contentId, score);
      }
    }
    
    return scoreMap;
  }
  
  /**
   * Get vector similarity between content and query
   */
  private async getVectorSimilarity(
    contentId: string,
    query: string
  ): Promise<number> {
    try {
      // In a real implementation, this would:
      // 1. Get the content embedding
      // 2. Generate an embedding for the query
      // 3. Calculate the cosine similarity between them
      
      // For this implementation, we'll simulate vector similarity
      // First, we try to actually get the embedding from the vector repository
      const embedding = await this.vectorRepository.findEmbedding(contentId);
      
      if (!embedding) {
        return 0.5; // Default if no embedding found
      }
      
      // Then, we'd normally compute similarity with the query embedding
      // Here, we'll just return a simulated value between 0.3 and 0.9
      return 0.3 + Math.random() * 0.6;
    } catch (error) {
      logger.error('Error getting vector similarity', {
        contentId,
        error
      });
      
      return 0.5; // Default on error
    }
  }
}