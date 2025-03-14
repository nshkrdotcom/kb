// // src/llm/model-registry.ts
//  import { LLMConnector } from './llm-connector';
//  import { OpenAIConnector } from './openai-connector';
//  import { config } from '../config/app-config';
//  import logger from '../utils/logger';
 
//  /**
//   * Registry for managing different LLM providers and models
//   */
//  export class ModelRegistry {
//    private models: Map<string, LLMConnector> = new Map();
//    private defaultConnector: string | null = null;
   
//    constructor() {
//      // Initialize with default connectors
//      this.initializeDefaultConnectors();
//    }
   
//    /**
//     * Register a model connector
//     */
//    registerConnector(connector: LLMConnector): void {
//      const providerName = connector.getProviderName();
     
//      this.models.set(providerName, connector);
//      logger.info(`Registered LLM connector: ${providerName}`);
     
//      // Set as default if no default exists
//      if (this.defaultConnector === null) {
//        this.defaultConnector = providerName;
//        logger.info(`Set default LLM connector to ${providerName}`);
//      }
//    }
   
//    /**
//     * Set the default connector
//     */
//    setDefaultConnector(providerName: string): void {
//      if (!this.models.has(providerName)) {
//        throw new Error(`LLM connector not found: ${providerName}`);
//      }
     
//      this.defaultConnector = providerName;
//      logger.info(`Set default LLM connector to ${providerName}`);
//    }
   
//    /**
//     * Get a connector by provider name
//     */
//    getConnector(providerName?: string): LLMConnector {
//      if (!providerName && !this.defaultConnector) {
//        throw new Error('No default LLM connector set');
//      }
     
//      const connectorName = providerName || this.defaultConnector!;
//      const connector = this.models.get(connectorName);
     
//      if (!connector) {
//        throw new Error(`LLM connector not found: ${connectorName}`);
//      }
     
//      return connector;
//    }
   
//    /**
//     * Get all registered connectors
//     */
//    getAllConnectors(): Map<string, LLMConnector> {
//      return new Map(this.models);
//    }
   
//    /**
//     * Get the default connector
//     */
//    getDefaultConnector(): LLMConnector {
//      if (!this.defaultConnector) {
//        throw new Error('No default LLM connector set');
//      }
     
//      return this.getConnector(this.defaultConnector);
//    }
   
//    /**
//     * Get all available models across all providers
//     */
//    async getAllAvailableModels(): Promise<Record<string, string[]>> {
//      const result: Record<string, string[]> = {};
     
//      for (const [name, connector] of this.models.entries()) {
//        try {
//          result[name] = await connector.getAvailableModels();
//        } catch (error) {
//          logger.error(`Failed to get models for provider ${name}`, { 
//            error: (error as Error).message 
//          });
//          result[name] = [];
//        }
//      }
     
//      return result;
//    }
   
//    /**
//     * Initialize default connectors based on configuration
//     */
//    private initializeDefaultConnectors(): void {
//      // Initialize OpenAI if API key is available
//      if (config.ai.openaiApiKey) {
//        this.registerConnector(new OpenAIConnector());
//        this.defaultConnector = 'OpenAI';
//      }
     
//      // Initialize other providers based on configuration
//      // Example: Anthropic, Hugging Face, etc.
//    }
//  }
 
//  // Create singleton instance
//  export const modelRegistry = new ModelRegistry();



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