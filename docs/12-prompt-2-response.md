# LLM Connector Implementation

Based on your requirements and existing codebase, here's a comprehensive implementation of the LLM integration layer for ContextNexus.

## 1. LLM Connector Interface

```typescript
// src/llm/connectors/llm-connector.ts
import { ApplicationError } from '../../utils/errors';

/**
 * Common options for LLM requests
 */
export interface LLMOptions {
  // Common options
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  
  // Conversation options
  systemPrompt?: string;
  conversationHistory?: ConversationMessage[];
  
  // Model specific options
  modelSpecificOptions?: Record<string, any>;
}

/**
 * Model information
 */
export interface LLMModelInfo {
  id: string;
  provider: string;
  maxContextTokens: number;
  capabilities: string[]; // e.g., 'text', 'code', 'image-understanding'
  version?: string;
  description?: string;
}

/**
 * Conversation message types
 */
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Base interface for all LLM connectors
 */
export interface LLMConnector {
  /**
   * Send a prompt and get a response synchronously
   */
  sendPrompt(prompt: string, options?: LLMOptions): Promise<string>;
  
  /**
   * Send a prompt and receive response chunks via callback
   */
  streamResponse(
    prompt: string, 
    onChunk: (chunk: string) => void, 
    options?: LLMOptions
  ): Promise<void>;
  
  /**
   * Get information about the model
   */
  getModelInfo(): LLMModelInfo;
}

/**
 * Error thrown by LLM connectors
 */
export class LLMConnectorError extends ApplicationError {
  constructor(
    message: string,
    statusCode: number = 500,
    public provider?: string,
    public model?: string,
    originalError?: Error
  ) {
    super(message, statusCode, originalError);
    this.name = 'LLMConnectorError';
  }
}
```

## 2. OpenAI Connector Implementation

