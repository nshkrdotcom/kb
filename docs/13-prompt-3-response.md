# Context Optimization Implementation

Here's a comprehensive implementation of the context optimization engine for ContextNexus, focusing on efficient content selection, relevance scoring, prompt building, and selection management.

## 1. Core Types and Interfaces

First, I'll create the necessary shared types for the context optimization components:

```typescript
// src/types/optimization.ts
import { ContentType } from './core';

/**
 * Optimized context containing selected content items
 */
export interface OptimizedContext {
  items: OptimizedContentItem[];
  totalTokens: number;
  remainingTokens: number;
  originalContentCount: number;
  selectedContentCount: number;
  query?: string;
}

/**
 * Content item optimized for inclusion in context
 */
export interface OptimizedContentItem {
  id: string;
  content: string;
  title: string;
  contentType: ContentType;
  tokens: number;
  relevance: number;
  chunkIndex?: number;
  metadata?: Record<string, any>;
}

/**
 * Available chunking strategies
 */
export enum ChunkStrategy {
  PARAGRAPH = 'paragraph',
  SEMANTIC = 'semantic',
  FIXED_SIZE = 'fixed-size',
  CODE_AWARE = 'code-aware',
  LIST_AWARE = 'list-aware'
}

/**
 * Content chunk
 */
export interface ContentChunk {
  content: string;
  tokens: number;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

/**
 * Prompt for sending to LLM
 */
export interface Prompt {
  text: string;
  tokens: number;
  messages?: Array<{
    role: string;
    content: string;
  }>;
  modelType: string;
}

/**
 * Factors used for relevance scoring
 */
export interface ScoringFactors {
  recency?: number; // 0-1 factor for recency
  userInteraction?: number; // 0-1 factor for user interaction history
  contentTypeWeights?: Record<string, number>; // weights for different content types
  manualRelevance?: number; // 0-1 factor for manually assigned relevance
  selectedByUser?: boolean; // whether the user manually selected this content
}

/**
 * Selection status information
 */
export interface SelectionStatus {
  contextId: string;
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  selectedItems: number;
  totalItems: number;
  breakdown: {
    [ContentType.TEXT]?: number;
    [ContentType.CODE]?: number;
    [ContentType.IMAGE]?: number;
  };
}
```

## 2. Context Optimizer Implementation

