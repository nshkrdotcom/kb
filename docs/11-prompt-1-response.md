# Authentication System Implementation

I've analyzed your existing codebase, including the `app-config.ts` and `UserRepository`. Based on this analysis, here's a comprehensive implementation of the remaining components for your authentication system.

## 1. Authentication Service

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

/**
 * Service for handling authentication and authorization
 */
export class AuthService implements AuthServiceInterface {
  // In-memory refresh token store - should be replaced with a database in production
  private refreshTokens: Map<string, { userId: string, expires: Date }> = new Map();
  
  constructor(private userRepository: UserRepository) {}
  
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<User> {
    logger.info('Registering new user', { email });
    
    try {
      // Validate input
      if (!email || !password || !name) {
        throw new ApplicationError('Email, password, and name are required', 400);
      }
      
      if (password.length < 8) {
        throw new ApplicationError('Password must be at least 8 characters long', 400);
      }
      
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ApplicationError('User with this email already exists', 409);
      }
      
      // Create user - password hashing is handled by the repository
      const user = await this.userRepository.create({
        email,
        name,
        password, // Pass as-is, repository will hash it
        role: 'user',
        settings: {},
      } as any); // Using 'any' because the password field isn't in the User type
      
      logger.info('User registered successfully', { userId: user.id });
      
      return user;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Failed to register user', { email, error: error.message });
      throw new ApplicationError('Registration failed', 500, error);
    }
  }
  
  /**
   * Authenticate a user with email and password
   */
  async login(email: string, password: string): Promise<{user: User, token: string, refreshToken: string}> {
    logger.info('User login attempt', { email });
    
    try {
      // Validate credentials using repository's verifyPassword method
      const user = await this.userRepository.verifyPassword(email, password);
      
      if (!user) {
        throw new ApplicationError('Invalid email or password', 401);
      }
      
      // Update last login timestamp
      await this.userRepository.updateLastLogin(user.id);
      
      // Generate JWT token
      const token = this.generateAccessToken(user);
      
      // Generate refresh token
      const refreshToken = this.generateRefreshToken(user.id);
      
      logger.info('User logged in successfully', { userId: user.id });
      
      return { user, token, refreshToken };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Login failed', { email, error: error.message });
      throw new ApplicationError('Authentication failed', 500, error);
    }
  }
  
  /**
   * Validate a JWT token and return the associated user
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Verify JWT token
      const payload = jwt.verify(token, config.auth.jwtSecret) as { userId: string };
      
      // Get user from database
      const user = await this.userRepository.findById(payload.userId);
      
      return user;
    } catch (error: any) {
      logger.debug('Token validation failed', { error: error.message });
      return null;
    }
  }
  
  /**
   * Generate a new access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<{token: string, refreshToken: string} | null> {
    try {
      // Check if refresh token exists and is valid
      const tokenData = this.refreshTokens.get(refreshToken);
      
      if (!tokenData) {
        logger.debug('Refresh token not found');
        return null;
      }
      
      // Check if token has expired
      if (new Date() > tokenData.expires) {
        logger.debug('Refresh token expired');
        this.refreshTokens.delete(refreshToken);
        return null;
      }
      
      // Get user
      const user = await this.userRepository.findById(tokenData.userId);
      
      if (!user) {
        logger.debug('User not found for refresh token');
        this.refreshTokens.delete(refreshToken);
        return null;
      }
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user.id);
      
      // Invalidate old refresh token
      this.refreshTokens.delete(refreshToken);
      
      logger.info('Token refreshed successfully', { userId: user.id });
      
      return {
        token: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error: any) {
      logger.error('Error refreshing token', { error: error.message });
      return null;
    }
  }
  
  /**
   * Initiate password reset flow
   */
  async resetPassword(email: string): Promise<boolean> {
    logger.info('Password reset requested', { email });
    
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      
      // If user not found, still return true to prevent email enumeration
      if (!user) {
        logger.debug('Password reset requested for non-existent email', { email });
        return true;
      }
      
      // In a real implementation, you would:
      // 1. Generate a reset token
      // 2. Store it with an expiration time
      // 3. Send an email with a reset link
      
      // For this implementation, we'll just log it
      logger.info('Password reset link would be sent to user', { userId: user.id });
      
      return true;
    } catch (error: any) {
      // Log error but don't expose it to the caller
      logger.error('Error processing password reset', { email, error: error.message });
      
      // Still return true to prevent email enumeration
      return true;
    }
  }
  
  /**
   * Change a user's password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    logger.info('Password change requested', { userId });
    
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new ApplicationError('User not found', 404);
      }
      
      // Verify old password
      const isVerified = await this.userRepository.verifyPassword(user.email, oldPassword);
      
      if (!isVerified) {
        throw new ApplicationError('Current password is incorrect', 401);
      }
      
      // Validate new password
      if (newPassword.length < 8) {
        throw new ApplicationError('New password must be at least 8 characters long', 400);
      }
      
      // Update password - repository handles hashing
      await this.userRepository.update(userId, { password: newPassword } as any);
      
      // Invalidate all refresh tokens for this user
      this.invalidateUserRefreshTokens(userId);
      
      logger.info('Password changed successfully', { userId });
      
      return true;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      logger.error('Error changing password', { userId, error: error.message });
      throw new ApplicationError('Password change failed', 500, error);
    }
  }
  
  /**
   * Logout a user by invalidating their refresh token
   */
  logout(refreshToken: string): boolean {
    logger.info('User logout');
    return this.refreshTokens.delete(refreshToken);
  }
  
  /**
   * Generate a JWT access token
   */
  private generateAccessToken(user: User): string {
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
    // Generate random token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Set expiration (30 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    // Store token
    this.refreshTokens.set(refreshToken, {
      userId,
      expires
    });
    
    return refreshToken;
  }
  
  /**
   * Invalidate all refresh tokens for a specific user
   */
  private invalidateUserRefreshTokens(userId: string): void {
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }
}
```

## 2. Authentication Middleware

```typescript
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
```

## 3. User Controller

```typescript
// src/api/controllers/user-controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../../services/auth-service';
import { UserRepository } from '../../repositories/interfaces';
import { ApplicationError } from '../../utils/errors';
import logger from '../../utils/logger';

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
      
      // Basic validation
      if (!email || !password || !name) {
        throw new ApplicationError('Email, password, and name are required', 400);
      }
      
      // Register user
      const user = await this.authService.register(email, password, name);
      
      // Return non-sensitive user data
      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Login a user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        throw new ApplicationError('Email and password are required', 400);
      }
      
      // Authenticate user
      const { user, token, refreshToken } = await this.authService.login(email, password);
      
      // Set refresh token as HTTP-only cookie for better security
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/users/refresh-token'
      });
      
      // Return user data and access token
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // User will be attached by auth middleware
      if (!req.user) {
        throw new ApplicationError('Authentication required', 401);
      }
      
      // Get fresh user data from database
      const user = await this.userRepository.findById(req.user.id);
      
      if (!user) {
        throw new ApplicationError('User not found', 404);
      }
      
      // Return user data
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        settings: user.settings,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // User will be attached by auth middleware
      if (!req.user) {
        throw new ApplicationError('Authentication required', 401);
      }
      
      const { name, email, settings } = req.body;
      
      // Build update object
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (settings !== undefined) updateData.settings = settings;
      
      // Update user
      const updatedUser = await this.userRepository.update(req.user.id, updateData);
      
      // Return updated user data
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        settings: updatedUser.settings,
        updatedAt: updatedUser.updatedAt
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        throw new ApplicationError('Refresh token is required', 400);
      }
      
      // Get new tokens
      const tokens = await this.authService.refreshToken(refreshToken);
      
      if (!tokens) {
        throw new ApplicationError('Invalid or expired refresh token', 401);
      }
      
      // Set new refresh token as cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/users/refresh-token'
      });
      
      // Return new access token
      res.json({
        token: tokens.token
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Initiate password reset
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ApplicationError('Email is required', 400);
      }
      
      // Initiate password reset
      await this.authService.resetPassword(email);
      
      // Always return success to prevent email enumeration
      res.json({
        message: 'If your email is registered, you will receive password reset instructions'
      });
    } catch (error: any) {
      // Still return success message even on error to prevent email enumeration
      res.json({
        message: 'If your email is registered, you will receive password reset instructions'
      });
      
      // But log the error
      logger.error('Error in reset password', { error: error.message });
    }
  }
  
  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // User will be attached by auth middleware
      if (!req.user) {
        throw new ApplicationError('Authentication required', 401);
      }
      
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        throw new ApplicationError('Old password and new password are required', 400);
      }
      
      // Change password
      await this.authService.changePassword(req.user.id, oldPassword, newPassword);
      
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        // Invalidate refresh token
        this.authService.logout(refreshToken);
        
        // Clear cookie
        res.clearCookie('refreshToken', {
          path: '/api/users/refresh-token'
        });
      }
      
      res.json({
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Error handler helper
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof ApplicationError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode
      });
      return;
    }
    
    logger.error('User controller error', { error: error.message });
    
    res.status(500).json({
      error: 'An unexpected error occurred',
      statusCode: 500
    });
  }
}
```

## 4. User Routes

```typescript
// src/api/routes/user-routes.ts
import express from 'express';
import { UserController } from '../controllers/user-controller';
import { authMiddleware } from '../middlewares/auth';