```typescript
// src/llm/connectors/openai-connector.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventSource } from 'eventsource';
import { 
  LLMConnector, 
  LLMOptions, 
  LLMModelInfo, 
  ConversationMessage,
  LLMConnectorError
} from './llm-connector';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

/**
 * OpenAI-specific model information
 */
interface OpenAIModelInfo extends LLMModelInfo {
  // OpenAI-specific fields
  supportsChatCompletions: boolean;
}

/**
 * OpenAI connector for interacting with OpenAI's API
 */
export class OpenAIConnector implements LLMConnector {
  private client: AxiosInstance;
  private modelInfo: OpenAIModelInfo;
  
  /**
   * Create a new OpenAI connector
   */
  constructor(
    modelId: string = 'gpt-3.5-turbo',
    private apiKey: string = config.ai.openaiApiKey,
    private baseURL: string = 'https://api.openai.com/v1'
  ) {
    if (!this.apiKey) {
      throw new LLMConnectorError(
        'OpenAI API key is required',
        401,
        'openai',
        modelId
      );
    }
    
    // Set up the axios client
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Model details based on ID
    this.modelInfo = this.getModelDetails(modelId);
    
    logger.debug('Initialized OpenAI connector', {
      model: modelId,
      supportsChatCompletions: this.modelInfo.supportsChatCompletions
    });
  }
  
  /**
   * Send a prompt and get a response synchronously
   */
  async sendPrompt(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      logger.debug('Sending prompt to OpenAI', {
        model: this.modelInfo.id,
        promptLength: prompt.length,
        options
      });
      
      let response;
      
      // Use chat completions or completions based on model support
      if (this.modelInfo.supportsChatCompletions) {
        const requestBody = this.buildChatRequest(prompt, options);
        response = await this.client.post('/chat/completions', requestBody);
      } else {
        const requestBody = this.buildCompletionRequest(prompt, options);
        response = await this.client.post('/completions', requestBody);
      }
      
      // Extract the response text
      let responseText = '';
      
      if (this.modelInfo.supportsChatCompletions) {
        responseText = response.data.choices[0]?.message?.content || '';
      } else {
        responseText = response.data.choices[0]?.text || '';
      }
      
      logger.debug('Received response from OpenAI', {
        model: this.modelInfo.id,
        responseLength: responseText.length
      });
      
      // Track usage if available
      if (response.data.usage) {
        logger.info('OpenAI usage stats', {
          model: this.modelInfo.id,
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        });
      }
      
      return responseText;
    } catch (error: any) {
      this.handleError(error, 'sendPrompt');
    }
  }
  
  /**
   * Send a prompt and receive response chunks via callback
   */
  async streamResponse(
    prompt: string, 
    onChunk: (chunk: string) => void,
    options: LLMOptions = {}
  ): Promise<void> {
    try {
      logger.debug('Streaming prompt to OpenAI', {
        model: this.modelInfo.id,
        promptLength: prompt.length,
        options
      });
      
      let requestBody;
      let endpoint;
      
      // Use chat completions or completions based on model support
      if (this.modelInfo.supportsChatCompletions) {
        requestBody = this.buildChatRequest(prompt, options, true);
        endpoint = '/chat/completions';
      } else {
        requestBody = this.buildCompletionRequest(prompt, options, true);
        endpoint = '/completions';
      }
      
      // Create request config
      const requestConfig: AxiosRequestConfig = {
        method: 'POST',
        url: `${this.baseURL}${endpoint}`,
        data: requestBody,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream'
      };
      
      // Make the streaming request
      const response = await axios(requestConfig);
      
      // Set up event source for SSE
      const eventSource = new EventSource(response.data);
      
      // Track usage
      let totalTokens = 0;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check for 'data: [DONE]' message that signals the end
          if (data === '[DONE]') {
            eventSource.close();
            logger.debug('Stream completed from OpenAI', {
              model: this.modelInfo.id,
              totalTokens
            });
            return;
          }
          
          let content = '';
          
          // Extract the text content based on model type
          if (this.modelInfo.supportsChatCompletions) {
            content = data.choices[0]?.delta?.content || '';
          } else {
            content = data.choices[0]?.text || '';
          }
          
          if (content) {
            onChunk(content);
            totalTokens++;
          }
        } catch (error) {
          logger.error('Error parsing streaming response', { error });
          eventSource.close();
        }
      };
      
      eventSource.onerror = (error) => {
        logger.error('Stream error from OpenAI', { error });
        eventSource.close();
        throw new LLMConnectorError(
          'Error in streaming response', 
          500, 
          'openai', 
          this.modelInfo.id, 
          error as Error
        );
      };
      
      // Return without waiting for all chunks (they'll arrive via callbacks)
    } catch (error: any) {
      this.handleError(error, 'streamResponse');
    }
  }
  
  /**
   * Get information about the model
   */
  getModelInfo(): LLMModelInfo {
    return this.modelInfo;
  }
  
  /**
   * Build a request body for chat completions
   */
  private buildChatRequest(
    prompt: string,
    options: LLMOptions,
    stream: boolean = false
  ): any {
    // Build messages array
    const messages: any[] = [];
    
    // Add system prompt if provided
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      messages.push(...options.conversationHistory);
    }
    
    // Add the current prompt as a user message
    messages.push({
      role: 'user',
      content: prompt
    });
    
    // Build the request body
    return {
      model: this.modelInfo.id,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stop: options.stopSequences,
      stream,
      ...(options.modelSpecificOptions || {})
    };
  }
  
  /**
   * Build a request body for text completions
   */
  private buildCompletionRequest(
    prompt: string,
    options: LLMOptions,
    stream: boolean = false
  ): any {
    // For older models that don't support chat completions
    return {
      model: this.modelInfo.id,
      prompt,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stop: options.stopSequences,
      stream,
      ...(options.modelSpecificOptions || {})
    };
  }
  
  /**
   * Get model details based on model ID
   */
  private getModelDetails(modelId: string): OpenAIModelInfo {
    // Model capabilities based on ID
    const modelMap: Record<string, OpenAIModelInfo> = {
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        maxContextTokens: 4096,
        supportsChatCompletions: true,
        capabilities: ['text', 'code'],
        version: '3.5',
        description: 'GPT-3.5 Turbo model optimized for chat'
      },
      'gpt-3.5-turbo-16k': {
        id: 'gpt-3.5-turbo-16k',
        provider: 'openai',
        maxContextTokens: 16384,
        supportsChatCompletions: true,
        capabilities: ['text', 'code'],
        version: '3.5',
        description: 'GPT-3.5 Turbo with 16k context'
      },
      'gpt-4': {
        id: 'gpt-4',
        provider: 'openai',
        maxContextTokens: 8192,
        supportsChatCompletions: true,
        capabilities: ['text', 'code', 'reasoning'],
        version: '4.0',
        description: 'GPT-4 base model'
      },
      'gpt-4-32k': {
        id: 'gpt-4-32k',
        provider: 'openai',
        maxContextTokens: 32768,
        supportsChatCompletions: true,
        capabilities: ['text', 'code', 'reasoning'],
        version: '4.0',
        description: 'GPT-4 with 32k context'
      },
      'gpt-4-turbo': {
        id: 'gpt-4-turbo',
        provider: 'openai',
        maxContextTokens: 128000,
        supportsChatCompletions: true,
        capabilities: ['text', 'code', 'reasoning', 'image-understanding'],
        version: '4.0',
        description: 'GPT-4 Turbo with larger context and image capabilities'
      },
      'text-davinci-003': {
        id: 'text-davinci-003',
        provider: 'openai',
        maxContextTokens: 4097,
        supportsChatCompletions: false,
        capabilities: ['text', 'code'],
        version: '3.0',
        description: 'Legacy GPT-3 Davinci model'
      }
    };
    
    // Default to GPT-3.5 Turbo if the model ID is not recognized
    return modelMap[modelId] || {
      id: modelId,
      provider: 'openai',
      maxContextTokens: 4096,
      supportsChatCompletions: modelId.includes('gpt-3.5') || modelId.includes('gpt-4'),
      capabilities: ['text'],
      description: 'Unknown OpenAI model'
    };
  }
  
  /**
   * Handle errors from the OpenAI API
   */
  private handleError(error: any, operation: string): never {
    // Log the error
    logger.error(`OpenAI ${operation} error`, {
      model: this.modelInfo.id,
      error: error.message,
      response: error.response?.data
    });
    
    // Extract error details
    let message = 'An error occurred while communicating with OpenAI';
    let statusCode = 500;
    
    if (error.response) {
      const data = error.response.data;
      message = data.error?.message || message;
      statusCode = error.response.status;
      
      // Handle specific error types
      if (statusCode === 401) {
        message = 'Invalid OpenAI API key';
      } else if (statusCode === 429) {
        message = 'OpenAI API rate limit exceeded';
      } else if (statusCode === 500) {
        message = 'OpenAI API server error';
      }
    }
    
    // Throw a standardized error
    throw new LLMConnectorError(
      message,
      statusCode,
      'openai',
      this.modelInfo.id,
      error
    );
  }
}
```

