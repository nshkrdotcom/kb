// src/config/container.ts
 import { PostgresProjectRepository } from '../repositories/postgres/project-repository';
 import { PostgresContextRepository } from '../repositories/postgres/context-repository';
 import { PostgresUserRepository } from '../repositories/postgres/user-repository';
 import { Neo4jGraphRepository } from '../repositories/neo4j/graph-repository';
 import { ProjectService } from '../services/project-service';
 import { ContextService } from '../services/context-service';
 import { ContentService } from '../services/content-service';
 import { AuthService } from '../services/auth-service';
 import { ProjectController } from '../api/controllers/project-controller';
 import { ContextController } from '../api/controllers/context-controller';
 import { ContentController } from '../api/controllers/content-controller';
 import logger from '../utils/logger';
 
 // Simple dependency injection container
 class Container {
   private instances: Map<string, any> = new Map();
   private factories: Map<string, () => any> = new Map();
 
   /**
    * Register a singleton factory
    */
   register<T>(name: string, factory: () => T): void {
     this.factories.set(name, factory);
   }
 
   /**
    * Resolve a dependency
    */
   resolve<T>(name: string): T {
     // Check if instance already exists
     if (this.instances.has(name)) {
       return this.instances.get(name);
     }
 
     // Get the factory
     const factory = this.factories.get(name);
     if (!factory) {
       throw new Error(`No factory registered for ${name}`);
     }
 
     // Create the instance
     const instance = factory();
     this.instances.set(name, instance);
 
     return instance;
   }
 
   /**
    * Clear all instances (useful for testing)
    */
   clear(): void {
     this.instances.clear();
   }
 }
 
 // Create the container
 export const container = new Container();
 
 // Initialize the container with our dependencies
 export function initializeContainer(): void {
   logger.info('Initializing dependency injection container');
 
   // Repositories
   container.register('projectRepository', () => new PostgresProjectRepository());
   container.register('contextRepository', () => new PostgresContextRepository());
   container.register('userRepository', () => new PostgresUserRepository());
   container.register('graphRepository', () => new Neo4jGraphRepository());
 
   // Services
   container.register('authService', () => 
     new AuthService(container.resolve('userRepository'))
   );
   
   container.register('projectService', () => 
     new ProjectService(
       container.resolve('projectRepository'),
       container.resolve('contextRepository'),
       container.resolve('graphRepository'),
       container.resolve('contentRepository')
     )
   );
   
   container.register('contextService', () => 
     new ContextService(
       container.resolve('contextRepository'),
       container.resolve('contentRepository'),
       container.resolve('graphRepository'),
       container.resolve('projectRepository')
     )
   );
   
   container.register('contentService', () => 
     new ContentService(
       container.resolve('contentRepository'),
       container.resolve('tagRepository'),
       container.resolve('objectStorageRepository'),
       container.resolve('vectorRepository'),
       container.resolve('graphRepository')
     )
   );
 
   // Controllers
   container.register('projectController', () => 
     new ProjectController(container.resolve('projectService'))
   );
   
   container.register('contextController', () => 
     new ContextController(container.resolve('contextService'))
   );
   
   container.register('contentController', () => 
     new ContentController(container.resolve('contentService'))
   );
 
   logger.info('Dependency injection container initialized');
 }
