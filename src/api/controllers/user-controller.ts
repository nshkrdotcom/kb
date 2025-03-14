// src/api/controllers/user-controller.ts
//  import { Request, Response, NextFunction } from 'express';
//  import { AuthService } from '../../services/auth-service';
//  import { UserRepository } from '../../repositories/interfaces';
//  import logger from '../../utils/logger';
//  import { ApplicationError } from '../../utils/errors';
 
//  /**
//   * Controller for user-related endpoints
//   */
//  export class UserController {
//    constructor(
//      private userRepository: UserRepository,
//      private authService: AuthService
//    ) {}
   
//    /**
//     * Register a new user
//     */
//    async register(req: Request, res: Response, next: NextFunction) {
//      try {
//        const { email, password, name } = req.body;
       
//        const result = await this.authService.register(email, password, name);
       
//        // Don't return the full user object for security
//        const { user, token } = result;
//        const safeUser = {
//          id: user.id,
//          email: user.email,
//          name: user.name,
//          role: user.role,
//          createdAt: user.createdAt
//        };
       
//        return res.status(201).json({
//          user: safeUser,
//          token
//        });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Login a user
//     */
//    async login(req: Request, res: Response, next: NextFunction) {
//      try {
//        const { email, password } = req.body;
       
//        const result = await this.authService.login(email, password);
       
//        // Don't return the full user object for security
//        const { user, token } = result;
//        const safeUser = {
//          id: user.id,
//          email: user.email,
//          name: user.name,
//          role: user.role,
//          lastLogin: user.lastLogin
//        };
       
//        return res.status(200).json({
//          user: safeUser,
//          token
//        });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Get the current user
//     */
//    async getCurrentUser(req: Request, res: Response, next: NextFunction) {
//      try {
//        // The user should be attached to the request by the authentication middleware
//        const user = req.user;
       
//        if (!user) {
//          throw new ApplicationError('Not authenticated', 401);
//        }
       
//        // Don't return the full user object for security
//        const safeUser = {
//          id: user.id,
//          email: user.email,
//          name: user.name,
//          role: user.role,
//          lastLogin: user.lastLogin,
//          settings: user.settings,
//          createdAt: user.createdAt
//        };
       
//        return res.status(200).json({ user: safeUser });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Update the current user
//     */
//    async updateCurrentUser(req: Request, res: Response, next: NextFunction) {
//      try {
//        const user = req.user;
       
//        if (!user) {
//          throw new ApplicationError('Not authenticated', 401);
//        }
       
//        const { name, email, password, settings } = req.body;
       
//        // Build update object
//        const updateData: any = {};
//        if (name !== undefined) updateData.name = name;
//        if (email !== undefined) updateData.email = email;
//        if (password !== undefined) updateData.password = password;
//        if (settings !== undefined) updateData.settings = settings;
       
//        // Update the user
//        const updatedUser = await this.userRepository.update(user.id, updateData);
       
//        // Don't return the full user object for security
//        const safeUser = {
//          id: updatedUser.id,
//          email: updatedUser.email,
//          name: updatedUser.name,
//          role: updatedUser.role,
//          settings: updatedUser.settings,
//          lastLogin: updatedUser.lastLogin
//        };
       
//        return res.status(200).json({ user: safeUser });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Get a user by ID (admin only)
//     */
//    async getUserById(req: Request, res: Response, next: NextFunction) {
//      try {
//        const { id } = req.params;
       
//        const user = await this.userRepository.findById(id);
       
//        if (!user) {
//          throw new ApplicationError(`User with ID ${id} not found`, 404);
//        }
       
//        // Don't return the full user object for security
//        const safeUser = {
//          id: user.id,
//          email: user.email,
//          name: user.name,
//          role: user.role,
//          settings: user.settings,
//          createdAt: user.createdAt,
//          lastLogin: user.lastLogin
//        };
       
//        return res.status(200).json({ user: safeUser });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Update a user (admin only)
//     */
//    async updateUser(req: Request, res: Response, next: NextFunction) {
//      try {
//        const { id } = req.params;
//        const { name, email, password, role, settings } = req.body;
       
//        // Check if user exists
//        const existingUser = await this.userRepository.findById(id);
       
//        if (!existingUser) {
//          throw new ApplicationError(`User with ID ${id} not found`, 404);
//        }
       
//        // Build update object
//        const updateData: any = {};
//        if (name !== undefined) updateData.name = name;
//        if (email !== undefined) updateData.email = email;
//        if (password !== undefined) updateData.password = password;
//        if (role !== undefined) updateData.role = role;
//        if (settings !== undefined) updateData.settings = settings;
       
//        // Update the user
//        const updatedUser = await this.userRepository.update(id, updateData);
       
//        // Don't return the full user object for security
//        const safeUser = {
//          id: updatedUser.id,
//          email: updatedUser.email,
//          name: updatedUser.name,
//          role: updatedUser.role,
//          settings: updatedUser.settings,
//          createdAt: updatedUser.createdAt,
//          lastLogin: updatedUser.lastLogin
//        };
       
//        return res.status(200).json({ user: safeUser });
//      } catch (error) {
//        next(error);
//      }
//    }
   
//    /**
//     * Delete a user (admin only)
//     */
//    async deleteUser(req: Request, res: Response, next: NextFunction) {
//      try {
//        const { id } = req.params;
       
//        // Check if user exists
//        const existingUser = await this.userRepository.findById(id);
       
//        if (!existingUser) {
//          throw new ApplicationError(`User with ID ${id} not found`, 404);
//        }
       
//        // Delete the user
//        const result = await this.userRepository.delete(id);
       
//        if (!result) {
//          throw new ApplicationError('Failed to delete user', 500);
//        }
       
//        return res.status(204).send();
//      } catch (error) {
//        next(error);
//      }
//    }
//  }



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