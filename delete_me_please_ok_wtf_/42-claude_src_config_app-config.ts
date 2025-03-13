// src/config/app-config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Helper function to get environment variables with defaults
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// Helper function to get boolean environment variables
function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Helper function to get number environment variables
function getNumEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Configuration object
export const config = {
  server: {
    port: getNumEnv('PORT', 3000),
    host: getEnv('HOST', 'localhost'),
    environment: getEnv('NODE_ENV', 'development'),
    apiPrefix: getEnv('API_PREFIX', '/api'),
    corsOrigin: getEnv('CORS_ORIGIN', '*'),
  },
  
  postgres: {
    host: getEnv('POSTGRES_HOST', 'localhost'),
    port: getNumEnv('POSTGRES_PORT', 5432),
    database: getEnv('POSTGRES_DB', 'contextnexus'),
    user: getEnv('POSTGRES_USER', 'postgres'),
    password: getEnv('POSTGRES_PASSWORD', 'postgres'),
    ssl: getBoolEnv('POSTGRES_SSL', false),
    maxConnections: getNumEnv('POSTGRES_MAX_CONNECTIONS', 20),
  },
  
  neo4j: {
    uri: getEnv('NEO4J_URI', 'bolt://localhost:7687'),
    user: getEnv('NEO4J_USER', 'neo4j'),
    password: getEnv('NEO4J_PASSWORD', 'neo4j'),
    database: getEnv('NEO4J_DATABASE', 'neo4j'),
  },
  
  minio: {
    endpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
    port: getNumEnv('MINIO_PORT', 9000),
    accessKey: getEnv('MINIO_ACCESS_KEY', 'minioadmin'),
    secretKey: getEnv('MINIO_SECRET_KEY', 'minioadmin'),
    useSSL: getBoolEnv('MINIO_USE_SSL', false),
    bucketName: getEnv('MINIO_BUCKET', 'contextnexus'),
    region: getEnv('MINIO_REGION', 'us-east-1'),
  },
  
  pinecone: {
    apiKey: getEnv('PINECONE_API_KEY', ''),
    environment: getEnv('PINECONE_ENVIRONMENT', ''),
    indexName: getEnv('PINECONE_INDEX', 'contextnexus'),
  },
  
  auth: {
    jwtSecret: getEnv('JWT_SECRET', 'your-secret-key'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '1d'),
    saltRounds: getNumEnv('SALT_ROUNDS', 10),
  },
  
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    format: getEnv('LOG_FORMAT', 'json'),
    path: getEnv('LOG_PATH', 'logs'),
  },
  
  contentLimits: {
    maxTokens: getNumEnv('MAX_TOKENS', 100000),
    maxContentSize: getNumEnv('MAX_CONTENT_SIZE', 10 * 1024 * 1024), // 10MB
    maxFileSize: getNumEnv('MAX_FILE_SIZE', 50 * 1024 * 1024), // 50MB
  },
  
  ai: {
    embeddingModel: getEnv('EMBEDDING_MODEL', 'text-embedding-ada-002'),
    openaiApiKey: getEnv('OPENAI_API_KEY', ''),
    maxVectorDimensions: getNumEnv('MAX_VECTOR_DIMENSIONS', 1536),
  }
};

// Export default config
export default config;