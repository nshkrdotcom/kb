// src/db/minio/connection.ts
import { Client } from 'minio';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

let minioClient: Client;

/**
 * Initialize MinIO client with configuration
 */
export function initMinIO(): Client {
  const { endpoint, port, accessKey, secretKey, useSSL, bucketName } = config.minio;
  
  try {
    minioClient = new Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });
    
    logger.info('MinIO client initialized', { endpoint, port, bucketName });
    
    // Ensure the default bucket exists
    minioClient.bucketExists(bucketName)
      .then(exists => {
        if (!exists) {
          return minioClient.makeBucket(bucketName, config.minio.region || 'us-east-1');
        }
      })
      .then(() => {
        if (!exists) {
          logger.info(`Created bucket ${bucketName}`);
        } else {
          logger.info(`Bucket ${bucketName} already exists`);
        }
      })
      .catch(error => {
        logger.error('Failed to initialize MinIO bucket', { error: error.message });
        throw error;
      });
    
    return minioClient;
  } catch (error: any) {
    logger.error('Error initializing MinIO client', { error: error.message });
    throw error;
  }
}

/**
 * Get the MinIO client instance, initializing if necessary
 */
export function getMinIOClient(): Client {
  if (!minioClient) {
    return initMinIO();
  }
  return minioClient;
}

/**
 * Upload an object to MinIO
 */
export async function uploadObject(
  key: string,
  data: Buffer,
  contentType: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    await client.putObject(bucketName, key, data, data.length, {
      'Content-Type': contentType,
      ...metadata,
    });
    
    logger.debug('Uploaded object to MinIO', { key, size: data.length, bucket: bucketName });
    
    // Return the object URL
    return getObjectURL(key);
  } catch (error: any) {
    logger.error('Failed to upload object to MinIO', { error: error.message, key });
    throw error;
  }
}

/**
 * Get an object from MinIO
 */
export async function getObject(key: string): Promise<Buffer> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    const dataStream = await client.getObject(bucketName, key);
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      dataStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      dataStream.on('end', () => {
        logger.debug('Retrieved object from MinIO', { key, bucket: bucketName });
        resolve(Buffer.concat(chunks));
      });
      
      dataStream.on('error', (error) => {
        logger.error('Error retrieving object from MinIO', { error: error.message, key });
        reject(error);
      });
    });
  } catch (error: any) {
    logger.error('Failed to get object from MinIO', { error: error.message, key });
    throw error;
  }
}

/**
 * Get a presigned URL for an object
 */
export async function getObjectURL(key: string, expirySeconds: number = 3600): Promise<string> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    const url = await client.presignedGetObject(bucketName, key, expirySeconds);
    
    logger.debug('Generated presigned URL for MinIO object', { key, expirySeconds });
    
    return url;
  } catch (error: any) {
    logger.error('Failed to generate presigned URL for MinIO object', { error: error.message, key });
    throw error;
  }
}

/**
 * Delete an object from MinIO
 */
export async function deleteObject(key: string): Promise<boolean> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    await client.removeObject(bucketName, key);
    
    logger.debug('Deleted object from MinIO', { key, bucket: bucketName });
    
    return true;
  } catch (error: any) {
    logger.error('Failed to delete object from MinIO', { error: error.message, key });
    throw error;
  }
}

/**
 * Get metadata for an object
 */
export async function getObjectMetadata(key: string): Promise<Record<string, any>> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    const stat = await client.statObject(bucketName, key);
    
    logger.debug('Retrieved object metadata from MinIO', { key, bucket: bucketName });
    
    // Extract custom metadata (remove internal MinIO headers)
    const metadata: Record<string, any> = {};
    
    Object.entries(stat.metaData || {}).forEach(([k, v]) => {
      // Convert MinIO's 'x-amz-meta-xxx' format to regular metadata keys
      const key = k.toLowerCase().startsWith('x-amz-meta-')
        ? k.substring(11) // Remove 'x-amz-meta-' prefix
        : k;
      
      metadata[key] = v;
    });
    
    // Add standard properties
    metadata.size = stat.size;
    metadata.contentType = stat.metaData['content-type'] || stat.metaData['Content-Type'];
    metadata.etag = stat.etag;
    metadata.lastModified = stat.lastModified;
    
    return metadata;
  } catch (error: any) {
    logger.error('Failed to get object metadata from MinIO', { error: error.message, key });
    throw error;
  }
}

/**
 * Copy an object within MinIO
 */
export async function copyObject(sourceKey: string, destinationKey: string): Promise<string> {
  const client = getMinIOClient();
  const bucketName = config.minio.bucketName;
  
  try {
    // MinIO requires CopySource to include the bucket name
    const copySource = `${bucketName}/${sourceKey}`;
    
    await client.copyObject(bucketName, destinationKey, copySource);
    
    logger.debug('Copied object in MinIO', { 
      sourceKey, 
      destinationKey, 
      bucket: bucketName 
    });
    
    // Return the new object URL
    return getObjectURL(destinationKey);
  } catch (error: any) {
    logger.error('Failed to copy object in MinIO', { 
      error: error.message, 
      sourceKey,
      destinationKey 
    });
    throw error;
  }
}