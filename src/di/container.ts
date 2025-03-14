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