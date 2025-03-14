// src/services/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/token';
import { AuthResponse } from '../types/auth';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // If error is 401 (Unauthorized) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            // Wait for the existing refresh to complete
            return this.refreshPromise
              .then((token) => {
                if (token && originalRequest.headers) {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`;
                }
                originalRequest._retry = true;
                return this.client(originalRequest);
              })
              .catch(() => {
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
              });
          }

          this.refreshing = true;
          originalRequest._retry = true;

          // Try to refresh the token
          this.refreshPromise = this.refreshToken();

          return this.refreshPromise
            .then((token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            })
            .catch(() => {
              // If refresh fails, redirect to login
              clearTokens();
              window.location.href = '/login';
              return Promise.reject(error);
            })
            .finally(() => {
              this.refreshing = false;
              this.refreshPromise = null;
            });
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async streamRequest<T>(url: string, data: any, onChunk: (chunk: any) => void): Promise<void> {
    const token = getAccessToken();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Stream request failed');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      
      // Parse Server-Sent Events
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.substring(6));
            onChunk(eventData);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      // Make a request to the token refresh endpoint
      const response = await axios.post<AuthResponse>(
        `${API_URL}/users/refresh-token`,
        { refreshToken }
      );
      
      const { token, refreshToken: newRefreshToken } = response.data;
      setTokens(token, newRefreshToken);
      
      return token;
    } catch (error) {
      clearTokens();
      return null;
    }
  }
}

export default new ApiClient();