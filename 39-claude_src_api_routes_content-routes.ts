// src/api/routes/content-routes.ts
import express from 'express';
import multer from 'multer';
import { ContentController } from '../controllers/content-controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { contentValidator } from '../validators/content-validator';
import { container } from '../../config/container';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const router = express.Router();
const contentController = container.resolve<ContentController>('contentController');

/**
 * @route   GET /api/content/:id
 * @desc    Get content item by ID with its data
 * @access  Private
 */
router.get(
  '/:id',
  authenticate(),
  (req, res, next) => contentController.getContentById(req, res, next)
);

/**
 * @route   POST /api/content/text
 * @desc    Create a text content item
 * @access  Private
 */
router.post(
  '/text',
  authenticate(),
  validateRequest(contentValidator.createTextContent),
  (req, res, next) => contentController.createTextContent(req, res, next)
);

/**
 * @route   POST /api/content/code
 * @desc    Create a code content item
 * @access  Private
 */
router.post(
  '/code',
  authenticate(),
  validateRequest(contentValidator.createCodeContent),
  (req, res, next) => contentController.createCodeContent(req, res, next)
);

/**
 * @route   POST /api/content/image
 * @desc    Create an image content item
 * @access  Private
 */
router.post(
  '/image',
  authenticate(),
  upload.single('image'),
  validateRequest(contentValidator.createImageContent),
  (req, res, next) => contentController.createImageContent(req, res, next)
);

/**
 * @route   GET /api/content/:id/similar
 * @desc    Find similar content
 * @access  Private
 */
router.get(
  '/:id/similar',
  authenticate(),
  (req, res, next) => contentController.findSimilarContent(req, res, next)
);

/**
 * @route   GET /api/content/search
 * @desc    Search content
 * @access  Private
 */
router.get(
  '/search',
  authenticate(),
  (req, res, next) => contentController.searchContent(req, res, next)
);

/**
 * @route   GET /api/content/:id/tags
 * @desc    Get content tags
 * @access  Private
 */
router.get(
  '/:id/tags',
  authenticate(),
  (req, res, next) => contentController.getContentTags(req, res, next)
);

/**
 * @route   POST /api/content/:id/tags
 * @desc    Add tag to content
 * @access  Private
 */
router.post(
  '/:id/tags',
  authenticate(),
  validateRequest(contentValidator.addTag),
  (req, res, next) => contentController.addTagToContent(req, res, next)
);

/**
 * @route   DELETE /api/content/:id/tags/:tagId
 * @desc    Remove tag from content
 * @access  Private
 */
router.delete(
  '/:id/tags/:tagId',
  authenticate(),
  (req, res, next) => contentController.removeTagFromContent(req, res, next)
);

/**
 * @route   POST /api/content/:id/versions
 * @desc    Create a new version of content
 * @access  Private
 */
router.post(
  '/:id/versions',
  authenticate(),
  (req, res, next) => contentController.createContentVersion(req, res, next)
);

/**
 * @route   GET /api/content/:id/versions
 * @desc    Get content version history
 * @access  Private
 */
router.get(
  '/:id/versions',
  authenticate(),
  (req, res, next) => contentController.getContentVersionHistory(req, res, next)
);

export default router;