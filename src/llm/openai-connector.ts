// src/llm/openai-connector.ts
 import { OpenAI } from 'openai';
 import { BaseLLMConnector, LLMRequestOptions, LLMResponse } from './llm-connector';
 import { config } from '../config/app-config';
 import logger from '../utils/logger';
 
 /**
  * OpenAI-specific request options
  */
 export interface OpenAIRequestOptions extends LLMRequestOptions {
   responseFormat?: { type: 'text' | 'json_object' };
   seed?: number;
   tools?: any[];
   toolChoice?: any;
 }
 
 /**
  * Implementation of LLMConnector for OpenAI
  */
 export class OpenAIConnector extends BaseLLMConnector {
   private client: OpenAI;
   private availableModels: string[] | null = null;
   
   constructor() {
     super(
       'OpenAI',
       config.ai.openaiDefaultModel || 'gpt-4o', // Default model
       {
         temperature: 0.7,
         maxTokens: 2000
       }
     );
     
     this.client = new OpenAI({
       apiKey: config.ai.openaiApiKey
     });
     
     // Cache available models
     this.loadAvailableModels();
   }
   
   /**
    * Send a prompt to OpenAI and get a response
    */
   async sendPrompt(prompt: string, options: OpenAIRequestOptions = {}): Promise<LLMResponse> {
     const mergedOptions = this.mergeOptions(options);
     this.logRequest(prompt, mergedOptions);
     
     try {
       const messages = this.buildMessages(prompt, mergedOptions.systemPrompt);
       
       const response = await this.client.chat.completions.create({
         model: mergedOptions.model || this.defaultModel,
         messages,
         max_tokens: mergedOptions.maxTokens,
         temperature: mergedOptions.temperature,
         top_p: mergedOptions.topP,
         presence_penalty: mergedOptions.presencePenalty,
         frequency_penalty: mergedOptions.frequencyPenalty,
         stop: mergedOptions.stop,
         stream: false,
         response_format: mergedOptions.responseFormat,
         seed: mergedOptions.seed,
         tools: mergedOptions.tools,
         tool_choice: mergedOptions.toolChoice
       });
       
       const content = response.choices[0]?.message?.content || '';
       
       const result: LLMResponse = {
         content,
         model: response.model,
         promptTokens: response.usage?.prompt_tokens || 0,
         completionTokens: response.usage?.completion_tokens || 0,
         totalTokens: response.usage?.total_tokens || 0,
         finishReason: response.choices[0]?.finish_reason || 'unknown',
         metadata: {
           id: response.id,
           created: response.created,
           systemFingerprint: response.system_fingerprint,
           toolCalls: response.choices[0]?.message?.tool_calls
         }
       };
       
       this.logResponse(result);
       return result;
     } catch (error: any) {
       logger.error('OpenAI request failed', { 
         error: error.message,
         model: mergedOptions.model,
         promptLength: prompt.length
       });
       throw error;
     }
   }
   
   /**
    * Stream a response from OpenAI
    */
   async streamResponse(
     prompt: string, 
     onChunk: (chunk: string, done: boolean) => void, 
     options: OpenAIRequestOptions = {}
   ): Promise<void> {
     const mergedOptions = this.mergeOptions(options);
     this.logRequest(prompt, mergedOptions);
     
     try {
       const messages = this.buildMessages(prompt, mergedOptions.systemPrompt);
       
       const stream = await this.client.chat.completions.create({
         model: mergedOptions.model || this.defaultModel,
         messages,
         max_tokens: mergedOptions.maxTokens,
         temperature: mergedOptions.temperature,
         top_p: mergedOptions.topP,
         presence_penalty: mergedOptions.presencePenalty,
         frequency_penalty: mergedOptions.frequencyPenalty,
         stop: mergedOptions.stop,
         stream: true
       });
       
       let content = '';
       let promptTokens = 0;
       let completionTokens = 0;
       
       for await (const chunk of stream) {
         const partialContent = chunk.choices[0]?.delta?.content || '';
         content += partialContent;
         
         // Estimate token usage (rough approximation)
         if (chunk.usage) {
           promptTokens = chunk.usage.prompt_tokens || 0;
           completionTokens = chunk.usage.completion_tokens || 0;
         } else {
           // Rough approximation of tokens: ~4 chars per token
           completionTokens = Math.ceil(content.length / 4);
         }
         
         const done = chunk.choices[0]?.finish_reason !== null;
         onChunk(partialContent, done);
       }
       
       logger.debug('OpenAI stream completed', {
         model: mergedOptions.model,
         promptTokens,
         completionTokens,
         totalTokens: promptTokens + completionTokens
       });
     } catch (error: any) {
       logger.error('OpenAI stream request failed', { 
         error: error.message,
         model: mergedOptions.model,
         promptLength: prompt.length
       });
       throw error;
     }
   }
   
   /**
    * Get available models from OpenAI
    */
   async getAvailableModels(): Promise<string[]> {
     if (this.availableModels) {
       return this.availableModels;
     }
     
     try {
       const response = await this.client.models.list();
       this.availableModels = response.data
         .map(model => model.id)
         .filter(id => id.startsWith('gpt-'));
       
       return this.availableModels;
     } catch (error: any) {
       logger.error('Failed to fetch OpenAI models', { error: error.message });
       return ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
     }
   }
   
   /**
    * Load available models (called on initialization)
    */
   private async loadAvailableModels(): Promise<void> {
     try {
       await this.getAvailableModels();
       logger.info('OpenAI models loaded', { count: this.availableModels?.length });
     } catch (error) {
       logger.warn('Failed to load OpenAI models, using defaults');
     }
   }
   
   /**
    * Build OpenAI message format from prompt and system prompt
    */
   private buildMessages(prompt: string, systemPrompt?: string): any[] {
     const messages = [];
     
     if (systemPrompt) {
       messages.push({
         role: 'system',
         content: systemPrompt
       });
     }
     
     messages.push({
       role: 'user',
       content: prompt
     });
     
     return messages;
   }
 }
