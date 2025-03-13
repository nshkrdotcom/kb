// src/api/routes/project-routes.ts
import express from 'express';
import { ProjectController } from '../controllers/project-controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { projectValidator } from '../validators/project-validator';
import { container } from '../../config/container';

const router = express.Router();
const projectController = container.resolve<ProjectController>('projectController');

/**
 * @route   GET /api/projects
 * @desc    Get all projects for a user
 * @access  Private
 */
router.get(
  '/',
  authenticate(),
  (req, res, next) => projectController.getAllProjects(req, res, next)
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a project by ID with its contexts
 * @access  Private
 */
router.get(
  '/:id',
  authenticate(),
  (req, res, next) => projectController.getProjectById(req, res, next)
);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post(
  '/',
  authenticate(),
  validateRequest(projectValidator.createProject),
  (req, res, next) => projectController.createProject(req, res, next)
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private
 */
router.put(
  '/:id',
  authenticate(),
  validateRequest(projectValidator.updateProject),
  (req, res, next) => projectController.updateProject(req, res, next)
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate(),
  (req, res, next) => projectController.deleteProject(req, res, next)
);

/**
 * @route   POST /api/projects/:id/archive
 * @desc    Archive a project (soft delete)
 * @access  Private
 */
router.post(
  '/:id/archive',
  authenticate(),
  (req, res, next) => projectController.archiveProject(req, res, next)
);

/**
 * @route   GET /api/projects/:id/stats
 * @desc    Get project statistics
 * @access  Private
 */
router.get(
  '/:id/stats',
  authenticate(),
  (req, res, next) => projectController.getProjectStats(req, res, next)
);

/**
 * @route   POST /api/projects/:id/collaborators
 * @desc    Add a collaborator to a project
 * @access  Private
 */
router.post(
  '/:id/collaborators',
  authenticate(),
  validateRequest(projectValidator.addCollaborator),
  (req, res, next) => projectController.addCollaborator(req, res, next)
);

/**
 * @route   DELETE /api/projects/:id/collaborators/:userId
 * @desc    Remove a collaborator from a project
 * @access  Private
 */
router.delete(
  '/:id/collaborators/:userId',
  authenticate(),
  (req, res, next) => projectController.removeCollaborator(req, res, next)
);

export default router;