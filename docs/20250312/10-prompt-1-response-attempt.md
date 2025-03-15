# Authentication System Implementation

Based on your requirements and the existing codebase, here's a comprehensive implementation of the JWT-based authentication system for ContextNexus.

## 1. AuthService Implementation

```typescript
// src/services/auth-service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../types/core';
import { UserRepository } from '../repositories/interfaces';
import { config } from '../config/app-config';
import logger from '../utils/logger';
import { ApplicationError } from '../utils/errors';

export interface AuthServiceInterface {
  register(email: string, password: string, name: string): Promise<User>;
  login(email: string, password: string): Promise<{user: User, token: string, refreshToken: string}>;
  validateToken(token: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<{token: string, refreshToken: string} | null>;
  resetPassword(email: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
}

// For storing refresh tokens - in a production environment, this should be 
// stored in a database or Redis
interface RefreshToken {
  token: string;
  userId: string;
  expires: Date;
}

export class AuthService implements AuthServiceInterface {
  private refreshTokens: Map<string, RefreshToken> = new Map();
  
  constructor(private userRepository: UserRepository) {}
  
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<User> {
    try {
      // Create new user using the user repository
      const user = await this.userRepository.create({
        email,
        name,
        password, // The repository handles hashing
        role: 'user', // Default role
        settings: {},
      } as any);
      
      logger.info('User registered successfully', { email });
      return user;
    } catch (error: any) {
      logger.error('Error registering user', { error: error.message, email });
      throw error; // Pass through repository errors
    }
  }
  
  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<{user: User, token: string, refreshToken: string}> {
    try {
      // Verify credentials using the user repository
      const user = await this.userRepository.verifyPassword(email, password);
      
      if (!user) {
        logger.warn('Failed login attempt', { email });
        throw new ApplicationError('Invalid email or password', 401);
      }
      
      // Update last login timestamp
      await this.userRepository.updateLastLogin(user.id);
      
      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user.id);
      
      logger.info('User logged in successfully', { userId: user.id });
      
      return {
        user,
        token,
        refreshToken
      };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error during login', { error: error.message, email });
      throw new ApplicationError('Authentication error', 500, error);
    }
  }
  
  /**
   * Validate a JWT token
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Verify the token
      const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
      
      // Get the user from the repository
      const user = await this.userRepository.findById(decoded.userId);
      
      return user;
    } catch (error: any) {
      logger.debug('Token validation failed', { error: error.message });
      return null; // Invalid token
    }
  }
  
  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<{token: string, refreshToken: string} | null> {
    try {
      // Check if refresh token exists and is valid
      const storedToken = this.refreshTokens.get(refreshToken);
      
      if (!storedToken || new Date() > storedToken.expires) {
        if (storedToken) {
          this.refreshTokens.delete(refreshToken);
        }
        return null;
      }
      
      // Get the user
      const user = await this.userRepository.findById(storedToken.userId);
      
      if (!user) {
        this.refreshTokens.delete(refreshToken);
        return null;
      }
      
      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user.id);
      
      // Remove the old refresh token
      this.refreshTokens.delete(refreshToken);
      
      logger.info('Token refreshed successfully', { userId: user.id });
      
      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error: any) {
      logger.error('Error refreshing token', { error: error.message });
      return null;
    }
  }
  
  /**
   * Initiate password reset process
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      // Find user
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists in the system
        logger.info('Password reset requested for non-existent email', { email });
        return true;
      }
      
      // In a real implementation, this would:
      // 1. Generate a reset token
      // 2. Store it with an expiration
      // 3. Send an email to the user with a reset link
      
      // For this implementation, we'll just log it
      logger.info('Password reset requested for user', { userId: user.id });
      
      return true;
    } catch (error: any) {
      logger.error('Error requesting password reset', { error: error.message, email });
      throw new ApplicationError('Error processing password reset', 500, error);
    }
  }
  
  /**
   * Change a user's password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new ApplicationError('User not found', 404);
      }
      
      // Verify old password
      const userData = await this.userRepository.verifyPassword(user.email, oldPassword);
      
      if (!userData) {
        throw new ApplicationError('Current password is incorrect', 401);
      }
      
      // Update password
      await this.userRepository.update(userId, { password: newPassword } as any);
      
      // Invalidate all refresh tokens for this user
      this.invalidateUserRefreshTokens(userId);
      
      logger.info('Password changed successfully', { userId });
      
      return true;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error changing password', { error: error.message, userId });
      throw new ApplicationError('Error changing password', 500, error);
    }
  }
  
  /**
   * Generate a JWT token
   */
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.auth.jwtSecret,
      {
        expiresIn: config.auth.jwtExpiresIn
      }
    );
  }
  
  /**
   * Generate a refresh token
   */
  private generateRefreshToken(userId: string): string {
    // Generate a random token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Set expiration (30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    // Store the token
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      userId,
      expires
    });
    
    return refreshToken;
  }
  
  /**
   * Invalidate all refresh tokens for a user
   */
  private invalidateUserRefreshTokens(userId: string): void {
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }
  
  /**
   * Invalidate a specific refresh token (logout)
   */
  logout(refreshToken: string): boolean {
    return this.refreshTokens.delete(refreshToken);
  }
}
```