## 3. Model Registry Implementation

```typescript
// src/llm/model-registry.ts
import { LLMConnector, LLMModelInfo } from './connectors/llm-connector';
import { OpenAIConnector } from './connectors/openai-connector';
import { config } from '../config/app-config';
import logger from '../utils/logger';
import { ApplicationError } from '../utils/errors';

/**
 * Registry options
 */
export interface ModelRegistryOptions {
  defaultModelId?: string;
  metricsEnabled?: boolean;
  fallbackEnabled?: boolean;
}

/**
 * Registry for managing LLM models
 */
export class ModelRegistry {
  private models: Map<string, LLMConnector> = new Map();
  private defaultModelId: string;
  private metricsEnabled: boolean;
  private fallbackEnabled: boolean;
  private usageMetrics: Map<string, { 
    requests: number, 
    failures: number, 
    totalTokens: number,
    responseTime: number[]
  }> = new Map();
  
  /**
   * Create a new model registry
   */
  constructor(options: ModelRegistryOptions = {}) {
    this.defaultModelId = options.defaultModelId || 'gpt-3.5-turbo';
    this.metricsEnabled = options.metricsEnabled ?? true;
    this.fallbackEnabled = options.fallbackEnabled ?? true;
    
    // Initialize with OpenAI default model if API key is available
    if (config.ai.openaiApiKey) {
      try {
        this.registerOpenAIModels();
      } catch (error) {
        logger.warn('Failed to register default OpenAI models', { error });
      }
    }
  }
  
  /**
   * Register a model connector
   */
  registerModel(modelId: string, connector: LLMConnector): void {
    this.models.set(modelId, connector);
    
    if (this.metricsEnabled) {
      this.usageMetrics.set(modelId, {
        requests: 0,
        failures: 0,
        totalTokens: 0,
        responseTime: []
      });
    }
    
    logger.info('Registered model connector', {
      modelId,
      provider: connector.getModelInfo().provider
    });
  }
  
  /**
   * Register multiple OpenAI models
   */
  registerOpenAIModels(): void {
    const apiKey = config.ai.openaiApiKey;
    
    if (!apiKey) {
      logger.warn('Cannot register OpenAI models - API key not provided');
      return;
    }
    
    // Register common models
    const models = [
      'gpt-3.5-turbo',
      'gpt-4'
    ];
    
    for (const modelId of models) {
      this.registerModel(
        modelId,
        new OpenAIConnector(modelId, apiKey)
      );
    }
  }
  
  /**
   * Get a model connector by ID
   */
  getModel(modelId: string): LLMConnector {
    const connector = this.models.get(modelId);
    
    if (!connector) {
      throw new ApplicationError(`Model ${modelId} not found in registry`, 404);
    }
    
    return connector;
  }
  
  /**
   * Get the default model connector
   */
  getDefaultModel(): LLMConnector {
    const defaultModel = this.models.get(this.defaultModelId);
    
    if (!defaultModel) {
      // If default model is not available, return any available model
      const firstModel = this.models.values().next().value;
      
      if (!firstModel) {
        throw new ApplicationError('No models available in registry', 500);
      }
      
      logger.warn('Default model not available, using alternative', {
        requestedModel: this.defaultModelId,
        usingModel: firstModel.getModelInfo().id
      });
      
      return firstModel;
    }
    
    return defaultModel;
  }
  
  /**
   * List all available models
   */
  listAvailableModels(): LLMModelInfo[] {
    return Array.from(this.models.values()).map(connector => connector.getModelInfo());
  }
  
  /**
   * Set the default model ID
   */
  setDefaultModel(modelId: string): void {
    if (!this.models.has(modelId)) {
      throw new ApplicationError(`Cannot set default model: ${modelId} not found in registry`, 404);
    }
    
    this.defaultModelId = modelId;
    logger.info('Set default model', { modelId });
  }
  
  /**
   * Track usage metrics for a model
   */
  trackUsage(modelId: string, tokens: number, responseTimeMs: number, success: boolean = true): void {
    if (!this.metricsEnabled) {
      return;
    }
    
    const metrics = this.usageMetrics.get(modelId);
    
    if (metrics) {
      metrics.requests++;
      metrics.totalTokens += tokens;
      metrics.responseTime.push(responseTimeMs);
      
      if (!success) {
        metrics.failures++;
      }
      
      // Trim response time array if it gets too long
      if (metrics.responseTime.length > 100) {
        metrics.responseTime = metrics.responseTime.slice(-100);
      }
    }
  }
  
  /**
   * Get usage metrics for all models
   */
  getUsageMetrics(): Record<string, any> {
    if (!this.metricsEnabled) {
      return {};
    }
    
    const result: Record<string, any> = {};
    
    for (const [modelId, metrics] of this.usageMetrics.entries()) {
      // Calculate average response time
      const avgResponseTime = metrics.responseTime.length > 0
        ? metrics.responseTime.reduce((sum, time) => sum + time, 0) / metrics.responseTime.length
        : 0;
      
      result[modelId] = {
        requests: metrics.requests,
        failures: metrics.failures,
        successRate: metrics.requests > 0 
          ? ((metrics.requests - metrics.failures) / metrics.requests) * 100 
          : 100,
        totalTokens: metrics.totalTokens,
        avgResponseTimeMs: Math.round(avgResponseTime)
      };
    }
    
    return result;
  }
  
  /**
   * Get a fallback model when the primary model fails
   */
  getFallbackModel(primaryModelId: string): LLMConnector | null {
    if (!this.fallbackEnabled) {
      return null;
    }
    
    // Simple fallback strategy: use default model if different, otherwise use any other model
    if (primaryModelId !== this.defaultModelId) {
      return this.getDefaultModel();
    }
    
    // Find any other model
    for (const [modelId, connector] of this.models.entries()) {
      if (modelId !== primaryModelId) {
        logger.info('Using fallback model', {
          primaryModel: primaryModelId,
          fallbackModel: modelId
        });
        return connector;
      }
    }
    
    // No fallback available
    return null;
  }
  
  /**
   * Clear usage metrics
   */
  clearMetrics(): void {
    for (const metrics of this.usageMetrics.values()) {
      metrics.requests = 0;
      metrics.failures = 0;
      metrics.totalTokens = 0;
      metrics.responseTime = [];
    }
    
    logger.info('Cleared usage metrics');
  }
}
```

