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