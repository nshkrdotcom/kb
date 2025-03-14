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