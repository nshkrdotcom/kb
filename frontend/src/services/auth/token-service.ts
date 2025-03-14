// frontend/src/services/auth/token-service.ts
import jwtDecode from 'jwt-decode';
import { authApi } from '../api/auth-api';

interface TokenPayload {
  userId: string;
  exp: number;
}

// Storage keys
const ACCESS_TOKEN_KEY = 'contextnexus_access_token';
const REFRESH_TOKEN_KEY = 'contextnexus_refresh_token';

// Get access token from storage
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Get refresh token from storage
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Set tokens in storage
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Clear tokens from storage
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Check if access token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    // Check if expiration time is in the past
    // Subtract 60 seconds to account for clock skew
    return decoded.exp < (Date.now() / 1000) - 60;
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};

// Get payload from access token
export const getTokenPayload = (token: string): TokenPayload | null => {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    return null;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await authApi.refreshToken(refreshToken);
    setTokens(response.token, response.refreshToken);
    return response.token;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

// Get user ID from token
export const getUserIdFromToken = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  
  const payload = getTokenPayload(token);
  return payload?.userId || null;
};