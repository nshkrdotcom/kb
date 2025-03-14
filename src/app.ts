// src/app.ts
// import express, { Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import compression from 'compression';
// import { config } from './config/app-config';
// import logger from './utils/logger';
// import { initializeDatabase } from './db/postgres/connection';
// import { initNeo4j } from './db/neo4j/connection';
// import apiRouter from './api/routes';
// import { ApplicationError } from './utils/errors';

// /**
//  * Create and configure the Express application
//  */
// export async function createApp() {
//   logger.info('Initializing application...');
  
//   // Initialize database connections
//   await initializeDatabases();
  
//   const app = express();
  
//   // Basic middleware
//   app.use(helmet());
//   app.use(cors());
//   app.use(compression());
//   app.use(morgan(config.server.environment === 'development' ? 'dev' : 'combined', {
//     stream: { write: (message: string) => logger.http(message.trim()) }
//   }));
//   app.use(express.json({ limit: '50mb' }));
//   app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
//   // Health check
//   app.get('/health', (req, res) => {
//     res.json({
//       status: 'UP',
//       timestamp: new Date().toISOString(),
//       uptime: process.uptime()
//     });
//   });
  
//   // API Routes
//   app.use(config.server.apiPrefix, apiRouter);
  
//   // 404 handler
//   app.use((req, res) => {
//     res.status(404).json({
//       status: 404,
//       message: 'Not Found',
//       path: req.originalUrl
//     });
//   });
  
//   // Error handling middleware
//   app.use((err: Error | ApplicationError, req: Request, res: Response, _next: NextFunction) => {
//     const status = err instanceof ApplicationError ? err.status : 500;
//     const message = err.message || 'Internal Server Error';
    
//     logger.error(`${status} - ${message}`, {
//       path: req.path,
//       method: req.method,
//       error: err instanceof ApplicationError ? err.originalError?.message : err.stack
//     });
    
//     res.status(status).json({
//       status,
//       message,
//       timestamp: new Date().toISOString(),
//       path: req.originalUrl
//     });
//   });
  
//   logger.info('Application initialized successfully');
  
//   return app;
// }

// /**
//  * Initialize all database connections
//  */
// async function initializeDatabases() {
//   try {
//     // Initialize PostgreSQL
//     await initializeDatabase();
    
//     // Initialize Neo4j
//     initNeo4j();
    
//     // Initialize MinIO and Pinecone connections
//     // This would be implemented in a real application
//     logger.info('Additional storage connections would be initialized here');
    
//   } catch (error) {
//     logger.error('Failed to initialize databases', {
//       error: (error as Error).message
//     });
//     throw error;
//   }
// }













// // Add to your existing app.ts file

// // Import new components
// import { AuthService } from './services/auth-service';
// import { UserController } from './api/controllers/user-controller';
// import createUserRoutes from './api/routes/user-routes';
// import cookieParser from 'cookie-parser'; // You'll need to install this package

// // Add cookie parser middleware
// app.use(cookieParser());

// // Initialize services
// const userRepository = new PostgresUserRepository();
// const authService = new AuthService(userRepository);

// // Store services for middleware access
// app.locals.services = {
//   authService
// };

// // Initialize controllers
// const userController = new UserController(authService, userRepository);

// // Mount user routes
// app.use(`${config.server.apiPrefix}/users`, createUserRoutes(userController));

// // Update existing routes to use authentication where needed
// // Example:
// // app.use(`${config.server.apiPrefix}/projects`, authMiddleware(), projectRoutes);
















// // Add to src/app.ts

// // Import new components
// import { OpenAIConnector } from './llm/connectors/openai-connector';
// import { ModelRegistry } from './llm/model-registry';
// import { QueryService } from './services/query-service';
// import { QueryController } from './api/controllers/query-controller';
// import createQueryRoutes from './api/routes/query-routes';

// // Initialize repositories and services (assuming these already exist)
// const contentService = new ContentService(
//   contentRepository, 
//   tagRepository, 
//   objectStorageRepository, 
//   vectorRepository,
//   graphRepository
// );

// const contextService = new ContextService(
//   contextRepository,
//   contentRepository
// );

// // Initialize LLM components
// const modelRegistry = new ModelRegistry({
//   defaultModelId: 'gpt-3.5-turbo',
//   metricsEnabled: true,
//   fallbackEnabled: true
// });

// // Register OpenAI models if API key is available
// if (config.ai.openaiApiKey) {
//   modelRegistry.registerOpenAIModels();
// } else {
//   logger.warn('OpenAI API key not found, LLM functionality will be limited');
// }

// // Initialize query service
// const queryService = new QueryService(
//   modelRegistry,
//   contextService,
//   contentService
// );

// // Initialize query controller
// const queryController = new QueryController(queryService);

// // Add query routes
// app.use(`${config.server.apiPrefix}/queries`, createQueryRoutes(queryController));





















// // Add to src/app.ts

// // Import new components
// import { ContextOptimizer } from './llm/context-optimizer';
// import { PromptBuilder } from './llm/prompt-builder';
// import { RelevanceScorer } from './selection/relevance-scorer';
// import { SelectionService } from './selection/selection-service';
// import { SelectionController } from './api/controllers/selection-controller';
// import createSelectionRoutes from './api/routes/selection-routes';

// // Initialize the context optimization components
// const relevanceScorer = new RelevanceScorer(
//   contentService,
//   vectorRepository
// );

// const contextOptimizer = new ContextOptimizer(
//   contextService,
//   contentService,
//   relevanceScorer
// );

// const promptBuilder = new PromptBuilder();

// const selectionService = new SelectionService(
//   contentService,
//   contextService,
//   relevanceScorer
// );

// // Initialize controller
// const selectionController = new SelectionController(selectionService);

// // Add selection routes
// app.use(`${config.server.apiPrefix}/selection`, createSelectionRoutes(selectionController));

// // Update the query service to use these new components
// // (Assuming the query service was created in the previous implementation)
// const queryService = new QueryService(
//   modelRegistry,
//   contextService,
//   contentService,
//   contextOptimizer,
//   promptBuilder
// );















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