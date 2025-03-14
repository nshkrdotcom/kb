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




// // src/services/auth-service.ts
// import apiClient from './api-client';
// import { 
//   User, 
//   LoginCredentials, 
//   RegisterCredentials, 
//   AuthResponse 
// } from '../types/auth';
// import { setTokens, clearTokens, getAccessToken } from '../utils/token';
// import jwtDecode from 'jwt-decode';

// class AuthService {
//   async login(credentials: LoginCredentials): Promise<User> {
//     try {
//       const response = await apiClient.post<AuthResponse>('/users/login', credentials);
//       const { user, token, refreshToken } = response;
      
//       setTokens(token, refreshToken);
//       return user;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async register(credentials: RegisterCredentials): Promise<User> {
//     try {
//       const response = await apiClient.post<User>('/users/register', credentials);
//       return response;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async logout(): Promise<void> {
//     try {
//       // Only make the API call if we have a token
//       const token = getAccessToken();
//       if (token) {
//         await apiClient.post('/users/logout', {});
//       }
//     } catch (error) {
//       console.error('Logout failed:', error);
//     } finally {
//       // Clear tokens regardless of API success/failure
//       clearTokens();
//     }
//   }

//   async resetPassword(email: string): Promise<void> {
//     try {
//       await apiClient.post('/users/reset-password', { email });
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async changePassword(oldPassword: string, newPassword: string): Promise<void> {
//     try {
//       await apiClient.post('/users/change-password', { oldPassword, newPassword });
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async getUserProfile(): Promise<User> {
//     try {
//       const user = await apiClient.get<User>('/users/profile');
//       return user;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   async updateUserProfile(updates: Partial<User>): Promise<User> {
//     try {
//       const user = await apiClient.put<User>('/users/profile', updates);
//       return user;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   isAuthenticated(): boolean {
//     const token = getAccessToken();
//     if (!token) return false;

//     try {
//       const decoded: any = jwtDecode(token);
//       const currentTime = Date.now() / 1000;
      
//       // Check if token is expired
//       return decoded.exp > currentTime;
//     } catch {
//       return false;
//     }
//   }

//   private handleError(error: any): Error {
//     if (error.response) {
//       // The request was made and the server responded with an error status
//       const message = error.response.data.error || 'An error occurred';
//       return new Error(message);
//     } else if (error.request) {
//       // The request was made but no response was received
//       return new Error('No response from server. Please check your internet connection.');
//     } else {
//       // Something happened in setting up the request
//       return new Error(error.message || 'An unexpected error occurred');
//     }
//   }
// }

// export default new AuthService();