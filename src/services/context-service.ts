// src/services/context-service.ts
import { 
    Context, ContentItem, ContextItem, RelationshipType, 
    SelectionOptions, TokenUsage 
  } from '../types/core';
  import { 
    ContextRepository, ContentRepository, GraphRepository,
    ProjectRepository
  } from '../repositories/interfaces';
  import { ApplicationError } from '../utils/errors';
  import logger from '../utils/logger';
  
  /**
   * Service for managing contexts and their content
   */
  export class ContextService {
    constructor(
      private contextRepository: ContextRepository,
      private contentRepository: ContentRepository,
      private graphRepository: GraphRepository,
      private projectRepository: ProjectRepository
    ) {}
    
    /**
     * Get a context with all its content items
     */
    async getContextWithContent(
      contextId: string, 
      options?: SelectionOptions
    ): Promise<{
      context: Context;
      contentItems: ContentItem[];
      relationships: any[];
      tokenUsage: TokenUsage;
    }> {
      logger.info('Fetching context with content', { contextId });
      
      try {
        // Get the context
        const context = await this.contextRepository.findById(contextId);
        if (!context) {
          throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
        }
        
        // Get all context items based on selection options
        const contextItems = await this.contextRepository.getContentItems(contextId, options);
        
        // Get the content for each context item
        const contentItems: ContentItem[] = [];
        for (const item of contextItems) {
          const content = await this.contentRepository.findById(item.contentId);
          if (content) {
            contentItems.push(content);
          }
        }
        
        // Get the relationships between content items from Neo4j
        const contentIds = contentItems.map(item => item.id);
        const relationships = await this.graphRepository.runCypherQuery(
          `
          MATCH (c1:Content)-[r]-(c2:Content)
          WHERE c1.id IN $contentIds AND c2.id IN $contentIds
          RETURN c1.id AS sourceId, type(r) AS type, r AS relationship, c2.id AS targetId
          `,
          { contentIds }
        );
        
        // Get token usage statistics
        const tokenUsage = await this.contextRepository.getTokenUsage(contextId);
        
        return { context, contentItems, relationships, tokenUsage };
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to fetch context with content', { 
          contextId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to fetch context with content', 500, error);
      }
    }
    
    /**
     * Add a content item to a context
     */
    async addContentToContext(
      contextId: string, 
      contentId: string, 
      relevanceScore: number = 1.0,
      position?: number
    ): Promise<ContextItem> {
      logger.info('Adding content to context', { 
        contextId, 
        contentId, 
        relevanceScore
      });
      
      try {
        // Check if context exists
        const context = await this.contextRepository.findById(contextId);
        if (!context) {
          throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
        }
        
        // Check if content exists
        const content = await this.contentRepository.findById(contentId);
        if (!content) {
          throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
        }
        
        // Check if content belongs to the same project as the context
        if (content.projectId !== context.projectId) {
          throw new ApplicationError('Content belongs to a different project', 400);
        }
        
        // Add to PostgreSQL
        const contextItem = await this.contextRepository.addContentItem(
          contextId,
          contentId,
          relevanceScore,
          position
        );
        
        // Add to Neo4j graph
        await this.graphRepository.runCypherQuery(
          `
          MATCH (context:Context {id: $contextId}), (content:Content {id: $contentId})
          MERGE (context)-[r:INCLUDES]->(content)
          ON CREATE SET 
            r.relevanceScore = $relevanceScore, 
            r.addedAt = datetime(),
            r.id = $relationshipId
          ON MATCH SET 
            r.relevanceScore = $relevanceScore, 
            r.updatedAt = datetime()
          RETURN r
          `,
          { 
            contextId, 
            contentId, 
            relevanceScore,
            relationshipId: `${contextId}_${contentId}` 
          }
        );
        
        logger.info('Content added to context successfully', {
          contextId,
          contentId,
          relevanceScore
        });
        
        return contextItem;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to add content to context', { 
          contextId, 
          contentId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to add content to context', 500, error);
      }
    }
    
    /**
     * Remove a content item from a context
     */
    async removeContentFromContext(contextId: string, contentId: string): Promise<boolean> {
      logger.info('Removing content from context', { contextId, contentId });
      
      try {
        // Check if context exists
        const context = await this.contextRepository.findById(contextId);
        if (!context) {
          throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
        }
        
        // Remove from PostgreSQL
        const removed = await this.contextRepository.removeContentItem(contextId, contentId);
        
        // Remove from Neo4j graph
        await this.graphRepository.runCypherQuery(
          `
          MATCH (context:Context {id: $contextId})-[r:INCLUDES]->(content:Content {id: $contentId})
          DELETE r
          `,
          { contextId, contentId }
        );
        
        if (removed) {
          logger.info('Content removed from context successfully', {
            contextId,
            contentId
          });
        } else {
          logger.warn('Content not found in context', {
            contextId,
            contentId
          });
        }
        
        return removed;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to remove content from context', { 
          contextId, 
          contentId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to remove content from context', 500, error);
      }
    }
    
    /**
     * Create a relationship between two content items
     */
    async createContentRelationship(
      sourceId: string,
      targetId: string,
      type: RelationshipType,
      metadata: Record<string, any> = {}
    ): Promise<string> {
      logger.info('Creating content relationship', { 
        sourceId, 
        targetId, 
        type 
      });
      
      try {
        // Check if content items exist
        const source = await this.contentRepository.findById(sourceId);
        if (!source) {
          throw new ApplicationError(`Source content with ID ${sourceId} not found`, 404);
        }
        
        const target = await this.contentRepository.findById(targetId);
        if (!target) {
          throw new ApplicationError(`Target content with ID ${targetId} not found`, 404);
        }
        
        // Check if content items belong to the same project
        if (source.projectId !== target.projectId) {
          throw new ApplicationError('Content items belong to different projects', 400);
        }
        
        // Add to Neo4j graph
        const relationshipId = await this.graphRepository.createRelationship(
          sourceId,
          targetId,
          type,
          { ...metadata, createdAt: new Date().toISOString() }
        );
        
        logger.info('Content relationship created successfully', {
          sourceId,
          targetId,
          type,
          relationshipId
        });
        
        return relationshipId;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to create content relationship', { 
          sourceId, 
          targetId, 
          type, 
          error: error.message 
        });
        throw new ApplicationError('Failed to create content relationship', 500, error);
      }
    }
    
    /**
     * Find content items related to a given content item
     */
    async findRelatedContent(
      contentId: string, 
      relationshipType?: RelationshipType
    ): Promise<any[]> {
      logger.info('Finding related content', { 
        contentId, 
        relationshipType 
      });
      
      try {
        // Check if content exists
        const content = await this.contentRepository.findById(contentId);
        if (!content) {
          throw new ApplicationError(`Content with ID ${contentId} not found`, 404);
        }
        
        // Get related content from Neo4j
        const related = await this.graphRepository.findRelatedNodes(
          contentId,
          relationshipType,
          'BOTH'
        );
        
        // Map to a simpler structure
        const result = related.map(item => ({
          contentId: item.node.id,
          relationshipType: item.relationship.type,
          direction: item.direction,
          metadata: item.relationship
        }));
        
        logger.info('Found related content', {
          contentId,
          count: result.length
        });
        
        return result;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to find related content', { 
          contentId, 
          relationshipType, 
          error: error.message 
        });
        throw new ApplicationError('Failed to find related content', 500, error);
      }
    }
    
    /**
     * Optimize context by removing least relevant items to fit within token budget
     */
    async optimizeContext(contextId: string, tokenBudget: number): Promise<{
      removedItems: string[];
      remainingTokens: number;
    }> {
      logger.info('Optimizing context', { contextId, tokenBudget });
      
      try {
        // Check if context exists
        const context = await this.contextRepository.findById(contextId);
        if (!context) {
          throw new ApplicationError(`Context with ID ${contextId} not found`, 404);
        }
        
        // Use repository method to optimize
        const result = await this.contextRepository.optimizeContext(contextId, tokenBudget);
        
        logger.info('Context optimized successfully', {
          contextId,
          removedCount: result.removedItems.length,
          remainingTokens: result.remainingTokens
        });
        
        return result;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to optimize context', { 
          contextId, 
          tokenBudget, 
          error: error.message 
        });
        throw new ApplicationError('Failed to optimize context', 500, error);
      }
    }
    
    /**
     * Clone a context to another project or within the same project
     */
    async cloneContext(
      sourceContextId: string, 
      targetProjectId: string,
      newName?: string
    ): Promise<Context> {
      logger.info('Cloning context', { 
        sourceContextId, 
        targetProjectId 
      });
      
      try {
        // Check if source context exists
        const sourceContext = await this.contextRepository.findById(sourceContextId);
        if (!sourceContext) {
          throw new ApplicationError(`Source context with ID ${sourceContextId} not found`, 404);
        }
        
        // Check if target project exists
        const targetProject = await this.projectRepository.findById(targetProjectId);
        if (!targetProject) {
          throw new ApplicationError(`Target project with ID ${targetProjectId} not found`, 404);
        }
        
        // Clone the context using repository method
        const newContext = await this.contextRepository.cloneContext(
          sourceContextId,
          targetProjectId,
          newName || `${sourceContext.name} (Copy)`
        );
        
        logger.info('Context cloned successfully', {
          sourceContextId,
          newContextId: newContext.id,
          targetProjectId
        });
        
        return newContext;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to clone context', { 
          sourceContextId, 
          targetProjectId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to clone context', 500, error);
      }
    }
    
    /**
     * Get the hierarchy of contexts
     */
    async getContextHierarchy(projectId: string): Promise<any> {
      logger.info('Getting context hierarchy', { projectId });
      
      try {
        // Check if project exists
        const project = await this.projectRepository.findById(projectId);
        if (!project) {
          throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
        }
        
        // Use Neo4j to get the hierarchy
        const result = await this.graphRepository.runCypherQuery(
          `
          MATCH (p:Project {id: $projectId})-[:HAS_CONTEXT]->(c:Context)
          OPTIONAL MATCH path = (c)-[:PARENT_OF*]->(child:Context)
          RETURN c AS rootContext, path
          `,
          { projectId }
        );
        
        // Process the results into a hierarchical structure
        const hierarchyMap = new Map();
        
        // First, collect all root contexts
        result.forEach((item: any) => {
          const rootContext = item.rootContext;
          if (!hierarchyMap.has(rootContext.id)) {
            hierarchyMap.set(rootContext.id, {
              ...rootContext,
              children: []
            });
          }
        });
        
        // Then process paths to build the hierarchy
        result.forEach((item: any) => {
          if (item.path) {
            item.path.forEach((pathSegment: any) => {
              const parent = pathSegment.start;
              const child = pathSegment.end;
              
              // Find or create parent node in our map
              let parentNode = hierarchyMap.get(parent.id);
              if (!parentNode) {
                parentNode = { ...parent, children: [] };
                hierarchyMap.set(parent.id, parentNode);
              }
              
              // Add child to parent
              let childNode = hierarchyMap.get(child.id);
              if (!childNode) {
                childNode = { ...child, children: [] };
                hierarchyMap.set(child.id, childNode);
              }
              
              parentNode.children.push(childNode);
            });
          }
        });
        
        // Get just the root context nodes (those without parents)
        const rootContexts = [];
        for (const [id, context] of hierarchyMap.entries()) {
          if (!context.parentContextId) {
            rootContexts.push(context);
          }
        }
        
        return rootContexts;
      } catch (error: any) {
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        logger.error('Failed to get context hierarchy', { 
          projectId, 
          error: error.message 
        });
        throw new ApplicationError('Failed to get context hierarchy', 500, error);
      }
    }
  }














