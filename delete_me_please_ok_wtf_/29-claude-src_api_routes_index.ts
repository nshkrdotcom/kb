// src/api/routes/index.ts
import express from 'express';
import projectRoutes from './project-routes';
import contextRoutes from './context-routes';
import contentRoutes from './content-routes';
import userRoutes from './user-routes';
import { version } from '../../../package.json';
import logger from '../../utils/logger';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  logger.debug('Health check request received');
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API version endpoint
router.get('/version', (req, res) => {
  logger.debug('Version request received');
  
  res.json({
    name: 'ContextNexus API',
    version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount the individual route groups
router.use('/projects', projectRoutes);
router.use('/contexts', contextRoutes);
router.use('/content', contentRoutes);
router.use('/users', userRoutes);

// Catch-all 404 endpoint for API routes
router.use('*', (req, res) => {
  logger.warn('API endpoint not found', { path: req.originalUrl });
  
  res.status(404).json({
    error: 'Endpoint not found',
    status: 404,
    path: req.originalUrl
  });
});

export default router;