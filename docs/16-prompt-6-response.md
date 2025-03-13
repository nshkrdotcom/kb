# Dependency Injection and Error Handling Implementation

I'll implement a comprehensive dependency injection system and robust error handling framework for the ContextNexus application. This implementation will improve code maintainability, testability, and provide a better user experience.

## 1. Dependency Injection Container

First, let's create a flexible dependency injection container:

```typescript
// src/di/container.ts
export interface DIContainer {
  register<T>(token: string, factory: () => T, singleton?: boolean): void;
  registerInstance<T>(token: string, instance: T): void;
  resolve<T>(token: string): T;
  createScope(): DIContainer;
}

/**
 * Dependency registration information
 */
interface Registration<T> {
  factory: () => T;
  singleton: boolean;
  instance?: T;
  resolving?: boolean;
}

/**
 * A simple dependency injection container implementation
 */
export class Container implements DIContainer {
  private registrations: Map<string, Registration<any>>;
  private parent: Container | null = null;

  /**
   * Create a new DI container
   */
  constructor(parent?: Container) {
    this.registrations = new Map();
    this.parent = parent || null;
  }

  /**
   * Register a factory for creating instances
   */
  register<T>(token: string, factory: () => T, singleton: boolean = false): void {
    this.registrations.set(token, {
      factory,
      singleton
    });
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: string, instance: T): void {
    this.registrations.set(token, {
      factory: () => instance,
      singleton: true,
      instance
    });
  }

  /**
   * Resolve a dependency
   */
  resolve<T>(token: string): T {
    // Check if the dependency is registered in this container
    const registration = this.registrations.get(token);
    
    if (!registration) {
      // If not found in this container, try the parent
      if (this.parent) {
        return this.parent.resolve<T>(token);
      }
      
      // If no parent or not found in parent
      throw new Error(`Dependency not registered: ${token}`);
    }
    
    // For singletons, create once and reuse
    if (registration.singleton) {
      if (!registration.instance) {
        // Check for circular dependencies
        if (registration.resolving) {
          throw new Error(`Circular dependency detected while resolving: ${token}`);
        }
        
        // Mark as resolving to detect circularity
        registration.resolving = true;
        
        try {
          registration.instance = registration.factory();
        } finally {
          registration.resolving = false;
        }
      }
      
      return registration.instance;
    }
    
    // For non-singletons, create a new instance each time
    return registration.factory();
  }

  /**
   * Create a new scope that inherits from this container
   */
  createScope(): DIContainer {
    return new Container(this);
  }
}

// Create and export a default container instance
export const container = new Container();
```

## 2. Error Handling Middleware and Error Classes

Let's create a robust error handling system with custom error classes:

```typescript
// src/utils/errors.ts
/**
 * Base application error class
 */
export class ApplicationError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public originalError?: Error | any
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensures proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get error details for API responses
   */
  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * 400 Bad Request - Invalid input
 */
export class ValidationError extends ApplicationError {
  constructor(
    message: string = 'Validation failed',
    public validationErrors: Record<string, string>[] | string[] = [],
    originalError?: Error
  ) {
    super(message, 400, originalError);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * 401 Unauthorized - Authentication failure
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', originalError?: Error) {
    super(message, 401, originalError);
  }
}

/**
 * 403 Forbidden - Authorization failure
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access denied', originalError?: Error) {
    super(message, 403, originalError);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource', originalError?: Error) {
    super(`${resource} not found`, 404, originalError);
  }
}

/**
 * 409 Conflict - Resource conflict
 */
export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict', originalError?: Error) {
    super(message, 409, originalError);
  }
}

/**
 * 429 Too Many Requests - Rate limiting
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', originalError?: Error) {
    super(message, 429, originalError);
  }
}

/**
 * 500 Internal Server Error - Unexpected error
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', originalError?: Error) {
    super(message, 500, originalError);
  }
}

/**
 * 503 Service Unavailable - External service failure
 */
export class ServiceUnavailableError extends ApplicationError {
  constructor(service: string = 'External service', originalError?: Error) {
    super(`${service} is currently unavailable`, 503, originalError);
  }
}
```

Now, let's implement the error handling middleware:

