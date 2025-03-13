// src/repositories/postgres/project-repository.ts
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../db/postgres/connection';
import { Project } from '../../types/core';
import { ProjectRepository } from '../interfaces';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * PostgreSQL implementation of the ProjectRepository interface
 */
export class PostgresProjectRepository implements ProjectRepository {
  /**
   * Find a project by ID
   */
  async findById(id: string): Promise<Project | null> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      );
      
      return result.rows.length ? this.mapToProject(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding project by ID', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find all projects matching a filter
   */
  async findAll(filter?: Partial<Project>): Promise<Project[]> {
    try {
      let queryText = 'SELECT * FROM projects';
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
      
      // Always sort by creation date
      queryText += ' ORDER BY created_at DESC';
      
      const result = await query(queryText, queryParams);
      return result.rows.map(this.mapToProject);
    } catch (error: any) {
      logger.error('Error finding all projects', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Create a new project
   */
  async create(entity: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const result = await query(
        `INSERT INTO projects (
          id, name, description, owner_id, settings, metadata, created_at, updated_at, is_archived
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          id,
          entity.name, 
          entity.description || null, 
          entity.ownerId,
          JSON.stringify(entity.settings || {}),
          JSON.stringify(entity.metadata || {}),
          now,
          now,
          false
        ]
      );
      
      return this.mapToProject(result.rows[0]);
    } catch (error: any) {
      logger.error('Error creating project', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Update a project
   */
  async update(id: string, entity: Partial<Project>): Promise<Project> {
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
      
      if (entity.settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(entity.settings));
      }
      
      if (entity.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(entity.metadata));
      }
      
      if (entity.isArchived !== undefined) {
        updates.push(`is_archived = $${paramIndex++}`);
        values.push(entity.isArchived);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add the id as the last parameter
      values.push(id);
      
      const result = await query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
      
      return this.mapToProject(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating project', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM projects WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error deleting project', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find projects by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<Project[]> {
    try {
      const result = await query(
        'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
        [ownerId]
      );
      
      return result.rows.map(this.mapToProject);
    } catch (error: any) {
      logger.error('Error finding projects by owner ID', { error: error.message, ownerId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find projects the user collaborates on
   */
  async findCollaborations(userId: string): Promise<Project[]> {
    try {
      const result = await query(
        `SELECT p.* FROM projects p
         JOIN project_users pu ON p.id = pu.project_id
         WHERE pu.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );
      
      return result.rows.map(this.mapToProject);
    } catch (error: any) {
      logger.error('Error finding collaborations', { error: error.message, userId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find active (non-archived) projects for a user
   */
  async findActiveProjects(userId: string): Promise<Project[]> {
    try {
      const result = await query(
        `SELECT p.* FROM projects p
         WHERE (p.owner_id = $1 OR EXISTS (
           SELECT 1 FROM project_users pu 
           WHERE pu.project_id = p.id AND pu.user_id = $1
         ))
         AND p.is_archived = false
         ORDER BY p.updated_at DESC`,
        [userId]
      );
      
      return result.rows.map(this.mapToProject);
    } catch (error: any) {
      logger.error('Error finding active projects', { error: error.message, userId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Archive a project (soft delete)
   */
  async archive(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE projects SET is_archived = true, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error archiving project', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Unarchive a project
   */
  async unarchive(id: string): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE projects SET is_archived = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error unarchiving project', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Add a collaborator to a project
   */
  async addCollaborator(projectId: string, userId: string, role: string): Promise<boolean> {
    try {
      const result = await query(
        `INSERT INTO project_users (project_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (project_id, user_id) 
         DO UPDATE SET role = $3, settings = project_users.settings
         RETURNING project_id`,
        [projectId, userId, role]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error adding collaborator', { error: error.message, projectId, userId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Remove a collaborator from a project
   */
  async removeCollaborator(projectId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM project_users WHERE project_id = $1 AND user_id = $2 RETURNING project_id',
        [projectId, userId]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error removing collaborator', { error: error.message, projectId, userId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Get collaborators for a project
   */
  async getCollaborators(projectId: string): Promise<{userId: string, role: string}[]> {
    try {
      const result = await query(
        'SELECT user_id, role FROM project_users WHERE project_id = $1',
        [projectId]
      );
      
      return result.rows.map(row => ({
        userId: row.user_id,
        role: row.role
      }));
    } catch (error: any) {
      logger.error('Error getting collaborators', { error: error.message, projectId });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Count projects matching a filter
   */
  async count(filter?: Partial<Project>): Promise<number> {
    try {
      let queryText = 'SELECT COUNT(*) FROM projects';
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
      logger.error('Error counting projects', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Map database row to Project object
   */
  private mapToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      settings: row.settings,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isArchived: row.is_archived
    };
  }
}