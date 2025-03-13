// src/server.ts
import { createApp } from './app';
import { config } from './config/app-config';
import logger from './utils/logger';
import { closePgPool } from './db/postgres/connection';
import { closeNeo4j } from './db/neo4j/connection';

/**
 * Start the server
 */
async function startServer() {
  try {
    const app = await createApp();
    
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running at http://${config.server.host}:${config.server.port}`);
      logger.info(`Environment: ${config.server.environment}`);
      logger.info(`API prefix: ${config.server.apiPrefix}`);
    });
    
    // Handle graceful shutdown
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', { 
      error: (error as Error).message 
    });
    process.exit(1);
  }
}

/**
 * Setup handlers for graceful shutdown
 */
function setupGracefulShutdown(server: any) {
  // Handle SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    gracefulShutdown(server);
  });
  
  // Handle SIGINT signal (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    gracefulShutdown(server);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { 
      error: error.message,
      stack: error.stack
    });
    gracefulShutdown(server);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { 
      reason: reason instanceof Error ? reason.message : reason 
    });
    gracefulShutdown(server);
  });
}

/**
 * Perform graceful shutdown operations
 */
async function gracefulShutdown(server: any) {
  logger.info('Closing HTTP server...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await closePgPool();
      await closeNeo4j();
      
      // Close other connections
      // (MinIO, Pinecone, etc.)
      
      logger.info('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { 
        error: (error as Error).message 
      });
      process.exit(1);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000); // 30 second timeout
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };