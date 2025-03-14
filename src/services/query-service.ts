// src/services/query-service.ts
import { v4 as uuidv4 } from 'uuid';
import { ModelRegistry } from '../llm/model-registry';
import { LLMConnector, LLMOptions, ConversationMessage } from '../llm/connectors/llm-connector';
import { ContextService } from './context-service';
import { ContentService } from './content-service';
import { Context, ContentItem, User } from '../types/core';
import logger from '../utils/logger';
import { ApplicationError } from '../utils/errors';
import { countTokens } from '../utils/token-counter';

/**
 * Query options
 */
export interface QueryOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  conversationId?: string;
  includeMetadata?: boolean;
  stream?: boolean;
  llmOptions?: LLMOptions;
}

/**
 * Query response
 */
export interface QueryResponse {
  id: string;
  query: string;
  response: string;
  contextId: string;
  modelId: string;
  conversationId?: string;
  metadata?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    responseTimeMs?: number;
    contextItems?: Array<{
      id: string;
      title: string;
      relevance: number;
    }>;
  };
}

/**
 * Service for processing queries using LLMs and context
 */
export class QueryService {
  constructor(
    private modelRegistry: ModelRegistry,
    private contextService: ContextService,
    private contentService: ContentService
  ) {}
  
  /**
   * Process a query with context and return a response
   */
  async processQuery(
    query: string, 
    contextId: string, 
    options: QueryOptions = {}
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    logger.info('Processing query', { query, contextId, options });
    
    try {
      // Validate input
      if (!query) {
        throw new ApplicationError('Query is required', 400);
      }
      
      // 1. Get context
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // 2. Get appropriate LLM connector
      const connector = options.modelId 
        ? this.modelRegistry.getModel(options.modelId)
        : this.modelRegistry.getDefaultModel();
      
      const modelInfo = connector.getModelInfo();
      
      // 3. Build prompt with context
      const { prompt, contextItems, promptTokens } = await this.buildPromptWithContext(
        query, 
        context, 
        modelInfo.maxContextTokens,
        options
      );
      
      // 4. Set up LLM options
      const llmOptions: LLMOptions = {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        conversationHistory: this.getConversationHistory(options.conversationId, options),
        ...options.llmOptions
      };
      
      // 5. Send prompt to LLM
      logger.debug('Sending prompt to LLM', { 
        modelId: modelInfo.id, 
        promptTokens,
        options: llmOptions
      });
      
      const response = await connector.sendPrompt(prompt, llmOptions);
      
      // 6. Calculate response metrics
      const responseTimeMs = Date.now() - startTime;
      const completionTokens = await countTokens(response);
      const totalTokens = promptTokens + completionTokens;
      
      // 7. Track usage
      this.modelRegistry.trackUsage(
        modelInfo.id,
        totalTokens,
        responseTimeMs,
        true
      );
      
      // 8. Create response object
      const queryResponse: QueryResponse = {
        id: uuidv4(),
        query,
        response,
        contextId,
        modelId: modelInfo.id,
        conversationId: options.conversationId
      };
      
      // Add metadata if requested
      if (options.includeMetadata) {
        queryResponse.metadata = {
          promptTokens,
          completionTokens,
          totalTokens,
          responseTimeMs,
          contextItems: contextItems.map(item => ({
            id: item.id,
            title: item.title,
            relevance: item.relevance
          }))
        };
      }
      
      // Log success
      logger.info('Query processed successfully', { 
        queryId: queryResponse.id,
        modelId: modelInfo.id,
        responseTimeMs,
        totalTokens
      });
      
      return queryResponse;
    } catch (error: any) {
      logger.error('Error processing query', { 
        query, 
        contextId, 
        error: error.message
      });
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to process query', 500, error);
    }
  }
  
  /**
   * Process a query with streaming response
   */
  async streamQueryResponse(
    query: string, 
    contextId: string, 
    onChunk: (chunk: string) => void, 
    options: QueryOptions = {}
  ): Promise<void> {
    const startTime = Date.now();
    logger.info('Processing streaming query', { query, contextId, options });
    
    try {
      // Validate input
      if (!query) {
        throw new ApplicationError('Query is required', 400);
      }
      
      // 1. Get context
      const context = await this.contextService.getContextById(contextId);
      if (!context) {
        throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
      }
      
      // 2. Get appropriate LLM connector
      const connector = options.modelId 
        ? this.modelRegistry.getModel(options.modelId)
        : this.modelRegistry.getDefaultModel();
      
      const modelInfo = connector.getModelInfo();
      
      // 3. Build prompt with context
      const { prompt, contextItems, promptTokens } = await this.buildPromptWithContext(
        query, 
        context, 
        modelInfo.maxContextTokens,
        options
      );
      
      // 4. Set up LLM options
      const llmOptions: LLMOptions = {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        conversationHistory: this.getConversationHistory(options.conversationId, options),
        ...options.llmOptions
      };
      
      // 5. Track token count for response
      let responseTokens = 0;
      const tokenCounter = (chunk: string) => {
        responseTokens += chunk.split(/\s+/).length; // Rough approximation
        onChunk(chunk);
      };
      
      // 6. Send prompt to LLM with streaming
      logger.debug('Sending streaming prompt to LLM', { 
        modelId: modelInfo.id, 
        promptTokens 
      });
      
      await connector.streamResponse(prompt, tokenCounter, llmOptions);
      
      // 7. Calculate response metrics
      const responseTimeMs = Date.now() - startTime;
      const totalTokens = promptTokens + responseTokens;
      
      // 8. Track usage
      this.modelRegistry.trackUsage(
        modelInfo.id,
        totalTokens,
        responseTimeMs,
        true
      );
      
      // Log success
      logger.info('Streaming query processed successfully', { 
        modelId: modelInfo.id,
        responseTimeMs,
        totalTokens
      });
    } catch (error: any) {
      logger.error('Error processing streaming query', { 
        query, 
        contextId, 
        error: error.message
      });
      
      // Try to notify the client with an error message
      try {
        onChunk(`\n\nError: ${error.message}`);
      } catch (e) {
        // Ignore error in error handling
      }
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to process streaming query', 500, error);
    }
  }
  