//   // src/services/context-service.ts
// import { ContextRepository, ContentRepository } from '../repositories/interfaces';
// import { Context, ContentItem } from '../types/core';
// import logger from '../utils/logger';
// import { 
//   ApplicationError, 
//   NotFoundError, 
//   ValidationError 
// } from '../utils/errors';

// export class ContextService {
//   constructor(
//     private contextRepository: ContextRepository,
//     private contentRepository: ContentRepository
//   ) {}
  
//   /**
//    * Get a context by ID
//    */
//   async getContextById(id: string): Promise<Context | null> {
//     try {
//       logger.debug('Getting context by ID', { id });
//       return await this.contextRepository.findById(id);
//     } catch (error: any) {
//       logger.error('Error getting context by ID', { id, error: error.message });
//       throw new ApplicationError('Failed to get context', 500, error);
//     }
//   }
  
//   /**
//    * Create a new context
//    */
//   async createContext(data: Partial<Context>): Promise<Context> {
//     try {
//       logger.info('Creating new context', { data });
      
//       if (!data.title) {
//         throw new ValidationError('Context title is required');
//       }
      
//       if (!data.projectId) {
//         throw new ValidationError('Project ID is required');
//       }
      
//       const context = await this.contextRepository.create(data as Context);
      
//       logger.info('Context created successfully', { id: context.id });
//       return context;
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error creating context', { error: error.message });
//       throw new ApplicationError('Failed to create context', 500, error);
//     }
//   }
  