## 4. Query Service Implementation

```typescript
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
```

## 5. Query Controller and Routes

```typescript
// src/api/controllers/query-controller.ts
import { Request, Response } from 'express';
import { QueryService, QueryOptions } from '../../services/query-service';
import { ApplicationError } from '../../utils/errors';
import logger from '../../utils/logger';

export class QueryController {
  constructor(private queryService: QueryService) {}
  
  /**
   * Process a query
   */
  async processQuery(req: Request, res: Response): Promise<void> {
    try {
      const { query, contextId, options } = req.body;
      
      // Validate input
      if (!query) {
        throw new ApplicationError('Query is required', 400);
      }
      
      if (!contextId) {
        throw new ApplicationError('Context ID is required', 400);
      }
      
      // Check if streaming is requested
      const queryOptions: QueryOptions = options || {};
      
      if (queryOptions.stream) {
        // Set up streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send a start event
        res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
        
        // Process streaming query
        await this.queryService.streamQueryResponse(
          query,
          contextId,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          },
          queryOptions
        );
        
        // Send an end event
        res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
        res.end();
      } else {
        // Process regular query
        const response = await this.queryService.processQuery(
          query,
          contextId,
          queryOptions
        );
        
        res.json(response);
      }
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Get available models
   */
  getAvailableModels(req: Request, res: Response): void {
    try {
      // This would typically come from the model registry
      // For now, we'll return a simple list
      res.json([
        {
          id: 'gpt-3.5-turbo',
          provider: 'openai',
          maxContextTokens: 4096,
          capabilities: ['text', 'code']
        },
        {
          id: 'gpt-4',
          provider: 'openai',
          maxContextTokens: 8192,
          capabilities: ['text', 'code', 'reasoning']
        }
      ]);
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
    
    logger.error('Query controller error', { error: error.message });
    
    res.status(500).json({
      error: 'An unexpected error occurred',
      statusCode: 500
    });
  }
}
```