  /**
   * Build a prompt using context content
   */
  private async buildPromptWithContext(
    query: string, 
    context: Context,
    maxContextTokens: number,
    options: QueryOptions = {}
  ): Promise<{ prompt: string; contextItems: Array<ContentItem & { relevance: number }>; promptTokens: number }> {
    // Get content items from context
    const contextItems = await this.contextService.getContextContent(context.id);
    
    // Sort context items by relevance to the query
    // In a real implementation, this would use vector similarity, order, and other factors
    // For this implementation, we'll use a simple relevance score based on order
    const scoredContextItems = contextItems.map((item, index) => ({
      ...item,
      relevance: 1 - (index / contextItems.length)
    }));
    
    // Sort by relevance (descending)
    scoredContextItems.sort((a, b) => b.relevance - a.relevance);
    
    // Calculate token budget for context
    // Reserve tokens for the query, system prompt, and response
    const systemPromptTokens = options.systemPrompt 
      ? await countTokens(options.systemPrompt) 
      : 0;
    const queryTokens = await countTokens(query);
    const reservedTokens = queryTokens + systemPromptTokens + 200; // Extra padding
    const maxResponseTokens = options.maxTokens || 1000;
    
    // Calculate available tokens for context
    const contextTokenBudget = maxContextTokens - reservedTokens - maxResponseTokens;
    
    if (contextTokenBudget <= 0) {
      logger.warn('Insufficient token budget for context', {
        maxContextTokens,
        reservedTokens,
        maxResponseTokens
      });
      
      // Return minimal prompt without context
      return {
        prompt: query,
        contextItems: [],
        promptTokens: queryTokens
      };
    }
    
    // Load content for context items until we hit the token budget
    let contextContent = '';
    let usedContextItems = [];
    let usedTokens = 0;
    
    for (const item of scoredContextItems) {
      // Load full content if not already loaded
      const contentWithData = item.content 
        ? item 
        : await this.contentService.getContentWithData(item.id);
      
      let contentText = '';
      
      // Extract text content based on content type
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
      
      // Count tokens for this content
      const contentTokens = await countTokens(contentText);
      
      // Check if we can include this item
      if (usedTokens + contentTokens <= contextTokenBudget) {
        // Format the content
        const formattedContent = `=== ${contentWithData.title} ===\n${contentText}\n\n`;
        contextContent += formattedContent;
        usedTokens += contentTokens;
        usedContextItems.push({ ...contentWithData, relevance: item.relevance });
      } else {
        // Skip this item if it's too large
        logger.debug('Skipping context item due to token budget', {
          itemId: item.id,
          itemTokens: contentTokens,
          remainingBudget: contextTokenBudget - usedTokens
        });
      }
    }
    
    // Build the final prompt
    let prompt = '';
    
    if (contextContent) {
      prompt = `I'm going to provide you with context information, followed by a question. Please answer the question based on the context provided.\n\nCONTEXT:\n${contextContent}\nQUESTION: ${query}`;
    } else {
      prompt = query;
    }
    
    const totalPromptTokens = await countTokens(prompt);
    
    logger.debug('Built prompt with context', {
      contextItems: usedContextItems.length,
      contextTokens: usedTokens,
      totalPromptTokens
    });
    
    return {
      prompt,
      contextItems: usedContextItems,
      promptTokens: totalPromptTokens
    };
  }
  
  /**
   * Get conversation history for the given conversation ID
   */
  private getConversationHistory(
    conversationId?: string,
    options?: QueryOptions
  ): ConversationMessage[] | undefined {
    // In a real implementation, this would retrieve the conversation history from a database
    // For this implementation, we'll use the conversation history from options if provided
    if (options?.llmOptions?.conversationHistory) {
      return options.llmOptions.conversationHistory;
    }
    
    // No conversation history available
    return undefined;
  }
}