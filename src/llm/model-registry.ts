// src/llm/model-registry.ts
 import { LLMConnector } from './llm-connector';
 import { OpenAIConnector } from './openai-connector';
 import { config } from '../config/app-config';
 import logger from '../utils/logger';
 
 /**
  * Registry for managing different LLM providers and models
  */
 export class ModelRegistry {
   private models: Map<string, LLMConnector> = new Map();
   private defaultConnector: string | null = null;
   
   constructor() {
     // Initialize with default connectors
     this.initializeDefaultConnectors();
   }
   
   /**
    * Register a model connector
    */
   registerConnector(connector: LLMConnector): void {
     const providerName = connector.getProviderName();
     
     this.models.set(providerName, connector);
     logger.info(`Registered LLM connector: ${providerName}`);
     
     // Set as default if no default exists
     if (this.defaultConnector === null) {
       this.defaultConnector = providerName;
       logger.info(`Set default LLM connector to ${providerName}`);
     }
   }
   
   /**
    * Set the default connector
    */
   setDefaultConnector(providerName: string): void {
     if (!this.models.has(providerName)) {
       throw new Error(`LLM connector not found: ${providerName}`);
     }
     
     this.defaultConnector = providerName;
     logger.info(`Set default LLM connector to ${providerName}`);
   }
   
   /**
    * Get a connector by provider name
    */
   getConnector(providerName?: string): LLMConnector {
     if (!providerName && !this.defaultConnector) {
       throw new Error('No default LLM connector set');
     }
     
     const connectorName = providerName || this.defaultConnector!;
     const connector = this.models.get(connectorName);
     
     if (!connector) {
       throw new Error(`LLM connector not found: ${connectorName}`);
     }
     
     return connector;
   }
   
   /**
    * Get all registered connectors
    */
   getAllConnectors(): Map<string, LLMConnector> {
     return new Map(this.models);
   }
   
   /**
    * Get the default connector
    */
   getDefaultConnector(): LLMConnector {
     if (!this.defaultConnector) {
       throw new Error('No default LLM connector set');
     }
     
     return this.getConnector(this.defaultConnector);
   }
   
   /**
    * Get all available models across all providers
    */
   async getAllAvailableModels(): Promise<Record<string, string[]>> {
     const result: Record<string, string[]> = {};
     
     for (const [name, connector] of this.models.entries()) {
       try {
         result[name] = await connector.getAvailableModels();
       } catch (error) {
         logger.error(`Failed to get models for provider ${name}`, { 
           error: (error as Error).message 
         });
         result[name] = [];
       }
     }
     
     return result;
   }
   
   /**
    * Initialize default connectors based on configuration
    */
   private initializeDefaultConnectors(): void {
     // Initialize OpenAI if API key is available
     if (config.ai.openaiApiKey) {
       this.registerConnector(new OpenAIConnector());
       this.defaultConnector = 'OpenAI';
     }
     
     // Initialize other providers based on configuration
     // Example: Anthropic, Hugging Face, etc.
   }
 }
 
 // Create singleton instance
 export const modelRegistry = new ModelRegistry();
