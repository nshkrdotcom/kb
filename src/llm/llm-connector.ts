// src/llm/llm-connector.ts
 import logger from '../utils/logger';
 
 /**
  * Options for LLM requests
  */
 export interface LLMRequestOptions {
   model?: string;
   maxTokens?: number;
   temperature?: number;
   topP?: number;
   presencePenalty?: number;
   frequencyPenalty?: number;
   stop?: string[];
   stream?: boolean;
   systemPrompt?: string;
   [key: string]: any; // Allow additional provider-specific options
 }
 
 /**
  * Response from an LLM
  */
 export interface LLMResponse {
   content: string;
   model: string;
   promptTokens: number;
   completionTokens: number;
   totalTokens: number;
   finishReason: string;
   metadata?: Record<string, any>;
 }
 
 /**
  * Base interface for LLM connections
  */
 export interface LLMConnector {
   /**
    * Send a prompt to the LLM and get a response
    */
   sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
   
   /**
    * Stream a response from the LLM
    */
   streamResponse(
     prompt: string, 
     onChunk: (chunk: string, done: boolean) => void, 
     options?: LLMRequestOptions
   ): Promise<void>;
   
   /**
    * Get the name of the LLM provider
    */
   getProviderName(): string;
   
   /**
    * Get the available models for this provider
    */
   getAvailableModels(): Promise<string[]>;
   
   /**
    * Get the default model for this provider
    */
   getDefaultModel(): string;
 }
 
 /**
  * Abstract base class for LLM connectors
  */
 export abstract class BaseLLMConnector implements LLMConnector {
   protected defaultModel: string;
   protected defaultOptions: Partial<LLMRequestOptions>;
   
   constructor(
     protected readonly providerName: string,
     defaultModel: string,
     defaultOptions: Partial<LLMRequestOptions> = {}
   ) {
     this.defaultModel = defaultModel;
     this.defaultOptions = defaultOptions;
   }
   
   abstract sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
   
   abstract streamResponse(
     prompt: string, 
     onChunk: (chunk: string, done: boolean) => void, 
     options?: LLMRequestOptions
   ): Promise<void>;
   
   getProviderName(): string {
     return this.providerName;
   }
   
   abstract getAvailableModels(): Promise<string[]>;
   
   getDefaultModel(): string {
     return this.defaultModel;
   }
   
   /**
    * Merge provided options with defaults
    */
   protected mergeOptions(options: LLMRequestOptions = {}): LLMRequestOptions {
     return {
       ...this.defaultOptions,
       ...options,
       model: options.model || this.defaultModel
     };
   }
   
   /**
    * Log details about an LLM request
    */
   protected logRequest(prompt: string, options: LLMRequestOptions): void {
     logger.debug('LLM request', {
       provider: this.providerName,
       model: options.model || this.defaultModel,
       promptLength: prompt.length,
       temperature: options.temperature,
       maxTokens: options.maxTokens
     });
   }
   
   /**
    * Log details about an LLM response
    */
   protected logResponse(response: LLMResponse): void {
     logger.debug('LLM response', {
       provider: this.providerName,
       model: response.model,
       promptTokens: response.promptTokens,
       completionTokens: response.completionTokens,
       totalTokens: response.totalTokens,
       finishReason: response.finishReason
     });
   }
 }



//  // src/llm/connectors/llm-connector.ts
// import { ApplicationError } from '../../utils/errors';

// /**
//  * Common options for LLM requests
//  */
// export interface LLMOptions {
//   // Common options
//   temperature?: number;
//   maxTokens?: number;
//   stopSequences?: string[];
//   topP?: number;
//   frequencyPenalty?: number;
//   presencePenalty?: number;
  
//   // Conversation options
//   systemPrompt?: string;
//   conversationHistory?: ConversationMessage[];
  
//   // Model specific options
//   modelSpecificOptions?: Record<string, any>;
// }

// /**
//  * Model information
//  */
// export interface LLMModelInfo {
//   id: string;
//   provider: string;
//   maxContextTokens: number;
//   capabilities: string[]; // e.g., 'text', 'code', 'image-understanding'
//   version?: string;
//   description?: string;
// }

// /**
//  * Conversation message types
//  */
// export interface ConversationMessage {
//   role: 'system' | 'user' | 'assistant';
//   content: string;
// }

// /**
//  * Base interface for all LLM connectors
//  */
// export interface LLMConnector {
//   /**
//    * Send a prompt and get a response synchronously
//    */
//   sendPrompt(prompt: string, options?: LLMOptions): Promise<string>;
  
//   /**
//    * Send a prompt and receive response chunks via callback
//    */
//   streamResponse(
//     prompt: string, 
//     onChunk: (chunk: string) => void, 
//     options?: LLMOptions
//   ): Promise<void>;
  
//   /**
//    * Get information about the model
//    */
//   getModelInfo(): LLMModelInfo;
// }

// /**
//  * Error thrown by LLM connectors
//  */
// export class LLMConnectorError extends ApplicationError {
//   constructor(
//     message: string,
//     statusCode: number = 500,
//     public provider?: string,
//     public model?: string,
//     originalError?: Error
//   ) {
//     super(message, statusCode, originalError);
//     this.name = 'LLMConnectorError';
//   }
// }