// src/repositories/postgres/context-repository.ts
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../db/postgres/connection';
import { Context, ContextItem, SelectionOptions, TokenUsage } from '../../types/core';
import { ContextRepository } from '../interfaces';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * PostgreSQL implementation of the ContextRepository interface
 */
export class PostgresContextRepository implements ContextRepository {
  /**
   * Find a context by ID
   */
  async findById(id: string): Promise<Context | null> {
    try {
      const result = await query(
        'SELECT * FROM contexts WHERE id = $1',
        [id]
      );
      
      return result.rows.length ? this.mapToContext(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding context by ID', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find all contexts matching a filter
   */
  async findAll(filter?: Partial<Context>): Promise<Context[]> {
    try {
      let queryText = 'SELECT * FROM contexts';
      const queryParams: any[] = [];
      
      if (filter) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        // Build conditions based on filter properties
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            // Convert camelCase to snake_case for DB column names
            const columnName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            conditions.push(`${columnName} = $${paramIndex}`);
            queryParams.push(value);
            paramIndex++;
          }
        });
        
        if (conditions.length) {
          queryText += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      // Always sort by position and then creation date
      queryText += ' ORDER BY position ASC, created_at DESC';
      
      const result = await query(queryText, queryParams);
      return result.rows.map(this.mapToContext);
    } catch (error: any) {
      logger.error('Error finding all contexts', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Create a new context
   */
  async create(entity: Omit<Context, 'id' | 'createdAt' | 'updatedAt'>): Promise<Context> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      // Get max position if position not provided
      let position = entity.position;
      if (position === undefined) {
        const posResult = await query(
          'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM contexts WHERE project_id = $1',
          [entity.projectId]
        );
        position = posResult.rows[0].next_pos;
      }
      
      const result = await query(
        `INSERT INTO contexts (
          id, project_id, name, description, parent_context_id, created_at, updated_at, 
          creator_id, is_active, settings, position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          id,
          entity.projectId,
          entity.name,
          entity.description || null,
          entity.parentContextId || null,
          now,
          now,
          entity.creatorId,
          entity.isActive !== undefined ? entity.isActive : true,
          JSON.stringify(entity.settings || {}),
          position
        ]
      );
      
      return this.mapToContext(result.rows[0]);
    } catch (error: any) {
      logger.error('Error creating context', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Update a context
   */
  async update(id: string, entity: Partial<Context>): Promise<Context> {
    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (entity.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(entity.name);
      }
      
      if (entity.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(entity.description);
      }
      
      if (entity.parentContextId !== undefined) {
        updates.push(`parent_context_id = $${paramIndex++}`);
        values.push(entity.parentContextId || null);
      }
      
      if (entity.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(entity.isActive);
      }
      
      if (entity.settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(entity.settings));
      }
      
      if (entity.position !== undefined) {
        updates.push(`position = $${paramIndex++}`);
        values.push(entity.position);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add the id as the last parameter
      values.push(id);
      
      const result = await query(
        `UPDATE contexts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new ApplicationError(`Context with ID ${id} not found`, 404);
      }
      
      return this.mapToContext(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating context', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Delete a context
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM contexts WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error deleting context', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find contexts by project ID
   */
  async findByProjectId(projectId: string): Promise<Context[]> {
    try {
      const result = await query(
        'SELECT * FROM contexts WHERE project_id = $1 ORDER BY position ASC, created_at ASC',
        [projectId]
      );
      
      return result.rows.map(this.mapToContext);
    } catch (error: any) {
      logger.error('Error finding contexts by project ID', { error: error.message, projectId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find child contexts
   */
  async findChildren(contextId: string): Promise<Context[]> {
    try {
      const result = await query(
        'SELECT * FROM contexts WHERE parent_context_id = $1 ORDER BY position ASC, created_at ASC',
        [contextId]
      );
      
      return result.rows.map(this.mapToContext);
    } catch (error: any) {
      logger.error('Error finding child contexts', { error: error.message, contextId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find ancestor contexts
   */
  async findAncestors(contextId: string): Promise<Context[]> {
    try {
      // Use a recursive CTE to find all ancestors
      const result = await query(
        `WITH RECURSIVE context_ancestors AS (
          SELECT * FROM contexts WHERE id = $1
          UNION
          SELECT c.* FROM contexts c
          INNER JOIN context_ancestors ca ON c.id = ca.parent_context_id
        )
        SELECT * FROM context_ancestors WHERE id != $1
        ORDER BY position ASC, created_at ASC`,
        [contextId]
      );
      
      return result.rows.map(this.mapToContext);
    } catch (error: any) {
      logger.error('Error finding ancestor contexts', { error: error.message, contextId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Get full path from root to the context
   */
  async getFullPath(contextId: string): Promise<Context[]> {
    try {
      // Use with recursive to get the path from root to the context
      const result = await query(
        `WITH RECURSIVE context_path AS (
          SELECT *, 0 as depth FROM contexts WHERE id = $1
          UNION
          SELECT c.*, cp.depth + 1 FROM contexts c
          INNER JOIN context_path cp ON c.id = cp.parent_context_id
        )
        SELECT * FROM context_path
        ORDER BY depth DESC`,
        [contextId]
      );
      
      return result.rows.map(this.mapToContext);
    } catch (error: any) {
      logger.error('Error getting context path', { error: error.message, contextId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Add a content item to a context
   */
  async addContentItem(
    contextId: string, 
    contentId: string, 
    relevance: number = 1.0,
    position?: number
  ): Promise<ContextItem> {
    try {
      // Get max position if position not provided
      if (position === undefined) {
        const posResult = await query(
          'SELECT COALESCE(MAX(order_position), 0) + 1 as next_pos FROM context_items WHERE context_id = $1',
          [contextId]
        );
        position = posResult.rows[0].next_pos;
      }
      
      // Insert or update the context item
      const result = await query(
        `INSERT INTO context_items (
          context_id, content_id, relevance_score, added_at, added_by, order_position
        ) VALUES ($1, $2, $3, NOW(), (SELECT creator_id FROM contexts WHERE id = $1), $4)
        ON CONFLICT (context_id, content_id) 
        DO UPDATE SET 
          relevance_score = $3,
          order_position = $4
        RETURNING *`,
        [contextId, contentId, relevance, position]
      );
      
      return {
        contextId: result.rows[0].context_id,
        contentId: result.rows[0].content_id,
        relevanceScore: result.rows[0].relevance_score,
        addedAt: result.rows[0].added_at,
        addedBy: result.rows[0].added_by,
        orderPosition: result.rows[0].order_position
      };
    } catch (error: any) {
      logger.error('Error adding content to context', { 
        error: error.message, 
        contextId,
        contentId 
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Remove a content item from a context
   */
  async removeContentItem(contextId: string, contentId: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM context_items WHERE context_id = $1 AND content_id = $2 RETURNING context_id',
        [contextId, contentId]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error removing content from context', { 
        error: error.message, 
        contextId,
        contentId 
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Get content items for a context
   */
  async getContentItems(
    contextId: string, 
    options?: SelectionOptions
  ): Promise<ContextItem[]> {
    try {
      let queryText = `
        SELECT ci.*, c.tokens
        FROM context_items ci
        JOIN content_items c ON ci.content_id = c.id
        WHERE ci.context_id = $1`;
      
      const queryParams: any[] = [contextId];
      let paramIndex = 2;
      
      // Apply relevance threshold filter
      if (options?.relevanceThreshold !== undefined) {
        queryText += ` AND ci.relevance_score >= $${paramIndex}`;
        queryParams.push(options.relevanceThreshold);
        paramIndex++;
      }
      
      // Apply content type filter
      if (options?.contentTypes !== undefined && options.contentTypes.length > 0) {
        queryText += ` AND c.content_type IN (${options.contentTypes.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        options.contentTypes.forEach(type => {
          queryParams.push(type);
        });
        paramIndex += options.contentTypes.length;
      }
      
      // Apply exclude content IDs filter
      if (options?.excludeContentIds !== undefined && options.excludeContentIds.length > 0) {
        queryText += ` AND ci.content_id NOT IN (${options.excludeContentIds.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        options.excludeContentIds.forEach(id => {
          queryParams.push(id);
        });
        paramIndex += options.excludeContentIds.length;
      }
      
      // Apply prioritize content IDs - we'll use a CASE expression for ordering
      let priorityCase = '';
      if (options?.prioritizeContentIds !== undefined && options.prioritizeContentIds.length > 0) {
        priorityCase = `
          CASE WHEN ci.content_id IN (${options.prioritizeContentIds.map((_, i) => `$${paramIndex + i}`).join(', ')}) THEN 0 ELSE 1 END,`;
        options.prioritizeContentIds.forEach(id => {
          queryParams.push(id);
        });
      }
      
      // Order by priority (if specified), then position, then relevance
      queryText += ` ORDER BY ${priorityCase} ci.order_position ASC, ci.relevance_score DESC`;
      
      // Apply token limit by using a CTE to calculate running total of tokens
      if (options?.maxTokens !== undefined) {
        queryText = `
          WITH context_contents AS (${queryText}),
          running_tokens AS (
            SELECT 
              *,
              SUM(tokens) OVER (ORDER BY ${priorityCase} order_position ASC, relevance_score DESC) as running_total
            FROM context_contents
          )
          SELECT * FROM running_tokens 
          WHERE running_total <= $${paramIndex}`;
        queryParams.push(options.maxTokens);
      }
      
      const result = await query(queryText, queryParams);
      
      return result.rows.map(row => ({
        contextId: row.context_id,
        contentId: row.content_id,
        relevanceScore: row.relevance_score,
        addedAt: row.added_at,
        addedBy: row.added_by,
        orderPosition: row.order_position
      }));
    } catch (error: any) {
      logger.error('Error getting context items', { 
        error: error.message, 
        contextId,
        options 
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Update the relevance score of a content item in a context
   */
  async updateContentItemRelevance(
    contextId: string, 
    contentId: string, 
    relevance: number
  ): Promise<boolean> {
    try {
      const result = await query(
        `UPDATE context_items 
         SET relevance_score = $3
         WHERE context_id = $1 AND content_id = $2
         RETURNING context_id`,
        [contextId, contentId, relevance]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error updating content relevance', { 
        error: error.message, 
        contextId,
        contentId 
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Reorder content items in a context
   */
  async reorderContentItems(
    contextId: string, 
    orderedContentIds: string[]
  ): Promise<boolean> {
    try {
      return await transaction(async (client) => {
        // Update each content item's position
        for (let i = 0; i < orderedContentIds.length; i++) {
          await client.query(
            `UPDATE context_items 
             SET order_position = $3
             WHERE context_id = $1 AND content_id = $2`,
            [contextId, orderedContentIds[i], i + 1]
          );
        }
        
        return true;
      });
    } catch (error: any) {
      logger.error('Error reordering content items', { 
        error: error.message, 
        contextId,
        contentCount: orderedContentIds.length 
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Get token usage for a context
   */
  async getTokenUsage(contextId: string): Promise<TokenUsage> {
    try {
      const result = await query(
        `SELECT 
           COUNT(ci.content_id) as content_count,
           COALESCE(SUM(c.tokens), 0) as total_tokens,
           CASE 
             WHEN COUNT(ci.content_id) > 0 THEN COALESCE(SUM(c.tokens), 0) / COUNT(ci.content_id)
             ELSE 0
           END as avg_tokens
         FROM context_items ci
         JOIN content_items c ON ci.content_id = c.id
         WHERE ci.context_id = $1`,
        [contextId]
      );
      
      // Get token limit from context settings or use default
      const contextResult = await query(
        'SELECT settings FROM contexts WHERE id = $1',
        [contextId]
      );
      
      const settings = contextResult.rows.length > 0 ? contextResult.rows[0].settings : {};
      const tokenLimit = settings.tokenLimit || 100000; // Default limit
      
      const totalTokens = parseInt(result.rows[0].total_tokens) || 0;
      const contentCount = parseInt(result.rows[0].content_count) || 0;
      const avgTokens = parseFloat(result.rows[0].avg_tokens) || 0;
      
      return {
        totalTokens,
        contentCount,
        averageTokensPerItem: avgTokens,
        tokenLimit,
        percentUsed: tokenLimit > 0 ? (totalTokens / tokenLimit) * 100 : 0
      };
    } catch (error: any) {
      logger.error('Error getting token usage', { 
        error: error.message, 
        contextId
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Optimize context to fit within token budget
   */
  async optimizeContext(
    contextId: string, 
    tokenBudget: number
  ): Promise<{ removedItems: string[]; remainingTokens: number }> {
    try {
      return await transaction(async (client) => {
        // Get current token usage
        const usageResult = await client.query(
          `SELECT 
             SUM(c.tokens) as total_tokens
           FROM context_items ci
           JOIN content_items c ON ci.content_id = c.id
           WHERE ci.context_id = $1`,
          [contextId]
        );
        
        const totalTokens = parseInt(usageResult.rows[0].total_tokens) || 0;
        
        // If already under budget, no optimization needed
        if (totalTokens <= tokenBudget) {
          return {
            removedItems: [],
            remainingTokens: totalTokens
          };
        }
        
        // Get all items ordered by relevance (ascending so least relevant comes first)
        const itemsResult = await client.query(
          `SELECT 
             ci.content_id,
             c.tokens,
             ci.relevance_score
           FROM context_items ci
           JOIN content_items c ON ci.content_id = c.id
           WHERE ci.context_id = $1
           ORDER BY ci.relevance_score ASC, ci.order_position DESC`,
          [contextId]
        );
        
        // Remove items until we're under budget
        const removedItems: string[] = [];
        let currentTokens = totalTokens;
        
        for (const item of itemsResult.rows) {
          if (currentTokens <= tokenBudget) {
            break;
          }
          
          const itemTokens = parseInt(item.tokens) || 0;
          
          // Remove this item
          await client.query(
            'DELETE FROM context_items WHERE context_id = $1 AND content_id = $2',
            [contextId, item.content_id]
          );
          
          removedItems.push(item.content_id);
          currentTokens -= itemTokens;
        }
        
        return {
          removedItems,
          remainingTokens: currentTokens
        };
      });
    } catch (error: any) {
      logger.error('Error optimizing context', { 
        error: error.message, 
        contextId,
        tokenBudget
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Clone a context to another project
   */
  async cloneContext(
    sourceContextId: string, 
    targetProjectId: string,
    newName?: string
  ): Promise<Context> {
    try {
      return await transaction(async (client) => {
        // Get source context
        const sourceResult = await client.query(
          'SELECT * FROM contexts WHERE id = $1',
          [sourceContextId]
        );
        
        if (sourceResult.rows.length === 0) {
          throw new ApplicationError(`Source context with ID ${sourceContextId} not found`, 404);
        }
        
        const sourceContext = this.mapToContext(sourceResult.rows[0]);
        
        // Create new context
        const newContextId = uuidv4();
        const now = new Date();
        
        await client.query(
          `INSERT INTO contexts (
            id, project_id, name, description, parent_context_id, created_at, updated_at, 
            creator_id, is_active, settings, position
          ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10)`,
          [
            newContextId,
            targetProjectId,
            newName || `${sourceContext.name} (Clone)`,
            sourceContext.description,
            now,
            now,
            sourceContext.creatorId,
            true,
            JSON.stringify(sourceContext.settings || {}),
            0 // Will be at the beginning
          ]
        );
        
        // Clone context items if source and target projects are the same
        // If different projects, user needs to manually add items
        if (sourceContext.projectId === targetProjectId) {
          // Clone all content items
          await client.query(
            `INSERT INTO context_items (
              context_id, content_id, relevance_score, added_at, added_by, order_position
            )
            SELECT $1, content_id, relevance_score, NOW(), added_by, order_position
            FROM context_items
            WHERE context_id = $2`,
            [newContextId, sourceContextId]
          );
        }
        
        // Get the newly created context
        const newContextResult = await client.query(
          'SELECT * FROM contexts WHERE id = $1',
          [newContextId]
        );
        
        return this.mapToContext(newContextResult.rows[0]);
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error cloning context', { 
        error: error.message, 
        sourceContextId,
        targetProjectId
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Merge two contexts
   */
  async mergeContexts(
    sourceContextId: string, 
    targetContextId: string
  ): Promise<boolean> {
    try {
      return await transaction(async (client) => {
        // Verify both contexts exist
        const contextsResult = await client.query(
          'SELECT id, project_id FROM contexts WHERE id IN ($1, $2)',
          [sourceContextId, targetContextId]
        );
        
        if (contextsResult.rows.length !== 2) {
          throw new ApplicationError('One or both contexts not found', 404);
        }
        
        // Verify contexts are in the same project
        const sourceProject = contextsResult.rows.find(r => r.id === sourceContextId)?.project_id;
        const targetProject = contextsResult.rows.find(r => r.id === targetContextId)?.project_id;
        
        if (sourceProject !== targetProject) {
          throw new ApplicationError('Cannot merge contexts from different projects', 400);
        }
        
        // Merge content items from source to target
        await client.query(
          `INSERT INTO context_items (
            context_id, content_id, relevance_score, added_at, added_by, order_position
          )
          SELECT $2, content_id, relevance_score, NOW(), added_by,
                 (SELECT COALESCE(MAX(order_position), 0) FROM context_items WHERE context_id = $2) + 
                 row_number() OVER (ORDER BY order_position)
          FROM context_items
          WHERE context_id = $1
          ON CONFLICT (context_id, content_id)
          DO UPDATE SET
            relevance_score = GREATEST(context_items.relevance_score, EXCLUDED.relevance_score)`,
          [sourceContextId, targetContextId]
        );
        
        return true;
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error merging contexts', { 
        error: error.message, 
        sourceContextId,
        targetContextId
      });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Count contexts matching a filter
   */
  async count(filter?: Partial<Context>): Promise<number> {
    try {
      let queryText = 'SELECT COUNT(*) FROM contexts';
      const queryParams: any[] = [];
      
      if (filter) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        // Build conditions based on filter properties
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            // Convert camelCase to snake_case for DB column names
            const columnName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            conditions.push(`${columnName} = $${paramIndex}`);
            queryParams.push(value);
            paramIndex++;
          }
        });
        
        if (conditions.length) {
          queryText += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      const result = await query(queryText, queryParams);
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      logger.error('Error counting contexts', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Map database row to Context object
   */
  private mapToContext(row: any): Context {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      description: row.description,
      parentContextId: row.parent_context_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creatorId: row.creator_id,
      isActive: row.is_active,
      settings: row.settings,
      position: row.position
    };
  }
}