```typescript
// src/api/middlewares/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { config } from '../../config/app-config';

/**
 * Global error handling middleware
 */
export function errorHandlerMiddleware(
  err: Error | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error status and message
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails: any = undefined;
  
  // Log the error
  const logMeta = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id
  };
  
  // Handle different error types
  if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    
    // Include validation errors if present (for ValidationError)
    if (err instanceof ValidationError) {
      errorDetails = err.validationErrors;
    }
    
    // Log with appropriate level based on status code
    if (statusCode >= 500) {
      logger.error(`Server error: ${err.message}`, {
        ...logMeta,
        stack: err.stack,
        originalError: err.originalError
      });
    } else if (statusCode >= 400) {
      logger.warn(`Client error: ${err.message}`, {
        ...logMeta,
        details: errorDetails
      });
    }
  } else {
    // For unexpected errors, log with stack trace
    logger.error(`Unexpected error: ${err.message}`, {
      ...logMeta,
      stack: err.stack
    });
  }
  
  // Prepare the response
  const errorResponse = {
    error: errorMessage,
    statusCode,
    ...(errorDetails && { details: errorDetails }),
    // Only include stack trace in development mode
    ...(config.environment === 'development' && 
        !(err instanceof ApplicationError) && { stack: err.stack }),
    path: req.path
  };
  
  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Catch-all for unhandled errors in async routes
 */
export function asyncHandler(fn: Function) {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

## 3. Logging Service

Next, let's implement a configurable logging service:

```typescript
// src/utils/logger.ts
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { config } from '../config/app-config';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * Create and configure Winston logger
 */
function createWinstonLogger(): WinstonLogger {
  // Determine log level based on environment
  const level = config.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  
  // Configure format based on environment
  const logFormat = config.environment === 'production'
    ? format.combine(
        format.timestamp(),
        format.json()
      )
    : format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => {
          const { timestamp, level, message, ...meta } = info;
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      );
  
  // Create Winston logger
  return createLogger({
    level,
    format: logFormat,
    defaultMeta: { service: 'contextnexus' },
    transports: [
      // Console transport for all environments
      new transports.Console(),
      
      // File transports for production
      ...(config.environment === 'production' ? [
        // Error log
        new transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        // Combined log
        new transports.File({ 
          filename: 'logs/combined.log' 
        })
      ] : [])
    ]
  });
}

/**
 * Application logger implementation
 */
class AppLogger implements Logger {
  private winstonLogger: WinstonLogger;
  
  constructor() {
    this.winstonLogger = createWinstonLogger();
  }
  
  debug(message: string, meta?: any): void {
    this.winstonLogger.debug(message, meta);
  }
  
  info(message: string, meta?: any): void {
    this.winstonLogger.info(message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.winstonLogger.warn(message, meta);
  }
  
  error(message: string, meta?: any): void {
    this.winstonLogger.error(message, meta);
  }
}

// Create and export a singleton logger instance
const logger = new AppLogger();
export default logger;
```

## 4. Validation Middleware

Now, let's implement a validation middleware using Joi:

```typescript
// src/api/middlewares/validation.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';
import { ValidationError } from '../../utils/errors';

/**
 * Validator middleware factory that takes a Joi schema
 */
export function validateRequest(schema: Joi.ObjectSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get data based on request method
    let data: any;
    
    if (req.method === 'GET') {
      data = req.query;
    } else if (req.body && Object.keys(req.body).length > 0) {
      data = req.body;
    } else {
      data = {};
    }
    
    // Validate the data against the schema
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: ''
        }
      }
    });
    
    if (error) {
      // Format the validation errors
      const errorDetails = error.details.map(detail => ({
        path: detail.path.join('.'),
        message: detail.message
      }));
      
      // Throw a validation error
      throw new ValidationError('Validation failed', errorDetails);
    }
    
    // Update the request data with the validated and sanitized data
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    // Continue to the next middleware/handler
    next();
  };
}

/**
 * Create a custom validation schema with specific rules
 */
export function createCustomValidator(
  baseSchema: Joi.ObjectSchema,
  customValidation: (value: any) => { error?: string, value?: any }
): Joi.ObjectSchema {
  return baseSchema.custom((value, helpers) => {
    const result = customValidation(value);
    
    if (result.error) {
      return helpers.error(result.error);
    }
    
    return result.value || value;
  });
}
```

## 5. Common Validators for Core Entities

Let's create some common validation schemas:

```typescript
// src/api/validators/common-validators.ts
import Joi from 'joi';

