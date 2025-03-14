// // src/llm/openai-connector.ts
//  import { OpenAI } from 'openai';
//  import { BaseLLMConnector, LLMRequestOptions, LLMResponse } from './llm-connector';
//  import { config } from '../config/app-config';
//  import logger from '../utils/logger';
 
//  /**
//   * OpenAI-specific request options
//   */
//  export interface OpenAIRequestOptions extends LLMRequestOptions {
//    responseFormat?: { type: 'text' | 'json_object' };
//    seed?: number;
//    tools?: any[];
//    toolChoice?: any;
//  }
 
//  /**
//   * Implementation of LLMConnector for OpenAI
//   */
//  export class OpenAIConnector extends BaseLLMConnector {
//    private client: OpenAI;
//    private availableModels: string[] | null = null;
   
//    constructor() {
//      super(
//        'OpenAI',
//        config.ai.openaiDefaultModel || 'gpt-4o', // Default model
//        {
//          temperature: 0.7,
//          maxTokens: 2000
//        }
//      );
     
//      this.client = new OpenAI({
//        apiKey: config.ai.openaiApiKey
//      });
     
//      // Cache available models
//      this.loadAvailableModels();
//    }
   
//    /**
//     * Send a prompt to OpenAI and get a response
//     */
//    async sendPrompt(prompt: string, options: OpenAIRequestOptions = {}): Promise<LLMResponse> {
//      const mergedOptions = this.mergeOptions(options);
//      this.logRequest(prompt, mergedOptions);
     
//      try {
//        const messages = this.buildMessages(prompt, mergedOptions.systemPrompt);
       
//        const response = await this.client.chat.completions.create({
//          model: mergedOptions.model || this.defaultModel,
//          messages,
//          max_tokens: mergedOptions.maxTokens,
//          temperature: mergedOptions.temperature,
//          top_p: mergedOptions.topP,
//          presence_penalty: mergedOptions.presencePenalty,
//          frequency_penalty: mergedOptions.frequencyPenalty,
//          stop: mergedOptions.stop,
//          stream: false,
//          response_format: mergedOptions.responseFormat,
//          seed: mergedOptions.seed,
//          tools: mergedOptions.tools,
//          tool_choice: mergedOptions.toolChoice
//        });
       
//        const content = response.choices[0]?.message?.content || '';
       
//        const result: LLMResponse = {
//          content,
//          model: response.model,
//          promptTokens: response.usage?.prompt_tokens || 0,
//          completionTokens: response.usage?.completion_tokens || 0,
//          totalTokens: response.usage?.total_tokens || 0,
//          finishReason: response.choices[0]?.finish_reason || 'unknown',
//          metadata: {
//            id: response.id,
//            created: response.created,
//            systemFingerprint: response.system_fingerprint,
//            toolCalls: response.choices[0]?.message?.tool_calls
//          }
//        };
       
//        this.logResponse(result);
//        return result;
//      } catch (error: any) {
//        logger.error('OpenAI request failed', { 
//          error: error.message,
//          model: mergedOptions.model,
//          promptLength: prompt.length
//        });
//        throw error;
//      }
//    }
   
//    /**
//     * Stream a response from OpenAI
//     */
//    async streamResponse(
//      prompt: string, 
//      onChunk: (chunk: string, done: boolean) => void, 
//      options: OpenAIRequestOptions = {}
//    ): Promise<void> {
//      const mergedOptions = this.mergeOptions(options);
//      this.logRequest(prompt, mergedOptions);
     
//      try {
//        const messages = this.buildMessages(prompt, mergedOptions.systemPrompt);
       
//        const stream = await this.client.chat.completions.create({
//          model: mergedOptions.model || this.defaultModel,
//          messages,
//          max_tokens: mergedOptions.maxTokens,
//          temperature: mergedOptions.temperature,
//          top_p: mergedOptions.topP,
//          presence_penalty: mergedOptions.presencePenalty,
//          frequency_penalty: mergedOptions.frequencyPenalty,
//          stop: mergedOptions.stop,
//          stream: true
//        });
       
//        let content = '';
//        let promptTokens = 0;
//        let completionTokens = 0;
       
//        for await (const chunk of stream) {
//          const partialContent = chunk.choices[0]?.delta?.content || '';
//          content += partialContent;
         
//          // Estimate token usage (rough approximation)
//          if (chunk.usage) {
//            promptTokens = chunk.usage.prompt_tokens || 0;
//            completionTokens = chunk.usage.completion_tokens || 0;
//          } else {
//            // Rough approximation of tokens: ~4 chars per token
//            completionTokens = Math.ceil(content.length / 4);
//          }
         
//          const done = chunk.choices[0]?.finish_reason !== null;
//          onChunk(partialContent, done);
//        }
       
//        logger.debug('OpenAI stream completed', {
//          model: mergedOptions.model,
//          promptTokens,
//          completionTokens,
//          totalTokens: promptTokens + completionTokens
//        });
//      } catch (error: any) {
//        logger.error('OpenAI stream request failed', { 
//          error: error.message,
//          model: mergedOptions.model,
//          promptLength: prompt.length
//        });
//        throw error;
//      }
//    }
   
//    /**
//     * Get available models from OpenAI
//     */
//    async getAvailableModels(): Promise<string[]> {
//      if (this.availableModels) {
//        return this.availableModels;
//      }
     
//      try {
//        const response = await this.client.models.list();
//        this.availableModels = response.data
//          .map(model => model.id)
//          .filter(id => id.startsWith('gpt-'));
       
//        return this.availableModels;
//      } catch (error: any) {
//        logger.error('Failed to fetch OpenAI models', { error: error.message });
//        return ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
//      }
//    }
   
//    /**
//     * Load available models (called on initialization)
//     */
//    private async loadAvailableModels(): Promise<void> {
//      try {
//        await this.getAvailableModels();
//        logger.info('OpenAI models loaded', { count: this.availableModels?.length });
//      } catch (error) {
//        logger.warn('Failed to load OpenAI models, using defaults');
//      }
//    }
   
//    /**
//     * Build OpenAI message format from prompt and system prompt
//     */
//    private buildMessages(prompt: string, systemPrompt?: string): any[] {
//      const messages = [];
     
//      if (systemPrompt) {
//        messages.push({
//          role: 'system',
//          content: systemPrompt
//        });
//      }
     
//      messages.push({
//        role: 'user',
//        content: prompt
//      });
     
//      return messages;
//    }
//  }

















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