// src/db/neo4j/connection.ts
import neo4j, { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

let driver: Driver;

/**
 * Initialize Neo4j driver with configuration
 */
export function initNeo4j(): Driver {
  const uri = config.neo4j.uri;
  const user = config.neo4j.user;
  const password = config.neo4j.password;
  const database = config.neo4j.database;
  
  try {
    driver = neo4j.driver(
      uri, 
      neo4j.auth.basic(user, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        disableLosslessIntegers: true
      }
    );
    
    logger.info('Neo4j driver initialized', { uri, database });
    
    // Test connection
    const session = driver.session({ database });
    session.run('RETURN 1 as test')
      .then(() => {
        logger.info('Neo4j connection verified');
        return session.close();
      })
      .catch(error => {
        logger.error('Failed to connect to Neo4j', { error: error.message });
        throw error;
      });
    
    return driver;
  } catch (error: any) {
    logger.error('Error initializing Neo4j driver', { error: error.message });
    throw error;
  }
}

/**
 * Get the Neo4j driver instance, initializing if necessary
 */
export function getDriver(): Driver {
  if (!driver) {
    return initNeo4j();
  }
  return driver;
}

/**
 * Get a new session from the driver
 */
export function getSession(database?: string): Session {
  return getDriver().session({ 
    database: database || config.neo4j.database 
  });
}

/**
 * Run a Cypher query with parameters and return results
 */
export async function runQuery<T = any>(
  query: string, 
  params: Record<string, any> = {},
  database?: string
): Promise<T[]> {
  const session = getSession(database);
  const start = Date.now();
  
  try {
    const result = await session.run(query, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed Cypher query', { 
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params: Object.keys(params),
      duration,
      records: result.records.length
    });
    
    // Convert Neo4j records to plain objects
    return result.records.map((record: Neo4jRecord) => {
      const obj: Record<string, any> = {};
      
      for (const key of record.keys) {
        const value = record.get(key);
        
        // Handle Neo4j Node objects
        if (value && typeof value === 'object' && value.properties) {
          obj[key] = value.properties;
        } 
        // Handle Neo4j Relationship objects
        else if (value && typeof value === 'object' && value.type) {
          obj[key] = {
            ...value.properties,
            type: value.type
          };
        }
        // Handle Path objects
        else if (value && typeof value === 'object' && value.segments) {
          obj[key] = value.segments.map((segment: any) => ({
            start: segment.start.properties,
            relationship: {
              ...segment.relationship.properties,
              type: segment.relationship.type
            },
            end: segment.end.properties
          }));
        }
        // Handle everything else
        else {
          obj[key] = value;
        }
      }
      
      return obj as T;
    });
  } catch (error: any) {
    logger.error('Neo4j query error', { 
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      error: error.message,
      duration: Date.now() - start
    });
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Run a query in a transaction
 */
export async function runInTransaction<T>(
  callback: (session: Session) => Promise<T>,
  database?: string
): Promise<T> {
  const session = getSession(database);
  const tx = session.beginTransaction();
  
  try {
    const result = await callback(tx as any);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Close the Neo4j driver (for graceful shutdown)
 */
export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    logger.info('Neo4j driver closed');
  }
}