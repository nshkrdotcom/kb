// src/types/auth.ts
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    createdAt?: string;
    settings?: Record<string, any>;
  }
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
  }
  
  export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    exp: number;
  }