/**
 * UUID validation pattern
 */
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Common validation schemas
 */
export const commonValidators = {
  // UUID parameter validation
  uuidParam: Joi.string().pattern(uuidPattern).required().messages({
    'string.pattern.base': 'Invalid ID format, must be a valid UUID',
    'string.empty': 'ID cannot be empty',
    'any.required': 'ID is required'
  }),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),
  
  // Email validation
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email cannot be empty',
    'any.required': 'Email is required'
  }),
  
  // Password validation
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required'
  }),
  
  // Token validation
  token: Joi.string().required().messages({
    'string.empty': 'Token cannot be empty',
    'any.required': 'Token is required'
  })
};
```

Now let's implement validators for specific entities:

```typescript
// src/api/validators/user-validator.ts
import Joi from 'joi';
import { commonValidators } from './common-validators';

export const userValidators = {
  // Login request validation
  login: Joi.object({
    email: commonValidators.email,
    password: Joi.string().required()
  }),
  
  // Registration request validation
  register: Joi.object({
    email: commonValidators.email,
    password: commonValidators.password,
    name: Joi.string().min(2).max(100).required()
  }),
  
  // Update profile validation
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    settings: Joi.object().unknown(true)
  }).min(1),
  
  // Password change validation
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: commonValidators.password
  }),
  
  // Password reset request validation
  resetPassword: Joi.object({
    email: commonValidators.email
  })
};
```

```typescript
// src/api/validators/context-validator.ts
import Joi from 'joi';
import { commonValidators } from './common-validators';

export const contextValidators = {
  // Create context validation
  createContext: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000),
    projectId: commonValidators.uuidParam
  }),
  
  // Update context validation
  updateContext: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    metadata: Joi.object().unknown(true)
  }).min(1),
  
  // Context content selection validation
  selectContent: Joi.object({
    itemIds: Joi.array().items(commonValidators.uuidParam).required(),
    selected: Joi.boolean().required()
  }),
  
  // Context content relevance validation
  updateRelevance: Joi.object({
    relevance: Joi.number().min(0).max(1).required()
  })
};
```

```typescript
// src/api/validators/query-validator.ts
import Joi from 'joi';
import { commonValidators } from './common-validators';