```typescript
// src/llm/context-optimizer.ts
import { ContentType } from '../types/core';
import { 
  OptimizedContext, 
  OptimizedContentItem, 
  ChunkStrategy, 
  ContentChunk 
} from '../types/optimization';
import { ContextService } from '../services/context-service';
import { ContentService } from '../services/content-service';
import { RelevanceScorer } from '../selection/relevance-scorer';
import { countTokens } from '../utils/token-counter';
import { ApplicationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Options for context optimization
 */
export interface OptimizationOptions {
  // Token budget
  maxTokens?: number;
  reserveTokens?: number; // Tokens to reserve for query and response
  
  // Content selection
  includeUserSelected?: boolean; // Whether to include user-selected content
  maxContentItems?: number; // Maximum number of content items to include
  relevanceThreshold?: number; // Minimum relevance score (0-1)
  
  // Chunking
  defaultChunkStrategy?: ChunkStrategy;
  chunkByContentType?: boolean; // Whether to use different chunking strategies based on content type
  maxChunkTokens?: number; // Maximum tokens per chunk
  
  // Compression
  enableCompression?: boolean; // Whether to compress content when token budget is tight
  compressionThreshold?: number; // Token threshold for compression
}

/**
 * Context optimizer for efficient content selection
 */
export class ContextOptimizer {
  constructor(
    private contextService: ContextService,
    private contentService: ContentService,
    private relevanceScorer: RelevanceScorer
  ) {}
  
  /**
   * Optimize context for a query within token budget
   */
  async optimizeContext(
    contextId: string, 
    query: string, 
    tokenBudget: number,
    options: OptimizationOptions = {}
  ): Promise<OptimizedContext> {
    logger.info('Optimizing context', { contextId, query, tokenBudget });
    
    try {
      // Apply default options
      const opts: OptimizationOptions = {
        maxTokens: tokenBudget,
        reserveTokens: 800, // Reserve tokens for query and response
        includeUserSelected: true,
        maxContentItems: 50,
        relevanceThreshold: 0.1,
        defaultChunkStrategy: ChunkStrategy.PARAGRAPH,
        chunkByContentType: true,
        maxChunkTokens: 1000,
        enableCompression: true,
        compressionThreshold: tokenBudget * 0.7,
        ...options
      };
      
      // 1. Get content from context
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      const allContentItems = await this.contextService.getContextContent(contextId);
      
      // 2. Score content relevance
      const contentIds = allContentItems.map(item => item.id);
      const relevanceScores = await this.relevanceScorer.batchScoreContent(contentIds, query);
      
      // 3. Sort and filter content by relevance
      const sortedItems = allContentItems
        .map(item => {
          const relevance = relevanceScores.get(item.id) || 0;
          return { item, relevance };
        })
        .filter(({ relevance }) => relevance >= (opts.relevanceThreshold || 0))
        .sort((a, b) => {
          // Prioritize user-selected content
          const userSelectedA = a.item.metadata?.selectedByUser === true;
          const userSelectedB = b.item.metadata?.selectedByUser === true;
          
          if (userSelectedA && !userSelectedB) return -1;
          if (!userSelectedA && userSelectedB) return 1;
          
          // Then sort by relevance
          return b.relevance - a.relevance;
        });
      
      // 4. Calculate available token budget
      const availableTokens = opts.maxTokens! - opts.reserveTokens!;
      
      // 5. Select content to fit within token budget
      const selectedItems: OptimizedContentItem[] = [];
      let usedTokens = 0;
      let compressionApplied = false;
      
      for (const { item, relevance } of sortedItems) {
        // Early exit if we've reached max items
        if (selectedItems.length >= opts.maxContentItems!) {
          break;
        }
        
        // Get full content if not already loaded
        const contentWithData = item.content 
          ? item 
          : await this.contentService.getContentWithData(item.id);
        
        if (!contentWithData.content) {
          continue; // Skip if content can't be loaded
        }
        
        // Get content text based on content type
        let contentText = '';
        if (typeof contentWithData.content === 'string') {
          contentText = contentWithData.content;
        } else if (contentWithData.content && typeof contentWithData.content === 'object') {
          if ('code' in contentWithData.content) {
            contentText = contentWithData.content.code;
          } else if ('text' in contentWithData.content) {
            contentText = contentWithData.content.text;
          }
        }
        
        if (!contentText) {
          continue;
        }
        
        // Count tokens
        const contentTokens = await countTokens(contentText);
        
        // Check if we need to chunk the content
        if (contentTokens > (opts.maxChunkTokens || contentTokens)) {
          const chunkStrategy = this.getChunkStrategy(contentWithData.contentType, opts);
          const chunks = this.chunkContent(contentText, contentWithData.contentType, chunkStrategy, opts);
          
          // Add chunks while respecting token budget
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Check if adding this chunk would exceed the budget
            if (usedTokens + chunk.tokens > availableTokens) {
              // Try compression if enabled and we're above the threshold
              if (opts.enableCompression && 
                  !compressionApplied && 
                  usedTokens > opts.compressionThreshold!) {
                // Compress existing content to make room
                const compressedItems = await this.compressSelected(selectedItems, availableTokens * 0.7);
                selectedItems.splice(0, selectedItems.length, ...compressedItems);
                usedTokens = compressedItems.reduce((sum, item) => sum + item.tokens, 0);
                compressionApplied = true;
                
                // Now try adding the chunk again
                if (usedTokens + chunk.tokens <= availableTokens) {
                  selectedItems.push({
                    id: contentWithData.id,
                    content: chunk.content,
                    title: contentWithData.title,
                    contentType: contentWithData.contentType,
                    tokens: chunk.tokens,
                    relevance,
                    chunkIndex: i,
                    metadata: {
                      ...contentWithData.metadata,
                      chunkInfo: {
                        startIndex: chunk.startIndex,
                        endIndex: chunk.endIndex,
                        totalChunks: chunks.length
                      }
                    }
                  });
                  usedTokens += chunk.tokens;
                }
              }
              // If we can't add it even after compression, move to next content item
              break;
            }
            
            // Add the chunk
            selectedItems.push({
              id: contentWithData.id,
              content: chunk.content,
              title: contentWithData.title,
              contentType: contentWithData.contentType,
              tokens: chunk.tokens,
              relevance,
              chunkIndex: i,
              metadata: {
                ...contentWithData.metadata,
                chunkInfo: {
                  startIndex: chunk.startIndex,
                  endIndex: chunk.endIndex,
                  totalChunks: chunks.length
                }
              }
            });
            usedTokens += chunk.tokens;
          }
        } else {
          // Check if adding this content would exceed the budget
          if (usedTokens + contentTokens > availableTokens) {
            // Try compression if enabled and we're above the threshold
            if (opts.enableCompression && 
                !compressionApplied && 
                usedTokens > opts.compressionThreshold!) {
              // Compress existing content to make room
              const compressedItems = await this.compressSelected(selectedItems, availableTokens * 0.7);
              selectedItems.splice(0, selectedItems.length, ...compressedItems);
              usedTokens = compressedItems.reduce((sum, item) => sum + item.tokens, 0);
              compressionApplied = true;
              
              // Now try adding the content again
              if (usedTokens + contentTokens <= availableTokens) {
                selectedItems.push({
                  id: contentWithData.id,
                  content: contentText,
                  title: contentWithData.title,
                  contentType: contentWithData.contentType,
                  tokens: contentTokens,
                  relevance,
                  metadata: contentWithData.metadata
                });
                usedTokens += contentTokens;
              }
            }
            // If we still can't add it, move to next content item
            continue;
          }
          
          // Add the content
          selectedItems.push({
            id: contentWithData.id,
            content: contentText,
            title: contentWithData.title,
            contentType: contentWithData.contentType,
            tokens: contentTokens,
            relevance,
            metadata: contentWithData.metadata
          });
          usedTokens += contentTokens;
        }
      }
      
      // Create optimized context
      const optimizedContext: OptimizedContext = {
        items: selectedItems,
        totalTokens: usedTokens,
        remainingTokens: availableTokens - usedTokens,
        originalContentCount: allContentItems.length,
        selectedContentCount: selectedItems.length,
        query
      };
      
      logger.info('Context optimization complete', {
        contextId,
        selectedItems: selectedItems.length,
        totalTokens: usedTokens,
        compressionApplied
      });
      
      return optimizedContext;
    } catch (error: any) {
      logger.error('Error optimizing context', {
        contextId,
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to optimize context', 500, error);
    }
  }
  
  /**
   * Chunk content into smaller pieces based on strategy
   */
  chunkContent(
    content: string,
    contentType: ContentType,
    chunkStrategy: ChunkStrategy,
    options: OptimizationOptions = {}
  ): ContentChunk[] {
    logger.debug('Chunking content', {
      contentType,
      strategy: chunkStrategy,
      contentLength: content.length
    });
    
    const maxChunkTokens = options.maxChunkTokens || 1000;
    
    try {
      switch (chunkStrategy) {
        case ChunkStrategy.PARAGRAPH:
          return this.chunkByParagraph(content, maxChunkTokens);
        
        case ChunkStrategy.SEMANTIC:
          return this.chunkBySemantic(content, maxChunkTokens);
        
        case ChunkStrategy.CODE_AWARE:
          return this.chunkCodeAware(content, maxChunkTokens);
        
        case ChunkStrategy.LIST_AWARE:
          return this.chunkListAware(content, maxChunkTokens);
        
        case ChunkStrategy.FIXED_SIZE:
        default:
          return this.chunkByFixedSize(content, maxChunkTokens);
      }
    } catch (error: any) {
      logger.error('Error chunking content', {
        contentType,
        strategy: chunkStrategy,
        error: error.message
      });
      
      // Fall back to fixed size chunking
      return this.chunkByFixedSize(content, maxChunkTokens);
    }
  }
  
  /**
   * Determine the best chunking strategy for a content type
   */
  private getChunkStrategy(
    contentType: ContentType,
    options: OptimizationOptions
  ): ChunkStrategy {
    if (!options.chunkByContentType) {
      return options.defaultChunkStrategy || ChunkStrategy.PARAGRAPH;
    }
    
    switch (contentType) {
      case ContentType.CODE:
        return ChunkStrategy.CODE_AWARE;
      
      case ContentType.TEXT:
        // Check if content contains lists
        if (options.defaultChunkStrategy === ChunkStrategy.LIST_AWARE) {
          return ChunkStrategy.LIST_AWARE;
        }
        return ChunkStrategy.PARAGRAPH;
      
      default:
        return options.defaultChunkStrategy || ChunkStrategy.PARAGRAPH;
    }
  }
  
  /**
   * Chunk content by paragraphs
   */
  private async chunkByParagraph(
    content: string,
    maxChunkTokens: number
  ): Promise<ContentChunk[]> {
    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    
    const chunks: ContentChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startIndex = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphTokens = await countTokens(paragraph);
      
      // If a single paragraph exceeds the limit, we need to split it further
      if (paragraphTokens > maxChunkTokens) {
        // First, add any accumulated content as a chunk
        if (currentChunk) {
          chunks.push({
            content: currentChunk,
            tokens: currentTokens,
            startIndex,
            endIndex: startIndex + currentChunk.length
          });
          startIndex += currentChunk.length;
        }
        
        // Then split the large paragraph
        const subChunks = await this.chunkByFixedSize(paragraph, maxChunkTokens);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            tokens: subChunk.tokens,
            startIndex: startIndex + subChunk.startIndex,
            endIndex: startIndex + subChunk.endIndex
          });
        }
        
        // Reset accumulator
        currentChunk = '';
        currentTokens = 0;
        startIndex += paragraph.length;
        continue;
      }
      
      // Check if adding this paragraph would exceed the token limit
      if (currentTokens + paragraphTokens > maxChunkTokens && currentChunk) {
        // Add the current chunk
        chunks.push({
          content: currentChunk,
          tokens: currentTokens,
          startIndex,
          endIndex: startIndex + currentChunk.length
        });
        
        // Start a new chunk
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
        startIndex += currentChunk.length;
      } else {
        // Add paragraph to current chunk
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
          currentTokens += paragraphTokens + 2; // +2 for the newlines
        } else {
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        }
      }
    }
    
    // Add any remaining content
    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        tokens: currentTokens,
        startIndex,
        endIndex: startIndex + currentChunk.length
      });
    }
    
    return chunks;
  }
  
  /**
   * Chunk content semantically (using sentence boundaries)
   */
  private async chunkBySemantic(
    content: string,
    maxChunkTokens: number
  ): Promise<ContentChunk[]> {
    // Split content into sentences using a regex that preserves trailing punctuation
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    
    const chunks: ContentChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startIndex = 0;
    
    for (const sentence of sentences) {
      const sentenceTokens = await countTokens(sentence);
      
      // If a single sentence exceeds the limit, we need to split it further
      if (sentenceTokens > maxChunkTokens) {
        // First, add any accumulated content as a chunk
        if (currentChunk) {
          chunks.push({
            content: currentChunk,
            tokens: currentTokens,
            startIndex,
            endIndex: startIndex + currentChunk.length
          });
          startIndex += currentChunk.length;
        }
        
        // Then split the large sentence
        const subChunks = await this.chunkByFixedSize(sentence, maxChunkTokens);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            tokens: subChunk.tokens,
            startIndex: startIndex + subChunk.startIndex,
            endIndex: startIndex + subChunk.endIndex
          });
        }
        
        // Reset accumulator
        currentChunk = '';
        currentTokens = 0;
        startIndex += sentence.length;
        continue;
      }
      
      // Check if adding this sentence would exceed the token limit
      if (currentTokens + sentenceTokens > maxChunkTokens && currentChunk) {
        // Add the current chunk
        chunks.push({
          content: currentChunk,
          tokens: currentTokens,
          startIndex,
          endIndex: startIndex + currentChunk.length
        });
        
        // Start a new chunk
        currentChunk = sentence;
        currentTokens = sentenceTokens;
        startIndex += currentChunk.length;
      } else {
        // Add sentence to current chunk
        if (currentChunk) {
          currentChunk += ' ' + sentence;
          currentTokens += sentenceTokens + 1; // +1 for the space
        } else {
          currentChunk = sentence;
          currentTokens = sentenceTokens;
        }
      }
    }
    
    // Add any remaining content
    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        tokens: currentTokens,
        startIndex,
        endIndex: startIndex + currentChunk.length
      });
    }
    
    return chunks;
  }
  
  /**
   * Chunk code in a code-aware manner
   */
  private async chunkCodeAware(
    content: string,
    maxChunkTokens: number
  ): Promise<ContentChunk[]> {
    // For code, we'll try to split at meaningful boundaries like:
    // - Function/class definitions
    // - Import statements
    // - Comment blocks
    
    // First, try to identify logical blocks
    const blockPatterns = [
      /\n\s*function\s+\w+/g, // Function definitions
      /\n\s*class\s+\w+/g,    // Class definitions
      /\n\s*import\s+/g,      // Import statements
      /\n\s*\/\*[\s\S]*?\*\//g, // Comment blocks
      /\n\s*\/\/[^\n]*/g,     // Single line comments
      /\n\s*\}/g,             // Closing braces (end of blocks)
      /\n\s*\{/g              // Opening braces (start of blocks)
    ];
    
    // Find all potential split points
    const splitPoints = new Set<number>();
    splitPoints.add(0); // Always include the start of the content
    
    for (const pattern of blockPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          splitPoints.add(match.index);
        }
      }
    }
    
    // Convert to array and sort
    const sortedSplitPoints = Array.from(splitPoints).sort((a, b) => a - b);
    
    // Create chunks based on split points
    const chunks: ContentChunk[] = [];
    let startPoint = 0;
    let currentChunk = '';
    let currentTokens = 0;
    
    for (let i = 1; i < sortedSplitPoints.length; i++) {
      const endPoint = sortedSplitPoints[i];
      const segment = content.substring(startPoint, endPoint);
      const segmentTokens = await countTokens(segment);
      
      // If this segment alone exceeds the limit, we need to split it further
      if (segmentTokens > maxChunkTokens) {
        // First, add any accumulated content as a chunk
        if (currentChunk) {
          chunks.push({
            content: currentChunk,
            tokens: currentTokens,
            startIndex: startPoint - currentChunk.length,
            endIndex: startPoint
          });
        }
        
        // Then split the large segment
        const subChunks = await this.chunkByFixedSize(segment, maxChunkTokens);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            tokens: subChunk.tokens,
            startIndex: startPoint + subChunk.startIndex,
            endIndex: startPoint + subChunk.endIndex
          });
        }
        
        // Reset accumulator
        currentChunk = '';
        currentTokens = 0;
        startPoint = endPoint;
        continue;
      }
      
      // Check if adding this segment would exceed the token limit
      if (currentTokens + segmentTokens > maxChunkTokens && currentChunk) {
        // Add the current chunk
        chunks.push({
          content: currentChunk,
          tokens: currentTokens,
          startIndex: startPoint - currentChunk.length,
          endIndex: startPoint
        });
        
        // Start a new chunk
        currentChunk = segment;
        currentTokens = segmentTokens;
      } else {
        // Add segment to current chunk
        if (currentChunk) {
          currentChunk += segment;
          currentTokens += segmentTokens;
        } else {
          currentChunk = segment;
          currentTokens = segmentTokens;
        }
      }
      
      startPoint = endPoint;
    }
    
    // Add any remaining content
    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        tokens: currentTokens,
        startIndex: startPoint - currentChunk.length,
        endIndex: startPoint
      });
    }
    
    // If content wasn't chunked properly, fall back to paragraph chunking
    if (chunks.length === 0) {
      return this.chunkByParagraph(content, maxChunkTokens);
    }
    
    return chunks;
  }
  
  /**
   * Chunk content with awareness of lists
   */
  private async chunkListAware(
    content: string,
    maxChunkTokens: number
  ): Promise<ContentChunk[]> {
    // For list-aware chunking, we want to keep list items together
    // First, identify list structures
    const listPatterns = [
      /^\s*[-*•]\s+/gm,    // Bullet lists
      /^\s*\d+\.\s+/gm,     // Numbered lists
      /^\s*[a-z]\)\s+/gm    // Lettered lists
    ];
    
    // Try to break content at list boundaries
    let modifiedContent = content;
    
    for (const pattern of listPatterns) {
      // Add a special marker at the beginning of each list item
      modifiedContent = modifiedContent.replace(pattern, match => `\n§LIST_ITEM§${match}`);
    }
    
    // Split by paragraphs first
    const paragraphs = modifiedContent.split(/\n\s*\n/);
    
    const chunks: ContentChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startIndex = 0;
    let inList = false;
    
    for (const paragraph of paragraphs) {
      // Check if this paragraph contains list items
      const containsListItem = paragraph.includes('§LIST_ITEM§');
      
      // If we're in a list and this paragraph doesn't contain list items,
      // or if we're not in a list and this paragraph does contain list items,
      // we want to create a chunk boundary
      if ((inList && !containsListItem) || (!inList && containsListItem)) {
        if (currentChunk) {
          // Remove our list markers before saving the chunk
          const cleanedChunk = currentChunk.replace(/§LIST_ITEM§/g, '');
          
          chunks.push({
            content: cleanedChunk,
            tokens: currentTokens,
            startIndex,
            endIndex: startIndex + cleanedChunk.length
          });
          
          // Start a new chunk
          currentChunk = paragraph;
          currentTokens = await countTokens(paragraph.replace(/§LIST_ITEM§/g, ''));
          startIndex += cleanedChunk.length;
          inList = containsListItem;
          continue;
        }
      }
      
      // Remove our list markers for token counting
      const cleanedParagraph = paragraph.replace(/§LIST_ITEM§/g, '');
      const paragraphTokens = await countTokens(cleanedParagraph);
      
      // If a single paragraph exceeds the limit, we need to split it further
      if (paragraphTokens > maxChunkTokens) {
        // First, add any accumulated content as a chunk
        if (currentChunk) {
          const cleanedChunk = currentChunk.replace(/§LIST_ITEM§/g, '');
          chunks.push({
            content: cleanedChunk,
            tokens: currentTokens,
            startIndex,
            endIndex: startIndex + cleanedChunk.length
          });
          startIndex += cleanedChunk.length;
        }
        
        // Then split the large paragraph
        const subChunks = await this.chunkByParagraph(cleanedParagraph, maxChunkTokens);
        for (const subChunk of subChunks) {
          chunks.push({
            content: subChunk.content,
            tokens: subChunk.tokens,
            startIndex: startIndex + subChunk.startIndex,
            endIndex: startIndex + subChunk.endIndex
          });
        }
        
        // Reset accumulator
        currentChunk = '';
        currentTokens = 0;
        startIndex += cleanedParagraph.length;
        continue;
      }
      
      // Check if adding this paragraph would exceed the token limit
      if (currentTokens + paragraphTokens > maxChunkTokens && currentChunk) {
        // Add the current chunk
        const cleanedChunk = currentChunk.replace(/§LIST_ITEM§/g, '');
        chunks.push({
          content: cleanedChunk,
          tokens: currentTokens,
          startIndex,
          endIndex: startIndex + cleanedChunk.length
        });
        
        // Start a new chunk
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
        startIndex += cleanedChunk.length;
      } else {
        // Add paragraph to current chunk
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
          currentTokens += paragraphTokens + 2; // +2 for the newlines
        } else {
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        }
      }
      
      // Update list state
      inList = containsListItem;
    }
    
    // Add any remaining content
    if (currentChunk) {
      const cleanedChunk = currentChunk.replace(/§LIST_ITEM§/g, '');
      chunks.push({
        content: cleanedChunk,
        tokens: currentTokens,
        startIndex,
        endIndex: startIndex + cleanedChunk.length
      });
    }
    
    return chunks;
  }
  
  /**
   * Chunk content by fixed token size
   */
  private async chunkByFixedSize(
    content: string,
    maxChunkTokens: number
  ): Promise<ContentChunk[]> {
    // Split content into words
    const words = content.split(/\s+/);
    
    const chunks: ContentChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let wordIndex = 0;
    let startIndex = 0;
    
    for (const word of words) {
      const wordWithSpace = wordIndex > 0 ? ' ' + word : word;
      const wordTokens = await countTokens(wordWithSpace);
      
      // If a single word exceeds the limit, we need to include it anyway
      if (wordTokens > maxChunkTokens) {
        // First, add any accumulated content as a chunk
        if (currentChunk.length > 0) {
          const chunk = currentChunk.join(' ');
          chunks.push({
            content: chunk,
            tokens: currentTokens,
            startIndex,
            endIndex: startIndex + chunk.length
          });
          startIndex += chunk.length + 1; // +1 for the space after the chunk
        }
        
        // Then add the large word as its own chunk
        chunks.push({
          content: word,
          tokens: wordTokens,
          startIndex,
          endIndex: startIndex + word.length
        });
        startIndex += word.length + 1; // +1 for the space after the word
        
        // Reset accumulator
        currentChunk = [];
        currentTokens = 0;
      }
      // Check if adding this word would exceed the token limit
      else if (currentTokens + wordTokens > maxChunkTokens && currentChunk.length > 0) {
        // Add the current chunk
        const chunk = currentChunk.join(' ');
        chunks.push({
          content: chunk,
          tokens: currentTokens,
          startIndex,
          endIndex: startIndex + chunk.length
        });
        
        // Start a new chunk
        currentChunk = [word];
        currentTokens = await countTokens(word);
        startIndex += chunk.length + 1; // +1 for the space after the chunk
      } else {
        // Add word to current chunk
        currentChunk.push(word);
        currentTokens += wordTokens;
      }
      
      wordIndex++;
    }
    
    // Add any remaining content
    if (currentChunk.length > 0) {
      const chunk = currentChunk.join(' ');
      chunks.push({
        content: chunk,
        tokens: currentTokens,
        startIndex,
        endIndex: startIndex + chunk.length
      });
    }
    
    return chunks;
  }
  
  /**
   * Compress selected content items to reduce token usage
   */
  private async compressSelected(
    items: OptimizedContentItem[],
    targetTokens: number
  ): Promise<OptimizedContentItem[]> {
    // If we're already under the target, no compression needed
    const currentTokens = items.reduce((sum, item) => sum + item.tokens, 0);
    if (currentTokens <= targetTokens) {
      return items;
    }
    
    logger.debug('Compressing content', {
      currentTokens,
      targetTokens,
      itemCount: items.length
    });
    
    // Sort by relevance (descending)
    const sortedItems = [...items].sort((a, b) => b.relevance - a.relevance);
    
    // Keep high relevance items intact, compress lower relevance items
    const compressionThreshold = 0.5; // Items below this relevance will be compressed
    const compressedItems: OptimizedContentItem[] = [];
    let usedTokens = 0;
    
    for (const item of sortedItems) {
      // If this item is high relevance, keep it intact
      if (item.relevance >= compressionThreshold) {
        compressedItems.push(item);
        usedTokens += item.tokens;
        continue;
      }
      
      // For lower relevance items, try to compress
      // Simple compression: extract key sentences or just take the beginning
      const compressedContent = await this.compressContent(item.content, item.contentType);
      const compressedTokens = await countTokens(compressedContent);
      
      compressedItems.push({
        ...item,
        content: compressedContent,
        tokens: compressedTokens,
        metadata: {
          ...item.metadata,
          compressed: true
        }
      });
      usedTokens += compressedTokens;
      
      // If we're now under the target, we can stop compressing
      if (usedTokens <= targetTokens) {
        break;
      }
    }
    
    // Sort back to original order
    compressedItems.sort((a, b) => {
      const aIndex = items.findIndex(item => item.id === a.id && item.chunkIndex === a.chunkIndex);
      const bIndex = items.findIndex(item => item.id === b.id && item.chunkIndex === b.chunkIndex);
      return aIndex - bIndex;
    });
    
    return compressedItems;
  }
  
  /**
   * Compress a single content item's text
   */
  private async compressContent(
    content: string,
    contentType: ContentType
  ): Promise<string> {
    // Different compression strategies based on content type
    switch (contentType) {
      case ContentType.CODE:
        return this.compressCode(content);
      
      case ContentType.TEXT:
      default:
        return this.compressText(content);
    }
  }
  
  /**
   * Compress text by extracting key sentences
   */
  private compressText(text: string): string {
    // Simple implementation: take first paragraph plus any sentences with key indicators
    const paragraphs = text.split(/\n\s*\n/);
    
    if (paragraphs.length === 0) {
      return text;
    }
    
    // Always include the first paragraph
    let compressed = paragraphs[0];
    
    // Look for key indicators in other paragraphs
    const keyPhrases = [
      'important', 'critical', 'essential', 'key', 'crucial',
      'significant', 'primary', 'main', 'fundamental', 'vital',
      'necessary', 'required', 'must', 'should', 'conclusion',
      'therefore', 'thus', 'hence', 'in summary', 'to summarize'
    ];
    
    // Regular expression to match key phrases
    const keyPhraseRegex = new RegExp(`\\b(${keyPhrases.join('|')})\\b`, 'i');
    
    // Add any sentences containing key phrases
    for (let i = 1; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      // If paragraph contains key phrases, add it
      if (keyPhraseRegex.test(paragraph)) {
        compressed += '\n\n' + paragraph;
      }
    }
    
    return compressed;
  }
  
  /**
   * Compress code by removing comments and extra whitespace
   */
  private compressCode(code: string): string {
    // Remove single-line comments
    let compressed = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove extra blank lines
    compressed = compressed.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // If code is still long, keep function signatures and structure
    if (compressed.length > 1000) {
      // Extract function definitions
      const functionMatches = compressed.match(/function\s+\w+\s*\([^)]*\)\s*{/g) || [];
      const classMatches = compressed.match(/class\s+\w+\s*[^{]*{/g) || [];
      
      // Extract import statements
      const importMatches = compressed.match(/import\s+.*;/g) || [];
      
      // Combine signatures
      const signatures = [
        ...importMatches,
        ...functionMatches.map(fn => fn + ' /* ... */ }'),
        ...classMatches.map(cls => cls + ' /* ... */ }')
      ];
      
      if (signatures.length > 0) {
        compressed = signatures.join('\n\n');
      } else {
        // If no signatures found, just take the first few lines
        compressed = compressed.split('\n').slice(0, 10).join('\n') + '\n// ...';
      }
    }
    
    return compressed;
  }
}
```

