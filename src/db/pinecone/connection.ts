// src/db/pinecone/connection.ts
import { PineconeClient, Vector, QueryRequest } from '@pinecone-database/pinecone';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

let pineconeClient: PineconeClient;
let indexName: string;

/**
 * Initialize Pinecone client with configuration
 */
export async function initPinecone(): Promise<PineconeClient> {
  const { apiKey, environment, indexName: configIndexName } = config.pinecone;
  
  try {
    pineconeClient = new PineconeClient();
    
    await pineconeClient.init({
      apiKey,
      environment,
    });
    
    indexName = configIndexName;
    
    logger.info('Pinecone client initialized', { 
      environment, 
      indexName 
    });
    
    // Verify index exists
    const indexList = await pineconeClient.listIndexes();
    
    if (!indexList.indexes?.some(index => index.name === indexName)) {
      logger.warn(`Pinecone index ${indexName} does not exist. You may need to create it.`);
    } else {
      logger.info(`Pinecone index ${indexName} verified`);
    }
    
    return pineconeClient;
  } catch (error: any) {
    logger.error('Error initializing Pinecone client', { error: error.message });
    throw error;
  }
}

/**
 * Get the Pinecone client instance, initializing if necessary
 */
export async function getPineconeClient(): Promise<PineconeClient> {
  if (!pineconeClient) {
    return await initPinecone();
  }
  return pineconeClient;
}

/**
 * Get the Pinecone index
 */
export async function getIndex() {
  const client = await getPineconeClient();
  return client.Index(indexName);
}

/**
 * Store a vector in Pinecone
 */
export async function storeVector(
  id: string,
  vector: number[],
  metadata: Record<string, any> = {}
): Promise<string> {
  try {
    const index = await getIndex();
    
    const upsertRequest = {
      vectors: [{
        id,
        values: vector,
        metadata
      }]
    };
    
    await index.upsert({ upsertRequest });
    
    logger.debug('Vector stored in Pinecone', { id, metadataKeys: Object.keys(metadata) });
    
    return id;
  } catch (error: any) {
    logger.error('Failed to store vector in Pinecone', { error: error.message, id });
    throw error;
  }
}

/**
 * Find similar vectors in Pinecone
 */
export async function findSimilarVectors(
  vector: number[],
  limit: number = 10,
  filter?: Record<string, any>
): Promise<{ id: string; score: number; metadata?: Record<string, any> }[]> {
  try {
    const index = await getIndex();
    
    const queryRequest: QueryRequest = {
      vector,
      topK: limit,
      includeMetadata: true
    };
    
    if (filter) {
      queryRequest.filter = filter;
    }
    
    const queryResponse = await index.query({ queryRequest });
    
    logger.debug('Similar vectors retrieved from Pinecone', { 
      resultCount: queryResponse.matches?.length || 0,
      filter: filter ? JSON.stringify(filter) : undefined
    });
    
    return (queryResponse.matches || []).map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata
    }));
  } catch (error: any) {
    logger.error('Failed to find similar vectors in Pinecone', { 
      error: error.message,
      limit,
      filter: filter ? JSON.stringify(filter) : undefined
    });
    throw error;
  }
}

/**
 * Delete a vector from Pinecone
 */
export async function deleteVector(id: string): Promise<boolean> {
  try {
    const index = await getIndex();
    
    await index.delete({
      ids: [id]
    });
    
    logger.debug('Vector deleted from Pinecone', { id });
    
    return true;
  } catch (error: any) {
    logger.error('Failed to delete vector from Pinecone', { error: error.message, id });
    throw error;
  }
}

/**
 * Fetch vectors by ID
 */
export async function fetchVectors(ids: string[]): Promise<Vector[]> {
  try {
    const index = await getIndex();
    
    const fetchResponse = await index.fetch({ ids });
    
    const vectors: Vector[] = [];
    
    Object.entries(fetchResponse.vectors || {}).forEach(([id, vector]) => {
      if (vector) {
        vectors.push({
          id,
          values: vector.values,
          metadata: vector.metadata
        });
      }
    });
    
    logger.debug('Vectors fetched from Pinecone', { 
      requestedCount: ids.length,
      retrievedCount: vectors.length
    });
    
    return vectors;
  } catch (error: any) {
    logger.error('Failed to fetch vectors from Pinecone', { 
      error: error.message,
      idsCount: ids.length
    });
    throw error;
  }
}

/**
 * Create text embedding (mock implementation)
 * In a real app, this would call an embedding service like OpenAI
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    // This is a mock implementation
    // In a real app, this would call OpenAI or another embedding service
    
    // Create a deterministic but varied vector based on the text
    // This is NOT suitable for production, just for illustration
    const hash = hashString(text);
    const seed = hash % 10000;
    const random = new PseudoRandom(seed);
    
    // Generate a 128-dimensional embedding
    const dimensions = 128;
    const embedding = Array(dimensions).fill(0).map(() => random.next() * 2 - 1);
    
    // Normalize the vector to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / magnitude);
    
    logger.debug('Created text embedding (mock)', { 
      textLength: text.length,
      dimensions
    });
    
    return normalizedEmbedding;
  } catch (error: any) {
    logger.error('Failed to create text embedding', { 
      error: error.message,
      textLength: text.length
    });
    throw error;
  }
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Simple deterministic random number generator
 */
class PseudoRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}