```typescript
// src/api/routes/query-routes.ts
import express from 'express';
import { QueryController } from '../controllers/query-controller';
import { authMiddleware } from '../middlewares/auth';

const createQueryRoutes = (queryController: QueryController) => {
  const router = express.Router();
  
  // All query routes require authentication
  router.use(authMiddleware());
  
  // Process a query
  router.post('/', queryController.processQuery.bind(queryController));
  
  // Get available models
  router.get('/models', queryController.getAvailableModels.bind(queryController));
  
  return router;
};

export default createQueryRoutes;
```

## 6. Token Counter Utility

```typescript
// src/utils/token-counter.ts
import { encode } from 'gpt-tokenizer';

/**
 * Count the number of tokens in a text
 */
export async function countTokens(text: string): Promise<number> {
  try {
    // Use the GPT tokenizer
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    // Fallback to a simple approximation
    return Math.ceil(text.length / 4);
  }
}
```

## 7. App Integration

To integrate the LLM connector layer with your existing app, add this to your app.ts file:

```typescript
// Add to src/app.ts

// Import new components
import { OpenAIConnector } from './llm/connectors/openai-connector';
import { ModelRegistry } from './llm/model-registry';
import { QueryService } from './services/query-service';
import { QueryController } from './api/controllers/query-controller';
import createQueryRoutes from './api/routes/query-routes';

// Initialize repositories and services (assuming these already exist)
const contentService = new ContentService(
  contentRepository, 
  tagRepository, 
  objectStorageRepository, 
  vectorRepository,
  graphRepository
);

const contextService = new ContextService(
  contextRepository,
  contentRepository
);

// Initialize LLM components
const modelRegistry = new ModelRegistry({
  defaultModelId: 'gpt-3.5-turbo',
  metricsEnabled: true,
  fallbackEnabled: true
});

// Register OpenAI models if API key is available
if (config.ai.openaiApiKey) {
  modelRegistry.registerOpenAIModels();
} else {
  logger.warn('OpenAI API key not found, LLM functionality will be limited');
}

// Initialize query service
const queryService = new QueryService(
  modelRegistry,
  contextService,
  contentService
);

// Initialize query controller
const queryController = new QueryController(queryService);

// Add query routes
app.use(`${config.server.apiPrefix}/queries`, createQueryRoutes(queryController));
```

## 8. Required Packages

You'll need to install these additional packages:

```bash
npm install axios eventsource gpt-tokenizer
npm install --save-dev @types/eventsource
```

## Implementation Highlights

This LLM connector implementation includes several important features:

1. **Abstraction Layer**:
   - Clean abstraction between different LLM providers
   - Common interface for both synchronous and streaming responses
   - Provider-specific options support

2. **Robust Error Handling**:
   - Standardized error types
   - Detailed logging for debugging
   - Fallback mechanisms when models fail

3. **Performance Monitoring**:
   - Token usage tracking
   - Response time metrics
   - Success/failure rates

4. **Context Management**:
   - Token budget allocation between context and response
   - Context selection based on relevance
   - Efficient prompt construction

5. **Streaming Support**:
   - Server-sent events implementation
   - Chunked response handling
   - Event-based communication

This implementation provides a solid foundation for interacting with various LLM providers while maintaining a consistent API for your application. The modular design allows for easily adding support for additional LLM providers in the future.