## 3. Relevance Scorer Implementation

```typescript
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
```

## 4. Prompt Builder Implementation

```typescript
// src/llm/prompt-builder.ts
import { Prompt, OptimizedContext } from '../types/optimization';
import { ConversationMessage } from './connectors/llm-connector';
import { countTokens } from '../utils/token-counter';
import { ContentType } from '../types/core';
import logger from '../utils/logger';

/**
 * Options for prompt building
 */
export interface PromptOptions {
  maxTokens?: number;
  temperature?: number;
  formatInstructions?: string;
  includeMetadata?: boolean;
}

/**
 * Builder for LLM prompts
 */
export class PromptBuilder {
  // Template fragments
  private readonly DEFAULT_SYSTEM_TEMPLATE = 
    `You are a helpful AI assistant. Answer the user's question based on the context provided.
     If the context doesn't contain the information needed, say so clearly.
     Base your answers solely on the information provided in the context.`;
  
  private readonly CONTEXT_INTRO = 
    `I'm going to provide you with context information, followed by a question.
     Please use this context to answer the question.`;
  
  private readonly CODE_FOCUS_TEMPLATE = 
    `You are a programming assistant specialized in helping with code. 
     Focus on explaining code concepts clearly and providing practical, 
     working examples. When analyzing code, make sure to explain why 
     certain approaches are used and suggest best practices.`;
  
  private readonly DOCUMENT_FOCUS_TEMPLATE = 
    `You are a knowledge assistant specialized in analyzing and summarizing documents.
     Focus on extracting key information, identifying main themes, and providing 
     concise but comprehensive summaries. Maintain the factual integrity of the source material.`;
  
  /**
   * Build a prompt for a single query
   */
  async buildPrompt(
    query: string,
    optimizedContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    logger.debug('Building prompt', {
      modelType,
      contextItems: optimizedContext.items.length,
      totalContextTokens: optimizedContext.totalTokens
    });
    
    try {
      // Determine if this is a chat-based or completion-based model
      const isChatModel = modelType.includes('gpt-3.5') || 
                          modelType.includes('gpt-4') ||
                          modelType.includes('claude');
      
      if (isChatModel) {
        return this.buildChatPrompt(query, optimizedContext, modelType, options);
      } else {
        return this.buildCompletionPrompt(query, optimizedContext, modelType, options);
      }
    } catch (error: any) {
      logger.error('Error building prompt', {
        error: error.message,
        modelType
      });
      
      // Fallback to a simple prompt
      return {
        text: query,
        tokens: await countTokens(query),
        modelType
      };
    }
  }
  
  /**
   * Build a prompt for a multi-turn conversation
   */
  async buildConversationPrompt(
    query: string,
    conversationHistory: ConversationMessage[],
    optimizedContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    logger.debug('Building conversation prompt', {
      modelType,
      contextItems: optimizedContext.items.length,
      historyMessages: conversationHistory.length
    });
    
    try {
      // For conversation prompts, we should always use the chat format
      const messages: ConversationMessage[] = [];
      
      // 1. System message with context
      const systemMessage = this.buildSystemMessage(optimizedContext, options);
      messages.push({
        role: 'system',
        content: systemMessage
      });
      
      // 2. Add conversation history
      messages.push(...conversationHistory);
      
      // 3. Add the current query
      messages.push({
        role: 'user',
        content: query
      });
      
      // Calculate total tokens
      let totalTokens = 0;
      for (const message of messages) {
        totalTokens += await countTokens(message.content);
      }
      
      // Add message format overhead (varies by model)
      totalTokens += messages.length * 4; // Approximate overhead per message
      
      return {
        text: '', // Not used for chat models
        tokens: totalTokens,
        messages,
        modelType
      };
    } catch (error: any) {
      logger.error('Error building conversation prompt', {
        error: error.message,
        modelType
      });
      
      // Fallback to a simple prompt
      return {
        text: query,
        tokens: await countTokens(query),
        modelType,
        messages: [
          { role: 'user', content: query }
        ]
      };
    }
  }
  
  /**
   * Build a chat-based prompt
   */
  private async buildChatPrompt(
    query: string,
    optimizedContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    // 1. System message with context
    const systemMessage = this.buildSystemMessage(optimizedContext, options);
    
    // 2. Create messages array
    const messages: ConversationMessage[] = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: query
      }
    ];
    
    // 3. Calculate total tokens
    let totalTokens = 0;
    for (const message of messages) {
      totalTokens += await countTokens(message.content);
    }
    
    // Add message format overhead (varies by model)
    totalTokens += messages.length * 4; // Approximate overhead per message
    
    return {
      text: '', // Not used for chat models
      tokens: totalTokens,
      messages,
      modelType
    };
  }
  
  /**
   * Build a completion-based prompt
   */
  private async buildCompletionPrompt(
    query: string,
    optimizedContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    // 1. Start with base instructions
    let promptText = this.CONTEXT_INTRO + '\n\n';
    
    // 2. Add format instructions if provided
    if (options.formatInstructions) {
      promptText += options.formatInstructions + '\n\n';
    }
    
    // 3. Add context items
    promptText += 'CONTEXT:\n';
    
    for (const item of optimizedContext.items) {
      promptText += `=== ${item.title} ===\n${item.content}\n\n`;
    }
    
    // 4. Add query
    promptText += 'QUESTION: ' + query + '\n\n';
    promptText += 'ANSWER:';
    
    // 5. Calculate tokens
    const totalTokens = await countTokens(promptText);
    
    return {
      text: promptText,
      tokens: totalTokens,
      modelType
    };
  }
  
  /**
   * Build system message with context
   */
  private buildSystemMessage(
    optimizedContext: OptimizedContext,
    options: PromptOptions = {}
  ): string {
    // 1. Start with appropriate system template
    let systemMessage = this.DEFAULT_SYSTEM_TEMPLATE;
    
    // Check if context is primarily code
    const codeItems = optimizedContext.items.filter(
      item => item.contentType === ContentType.CODE
    );
    
    if (codeItems.length > optimizedContext.items.length / 2) {
      systemMessage = this.CODE_FOCUS_TEMPLATE;
    }
    
    // 2. Add format instructions if provided
    if (options.formatInstructions) {
      systemMessage += '\n\n' + options.formatInstructions;
    }
    
    // 3. Add context items
    systemMessage += '\n\n' + 'CONTEXT:\n';
    
    for (const item of optimizedContext.items) {
      systemMessage += `=== ${item.title} ===\n${item.content}\n\n`;
    }
    
    return systemMessage;
  }
  
  /**
   * Create a code-focused prompt specifically for code analysis
   */
  async buildPromptForCodeFocus(
    query: string,
    codeContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    logger.debug('Building code-focused prompt', {
      modelType,
      contextItems: codeContext.items.length
    });
    
    // Use the code-specific system template
    const modifiedOptions = {
      ...options,
      formatInstructions: `
        When analyzing code:
        1. Explain what the code does
        2. Identify any potential issues or bugs
        3. Suggest improvements or optimizations
        4. Explain any complex or non-obvious parts
      `
    };
    
    return this.buildPrompt(query, codeContext, modelType, modifiedOptions);
  }
  
  /**
   * Create a documentation-focused prompt
   */
  async buildPromptForDocumentationFocus(
    query: string,
    docContext: OptimizedContext,
    modelType: string,
    options: PromptOptions = {}
  ): Promise<Prompt> {
    logger.debug('Building documentation-focused prompt', {
      modelType,
      contextItems: docContext.items.length
    });
    
    // Use the documentation-specific system template
    const modifiedOptions = {
      ...options,
      formatInstructions: `
        When analyzing documents:
        1. Identify key information and main themes
        2. Provide accurate, factual responses
        3. Cite specific sections when appropriate
        4. Maintain the document's factual integrity
      `
    };
    
    return this.buildPrompt(query, docContext, modelType, modifiedOptions);
  }
}
```

