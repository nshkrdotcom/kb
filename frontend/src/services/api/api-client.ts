// frontend/src/services/api/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken, refreshAccessToken, clearTokens } from '../auth/token-service';

export class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
  }> = [];

  constructor(baseURL = process.env.REACT_APP_API_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // If error is 401 and not already retrying
        if (
          error.response?.status === 401 &&
          !originalRequest.headers['X-Retry']
        ) {
          if (this.isRefreshing) {
            // Add failed request to queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          this.isRefreshing = true;
          originalRequest.headers['X-Retry'] = 'true';

          try {
            const newToken = await refreshAccessToken();
            
            // Process failed queue
            this.processQueue(null, newToken);
            
            // Retry original request
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else if (token) {
        request.config.headers['Authorization'] = `Bearer ${token}`;
        request.resolve(this.client(request.config));
      }
    });
    this.failedQueue = [];
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'GET', url);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'POST', url, data);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'PUT', url, data);
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleRequestError(error, 'DELETE', url);
      throw error;
    }
  }

  public async streamRequest<T>(url: string, method: string, data: any, onChunk: (chunk: any) => void): Promise<void> {
    const token = getAccessToken();
    
    try {
      const response = await fetch(`${this.client.defaults.baseURL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stream request failed: ${errorText}`);
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
        
        // Parse server-sent events
        chunk.split('\n\n').forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.substring(6));
              onChunk(eventData);
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        });
      }
    } catch (error) {
      this.handleRequestError(error, method, url, data);
      throw error;
    }
  }

  private handleRequestError(error: any, method: string, url: string, data?: any) {
    console.error(`API Error [${method} ${url}]:`, error);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Implement error reporting to service like Sentry
      // captureException(error, { extra: { method, url, data } });
    }
  }
}

export default new ApiClient();