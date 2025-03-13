// src/api/controllers/project-controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../../services/project-service';
import { validateProject } from '../validators/project-validator';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * Controller for project-related endpoints
 */
export class ProjectController {
  constructor(private projectService: ProjectService) {}
  
  /**
   * Get all projects for a user
   */
  async getAllProjects(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real app, this would come from authenticated user
      const userId = req.query.userId as string;
      
      if (!userId) {
        throw new ApplicationError('User ID is required', 400);
      }
      
      const ownedProjects = await this.projectService.projectRepository.findByOwnerId(userId);
      const collaborationProjects = await this.projectService.projectRepository.findCollaborations(userId);
      
      return res.json({
        owned: ownedProjects,
        collaborations: collaborationProjects
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get a project by ID with its contexts
   */
  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const result = await this.projectService.getProjectWithContexts(id);
      
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, ownerId, settings } = req.body;
      
      // Validate request body
      const validationError = validateProject(req.body);
      if (validationError) {
        throw new ApplicationError(validationError, 400);
      }
      
      const result = await this.projectService.createProject(
        name,
        description,
        ownerId,
        settings
      );
      
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a project
   */
  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, settings, metadata } = req.body;
      
      // Get the project to check if it exists
      const project = await this.projectService.projectRepository.findById(id);
      
      if (!project) {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
      
      // Update the project
      const updatedProject = await this.projectService.projectRepository.update(id, {
        name,
        description,
        settings,
        metadata
      });
      
      // Update in Neo4j as well
      await this.projectService.graphRepository.updateNode(
        id,
        {
          name: name,
          description: description
        }
      );
      
      return res.json({ project: updatedProject });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a project
   */
  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const result = await this.projectService.deleteProject(id);
      
      if (result) {
        return res.status(204).send();
      } else {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Archive a project (soft delete)
   */
  async archiveProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const result = await this.projectService.archiveProject(id);
      
      if (result) {
        return res.json({ success: true, message: 'Project archived successfully' });
      } else {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get project statistics
   */
  async getProjectStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const stats = await this.projectService.getProjectStats(id);
      
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add a collaborator to a project
   */
  async addCollaborator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        throw new ApplicationError('User ID and role are required', 400);
      }
      
      const project = await this.projectService.projectRepository.findById(id);
      
      if (!project) {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
      
      const result = await this.projectService.projectRepository.addCollaborator(id, userId, role);
      
      return res.json({
        success: result,
        projectId: id,
        userId,
        role
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Remove a collaborator from a project
   */
  async removeCollaborator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      
      const project = await this.projectService.projectRepository.findById(id);
      
      if (!project) {
        throw new ApplicationError(`Project with ID ${id} not found`, 404);
      }
      
      const result = await this.projectService.projectRepository.removeCollaborator(id, userId);
      
      return res.json({
        success: result,
        projectId: id,
        userId
      });
    } catch (error) {
      next(error);
    }
  }
}