export const queryValidators = {
  // Query request validation
  query: Joi.object({
    query: Joi.string().min(1).required(),
    contextId: commonValidators.uuidParam,
    options: Joi.object({
      modelId: Joi.string(),
      temperature: Joi.number().min(0).max(1),
      maxTokens: Joi.number().integer().min(1).max(10000),
      includeMetadata: Joi.boolean(),
      stream: Joi.boolean()
    })
  }),
  
  // Suggest content validation
  suggestContent: Joi.object({
    query: Joi.string().min(1).required(),
    options: Joi.object({
      maxItems: Joi.number().integer().min(1).max(50),
      maxTokens: Joi.number().integer().min(1),
      contentTypes: Joi.array().items(Joi.string().valid('text', 'code', 'image', 'list')),
      sortBy: Joi.string().valid('relevance', 'recency', 'title', 'type'),
      sortDirection: Joi.string().valid('asc', 'desc')
    })
  })
};
```

## 6. App Integration

Now, let's update the app.ts file to integrate all these components:

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/app-config';
import { container } from './di/container';
import { errorHandlerMiddleware, asyncHandler } from './api/middlewares/error-handler';
import logger from './utils/logger';

// Import repositories
import { PostgresUserRepository } from './repositories/postgres/user-repository';
import { PostgresContextRepository } from './repositories/postgres/context-repository';
import { PostgresContentRepository } from './repositories/postgres/content-repository';
import { MinioObjectRepository } from './repositories/minio/object-repository';
import { PineconeVectorRepository } from './repositories/pinecone/vector-repository';
import { Neo4jGraphRepository } from './repositories/neo4j/graph-repository';

// Import services
import { AuthService } from './services/auth-service';
import { ContentService } from './services/content-service';
import { ContextService } from './services/context-service';
import { ProjectService } from './services/project-service';
import { StorageService } from './services/storage-service';
import { ModelRegistry } from './llm/model-registry';
import { OpenAIConnector } from './llm/connectors/openai-connector';
import { ContextOptimizer } from './llm/context-optimizer';
import { PromptBuilder } from './llm/prompt-builder';
import { RelevanceScorer } from './selection/relevance-scorer';
import { SelectionService } from './selection/selection-service';
import { QueryService } from './services/query-service';

// Import controllers
import { UserController } from './api/controllers/user-controller';
import { ContextController } from './api/controllers/context-controller';
import { ContentController } from './api/controllers/content-controller';
import { QueryController } from './api/controllers/query-controller';
import { SelectionController } from './api/controllers/selection-controller';

// Import routes
import createUserRoutes from './api/routes/user-routes';
import createContextRoutes from './api/routes/context-routes';
import createContentRoutes from './api/routes/content-routes';
import createQueryRoutes from './api/routes/query-routes';
import createSelectionRoutes from './api/routes/selection-routes';

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
if (config.environment !== 'test') {
  app.use(morgan(config.environment === 'development' ? 'dev' : 'combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Register repositories
container.register('userRepository', () => new PostgresUserRepository(), true);
container.register('contextRepository', () => new PostgresContextRepository(), true);
container.register('contentRepository', () => new PostgresContentRepository(), true);
container.register('objectRepository', () => new MinioObjectRepository(), true);
container.register('vectorRepository', () => new PineconeVectorRepository(), true);
container.register('graphRepository', () => new Neo4jGraphRepository(), true);

// Register services
container.register('authService', () => {
  const userRepository = container.resolve<PostgresUserRepository>('userRepository');
  return new AuthService(userRepository);
}, true);

container.register('projectService', () => {
  // Implementation depends on your project service
  return new ProjectService();
}, true);

container.register('contentService', () => {
  const contentRepository = container.resolve('contentRepository');
  const objectRepository = container.resolve('objectRepository');
  const vectorRepository = container.resolve('vectorRepository');
  const graphRepository = container.resolve('graphRepository');
  return new ContentService(
    contentRepository, 
    objectRepository, 
    vectorRepository, 
    graphRepository
  );
}, true);

container.register('contextService', () => {
  const contextRepository = container.resolve('contextRepository');
  const contentRepository = container.resolve('contentRepository');
  return new ContextService(contextRepository, contentRepository);
}, true);

container.register('storageService', () => {
  const objectRepository = container.resolve('objectRepository');
  return new StorageService(objectRepository);
}, true);

// Register LLM components
container.register('modelRegistry', () => {
  const registry = new ModelRegistry();
  
  // Register OpenAI models if API key is available
  if (config.ai.openaiApiKey) {
    registry.registerModel(
      'gpt-3.5-turbo',
      new OpenAIConnector('gpt-3.5-turbo', config.ai.openaiApiKey)
    );
    
    registry.registerModel(
      'gpt-4',
      new OpenAIConnector('gpt-4', config.ai.openaiApiKey)
    );
  }
  
  return registry;
}, true);

container.register('relevanceScorer', () => {
  const contentService = container.resolve<ContentService>('contentService');
  const vectorRepository = container.resolve('vectorRepository');
  return new RelevanceScorer(contentService, vectorRepository);
}, true);

container.register('contextOptimizer', () => {
  const contextService = container.resolve<ContextService>('contextService');
  const contentService = container.resolve<ContentService>('contentService');
  const relevanceScorer = container.resolve<RelevanceScorer>('relevanceScorer');
  return new ContextOptimizer(contextService, contentService, relevanceScorer);
}, true);

container.register('promptBuilder', () => {
  return new PromptBuilder();
}, true);

container.register('selectionService', () => {
  const contentService = container.resolve<ContentService>('contentService');
  const contextService = container.resolve<ContextService>('contextService');
  const relevanceScorer = container.resolve<RelevanceScorer>('relevanceScorer');
  return new SelectionService(contentService, contextService, relevanceScorer);
}, true);

container.register('queryService', () => {
  const modelRegistry = container.resolve<ModelRegistry>('modelRegistry');
  const contextService = container.resolve<ContextService>('contextService');
  const contentService = container.resolve<ContentService>('contentService');
  const contextOptimizer = container.resolve<ContextOptimizer>('contextOptimizer');
  const promptBuilder = container.resolve<PromptBuilder>('promptBuilder');
  return new QueryService(
    modelRegistry,
    contextService,
    contentService,
    contextOptimizer,
    promptBuilder
  );
}, true);

// Register controllers
container.register('userController', () => {
  const authService = container.resolve<AuthService>('authService');
  const userRepository = container.resolve('userRepository');
  return new UserController(authService, userRepository);
}, true);

container.register('contextController', () => {
  const contextService = container.resolve<ContextService>('contextService');
  return new ContextController(contextService);
}, true);

container.register('contentController', () => {
  const contentService = container.resolve<ContentService>('contentService');
  return new ContentController(contentService);
}, true);

container.register('queryController', () => {
  const queryService = container.resolve<QueryService>('queryService');
  return new QueryController(queryService);
}, true);

container.register('selectionController', () => {
  const selectionService = container.resolve<SelectionService>('selectionService');
  return new SelectionController(selectionService);
}, true);

// Configure routes
app.use(`${config.server.apiPrefix}/users`, createUserRoutes(container.resolve('userController')));
app.use(`${config.server.apiPrefix}/contexts`, createContextRoutes(container.resolve('contextController')));
app.use(`${config.server.apiPrefix}/content`, createContentRoutes(container.resolve('contentController')));
app.use(`${config.server.apiPrefix}/queries`, createQueryRoutes(container.resolve('queryController')));
app.use(`${config.server.apiPrefix}/selection`, createSelectionRoutes(container.resolve('selectionController')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply error handler middleware
app.use(errorHandlerMiddleware);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    statusCode: 404,
    path: req.path
  });
});

// Start the server
if (require.main === module) {
  const port = config.server.port;
  app.listen(port, () => {
    logger.info(`Server started on port ${port}`, {
      environment: config.environment,
      port
    });
  });
}

export default app;
```