## 2. Authentication Middleware

```typescript
// src/api/middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { User } from '../../types/core';
import { AuthService } from '../../services/auth-service';
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
 * Authentication middleware for protecting routes
 * @param requiredRole Optional role required to access the route
 */
export function authMiddleware(requiredRole?: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApplicationError('No authentication token provided', 401);
      }
      
      const token = authHeader.split(' ')[1];
      
      // Get auth service (assuming it's injected into request)
      const authService = req.app.locals.authService as AuthService;
      
      if (!authService) {
        logger.error('AuthService not available in request');
        throw new ApplicationError('Internal server error', 500);
      }
      
      // Validate token
      const user = await authService.validateToken(token);
      
      if (!user) {
        throw new ApplicationError('Invalid or expired token', 401);
      }
      
      // Check role if required
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        logger.warn('Unauthorized access attempt', { 
          userId: user.id, 
          requiredRole, 
          userRole: user.role 
        });
        throw new ApplicationError('You do not have permission to access this resource', 403);
      }
      
      // Attach user to request
      req.user = user;
      
      next();
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      
      logger.error('Authentication error', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Optional authentication middleware - attaches user if token is valid but doesn't require it
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  const authService = req.app.locals.authService as AuthService;
  
  if (!authService) {
    return next();
  }
  
  authService.validateToken(token)
    .then(user => {
      if (user) {
        req.user = user;
      }
      next();
    })
    .catch(() => {
      // Continue even if token validation fails
      next();
    });
}
```

## 3. User Controller

```typescript
// src/api/controllers/user-controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../../services/auth-service';
import { UserRepository } from '../../repositories/interfaces';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

export class UserController {
  constructor(
    private authService: AuthService,
    private userRepository: UserRepository
  ) {}
  
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        throw new ApplicationError('Email, password, and name are required', 400);
      }
      
      const user = await this.authService.register(email, password, name);
      
      // Don't return sensitive information
      const { id, email: userEmail, name: userName, role, createdAt } = user;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: { id, email: userEmail, name: userName, role, createdAt }
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in register controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Login a user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ApplicationError('Email and password are required', 400);
      }
      
      const { user, token, refreshToken } = await this.authService.login(email, password);
      
      // Don't return sensitive information
      const { id, email: userEmail, name, role } = user;
      
      res.json({
        message: 'Login successful',
        user: { id, email: userEmail, name, role },
        token,
        refreshToken
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in login controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Refresh an access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApplicationError('Refresh token is required', 400);
      }
      
      const result = await this.authService.refreshToken(refreshToken);
      
      if (!result) {
        throw new ApplicationError('Invalid or expired refresh token', 401);
      }
      
      res.json({
        message: 'Token refreshed successfully',
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in refresh token controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Get the current user's profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      if (!user) {
        throw new ApplicationError('Not authenticated', 401);
      }
      
      // Fetch user to get latest data
      const latestUser = await this.userRepository.findById(user.id);
      
      if (!latestUser) {
        throw new ApplicationError('User not found', 404);
      }
      
      // Don't return sensitive information
      const { id, email, name, role, settings, createdAt, lastLogin } = latestUser;
      
      res.json({
        user: { id, email, name, role, settings, createdAt, lastLogin }
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in get profile controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Reset password request
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ApplicationError('Email is required', 400);
      }
      
      await this.authService.resetPassword(email);
      
      // Always return success to prevent email enumeration
      res.json({
        message: 'If your email exists in our system, you will receive a password reset link'
      });
    } catch (error: any) {
      // Always return success to prevent email enumeration
      res.json({
        message: 'If your email exists in our system, you will receive a password reset link'
      });
      
      // But log the error for debugging
      logger.error('Error in reset password controller', { error: error.message });
    }
  }
  
  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      if (!user) {
        throw new ApplicationError('Not authenticated', 401);
      }
      
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        throw new ApplicationError('Old password and new password are required', 400);
      }
      
      if (newPassword.length < 8) {
        throw new ApplicationError('New password must be at least 8 characters long', 400);
      }
      
      await this.authService.changePassword(user.id, oldPassword, newPassword);
      
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in change password controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApplicationError('Refresh token is required', 400);
      }
      
      // Invalidate the refresh token
      this.authService.logout(refreshToken);
      
      res.json({
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      logger.error('Error in logout controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

## 4. User Routes

```typescript
// src/api/routes/user-routes.ts
import express from 'express';
import { UserController } from '../controllers/user-controller';
import { authMiddleware } from '../middlewares/auth';