//   /**
//    * Update a context
//    */
//   async updateContext(id: string, data: Partial<Context>): Promise<Context> {
//     try {
//       logger.info('Updating context', { id, data });
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(id);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Update the context
//       const updatedContext = await this.contextRepository.update(id, data);
      
//       logger.info('Context updated successfully', { id });
//       return updatedContext;
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error updating context', { id, error: error.message });
//       throw new ApplicationError('Failed to update context', 500, error);
//     }
//   }
  
//   /**
//    * Delete a context
//    */
//   async deleteContext(id: string): Promise<void> {
//     try {
//       logger.info('Deleting context', { id });
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(id);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Delete the context
//       await this.contextRepository.delete(id);
      
//       logger.info('Context deleted successfully', { id });
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error deleting context', { id, error: error.message });
//       throw new ApplicationError('Failed to delete context', 500, error);
//     }
//   }
  
//   /**
//    * Get content items for a context
//    */
//   async getContextContent(contextId: string): Promise<ContentItem[]> {
//     try {
//       logger.debug('Getting context content', { contextId });
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(contextId);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Get content items for the context
//       const contentItems = await this.contextRepository.getContentItems(contextId);
      
//       return contentItems;
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error getting context content', { contextId, error: error.message });
//       throw new ApplicationError('Failed to get context content', 500, error);
//     }
//   }
  
