// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/app-config';
import logger from './utils/logger';
import { initializeDatabase } from './db/postgres/connection';
import { initNeo4j } from './db/neo4j/connection';
import apiRouter from './api/routes';
import { ApplicationError } from './utils/errors';

/**
 * Create and configure the Express application
 */
export async function createApp() {
  logger.info('Initializing application...');
  
  // Initialize database connections
  await initializeDatabases();
  
  const app = express();
  
  // Basic middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(morgan(config.server.environment === 'development' ? 'dev' : 'combined', {
    stream: { write: (message: string) => logger.http(message.trim()) }
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // API Routes
  app.use(config.server.apiPrefix, apiRouter);
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 404,
      message: 'Not Found',
      path: req.originalUrl
    });
  });
  
  // Error handling middleware
  app.use((err: Error | ApplicationError, req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof ApplicationError ? err.status : 500;
    const message = err.message || 'Internal Server Error';
    
    logger.error(`${status} - ${message}`, {
      path: req.path,
      method: req.method,
      error: err instanceof ApplicationError ? err.originalError?.message : err.stack
    });
    
    res.status(status).json({
      status,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  });
  
  logger.info('Application initialized successfully');
  
  return app;
}

/**
 * Initialize all database connections
 */
async function initializeDatabases() {
  try {
    // Initialize PostgreSQL
    await initializeDatabase();
    
    // Initialize Neo4j
    initNeo4j();
    
    // Initialize MinIO and Pinecone connections
    // This would be implemented in a real application
    logger.info('Additional storage connections would be initialized here');
    
  } catch (error) {
    logger.error('Failed to initialize databases', {
      error: (error as Error).message
    });
    throw error;
  }
}