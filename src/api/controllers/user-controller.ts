// src/api/controllers/user-controller.ts
 import { Request, Response, NextFunction } from 'express';
 import { AuthService } from '../../services/auth-service';
 import { UserRepository } from '../../repositories/interfaces';
 import logger from '../../utils/logger';
 import { ApplicationError } from '../../utils/errors';
 
 /**
  * Controller for user-related endpoints
  */
 export class UserController {
   constructor(
     private userRepository: UserRepository,
     private authService: AuthService
   ) {}
   
   /**
    * Register a new user
    */
   async register(req: Request, res: Response, next: NextFunction) {
     try {
       const { email, password, name } = req.body;
       
       const result = await this.authService.register(email, password, name);
       
       // Don't return the full user object for security
       const { user, token } = result;
       const safeUser = {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role,
         createdAt: user.createdAt
       };
       
       return res.status(201).json({
         user: safeUser,
         token
       });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Login a user
    */
   async login(req: Request, res: Response, next: NextFunction) {
     try {
       const { email, password } = req.body;
       
       const result = await this.authService.login(email, password);
       
       // Don't return the full user object for security
       const { user, token } = result;
       const safeUser = {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role,
         lastLogin: user.lastLogin
       };
       
       return res.status(200).json({
         user: safeUser,
         token
       });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Get the current user
    */
   async getCurrentUser(req: Request, res: Response, next: NextFunction) {
     try {
       // The user should be attached to the request by the authentication middleware
       const user = req.user;
       
       if (!user) {
         throw new ApplicationError('Not authenticated', 401);
       }
       
       // Don't return the full user object for security
       const safeUser = {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role,
         lastLogin: user.lastLogin,
         settings: user.settings,
         createdAt: user.createdAt
       };
       
       return res.status(200).json({ user: safeUser });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Update the current user
    */
   async updateCurrentUser(req: Request, res: Response, next: NextFunction) {
     try {
       const user = req.user;
       
       if (!user) {
         throw new ApplicationError('Not authenticated', 401);
       }
       
       const { name, email, password, settings } = req.body;
       
       // Build update object
       const updateData: any = {};
       if (name !== undefined) updateData.name = name;
       if (email !== undefined) updateData.email = email;
       if (password !== undefined) updateData.password = password;
       if (settings !== undefined) updateData.settings = settings;
       
       // Update the user
       const updatedUser = await this.userRepository.update(user.id, updateData);
       
       // Don't return the full user object for security
       const safeUser = {
         id: updatedUser.id,
         email: updatedUser.email,
         name: updatedUser.name,
         role: updatedUser.role,
         settings: updatedUser.settings,
         lastLogin: updatedUser.lastLogin
       };
       
       return res.status(200).json({ user: safeUser });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Get a user by ID (admin only)
    */
   async getUserById(req: Request, res: Response, next: NextFunction) {
     try {
       const { id } = req.params;
       
       const user = await this.userRepository.findById(id);
       
       if (!user) {
         throw new ApplicationError(`User with ID ${id} not found`, 404);
       }
       
       // Don't return the full user object for security
       const safeUser = {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role,
         settings: user.settings,
         createdAt: user.createdAt,
         lastLogin: user.lastLogin
       };
       
       return res.status(200).json({ user: safeUser });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Update a user (admin only)
    */
   async updateUser(req: Request, res: Response, next: NextFunction) {
     try {
       const { id } = req.params;
       const { name, email, password, role, settings } = req.body;
       
       // Check if user exists
       const existingUser = await this.userRepository.findById(id);
       
       if (!existingUser) {
         throw new ApplicationError(`User with ID ${id} not found`, 404);
       }
       
       // Build update object
       const updateData: any = {};
       if (name !== undefined) updateData.name = name;
       if (email !== undefined) updateData.email = email;
       if (password !== undefined) updateData.password = password;
       if (role !== undefined) updateData.role = role;
       if (settings !== undefined) updateData.settings = settings;
       
       // Update the user
       const updatedUser = await this.userRepository.update(id, updateData);
       
       // Don't return the full user object for security
       const safeUser = {
         id: updatedUser.id,
         email: updatedUser.email,
         name: updatedUser.name,
         role: updatedUser.role,
         settings: updatedUser.settings,
         createdAt: updatedUser.createdAt,
         lastLogin: updatedUser.lastLogin
       };
       
       return res.status(200).json({ user: safeUser });
     } catch (error) {
       next(error);
     }
   }
   
   /**
    * Delete a user (admin only)
    */
   async deleteUser(req: Request, res: Response, next: NextFunction) {
     try {
       const { id } = req.params;
       
       // Check if user exists
       const existingUser = await this.userRepository.findById(id);
       
       if (!existingUser) {
         throw new ApplicationError(`User with ID ${id} not found`, 404);
       }
       
       // Delete the user
       const result = await this.userRepository.delete(id);
       
       if (!result) {
         throw new ApplicationError('Failed to delete user', 500);
       }
       
       return res.status(204).send();
     } catch (error) {
       next(error);
     }
   }
 }