## 7. Example Refactored Service

Let's refactor an existing service to use the dependency injection system:

```typescript
// src/services/context-service.ts
import { ContextRepository, ContentRepository } from '../repositories/interfaces';
import { Context, ContentItem } from '../types/core';
import logger from '../utils/logger';
import { 
  ApplicationError, 
  NotFoundError, 
  ValidationError 
} from '../utils/errors';

export class ContextService {
  constructor(
    private contextRepository: ContextRepository,
    private contentRepository: ContentRepository
  ) {}
  
  /**
   * Get a context by ID
   */
  async getContextById(id: string): Promise<Context | null> {
    try {
      logger.debug('Getting context by ID', { id });
      return await this.contextRepository.findById(id);
    } catch (error: any) {
      logger.error('Error getting context by ID', { id, error: error.message });
      throw new ApplicationError('Failed to get context', 500, error);
    }
  }
  
  /**
   * Create a new context
   */
  async createContext(data: Partial<Context>): Promise<Context> {
    try {
      logger.info('Creating new context', { data });
      
      if (!data.title) {
        throw new ValidationError('Context title is required');
      }
      
      if (!data.projectId) {
        throw new ValidationError('Project ID is required');
      }
      
      const context = await this.contextRepository.create(data as Context);
      
      logger.info('Context created successfully', { id: context.id });
      return context;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error creating context', { error: error.message });
      throw new ApplicationError('Failed to create context', 500, error);
    }
  }
  
  /**
   * Update a context
   */
  async updateContext(id: string, data: Partial<Context>): Promise<Context> {
    try {
      logger.info('Updating context', { id, data });
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(id);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Update the context
      const updatedContext = await this.contextRepository.update(id, data);
      
      logger.info('Context updated successfully', { id });
      return updatedContext;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating context', { id, error: error.message });
      throw new ApplicationError('Failed to update context', 500, error);
    }
  }
  
  /**
   * Delete a context
   */
  async deleteContext(id: string): Promise<void> {
    try {
      logger.info('Deleting context', { id });
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(id);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Delete the context
      await this.contextRepository.delete(id);
      
      logger.info('Context deleted successfully', { id });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error deleting context', { id, error: error.message });
      throw new ApplicationError('Failed to delete context', 500, error);
    }
  }
  
  /**
   * Get content items for a context
   */
  async getContextContent(contextId: string): Promise<ContentItem[]> {
    try {
      logger.debug('Getting context content', { contextId });
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(contextId);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Get content items for the context
      const contentItems = await this.contextRepository.getContentItems(contextId);
      
      return contentItems;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error getting context content', { contextId, error: error.message });
      throw new ApplicationError('Failed to get context content', 500, error);
    }
  }
  
  /**
   * Add content to a context
   */
  async addContentToContext(
    contextId: string, 
    contentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      logger.info('Adding content to context', { contextId, contentId });
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(contextId);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Check if content exists
      const existingContent = await this.contentRepository.findById(contentId);
      
      if (!existingContent) {
        throw new NotFoundError('Content');
      }
      
      // Add content to context
      await this.contextRepository.addContentItem(contextId, contentId, metadata);
      
      logger.info('Content added to context successfully', { contextId, contentId });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error adding content to context', { 
        contextId, 
        contentId, 
        error: error.message 
      });
      
      throw new ApplicationError('Failed to add content to context', 500, error);
    }
  }
  
  /**
   * Remove content from a context
   */
  async removeContentFromContext(contextId: string, contentId: string): Promise<void> {
    try {
      logger.info('Removing content from context', { contextId, contentId });
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(contextId);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Remove content from context
      await this.contextRepository.removeContentItem(contextId, contentId);
      
      logger.info('Content removed from context successfully', { contextId, contentId });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error removing content from context', { 
        contextId, 
        contentId, 
        error: error.message 
      });
      
      throw new ApplicationError('Failed to remove content from context', 500, error);
    }
  }
  
  /**
   * Update content relevance in a context
   */
  async updateContentRelevance(
    contextId: string,
    contentId: string,
    relevance: number
  ): Promise<void> {
    try {
      logger.info('Updating content relevance', { contextId, contentId, relevance });
      
      // Validate relevance value
      if (relevance < 0 || relevance > 1) {
        throw new ValidationError('Relevance must be between 0 and 1');
      }
      
      // Check if context exists
      const existingContext = await this.contextRepository.findById(contextId);
      
      if (!existingContext) {
        throw new NotFoundError('Context');
      }
      
      // Check if content exists in context
      const contentItems = await this.contextRepository.getContentItems(contextId);
      const contentExists = contentItems.some(item => item.id === contentId);
      
      if (!contentExists) {
        throw new NotFoundError('Content in context');
      }
      
      // Update content relevance
      await this.contextRepository.updateContentMetadata(contextId, contentId, { relevance });
      
      logger.info('Content relevance updated successfully', { contextId, contentId });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating content relevance', { 
        contextId, 
        contentId, 
        relevance,
        error: error.message 
      });
      
      throw new ApplicationError('Failed to update content relevance', 500, error);
    }
  }
}
```