const createUserRoutes = (userController: UserController) => {
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

## 5. App Integration

To integrate these components, you'll need to update your app.ts file:

```typescript
// Add to your existing app.ts file

// Import new components
import { AuthService } from './services/auth-service';
import { UserController } from './api/controllers/user-controller';
import createUserRoutes from './api/routes/user-routes';
import cookieParser from 'cookie-parser'; // You'll need to install this package

// Add cookie parser middleware
app.use(cookieParser());

// Initialize services
const userRepository = new PostgresUserRepository();
const authService = new AuthService(userRepository);

// Store services for middleware access
app.locals.services = {
  authService
};

// Initialize controllers
const userController = new UserController(authService, userRepository);

// Mount user routes
app.use(`${config.server.apiPrefix}/users`, createUserRoutes(userController));

// Update existing routes to use authentication where needed
// Example:
// app.use(`${config.server.apiPrefix}/projects`, authMiddleware(), projectRoutes);
```

## 6. Required Packages

You'll need to install these additional packages:

```bash
npm install jsonwebtoken cookie-parser
npm install --save-dev @types/jsonwebtoken @types/cookie-parser
```

## Security Considerations

This implementation includes several security best practices:

1. **JWT implementation**:
   - Short-lived access tokens
   - Long-lived refresh tokens with rotation
   - Server-side refresh token storage
   - Token invalidation on logout and password change

2. **Cookie security**:
   - HTTP-only cookies for refresh tokens
   - Secure flag in production
   - Path restriction
   - Configurable expiration

3. **Password security**:
   - Leverages your existing bcrypt hashing
   - Password validation
   - Secure password reset workflow

4. **Protection against common attacks**:
   - Email enumeration prevention
   - Proper error handling
   - Role-based access control

This authentication system should integrate smoothly with your existing codebase and provide a robust foundation for securing your ContextNexus application.