// src/services/llm-service.ts
 import { modelRegistry } from '../llm/model-registry';
 import { LLMRequestOptions, LLMResponse } from '../llm/llm-connector';
 import { ContentService } from './content-service';
 import { ContentItem, ContentType, Context, StorageType } from '../types/core';
 import { ContextService } from './context-service';
 import { config } from '../config/app-config';
 import logger from '../utils/logger';
 import { ApplicationError } from '../utils/errors';
 
 export interface QueryOptions {
   contextId?: string;
   projectId: string;
   systemPrompt?: string;
   llmOptions?: LLMRequestOptions;
   providerName?: string;
   userId: string;
   saveResponse?: boolean;
   responseContextId?: string;
   maxContextTokens?: number;
   includedContentIds?: string[];
 }
 
 export interface QueryResult {
   response: LLMResponse;
   contentItem?: ContentItem;
   contentTokens: number;
   promptTokens: number;
   completionTokens: number;
   totalTokens: number;
 }
 
 /**
  * Service for interacting with LLMs
  */
 export class LLMService {
   constructor(
     private contentService: ContentService,
     private contextService: ContextService
   ) {}
   
   /**
    * Send a query to an LLM with optional context
    */
   async query(
     query: string,
     options: QueryOptions
   ): Promise<QueryResult> {
     logger.info('Processing LLM query', { 
       queryLength: query.length,
       contextId: options.contextId,
       projectId: options.projectId
     });
     
     try {
       // Get the LLM connector
       const connector = modelRegistry.getConnector(options.providerName);
       
       // Build the prompt with context if provided
       const { prompt, contentTokens } = await this.buildPromptWithContext(
         query,
         options
       );
       
       // Send the prompt to the LLM
       const response = await connector.sendPrompt(prompt, {
         systemPrompt: options.systemPrompt,
         ...options.llmOptions
       });
       
       // Save the response as a content item if requested
       let contentItem: ContentItem | undefined;
       
       if (options.saveResponse) {
         contentItem = await this.saveResponseAsContent(
           response.content,
           query,
           options
         );
       }
       
       logger.info('LLM query completed', {
         provider: connector.getProviderName(),
         model: response.model,
         promptTokens: response.promptTokens,
         completionTokens: response.completionTokens,
         totalTokens: response.totalTokens
       });
       
       return {
         response,
         contentItem,
         contentTokens,
         promptTokens: response.promptTokens,
         completionTokens: response.completionTokens,
         totalTokens: response.totalTokens
       };
     } catch (error: any) {
       logger.error('Error processing LLM query', {
         error: error.message,
         queryLength: query.length,
         contextId: options.contextId
       });
       
       throw new ApplicationError('Failed to process query', 500, error);
     }
   }
   
   /**
    * Stream a response from the LLM
    */
   async streamResponse(
     query: string,
     onChunk: (chunk: string, done: boolean) => void,
     options: QueryOptions
   ): Promise<void> {
     logger.info('Streaming LLM response', { 
       queryLength: query.length,
       contextId: options.contextId,
       projectId: options.projectId
     });
     
     try {
       // Get the LLM connector
       const connector = modelRegistry.getConnector(options.providerName);
       
       // Build the prompt with context if provided
       const { prompt } = await this.buildPromptWithContext(
         query,
         options
       );
       
       // Collect the full response
       let fullResponse = '';
       const onChunkWrapper = (chunk: string, done: boolean) => {
         fullResponse += chunk;
         onChunk(chunk, done);
         
         // Save the response when done if requested
         if (done && options.saveResponse) {
           this.saveResponseAsContent(
             fullResponse,
             query,
             options
           ).catch(error => {
             logger.error('Error saving streamed response', {
               error: error.message
             });
           });
         }
       };
       
       // Stream the response from the LLM
       await connector.streamResponse(
         prompt,
         onChunkWrapper,
         {
           systemPrompt: options.systemPrompt,
           stream: true,
           ...options.llmOptions
         }
       );
       
       logger.info('LLM stream completed', {
         provider: connector.getProviderName(),
         responseLength: fullResponse.length
       });
     } catch (error: any) {
       logger.error('Error streaming LLM response', {
         error: error.message,
         queryLength: query.length,
         contextId: options.contextId
       });
       
       // Signal completion with error
       onChunk(`Error: ${error.message}`, true);
       
       throw new ApplicationError('Failed to stream response', 500, error);
     }
   }
   
   /**
    * Build a prompt with context from a query
    */
   private async buildPromptWithContext(
     query: string,
     options: QueryOptions
   ): Promise<{ prompt: string; contentTokens: number }> {
     let contextContent = '';
     let contentTokens = 0;
     
     if (options.contextId) {
       // Get context items with content
       const contextData = await this.contextService.getContextWithContent(
         options.contextId,
         {
           relevanceThreshold: 0.2,
           maxTokens: options.maxContextTokens || config.ai.maxContextTokens || 8000,
           prioritizeContentIds: options.includedContentIds
         }
       );
       
       const contentItems = contextData.contentItems;
       contentTokens = contextData.tokenUsage.totalTokens;
       
       // Build the context content
       if (contentItems.length > 0) {
         contextContent = this.formatContextContent(contentItems);
       }
     } else if (options.includedContentIds && options.includedContentIds.length > 0) {
       // Get specific content items
       const contentItems = await Promise.all(
         options.includedContentIds.map(id => this.contentService.getContentWithData(id))
       );
       
       // Calculate token count
       contentTokens = contentItems.reduce((sum, item) => sum + (item.tokens || 0), 0);
       
       // Build the context content
       contextContent = this.formatContextContent(contentItems);
     }
     
     // Build the final prompt
     let prompt = '';
     
     if (contextContent) {
       prompt = `
 # Context Information
 ${contextContent}
 
 # User Question
 ${query}`;
     } else {
       prompt = query;
     }
     
     return { prompt, contentTokens };
   }
   
   /**
    * Format content items into a context string
    */
   private formatContextContent(contentItems: ContentItem[]): string {
     let contextContent = '';
     
     for (const item of contentItems) {
       contextContent += `## ${item.title || 'Content'}\n\n`;
       
       if (item.contentType === ContentType.TEXT) {
         contextContent += `${item.content}\n\n`;
       } else if (item.contentType === ContentType.CODE) {
         const codeContent = item.content as { code: string; language: string };
         contextContent += `\`\`\`${codeContent.language || ''}\n${codeContent.code}\n\`\`\`\n\n`;
       } else {
         // For other content types, include metadata or description
         contextContent += `[${item.contentType} content]\n\n`;
         
         if (item.metadata && item.metadata.description) {
           contextContent += `${item.metadata.description}\n\n`;
         }
       }
     }
     
     return contextContent;
   }
   
   /**
    * Save an LLM response as a content item
    */
   private async saveResponseAsContent(
     responseText: string,
     query: string,
     options: QueryOptions
   ): Promise<ContentItem> {
     const title = `Response to: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`;
     
     const contextId = options.responseContextId || options.contextId;
     
     // Create the content item
     const contentItem = await this.contentService.createTextContent(
       options.projectId,
       title,
       responseText,
       options.userId,
       [], // No tags initially
       {
         query,
         contextId,
         provider: options.providerName || modelRegistry.getDefaultConnector().getProviderName(),
         model: options.llmOptions?.model || modelRegistry.getDefaultConnector().getDefaultModel(),
         timestamp: new Date().toISOString()
       }
     );
     
     // Add to context if a context ID was provided
     if (contextId) {
       await this.contextService.addContentToContext(
         contextId,
         contentItem.id
       );
     }
     
     return contentItem;
   }
 }