## 8. Example Controller Using AsyncHandler

```typescript
// src/api/controllers/context-controller.ts
import { Request, Response } from 'express';
import { ContextService } from '../../services/context-service';
import { asyncHandler } from '../middlewares/error-handler';
import { NotFoundError } from '../../utils/errors';

export class ContextController {
  constructor(private contextService: ContextService) {}
  
  /**
   * Get all contexts for a project
   */
  getContextsForProject = asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const contexts = await this.contextService.getContextsForProject(projectId);
    res.json(contexts);
  });
  
  /**
   * Get a context by ID
   */
  getContextById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const context = await this.contextService.getContextById(id);
    
    if (!context) {
      throw new NotFoundError('Context');
    }
    
    res.json(context);
  });
  
  /**
   * Create a new context
   */
  createContext = asyncHandler(async (req: Request, res: Response) => {
    const context = await this.contextService.createContext(req.body);
    res.status(201).json(context);
  });
  
  /**
   * Update a context
   */
  updateContext = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedContext = await this.contextService.updateContext(id, req.body);
    res.json(updatedContext);
  });
  
  /**
   * Delete a context
   */
  deleteContext = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.contextService.deleteContext(id);
    res.status(204).end();
  });
  
  /**
   * Get content items for a context
   */
  getContextContent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const contentItems = await this.contextService.getContextContent(id);
    res.json(contentItems);
  });
  
  /**
   * Add content to a context
   */
  addContentToContext = asyncHandler(async (req: Request, res: Response) => {
    const { id, contentId } = req.params;
    await this.contextService.addContentToContext(id, contentId, req.body.metadata);
    res.status(204).end();
  });
  
  /**
   * Remove content from a context
   */
  removeContentFromContext = asyncHandler(async (req: Request, res: Response) => {
    const { id, contentId } = req.params;
    await this.contextService.removeContentFromContext(id, contentId);
    res.status(204).end();
  });
  
  /**
   * Update content relevance in a context
   */
  updateContentRelevance = asyncHandler(async (req: Request, res: Response) => {
    const { id, contentId } = req.params;
    const { relevance } = req.body;
    await this.contextService.updateContentRelevance(id, contentId, relevance);
    res.status(204).end();
  });
}
```

