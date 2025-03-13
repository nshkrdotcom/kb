// src/db/postgres/connection.ts
import { Pool, PoolClient } from 'pg';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

// Create a connection pool
export const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  ssl: config.postgres.ssl,
  max: config.postgres.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pgPool.on('connect', (client: PoolClient) => {
  logger.info('New PostgreSQL client connected');
});

pgPool.on('error', (err: Error) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

// Simple query helper
export async function query(text: string, params: any[] = []): Promise<any> {
  const start = Date.now();
  try {
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', { 
      text, 
      duration,
      rowCount: res.rowCount,
      // Only log params if they don't contain sensitive information
      // params: params.length > 0 ? 'params present' : 'no params'
    });
    
    return res;
  } catch (err: any) {
    logger.error('Query error', { 
      text, 
      error: err.message,
      duration: Date.now() - start
    });
    throw err;
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Close pool (for graceful shutdown)
export async function closePgPool(): Promise<void> {
  await pgPool.end();
  logger.info('PostgreSQL pool closed');
}

// Initialize database - create tables if needed
export async function initializeDatabase(): Promise<void> {
  // This would typically run migrations, but for simplicity
  // we're just checking connection
  try {
    const result = await query('SELECT NOW()');
    logger.info('PostgreSQL database initialized', {
      timestamp: result.rows[0].now
    });
  } catch (err: any) {
    logger.error('Failed to initialize PostgreSQL database', { 
      error: err.message 
    });
    throw err;
  }
}