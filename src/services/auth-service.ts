// src/services/auth-service.ts
 import jwt from 'jsonwebtoken';
 import { UserRepository } from '../repositories/interfaces';
 import { User } from '../types/core';
 import { config } from '../config/app-config';
 import logger from '../utils/logger';
 import { ApplicationError } from '../utils/errors';
 
 interface TokenPayload {
   userId: string;
   email: string;
   role: string;
 }
 
 interface AuthResult {
   user: User;
   token: string;
 }
 
 /**
  * Service for user authentication and authorization
  */
 export class AuthService {
   constructor(private userRepository: UserRepository) {}
   
   /**
    * Register a new user
    */
   async register(
     email: string,
     password: string,
     name: string,
     role: string = 'user'
   ): Promise<AuthResult> {
     logger.info('Registering new user', { email, name });
     
     try {
       // Check if user already exists
       const existingUser = await this.userRepository.findByEmail(email);
       
       if (existingUser) {
         throw new ApplicationError('User with this email already exists', 409);
       }
       
       // Create the user
       const user = await this.userRepository.create({
         email,
         name,
         role,
         settings: {},
         password // Will be hashed in the repository
       } as any);
       
       // Generate JWT token
       const token = this.generateToken(user);
       
       return { user, token };
     } catch (error: any) {
       if (error instanceof ApplicationError) {
         throw error;
       }
       
       logger.error('Error registering user', { error: error.message, email });
       throw new ApplicationError('Failed to register user', 500, error);
     }
   }
   
   /**
    * Login a user with email and password
    */
   async login(email: string, password: string): Promise<AuthResult> {
     logger.info('User login attempt', { email });
     
     try {
       // Verify credentials
       const user = await this.userRepository.verifyPassword(email, password);
       
       if (!user) {
         throw new ApplicationError('Invalid email or password', 401);
       }
       
       // Update last login time
       await this.userRepository.updateLastLogin(user.id);
       
       // Generate JWT token
       const token = this.generateToken(user);
       
       logger.info('User logged in successfully', { userId: user.id });
       
       return { user, token };
     } catch (error: any) {
       if (error instanceof ApplicationError) {
         throw error;
       }
       
       logger.error('Error during login', { error: error.message, email });
       throw new ApplicationError('Login failed', 500, error);
     }
   }
   
   /**
    * Verify a JWT token and return the user
    */
   async verifyToken(token: string): Promise<User> {
     try {
       // Verify the token
       const decoded = jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
       
       // Get the user
       const user = await this.userRepository.findById(decoded.userId);
       
       if (!user) {
         throw new ApplicationError('User not found', 404);
       }
       
       return user;
     } catch (error: any) {
       if (error instanceof jwt.JsonWebTokenError) {
         throw new ApplicationError('Invalid token', 401);
       }
       
       if (error instanceof jwt.TokenExpiredError) {
         throw new ApplicationError('Token expired', 401);
       }
       
       if (error instanceof ApplicationError) {
         throw error;
       }
       
       logger.error('Error verifying token', { error: error.message });
       throw new ApplicationError('Token verification failed', 500, error);
     }
   }
   
   /**
    * Check if a user has the required role
    */
   checkRole(user: User, requiredRole: string | string[]): boolean {
     if (!user || !user.role) {
       return false;
     }
     
     if (user.role === 'admin') {
       // Admin role has access to everything
       return true;
     }
     
     if (Array.isArray(requiredRole)) {
       return requiredRole.includes(user.role);
     }
     
     return user.role === requiredRole;
   }
   
   /**
    * Generate a JWT token for a user
    */
   private generateToken(user: User): string {
     const payload: TokenPayload = {
       userId: user.id,
       email: user.email,
       role: user.role || 'user'
     };
     
     return jwt.sign(
       payload, 
       config.auth.jwtSecret, 
       { expiresIn: config.auth.jwtExpiresIn }
     );
   }
 }