## 9. Example Routes with Validation

```typescript
// src/api/routes/context-routes.ts
import express from 'express';
import { ContextController } from '../controllers/context-controller';
import { validateRequest } from '../middlewares/validation';
import { contextValidators } from '../validators/context-validator';
import { commonValidators } from '../validators/common-validators';
import { authMiddleware } from '../middlewares/auth';

const createContextRoutes = (contextController: ContextController) => {
  const router = express.Router();
  
  // Apply authentication middleware to all routes
  router.use(authMiddleware());
  
  // Get contexts for a project
  router.get(
    '/project/:projectId', 
    validateRequest(Joi.object({ projectId: commonValidators.uuidParam })),
    contextController.getContextsForProject
  );
  
  // Get a context by ID
  router.get(
    '/:id', 
    validateRequest(Joi.object({ id: commonValidators.uuidParam })),
    contextController.getContextById
  );
  
  // Create a new context
  router.post(
    '/', 
    validateRequest(contextValidators.createContext),
    contextController.createContext
  );
  
  // Update a context
  router.put(
    '/:id', 
    validateRequest(Joi.object({ id: commonValidators.uuidParam })),
    validateRequest(contextValidators.updateContext),
    contextController.updateContext
  );
  
  // Delete a context
  router.delete(
    '/:id', 
    validateRequest(Joi.object({ id: commonValidators.uuidParam })),
    contextController.deleteContext
  );
  
  // Get content items for a context
  router.get(
    '/:id/content', 
    validateRequest(Joi.object({ id: commonValidators.uuidParam })),
    contextController.getContextContent
  );
  
  // Add content to a context
  router.post(
    '/:id/content/:contentId', 
    validateRequest(Joi.object({ 
      id: commonValidators.uuidParam,
      contentId: commonValidators.uuidParam,
      metadata: Joi.object().unknown(true)
    })),
    contextController.addContentToContext
  );
  
  // Remove content from a context
  router.delete(
    '/:id/content/:contentId', 
    validateRequest(Joi.object({ 
      id: commonValidators.uuidParam,
      contentId: commonValidators.uuidParam
    })),
    contextController.removeContentFromContext
  );
  
  // Update content relevance in a context
  router.put(
    '/:id/content/:contentId/relevance', 
    validateRequest(Joi.object({ 
      id: commonValidators.uuidParam,
      contentId: commonValidators.uuidParam
    })),
    validateRequest(contextValidators.updateRelevance),
    contextController.updateContentRelevance
  );
  
  return router;
};

export default createContextRoutes;
```

## Implementation Benefits

This implementation provides several important benefits:

1. **Dependency Injection**
   - Clear separation of concerns with explicit dependencies
   - Improved testability through easy dependency mocking
   - Simplified service instantiation and configuration
   - Handles circular dependencies gracefully
   - Supports scoped instances for request-specific dependencies

2. **Error Handling**
   - Consistent error responses throughout the application
   - Proper status codes for different error types
   - Detailed error messages in development, simplified in production
   - Structured logging of errors for easier debugging
   - AsyncHandler utility to eliminate try/catch boilerplate

3. **Logging Service**
   - Environment-specific logging configuration
   - Structured log format with consistent metadata
   - Different log levels for filtering importance
   - Separate files for error logs in production
   - Service name and timestamp included in all logs

4. **Validation**
   - Schema-based validation using Joi
   - Consistent error messages and formats
   - Custom validation rules for complex scenarios
   - Reusable validation schemas for common patterns
   - Early validation to prevent invalid data reaching services

These infrastructure components create a solid foundation for the ContextNexus application, making it more maintainable, testable, and reliable. They provide a consistent pattern for handling errors, managing dependencies, and validating user input throughout the application.