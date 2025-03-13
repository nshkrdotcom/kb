// src/services/project-service.ts
import { Project, Context } from '../types/core';
import { 
  ProjectRepository, 
  ContextRepository, 
  GraphRepository, 
  ContentRepository 
} from '../repositories/interfaces';
import { ApplicationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Service for managing projects and their high-level operations
 */
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private contextRepository: ContextRepository,
    private graphRepository: GraphRepository,
    private contentRepository: ContentRepository
  ) {}
  
  /**
   * Create a new project with an initial main context
   */
  async createProject(
    name: string, 
    description: string, 
    ownerId: string,
    settings: Record<string, any> = {}
  ): Promise<{ project: Project; mainContext: Context }> {
    logger.info('Creating new project', { name, ownerId });
    
    try {
      // Create the project in PostgreSQL
      const project = await this.projectRepository.create({
        name,
        description,
        ownerId,
        settings,
        metadata: {}
      });
      
      // Create the main context for this project
      const mainContext = await this.contextRepository.create({
        projectId: project.id,
        name: 'Main Context',
        description: 'Default context for the project',
        creatorId: ownerId,
        isActive: true,
        settings: {}
      });
      
      // Create the project node in Neo4j
      await this.graphRepository.createNode(
        ['Project'],
        {
          id: project.id,
          name: project.name,
          description: project.description,
          ownerId: project.ownerId
        }
      );
      
      // Create the context node in Neo4j
      await this.graphRepository.createNode(
        ['Context'],
        {
          id: mainContext.id,
          name: mainContext.name,
          description: mainContext.description,
          projectId: mainContext.projectId
        }
      );
      
      // Create relationship between project and context
      await this.graphRepository.createRelationship(
        project.id,
        mainContext.id,
        'HAS_CONTEXT',
        { isPrimary: true }
      );
      
      logger.info('Project created successfully', { 
        projectId: project.id, 
        contextId: mainContext.id 
      });
      
      return { project, mainContext };
    } catch (error: any) {
      logger.error('Failed to create project', { 
        name, 
        ownerId, 
        error: error.message 
      });
      throw new ApplicationError('Failed to create project', 500, error);
    }
  }
  
  /**
   * Get a project with all its contexts and their structure
   */
  async getProjectWithContexts(projectId: string): Promise<{ 
    project: Project; 
    contexts: Context[];
    graph: { nodes: any[]; edges: any[] };
  }> {
    logger.info('Fetching project with contexts', { projectId });
    
    try {
      // Get project from PostgreSQL
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
      }
      
      // Get all contexts for this project
      const contexts = await this.contextRepository.findByProjectId(projectId);
      
      // Get the graph structure from Neo4j
      const graph = await this.graphRepository.getKnowledgeGraph(projectId);
      
      return { project, contexts, graph };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to fetch project with contexts', { 
        projectId, 
        error: error.message 
      });
      throw new ApplicationError('Failed to fetch project', 500, error);
    }
  }
  
  /**
   * Create a branch context from an existing context
   */
  async createContextBranch(
    projectId: string,
    parentContextId: string,
    name: string,
    description: string,
    creatorId: string,
    contentIds: string[] = [],
    settings: Record<string, any> = {}
  ): Promise<Context> {
    logger.info('Creating context branch', { 
      projectId, 
      parentContextId, 
      name 
    });
    
    try {
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
      }
      
      // Check if parent context exists
      const parentContext = await this.contextRepository.findById(parentContextId);
      if (!parentContext) {
        throw new ApplicationError(`Parent context with ID ${parentContextId} not found`, 404);
      }
      
      // Create the branch context
      const branchContext = await this.contextRepository.create({
        projectId,
        name,
        description,
        parentContextId,
        creatorId,
        isActive: true,
        settings
      });
      
      // Create the context node in Neo4j
      await this.graphRepository.createNode(
        ['Context'],
        {
          id: branchContext.id,
          name: branchContext.name,
          description: branchContext.description,
          projectId: branchContext.projectId
        }
      );
      
      // Create parent-child relationship in Neo4j
      await this.graphRepository.createRelationship(
        parentContextId,
        branchContext.id,
        'PARENT_OF',
        { createdAt: new Date().toISOString() }
      );
      
      // Add the project-context relationship
      await this.graphRepository.createRelationship(
        projectId,
        branchContext.id,
        'HAS_CONTEXT',
        { isPrimary: false }
      );
      
      // Add content items to the new context
      for (const contentId of contentIds) {
        await this.contextRepository.addContentItem(branchContext.id, contentId);
        
        // Also add the relationship in Neo4j
        await this.graphRepository.createRelationship(
          branchContext.id,
          contentId,
          'INCLUDES'
        );
      }
      
      logger.info('Context branch created successfully', {
        branchContextId: branchContext.id,
        parentContextId,
        contentCount: contentIds.length
      });
      
      return branchContext;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to create context branch', { 
        projectId, 
        parentContextId, 
        name, 
        error: error.message 
      });
      throw new ApplicationError('Failed to create context branch', 500, error);
    }
  }
  
  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<{
    contextCount: number;
    contentCount: number;
    totalTokens: number;
    collaboratorCount: number;
  }> {
    logger.info('Fetching project statistics', { projectId });
    
    try {
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
      }
      
      // Get counts from repositories
      const contextCount = await this.contextRepository.count({ projectId });
      const contentCount = await this.contentRepository.count({ projectId });
      const collaborators = await this.projectRepository.getCollaborators(projectId);
      
      // Calculate total tokens (this could be optimized with a specialized query)
      const contents = await this.contentRepository.findByProjectId(projectId);
      const totalTokens = contents.reduce((sum, content) => sum + content.tokens, 0);
      
      return {
        contextCount,
        contentCount,
        totalTokens,
        collaboratorCount: collaborators.length
      };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to fetch project statistics', { 
        projectId, 
        error: error.message 
      });
      throw new ApplicationError('Failed to fetch project statistics', 500, error);
    }
  }
  
  /**
   * Delete a project and all its associated data
   */
  async deleteProject(projectId: string): Promise<boolean> {
    logger.info('Deleting project', { projectId });
    
    try {
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
      }
      
      // Delete from Neo4j (this will cascade to all related nodes)
      await this.graphRepository.runCypherQuery(
        `
        MATCH (p:Project {id: $projectId})
        OPTIONAL MATCH (p)-[r]-()
        DELETE r, p
        `,
        { projectId }
      );
      
      // Delete from PostgreSQL (which should cascade to contexts and content items)
      const deleted = await this.projectRepository.delete(projectId);
      
      if (deleted) {
        logger.info('Project deleted successfully', { projectId });
      } else {
        logger.warn('Project not deleted', { projectId });
      }
      
      return deleted;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to delete project', { 
        projectId, 
        error: error.message 
      });
      throw new ApplicationError('Failed to delete project', 500, error);
    }
  }
  
  /**
   * Archive a project (soft delete)
   */
  async archiveProject(projectId: string): Promise<boolean> {
    logger.info('Archiving project', { projectId });
    
    try {
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new ApplicationError(`Project with ID ${projectId} not found`, 404);
      }
      
      // Archive the project
      const archived = await this.projectRepository.archive(projectId);
      
      if (archived) {
        logger.info('Project archived successfully', { projectId });
      } else {
        logger.warn('Project not archived', { projectId });
      }
      
      return archived;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to archive project', { 
        projectId, 
        error: error.message 
      });
      throw new ApplicationError('Failed to archive project', 500, error);
    }
  }
}