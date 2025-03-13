// src/services/content-service.ts
import { 
    ContentItem, ContentType, StorageType, Tag
  } from '../types/core';
  import { 
    ContentRepository, 
    TagRepository, 
    ObjectStorageRepository, 
    VectorRepository,
    GraphRepository
  } from '../repositories/interfaces';
  import { countTokens } from '../utils/token-counter';
  import { ApplicationError } from '../utils/errors';
  import logger from '../utils/logger';
  
  /**
   * Service for managing content items and their relationships
   */
  export class ContentService {
    constructor(
      private contentRepository: ContentRepository,
      private tagRepository: TagRepository,
      private objectStorageRepository: ObjectStorageRepository,
      private vectorRepository: VectorRepository,
      private graphRepository: GraphRepository
    ) {}
    
    /**
     * Get content item with its actual data
     */
    async getContentWithData(id: string): Promise<ContentItem> {
      logger.info('Fetching content with data', { contentId: id });
      
      try {
        // Get the content item metadata
        const contentItem = await this.contentRepository.findById(id);
        if (!contentItem) {
          throw new ApplicationError(`Content with ID ${id} not found`, 404);
        }
        
        // Load the actual content based on type and storage
        if (contentItem.storageType === StorageType.POSTGRES) {
          if (contentItem.contentType === ContentType.TEXT) {
            const textContent = await this.contentRepository.getTextContent(id);
            if (textContent) {
              contentItem.content = textContent.content;
            }
          } else if (contentItem.contentType === ContentType.CODE) {
            const codeContent = await this.contentRepository.getCodeContent(id);
            if (codeContent) {
              contentItem.content = {
                code: codeContent.code,
                language: codeContent.language,
                highlightedHtml: codeContent.highlightedHtml
              };
            }
          }
        } else if (contentItem.storageType === StorageType.MINIO) {
          // For binary content stored in MinIO
          const buffer = await this.objectStorageRepository.getObject(contentItem.storageKey);
          contentItem.content = {
            url: await this.objectStorageRepository.getObjectURL(contentItem.storageKey),
            size: buffer.length,
            metadata: await this.objectStorageRepository.getMetadata(contentItem.storageKey)
          };
        }
        
        logger.info('Content fetched successfully', { 
          contentId: id, 
          contentType: contentItem.contentType 
        });
        
        return contentItem;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to fetch content with data', { 
          contentId: id, 
          error: error.message 
        });
        throw new ApplicationError('Failed to fetch content', 500, error);
      }
    }
    
    /**
     * Create a text content item
     */
    async createTextContent(
      projectId: string,
      title: string,
      text: string,
      creatorId: string,
      tags: string[] = [],
      metadata: Record<string, any> = {}
    ): Promise<ContentItem> {
      logger.info('Creating text content', { 
        projectId, 
        title, 
        creatorId 
      });
      
      try {
        // Count tokens
        const tokenCount = await countTokens(text);
        
        // Create the content item with text
        const contentItem = await this.contentRepository.createTextContent(
          {
            projectId,
            contentType: ContentType.TEXT,
            storageType: StorageType.POSTGRES,
            storageKey: 'postgres', // This is a placeholder since we're using the DB directly
            title,
            creatorId,
            metadata,
            embeddingId: undefined, // Will be set later if embeddings are created
            tokens: tokenCount,
            version: 1,
            isActive: true
          },
          text
        );
        
        // Create node in Neo4j
        await this.graphRepository.createNode(
          ['Content', 'Text'],
          {
            id: contentItem.id,
            title: contentItem.title,
            contentType: contentItem.contentType,
            projectId: contentItem.projectId,
            creatorId: contentItem.creatorId,
            createdAt: contentItem.createdAt.toISOString(),
            tokens: contentItem.tokens
          }
        );
        
        // Create project-content relationship
        await this.graphRepository.createRelationship(
          projectId,
          contentItem.id,
          'HAS_CONTENT'
        );
        
        // Add tags if provided
        if (tags.length > 0) {
          await this.addTagsToContent(contentItem.id, projectId, tags);
        }
        
        // Create embedding for vector search if enabled
        await this.createEmbeddingIfEnabled(contentItem.id, text);
        
        logger.info('Text content created successfully', {
          contentId: contentItem.id,
          projectId,
          tokens: tokenCount
        });
        
        return contentItem;
      } catch (error: any) {
        logger.error('Failed to create text content', { 
          projectId, 
          title, 
          error: error.message 
        });
        throw new ApplicationError('Failed to create text content', 500, error);
      }
    }
    
    /**
     * Create a code content item
     */
    async createCodeContent(
      projectId: string,
      title: string,
      code: string,
      language: string,
      creatorId: string,
      tags: string[] = [],
      metadata: Record<string, any> = {}
    ): Promise<ContentItem> {
      logger.info('Creating code content', { 
        projectId, 
        title, 
        language, 
        creatorId 
      });
      
      try {
        // Count tokens
        const tokenCount = await countTokens(code);
        
        // Create the content item with code
        const contentItem = await this.contentRepository.createCodeContent(
          {
            projectId,
            contentType: ContentType.CODE,
            storageType: StorageType.POSTGRES,
            storageKey: 'postgres', // This is a placeholder since we're using the DB directly
            title,
            creatorId,
            metadata: {
              language,
              ...metadata
            },
            embeddingId: undefined, // Will be set later if embeddings are created
            tokens: tokenCount,
            version: 1,
            isActive: true
          },
          code,
          language
        );
        
        // Create node in Neo4j
        await this.graphRepository.createNode(
          ['Content', 'Code'],
          {
            id: contentItem.id,
            title: contentItem.title,
            contentType: contentItem.contentType,
            language,
            projectId: contentItem.projectId,
            creatorId: contentItem.creatorId,
            createdAt: contentItem.createdAt.toISOString(),
            tokens: contentItem.tokens
          }
        );
        
        // Create project-content relationship
        await this.graphRepository.createRelationship(
          projectId,
          contentItem.id,
          'HAS_CONTENT'
        );
        
        // Add tags if provided
        if (tags.length > 0) {
          await this.addTagsToContent(contentItem.id, projectId, tags);
        }
        
        // Create embedding for vector search if enabled
        await this.createEmbeddingIfEnabled(contentItem.id, code);
        
        logger.info('Code content created successfully', {
          contentId: contentItem.id,
          projectId,
          language,
          tokens: tokenCount
        });
        
        return contentItem;
      } catch (error: any) {
        logger.error('Failed to create code content', { 
          projectId, 
          title, 
          language, 
          error: error.message 
        });
        throw new ApplicationError('Failed to create code content', 500, error);
      }
    }
    
    /**
     * Create an image content item
     */
    async createImageContent(
      projectId: string,
      title: string,
      imageBuffer: Buffer,
      mimeType: string,
      creatorId: string,
      tags: string[] = [],
      metadata: Record<string, any> = {}
    ): Promise<ContentItem> {
      logger.info('Creating image content', { 
        projectId, 
        title, 
        mimeType, 
        creatorId 
      });
      
      try {
        // Generate a storage key for the image
        const storageKey = `projects/${projectId}/images/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Upload to object storage
        await this.objectStorageRepository.uploadObject(
          storageKey,
          imageBuffer,
          mimeType,
          metadata
        );
        
        // Create the content item
        const contentItem = await this.contentRepository.create({
          projectId,
          contentType: ContentType.IMAGE,
          storageType: StorageType.MINIO,
          storageKey,
          title,
          creatorId,
          metadata: {
            mimeType,
            size: imageBuffer.length,
            ...metadata
          },
          embeddingId: undefined,
          tokens: 0, // Images don't have tokens
          version: 1,
          isActive: true
        });
        
        // Create node in Neo4j
        await this.graphRepository.createNode(
          ['Content', 'Image'],
          {
            id: contentItem.id,
            title: contentItem.title,
            contentType: contentItem.contentType,
            mimeType,
            projectId: contentItem.projectId,
            creatorId: contentItem.creatorId,
            createdAt: contentItem.createdAt.toISOString()
          }
        );
        
        // Create project-content relationship
        await this.graphRepository.createRelationship(
          projectId,
          contentItem.id,
          'HAS_CONTENT'
        );
        
        // Add tags if provided
        if (tags.length > 0) {
          await this.addTagsToContent(contentItem.id, projectId, tags);
        }
        
        logger.info('Image content created successfully', {
          contentId: contentItem.id,
          projectId,
          mimeType,
          size: imageBuffer.length
        });
        
        return contentItem;
      } catch (error: any) {
        logger.error('Failed to create image content', { 
          projectId, 
          title, 
          mimeType, 
          error: error.message 
        });
        throw new ApplicationError('Failed to create image content', 500, error);
      }
    }
    
    /**
     * Find similar content using vector search
     */
    async findSimilarContent(
      contentId: string,
      limit: number = 10,
      projectId?: string
    ): Promise<{ contentId: string; score: number }[]> {
      logger.info('Finding similar content', { 
        contentId, 
        limit, 
        projectId 
      });
      
      try {
        // Get the content item
        const contentItem = await this.contentRepository.findById(contentId);
        if (!contentItem) {
          throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
        }
        
        // Check if the content has an embedding
        if (!contentItem.embeddingId) {
          // If no embedding, try to create one on the fly
          const content = await this.getContentWithData(contentId);
          if (!content.content) {
            throw new ApplicationError('Cannot find similar content without embedding', 400);
          }
          
          // For text or code content
          const textToEmbed = typeof content.content === 'string' 
            ? content.content 
            : content.content.code || '';
          
          await this.createEmbeddingIfEnabled(contentId, textToEmbed);
          
          // Reload content to get the embedding ID
          const updatedContent = await this.contentRepository.findById(contentId);
          if (!updatedContent?.embeddingId) {
            throw new ApplicationError('Failed to create embedding for content', 500);
          }
          
          contentItem.embeddingId = updatedContent.embeddingId;
        }
        
        // Get the embedding
        const embedding = await this.vectorRepository.findEmbedding(contentId);
        if (!embedding) {
          throw new ApplicationError('Embedding not found for content', 404);
        }
        
        // Build filter for project if specified
        const filters: Record<string, any> = {};
        if (projectId) {
          filters.projectId = projectId;
        } else {
          // Default to same project as the content
          filters.projectId = contentItem.projectId;
        }
        
        // Find similar content
        const similarContent = await this.vectorRepository.findSimilar(
          embedding.vector,
          limit,
          filters
        );
        
        logger.info('Found similar content', {
          contentId,
          count: similarContent.length
        });
        
        return similarContent.filter(item => item.id !== contentId)
          .map(item => ({
            contentId: item.id,
            score: item.score
          }));
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to find similar content', { 
          contentId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to find similar content', 500, error);
      }
    }
    
    /**
     * Helper method to add tags to content
     */
    private async addTagsToContent(
      contentId: string,
      projectId: string,
      tags: string[]
    ): Promise<void> {
      // Process each tag
      for (const tagName of tags) {
        // Find or create the tag
        const tag = await this.tagRepository.findOrCreate(
          projectId,
          tagName
        );
        
        // Add tag to content
        await this.contentRepository.addTag(contentId, tag.id);
        
        // Create relationship in Neo4j
        await this.graphRepository.createRelationship(
          contentId,
          tag.id,
          'TAGGED_AS'
        );
      }
    }
    
    /**
     * Helper method to create embedding if enabled
     */
    private async createEmbeddingIfEnabled(
      contentId: string,
      text: string
    ): Promise<void> {
      try {
        // This would be gated by configuration in a real app
        const embeddingsEnabled = true;
        
        if (embeddingsEnabled && text && text.length > 0) {
          // In a real app, you would call out to an embedding service
          // Here we just create a simple mock embedding
          const mockVector = new Array(128).fill(0).map(() => Math.random());
          
          // Store the embedding
          const embeddingId = await this.vectorRepository.storeEmbedding(
            contentId,
            mockVector,
            { contentId }
          );
          
          // Update the content item with the embedding ID
          await this.contentRepository.update(contentId, { embeddingId });
          
          logger.debug('Created embedding for content', {
            contentId,
            embeddingId
          });
        }
      } catch (error: any) {
        // Log but don't fail the whole operation if embedding fails
        logger.warn('Failed to create embedding for content', {
          contentId,
          error: error.message
        });
      }
    }
  }