// src/repositories/postgres/user-repository.ts
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { query, transaction } from '../../db/postgres/connection';
import { User } from '../../types/core';
import { UserRepository } from '../interfaces';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * PostgreSQL implementation of the UserRepository interface
 */
export class PostgresUserRepository implements UserRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      return result.rows.length ? this.mapToUser(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding user by ID', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      
      return result.rows.length ? this.mapToUser(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding user by email', { error: error.message, email });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find multiple users by their IDs
   */
  async findByIds(ids: string[]): Promise<User[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      
      // Create parameterized query with the correct number of placeholders
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
      const result = await query(
        `SELECT * FROM users WHERE id IN (${placeholders})`,
        ids
      );
      
      return result.rows.map(this.mapToUser);
    } catch (error: any) {
      logger.error('Error finding users by IDs', { error: error.message, count: ids.length });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Find all users matching a filter
   */
  async findAll(filter?: Partial<User>): Promise<User[]> {
    try {
      let queryText = 'SELECT * FROM users';
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
      return result.rows.map(this.mapToUser);
    } catch (error: any) {
      logger.error('Error finding all users', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Create a new user
   */
  async create(entity: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.findByEmail(entity.email);
      if (existingUser) {
        throw new ApplicationError(`User with email ${entity.email} already exists`, 409);
      }
      
      const id = uuidv4();
      const now = new Date();
      
      // Hash password if it exists in entity
      let hashedPassword: string | undefined;
      if ((entity as any).password) {
        hashedPassword = await bcrypt.hash(
          (entity as any).password, 
          config.auth.saltRounds
        );
      }
      
      const result = await query(
        `INSERT INTO users (
          id, email, name, created_at, updated_at, settings, 
          last_login, role, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          id,
          entity.email.toLowerCase(), 
          entity.name,
          now,
          now,
          JSON.stringify(entity.settings || {}),
          entity.lastLogin || null,
          entity.role || 'user',
          hashedPassword || null
        ]
      );
      
      return this.mapToUser(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error creating user', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Update a user
   */
  async update(id: string, entity: Partial<User>): Promise<User> {
    try {
      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (entity.email !== undefined) {
        // Check if the new email is already in use by a different user
        if (entity.email) {
          const existingUser = await this.findByEmail(entity.email);
          if (existingUser && existingUser.id !== id) {
            throw new ApplicationError(`Email ${entity.email} is already in use`, 409);
          }
        }
        
        updates.push(`email = $${paramIndex++}`);
        values.push(entity.email.toLowerCase());
      }
      
      if (entity.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(entity.name);
      }
      
      if (entity.settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(entity.settings));
      }
      
      if (entity.lastLogin !== undefined) {
        updates.push(`last_login = $${paramIndex++}`);
        values.push(entity.lastLogin);
      }
      
      if (entity.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(entity.role);
      }
      
      // Handle password update separately
      if ((entity as any).password !== undefined) {
        const hashedPassword = await bcrypt.hash(
          (entity as any).password, 
          config.auth.saltRounds
        );
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(hashedPassword);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add the id as the last parameter
      values.push(id);
      
      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new ApplicationError(`User with ID ${id} not found`, 404);
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating user', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Update a user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    try {
      const now = new Date();
      
      const result = await query(
        'UPDATE users SET last_login = $1, updated_at = $1 WHERE id = $2 RETURNING *',
        [now, id]
      );
      
      if (result.rows.length === 0) {
        throw new ApplicationError(`User with ID ${id} not found`, 404);
      }
      
      return this.mapToUser(result.rows[0]);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error updating user last login', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error: any) {
      logger.error('Error deleting user', { error: error.message, id });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Count users matching a filter
   */
  async count(filter?: Partial<User>): Promise<number> {
    try {
      let queryText = 'SELECT COUNT(*) FROM users';
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
      logger.error('Error counting users', { error: error.message });
      throw new ApplicationError('Database error', 500, error);
    }
  }
  
  /**
   * Verify a user's password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      // Get user with password hash
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      // Verify password
      if (!user.password_hash) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return this.mapToUser(user);
    } catch (error: any) {
      logger.error('Error verifying password', { error: error.message, email });
      throw new ApplicationError('Authentication error', 500, error);
    }
  }
  
  /**
   * Map database row to User object
   */
  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      settings: row.settings || {},
      lastLogin: row.last_login,
      role: row.role
    };
  }
}