//   /**
//    * Add content to a context
//    */
//   async addContentToContext(
//     contextId: string, 
//     contentId: string,
//     metadata?: Record<string, any>
//   ): Promise<void> {
//     try {
//       logger.info('Adding content to context', { contextId, contentId });
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(contextId);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Check if content exists
//       const existingContent = await this.contentRepository.findById(contentId);
      
//       if (!existingContent) {
//         throw new NotFoundError('Content');
//       }
      
//       // Add content to context
//       await this.contextRepository.addContentItem(contextId, contentId, metadata);
      
//       logger.info('Content added to context successfully', { contextId, contentId });
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error adding content to context', { 
//         contextId, 
//         contentId, 
//         error: error.message 
//       });
      
//       throw new ApplicationError('Failed to add content to context', 500, error);
//     }
//   }
  
//   /**
//    * Remove content from a context
//    */
//   async removeContentFromContext(contextId: string, contentId: string): Promise<void> {
//     try {
//       logger.info('Removing content from context', { contextId, contentId });
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(contextId);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Remove content from context
//       await this.contextRepository.removeContentItem(contextId, contentId);
      
//       logger.info('Content removed from context successfully', { contextId, contentId });
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error removing content from context', { 
//         contextId, 
//         contentId, 
//         error: error.message 
//       });
      
//       throw new ApplicationError('Failed to remove content from context', 500, error);
//     }
//   }
  
//   /**
//    * Update content relevance in a context
//    */
//   async updateContentRelevance(
//     contextId: string,
//     contentId: string,
//     relevance: number
//   ): Promise<void> {
//     try {
//       logger.info('Updating content relevance', { contextId, contentId, relevance });
      
//       // Validate relevance value
//       if (relevance < 0 || relevance > 1) {
//         throw new ValidationError('Relevance must be between 0 and 1');
//       }
      
//       // Check if context exists
//       const existingContext = await this.contextRepository.findById(contextId);
      
//       if (!existingContext) {
//         throw new NotFoundError('Context');
//       }
      
//       // Check if content exists in context
//       const contentItems = await this.contextRepository.getContentItems(contextId);
//       const contentExists = contentItems.some(item => item.id === contentId);
      
//       if (!contentExists) {
//         throw new NotFoundError('Content in context');
//       }
      
//       // Update content relevance
//       await this.contextRepository.updateContentMetadata(contextId, contentId, { relevance });
      
//       logger.info('Content relevance updated successfully', { contextId, contentId });
//     } catch (error: any) {
//       if (error instanceof ApplicationError) {
//         throw error;
//       }
      
//       logger.error('Error updating content relevance', { 
//         contextId, 
//         contentId, 
//         relevance,
//         error: error.message 
//       });
      
//       throw new ApplicationError('Failed to update content relevance', 500, error);
//     }
//   }
// }