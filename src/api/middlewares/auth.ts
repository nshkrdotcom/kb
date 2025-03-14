// src/api/middlewares/auth.ts
//  import { Request, Response, NextFunction } from 'express';
//  import { AuthService } from '../../services/auth-service';
//  import { User } from '../../types/core';
//  import logger from '../../utils/logger';
//  import { ApplicationError } from '../../utils/errors';
//  import { container } from '../../config/container';
 
//  // Extend Express Request to include user property
//  declare global {
//    namespace Express {
//      interface Request {
//        user?: User;
//      }
//    }
//  }
 
//  /**
//   * Middleware to authenticate requests
//   * @param requiredRole Optional role or roles that the user must have
//   */
//  export function authenticate(requiredRole?: string | string[]) {
//    return async (req: Request, res: Response, next: NextFunction) => {
//      try {
//        // Get the authorization header
//        const authHeader = req.headers.authorization;
       
//        if (!authHeader) {
//          throw new ApplicationError('Authorization header is required', 401);
//        }
       
//        // Check if it's a Bearer token
//        if (!authHeader.startsWith('Bearer ')) {
//          throw new ApplicationError('Bearer token is required', 401);
//        }
       
//        // Extract the token
//        const token = authHeader.substring(7);
       
//        // Get the auth service from the container
//        const authService = container.resolve<AuthService>('authService');
       
//        // Verify the token
//        const user = await authService.verifyToken(token);
       
//        // Store the user in the request
//        req.user = user;
       
//        // Check role if required
//        if (requiredRole && !authService.checkRole(user, requiredRole)) {
//          throw new ApplicationError('Insufficient permissions', 403);
//        }
       
//        next();
//      } catch (error: any) {
//        if (error instanceof ApplicationError) {
//          return res.status(error.status).json({
//            error: error.message,
//            status: error.status
//          });
//        }
       
//        logger.error('Authentication error', { error: error.message });
//        return res.status(500).json({
//          error: 'Internal server error',
//          status: 500
//        });
//      }
//    };
//  }
 
//  /**
//   * Middleware to optionally authenticate requests
//   * Does not reject the request if no token is provided
//   */
//  export function optionalAuth() {
//    return async (req: Request, res: Response, next: NextFunction) => {
//      try {
//        // Get the authorization header
//        const authHeader = req.headers.authorization;
       
//        // Skip if no header
//        if (!authHeader || !authHeader.startsWith('Bearer ')) {
//          return next();
//        }
       
//        // Extract the token
//        const token = authHeader.substring(7);
       
//        // Get the auth service from the container
//        const authService = container.resolve<AuthService>('authService');
       
//        try {
//          // Verify the token
//          const user = await authService.verifyToken(token);
         
//          // Store the user in the request
//          req.user = user;
//        } catch (error) {
//          // Ignore token errors in optional auth
//          logger.debug('Optional auth token invalid', { error: (error as Error).message });
//        }
       
//        next();
//      } catch (error: any) {
//        // Continue without authentication in case of errors
//        logger.debug('Optional auth error', { error: error.message });
//        next();
//      }
//    };
//  }



// src/api/middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthService } from '../../services/auth-service';
import { User } from '../../types/core';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware that validates JWT token and attaches user to request
 * @param requiredRole Optional role required to access the route
 */
export function authMiddleware(requiredRole?: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the auth header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApplicationError('Authentication required', 401);
      }
      
      // Extract token
      const token = authHeader.substring(7);
      
      // Get auth service instance
      const authService = req.app.locals.services.authService as AuthService;
      
      if (!authService) {
        logger.error('AuthService not available');
        throw new ApplicationError('Internal server error', 500);
      }
      
      // Validate token
      const user = await authService.validateToken(token);
      
      if (!user) {
        throw new ApplicationError('Invalid or expired token', 401);
      }
      
      // Role-based authorization check
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        logger.warn('Unauthorized access attempt', { 
          userId: user.id,
          requiredRole,
          userRole: user.role,
          path: req.path
        });
        
        throw new ApplicationError('Insufficient permissions', 403);
      }
      
      // Attach user to request for use in route handlers
      req.user = user;
      
      // Continue to the route handler
      next();
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ 
          error: error.message,
          statusCode: error.statusCode
        });
      }
      
      logger.error('Authentication error', { error: error.message, path: req.path });
      
      res.status(500).json({
        error: 'Authentication failed',
        statusCode: 500
      });
    }
  };
}

/**
 * Optional authentication middleware that attaches user if token is valid
 * but doesn't require authentication
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Get the auth header
  const authHeader = req.headers.authorization;
  
  // If no auth header, continue without authentication
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  // Extract token
  const token = authHeader.substring(7);
  
  // Get auth service instance
  const authService = req.app.locals.services.authService as AuthService;
  
  if (!authService) {
    return next();
  }
  
  // Try to validate token
  authService.validateToken(token)
    .then(user => {
      if (user) {
        // Attach user to request if valid
        req.user = user;
      }
      next();
    })
    .catch(error => {
      // On error, just continue without attaching user
      logger.debug('Token validation failed in optional auth', { 
        error: error.message,
        path: req.path
      });
      next();
    });
}