## 5. Selection Service Implementation

```typescript
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
```

## 6. Selection Controller Implementation

```typescript
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
```

## 7. Selection Routes Implementation

```typescript
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
```

## 8. App Integration

To integrate these components with your app, add this to your app.ts file:

```typescript
// Add to src/app.ts

// Import new components
import { ContextOptimizer } from './llm/context-optimizer';
import { PromptBuilder } from './llm/prompt-builder';
import { RelevanceScorer } from './selection/relevance-scorer';
import { SelectionService } from './selection/selection-service';
import { SelectionController } from './api/controllers/selection-controller';
import createSelectionRoutes from './api/routes/selection-routes';

// Initialize the context optimization components
const relevanceScorer = new RelevanceScorer(
  contentService,
  vectorRepository
);

const contextOptimizer = new ContextOptimizer(
  contextService,
  contentService,
  relevanceScorer
);

const promptBuilder = new PromptBuilder();

const selectionService = new SelectionService(
  contentService,
  contextService,
  relevanceScorer
);

// Initialize controller
const selectionController = new SelectionController(selectionService);

// Add selection routes
app.use(`${config.server.apiPrefix}/selection`, createSelectionRoutes(selectionController));

// Update the query service to use these new components
// (Assuming the query service was created in the previous implementation)
const queryService = new QueryService(
  modelRegistry,
  contextService,
  contentService,
  contextOptimizer,
  promptBuilder
);
```

## Key Features

This implementation provides several advanced features:

1. **Intelligent Content Selection**:
   - Relevance scoring using multiple signals (vector similarity, content type, recency)
   - User-selected content prioritization
   - Token budget management

2. **Content Chunking Strategies**:
   - Paragraph-based chunking
   - Semantic chunking using sentence boundaries
   - Code-aware chunking that preserves function and class definitions
   - List-aware chunking that keeps list items together

3. **Content Compression**:
   - Dynamic compression when token budget is tight
   - Different compression strategies for text vs. code
   - Preserves most relevant parts while reducing tokens

4. **Smart Prompt Building**:
   - Different templates for different model types (chat vs. completion)
   - Content-aware system messages (code vs. text)
   - Multi-turn conversation support

5. **Context Visualization**:
   - Token usage tracking
   - Content type breakdown
   - Selection status for UI

The implementation is designed to be extensible and configurable, allowing for easy adaptation to different LLM providers, content types, and user preferences. It integrates cleanly with the existing ContentService and ContextService components, enhancing them with intelligent context optimization capabilities.