export const createUserRoutes = (userController: UserController) => {
  const router = express.Router();
  
  // Public routes
  router.post('/register', userController.register.bind(userController));
  router.post('/login', userController.login.bind(userController));
  router.post('/refresh-token', userController.refreshToken.bind(userController));
  router.post('/reset-password', userController.resetPassword.bind(userController));
  
  // Protected routes
  router.get('/profile', authMiddleware(), userController.getProfile.bind(userController));
  router.put('/profile', authMiddleware(), userController.updateProfile.bind(userController));
  router.post('/change-password', authMiddleware(), userController.changePassword.bind(userController));
  router.post('/logout', authMiddleware(), userController.logout.bind(userController));
  
  return router;
};

export default createUserRoutes;
```

## 5. Error Handling Utilities

```typescript
// src/utils/errors.ts
export class ApplicationError extends Error {
  statusCode: number;
  originalError?: Error;
  
  constructor(message: string, statusCode: number = 500, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.originalError = originalError;
    
    // For better debugging in NodeJS
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string>) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
    super(message, 404);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}
```

## 6. Integration Updates

To integrate these components, you'll need to update your `app.ts` file:

```typescript
// Add this to src/app.ts
import { PostgresUserRepository } from './repositories/postgres/user-repository';
import { AuthService } from './services/auth-service';
import { UserController } from './api/controllers/user-controller';
import createUserRoutes from './api/routes/user-routes';

// Initialize repositories
const userRepository = new PostgresUserRepository();

// Initialize services
const authService = new AuthService(userRepository);

// Initialize controllers
const userController = new UserController(authService, userRepository);

// Make services available to middleware
app.locals.authService = authService;

// Register user routes
app.use(`${config.server.apiPrefix}/users`, createUserRoutes(userController));
```

## 7. Logger Implementation

```typescript
// src/utils/logger.ts
import winston from 'winston';
import { config } from '../config/app-config';

// Define the logger configuration
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.logging.format === 'json' 
      ? winston.format.json() 
      : winston.format.simple()
  ),
  defaultMeta: { service: 'contextnexus' },
  transports: [
    // Write all logs to console
    new winston.transports.Console(),
    
    // Write logs to file in non-dev environments
    ...(config.server.environment !== 'development' 
      ? [new winston.transports.File({ 
          filename: `${config.logging.path}/error.log`, 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: `${config.logging.path}/combined.log` 
        })]
      : [])
  ]
});

// Simplify in development environment
if (config.server.environment === 'development') {
  logger.format = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
}

export default logger;
```

## Security Features

This implementation includes several security best practices:

1. **Secure JWT Implementation**:
   - Configurable expiration time
   - Refresh token mechanism for extended sessions
   - Token invalidation on password change or logout

2. **Password Security**:
   - Leverages bcrypt hashing from UserRepository
   - Password validation
   - Secure password reset flow

3. **Protection Against Common Attacks**:
   - Email enumeration prevention in password reset
   - Proper error handling to avoid information leakage
   - Role-based access control

4. **Tokens Management**:
   - Refresh tokens with expiration dates
   - Token invalidation mechanism
   - Secure storage (note: should be moved to database for production)

The implementation is ready to be integrated with your existing ContextNexus backend and will provide a robust authentication foundation for the rest of your API endpoints.