# Complete Backend-Frontend Integration: Detailed Implementation Plan

## 1. API Client Architecture

### 1.1 Core API Client Implementation
```typescript
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
```

### 1.2 Service-Specific API Clients

```typescript
// frontend/src/services/api/auth-api.ts
import apiClient from './api-client';
import { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';

export const authApi = {
  login: (credentials: LoginRequest): Promise<AuthResponse> => 
    apiClient.post<AuthResponse>('/users/login', credentials),
    
  register: (userData: RegisterRequest): Promise<User> => 
    apiClient.post<User>('/users/register', userData),
    
  refreshToken: (refreshToken: string): Promise<AuthResponse> => 
    apiClient.post<AuthResponse>('/users/refresh-token', { refreshToken }),
    
  getProfile: (): Promise<User> => 
    apiClient.get<User>('/users/profile'),
    
  updateProfile: (updates: Partial<User>): Promise<User> => 
    apiClient.put<User>('/users/profile', updates),
    
  changePassword: (oldPassword: string, newPassword: string): Promise<void> => 
    apiClient.post<void>('/users/change-password', { oldPassword, newPassword }),
    
  logout: (): Promise<void> => 
    apiClient.post<void>('/users/logout'),
};

// frontend/src/services/api/context-api.ts
import apiClient from './api-client';
import { Context, CreateContextRequest, UpdateContextRequest } from '../../types/context';

export const contextApi = {
  getContextsForProject: (projectId: string): Promise<Context[]> => 
    apiClient.get<Context[]>(`/contexts/project/${projectId}`),
    
  getContextById: (id: string): Promise<Context> => 
    apiClient.get<Context>(`/contexts/${id}`),
    
  createContext: (data: CreateContextRequest): Promise<Context> => 
    apiClient.post<Context>('/contexts', data),
    
  updateContext: (id: string, data: UpdateContextRequest): Promise<Context> => 
    apiClient.put<Context>(`/contexts/${id}`, data),
    
  deleteContext: (id: string): Promise<void> => 
    apiClient.delete<void>(`/contexts/${id}`),
    
  getContextContent: (id: string): Promise<ContentItem[]> => 
    apiClient.get<ContentItem[]>(`/contexts/${id}/content`),
    
  addContentToContext: (contextId: string, contentId: string, metadata?: Record<string, any>): Promise<void> => 
    apiClient.post<void>(`/contexts/${contextId}/content/${contentId}`, { metadata }),
    
  removeContentFromContext: (contextId: string, contentId: string): Promise<void> => 
    apiClient.delete<void>(`/contexts/${contextId}/content/${contentId}`),
    
  updateContentRelevance: (contextId: string, contentId: string, relevance: number): Promise<void> => 
    apiClient.put<void>(`/contexts/${contextId}/content/${contentId}/relevance`, { relevance }),
};

// Also implement similar API clients for:
// - query-api.ts (LLM interaction)
// - selection-api.ts (context selection)
// - content-api.ts (content management)
// - project-api.ts (project management)
```

### 1.3 API Error Handling Utilities

```typescript
// frontend/src/services/api/api-error.ts
import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
  details?: Array<{ path: string; message: string }>;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: Array<{ path: string; message: string }>;
  public isNetworkError: boolean;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isNetworkError = false;
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof AxiosError) {
      // Network error (no response)
      if (error.code === 'ECONNABORTED' || !error.response) {
        const apiError = new ApiError(
          'Network error: Unable to connect to the server',
          0
        );
        apiError.isNetworkError = true;
        return apiError;
      }

      // Server returned an error response
      const response = error.response;
      const data = response.data as ApiErrorResponse;

      return new ApiError(
        data.error || 'An unknown error occurred',
        response.status,
        data.details
      );
    }

    // Unknown error
    return new ApiError(
      error instanceof Error ? error.message : String(error),
      500
    );
  }

  getFirstDetailMessage(): string | undefined {
    return this.details && this.details.length > 0
      ? this.details[0].message
      : undefined;
  }

  toUserFriendlyMessage(): string {
    // Network error
    if (this.isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (this.statusCode === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (this.statusCode === 403) {
      return 'You don\'t have permission to perform this action.';
    }

    // Validation errors
    if (this.statusCode === 400) {
      const detailMessage = this.getFirstDetailMessage();
      return detailMessage || 'Please check your input and try again.';
    }

    // Not found
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }

    // Rate limiting
    if (this.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }

    // Server errors
    if (this.statusCode >= 500) {
      return 'The server encountered an error. Please try again later.';
    }

    // Default message
    return this.message || 'An unexpected error occurred.';
  }
}
```

## 2. State Management Integration

### 2.1 Redux State Synchronization

```typescript
// frontend/src/store/middleware/api-sync-middleware.ts
import { Middleware } from 'redux';
import { 
  CONTEXT_SELECTED, 
  CONTEXT_CONTENT_UPDATED, 
  ITEM_RELEVANCE_UPDATED 
} from '../actions/types';
import { contextApi } from '../../services/api/context-api';

// Middleware to sync specific state changes with the API
export const apiSyncMiddleware: Middleware = store => next => action => {
  // First, update the local state
  const result = next(action);
  
  // Then, perform API calls based on action type
  switch (action.type) {
    case CONTEXT_SELECTED:
      // When a context is selected, load its content
      if (action.payload.contextId) {
        store.dispatch(loadContextContent(action.payload.contextId));
      }
      break;
      
    case CONTEXT_CONTENT_UPDATED:
      // When content selection changes, update on server
      const { contextId, itemIds, selected } = action.payload;
      contextApi.updateContentSelection(contextId, itemIds, selected)
        .catch(error => {
          console.error('Failed to update content selection:', error);
          // Dispatch a failure action to revert the selection in UI
          store.dispatch(updateSelectionFailed(contextId, itemIds, selected));
        });
      break;
      
    case ITEM_RELEVANCE_UPDATED:
      // When relevance is updated, sync with server
      const { contextId, contentId, relevance } = action.payload;
      
      // Debounce relevance updates (multiple sliders may be adjusted quickly)
      if (relevanceUpdateTimeouts[contentId]) {
        clearTimeout(relevanceUpdateTimeouts[contentId]);
      }
      
      relevanceUpdateTimeouts[contentId] = setTimeout(() => {
        contextApi.updateContentRelevance(contextId, contentId, relevance)
          .catch(error => {
            console.error('Failed to update relevance:', error);
            // Dispatch failure action to revert UI
            store.dispatch(updateRelevanceFailed(contextId, contentId, relevance));
          });
          
        delete relevanceUpdateTimeouts[contentId];
      }, 500); // 500ms debounce
      break;
  }
  
  return result;
};

// Track timeouts for debouncing
const relevanceUpdateTimeouts: Record<string, NodeJS.Timeout> = {};

// Action creators for API interactions
function loadContextContent(contextId: string) {
  return {
    type: 'LOAD_CONTEXT_CONTENT_REQUEST',
    payload: { contextId }
  };
}

function updateSelectionFailed(contextId: string, itemIds: string[], selected: boolean) {
  return {
    type: 'UPDATE_SELECTION_FAILED',
    payload: { contextId, itemIds, selected }
  };
}

function updateRelevanceFailed(contextId: string, contentId: string, relevance: number) {
  return {
    type: 'UPDATE_RELEVANCE_FAILED',
    payload: { contextId, contentId, relevance }
  };
}
```

### 2.2 Redux Thunks for API Integration

```typescript
// frontend/src/store/thunks/context-thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { contextApi } from '../../services/api/context-api';
import { ApiError } from '../../services/api/api-error';
import { showNotification } from '../slices/notification-slice';

// Get contexts for a project
export const fetchContextsForProject = createAsyncThunk(
  'contexts/fetchForProject',
  async (projectId: string, { rejectWithValue, dispatch }) => {
    try {
      return await contextApi.getContextsForProject(projectId);
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: apiError.toUserFriendlyMessage()
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Create a new context
export const createContext = createAsyncThunk(
  'contexts/create',
  async (data: CreateContextRequest, { rejectWithValue, dispatch }) => {
    try {
      const result = await contextApi.createContext(data);
      dispatch(showNotification({
        type: 'success',
        message: `Context "${result.title}" created successfully`
      }));
      return result;
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: apiError.toUserFriendlyMessage()
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Get context content with optimistic updates
export const fetchContextContent = createAsyncThunk(
  'contexts/fetchContent',
  async (contextId: string, { rejectWithValue, dispatch }) => {
    try {
      return await contextApi.getContextContent(contextId);
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to load context content: ${apiError.toUserFriendlyMessage()}`
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Update content selection with optimistic updates
export const updateContentSelection = createAsyncThunk(
  'contexts/updateSelection',
  async ({ 
    contextId, 
    itemIds, 
    selected 
  }: { 
    contextId: string; 
    itemIds: string[]; 
    selected: boolean;
  }, { dispatch }) => {
    // Optimistically update the UI
    dispatch({
      type: 'CONTEXT_CONTENT_UPDATED',
      payload: { contextId, itemIds, selected }
    });
    
    try {
      await contextApi.updateContentSelection(contextId, itemIds, selected);
      return { contextId, itemIds, selected, success: true };
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to update selection: ${apiError.toUserFriendlyMessage()}`
      }));
      
      // Revert the optimistic update
      dispatch({
        type: 'UPDATE_SELECTION_FAILED',
        payload: { contextId, itemIds, selected }
      });
      
      throw error; // Let the thunk middleware handle it
    }
  }
);

// Implement similar thunks for all context operations
// ...
```

### 2.3 Redux Selectors for Derived State

```typescript
// frontend/src/store/selectors/context-selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Select all contexts
export const selectAllContexts = (state: RootState) => state.contexts.items;

// Select active context ID
export const selectActiveContextId = (state: RootState) => state.contexts.activeContextId;

// Select active context (derived)
export const selectActiveContext = createSelector(
  [selectAllContexts, selectActiveContextId],
  (contexts, activeId) => activeId ? contexts[activeId] : null
);

// Select all content items
export const selectAllContentItems = (state: RootState) => state.contentItems.items;

// Select content items by context ID (derived)
export const selectContentItemsByContextId = createSelector(
  [selectAllContentItems, (_, contextId) => contextId],
  (items, contextId) => Object.values(items).filter(item => item.contextId === contextId)
);

// Select selected content items for active context (derived)
export const selectSelectedContentForActiveContext = createSelector(
  [selectAllContentItems, selectActiveContextId],
  (items, contextId) => {
    if (!contextId) return [];
    return Object.values(items)
      .filter(item => item.contextId === contextId && item.selected);
  }
);

// Select token usage for active context (derived)
export const selectTokenUsageForActiveContext = createSelector(
  [selectSelectedContentForActiveContext],
  (selectedItems) => {
    const usage = {
      total: 10000, // Max tokens (could be configurable)
      used: 0,
      breakdown: {
        text: 0,
        code: 0,
        image: 0,
        list: 0
      }
    };
    
    selectedItems.forEach(item => {
      usage.used += item.tokens;
      if (usage.breakdown[item.type] !== undefined) {
        usage.breakdown[item.type] += item.tokens;
      }
    });
    
    return {
      ...usage,
      percentage: (usage.used / usage.total) * 100,
    };
  }
);

// Additional selectors for context visualization, filtering, etc.
// ...
```

## 3. Authentication Flow Implementation

### 3.1 Token Management Service

```typescript
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
```

### 3.2 Auth Guard Component

```typescript
// frontend/src/components/auth/AuthGuard.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { checkAuthStatus } from '../../store/thunks/auth-thunks';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[]; // Optional role-based access control
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status if not already loading
    if (!isLoading) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch, isLoading]);

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the current location for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = user && roles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required roles, render children
  return <>{children}</>;
};
```

### 3.3 Protected Route Component

```typescript
// frontend/src/routes/ProtectedRoute.tsx
import React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';

interface ProtectedRouteProps extends RouteProps {
  roles?: string[];
  element: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  element,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      element={
        <AuthGuard roles={roles}>
          {element}
        </AuthGuard>
      }
    />
  );
};
```

## 4. WebSocket Implementation for Real-time Features

### 4.1 WebSocket Service

```typescript
// frontend/src/services/websocket-service.ts
import { getAccessToken } from './auth/token-service';
import { store } from '../store/store';
import {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessageReceived
} from '../store/slices/websocket-slice';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  constructor(private url: string) {}

  // Connect to WebSocket server
  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    const token = getAccessToken();
    if (!token) {
      console.error('Cannot connect to WebSocket: No auth token');
      return;
    }

    try {
      // Connect with authentication token
      this.socket = new WebSocket(`${this.url}?token=${token}`);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
    store.dispatch(wsDisconnected());
  }

  // Send message to WebSocket server
  public send(type: string, payload: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }

    const message = JSON.stringify({ type, payload });
    this.socket.send(message);
  }

  // Handle WebSocket open event
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    store.dispatch(wsConnected());
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    store.dispatch(wsDisconnected());
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    store.dispatch(wsError('Connection error'));
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      store.dispatch(wsMessageReceived(data));
      
      // Handle specific message types
      this.handleSpecificMessageTypes(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle specific message types with custom logic
  private handleSpecificMessageTypes(data: any): void {
    switch (data.type) {
      case 'CONTEXT_UPDATED':
        // Dispatch context update action
        store.dispatch({
          type: 'contexts/contextUpdated',
          payload: data.payload
        });
        break;
        
      case 'SELECTION_CHANGED':
        // Dispatch selection change action
        store.dispatch({
          type: 'contexts/selectionChanged',
          payload: data.payload
        });
        break;
        
      case 'USER_JOINED':
      case 'USER_LEFT':
        // Handle user presence updates
        store.dispatch({
          type: 'collaboration/presenceChanged',
          payload: data.payload
        });
        break;
        
      // Add more message type handlers as needed
    }
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up');
      return;
    }

    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

// Create and export the WebSocket service instance
export const wsService = new WebSocketService(
  process.env.REACT_APP_WS_URL || 'wss://api.contextnexus.io/ws'
);
```

### 4.2 WebSocket Integration with Redux

```typescript
// frontend/src/store/slices/websocket-slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  lastMessage: any | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  error: null,
  lastMessage: null
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    wsConnected: (state) => {
      state.isConnected = true;
      state.error = null;
    },
    wsDisconnected: (state) => {
      state.isConnected = false;
    },
    wsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    wsMessageReceived: (state, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
    }
  }
});

export const {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessageReceived
} = websocketSlice.actions;

export default websocketSlice.reducer;
```

### 4.3 Collaboration Middleware

```typescript
// frontend/src/store/middleware/collaboration-middleware.ts
import { Middleware } from 'redux';
import { wsService } from '../../services/websocket-service';

// Actions that should be synced with other users in real-time
const SYNC_ACTIONS = [
  'contexts/updateSelection',
  'contexts/updateRelevance',
  'contexts/addCategory',
  'contexts/removeCategory',
  'contexts/assignItemsToCategory'
];

// Middleware to sync state changes with other users via WebSocket
export const collaborationMiddleware: Middleware = store => next => action => {
  // Execute the action locally first
  const result = next(action);
  
  // If it's an action we want to sync, send it to the server
  if (SYNC_ACTIONS.includes(action.type) && wsService && store.getState().websocket.isConnected) {
    // Get the active context ID
    const activeContextId = store.getState().contexts.activeContextId;
    
    if (activeContextId) {
      // Send the action to other users in the same context
      wsService.send('SYNC_ACTION', {
        contextId: activeContextId,
        action: {
          type: action.type,
          payload: action.payload
        }
      });
    }
  }
  
  return result;
};
```

## 5. Integration Testing Plan

### 5.1 Unit Tests for API Client

```typescript
// frontend/src/services/api/__tests__/api-client.test.ts
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../api-client';
import { getAccessToken, setTokens, clearTokens } from '../../auth/token-service';

// Mock the token service
jest.mock('../../auth/token-service');

describe('API Client', () => {
  let mockAxios: MockAdapter;
  
  beforeEach(() => {
    mockAxios = new MockAdapter(apiClient['client']);
    jest.resetAllMocks();
  });
  
  afterEach(() => {
    mockAxios.restore();
  });
  
  test('should add auth token to request headers when available', async () => {
    // Mock token retrieval
    (getAccessToken as jest.Mock).mockReturnValue('test-token');
    
    // Configure mock response
    mockAxios.onGet('/test').reply(config => {
      // Check if Authorization header was set correctly
      expect(config.headers?.Authorization).toBe('Bearer test-token');
      return [200, { data: 'success' }];
    });
    
    // Make the request
    await apiClient.get('/test');
  });
  
  test('should handle 401 errors and refresh token', async () => {
    // Mock initial token
    (getAccessToken as jest.Mock).mockReturnValue('expired-token');
    
    // Mock successful token refresh
    mockAxios.onPost('/users/refresh-token').reply(200, {
      token: 'new-token',
      refreshToken: 'new-refresh-token'
    });
    
    // Configure 401 for first request, success for retry
    mockAxios.onGet('/test').replyOnce(401);
    mockAxios.onGet('/test').reply(200, { data: 'success' });
    
    // Make the request
    const result = await apiClient.get('/test');
    
    // Verify tokens were updated
    expect(setTokens).toHaveBeenCalledWith('new-token', 'new-refresh-token');
    expect(result).toEqual({ data: 'success' });
  });
  
  test('should handle failed token refresh', async () => {
    // Mock initial token
    (getAccessToken as jest.Mock).mockReturnValue('expired-token');
    
    // Mock failed token refresh
    mockAxios.onPost('/users/refresh-token').reply(401, {
      error: 'Invalid refresh token'
    });
    
    // Configure 401 for the test endpoint
    mockAxios.onGet('/test').reply(401);
    
    // Make the request and expect it to fail
    await expect(apiClient.get('/test')).rejects.toThrow();
    
    // Verify tokens were cleared
    expect(clearTokens).toHaveBeenCalled();
  });
  
  // Add more tests for other API client functionality...
});
```

### 5.2 Integration Tests for Auth Flow

```typescript
// frontend/src/features/auth/__tests__/auth-flow.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../../store/store';
import LoginForm from '../../../components/auth/LoginForm';
import { authApi } from '../../../services/api/auth-api';
import { setTokens } from '../../../services/auth/token-service';

// Mock API client and token service
jest.mock('../../../services/api/auth-api');
jest.mock('../../../services/auth/token-service');

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  test('successful login flow', async () => {
    // Mock successful login API call
    (authApi.login as jest.Mock).mockResolvedValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com', role: 'user' },
      token: 'test-token',
      refreshToken: 'test-refresh-token'
    });
    
    // Render login form
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify API was called with correct data
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Verify tokens were saved
    await waitFor(() => {
      expect(setTokens).toHaveBeenCalledWith('test-token', 'test-refresh-token');
    });
    
    // Verify redirect (would need to mock useNavigate)
  });
  
  test('login with invalid credentials shows error', async () => {
    // Mock failed login
    (authApi.login as jest.Mock).mockRejectedValue({
      response: {
        data: { error: 'Invalid email or password', statusCode: 401 },
        status: 401
      }
    });
    
    // Render login form
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
  
  // Add more tests for registration, token refresh, etc.
});
```

### 5.3 End-to-End Tests

```typescript
// frontend/cypress/e2e/auth-flow.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });
  
  it('should allow a user to log in and access protected pages', () => {
    // Visit login page
    cy.visit('/login');
    
    // Fill out login form
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    
    // Submit form
    cy.get('[data-testid=login-button]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user info is displayed
    cy.get('[data-testid=user-display]').should('contain', 'user@example.com');
    
    // Navigate to protected page
    cy.get('[data-testid=contexts-link]').click();
    
    // Verify access to protected page
    cy.url().should('include', '/contexts');
    cy.get('h1').should('contain', 'Contexts');
  });
  
  it('should redirect unauthenticated users to login page', () => {
    // Try to access protected page without logging in
    cy.visit('/contexts');
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    
    // Verify login form is displayed
    cy.get('[data-testid=login-form]').should('exist');
  });
  
  it('should maintain authentication after page refresh', () => {
    // Log in
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Verify login successful
    cy.url().should('include', '/dashboard');
    
    // Refresh the page
    cy.reload();
    
    // Verify still logged in
    cy.get('[data-testid=user-display]').should('contain', 'user@example.com');
    cy.url().should('include', '/dashboard');
  });
  
  it('should allow a user to log out', () => {
    // Log in
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('user@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Click logout button
    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=logout-button]').click();
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    
    // Try to access protected page
    cy.visit('/contexts');
    
    // Verify redirect back to login
    cy.url().should('include', '/login');
  });
});
```

## 6. Error Handling Strategy

### 6.1 Global Error Boundary Component

```tsx
// frontend/src/components/errorHandling/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring/analytics service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // e.g., Sentry.captureException(error)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise default error view
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">Error details:</p>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 6.2 Notification System for API Errors

```tsx
// frontend/src/components/notifications/NotificationSystem.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RootState } from '../../store/store';
import { removeNotification } from '../../store/slices/notification-slice';

const NotificationSystem: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.items);
  
  useEffect(() => {
    // Show new notifications
    notifications.forEach(notification => {
      if (!notification.displayed) {
        // Convert notification type to toast type
        const toastType = notification.type === 'error' ? toast.error :
                         notification.type === 'success' ? toast.success :
                         notification.type === 'warning' ? toast.warning :
                         toast.info;
        
        // Display toast
        toastType(notification.message, {
          position: 'top-right',
          autoClose: notification.type === 'error' ? 8000 : 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          onClose: () => dispatch(removeNotification(notification.id))
        });
        
        // Mark as displayed
        dispatch({ 
          type: 'notifications/markAsDisplayed', 
          payload: notification.id 
        });
      }
    });
  }, [notifications, dispatch]);
  
  return <ToastContainer />;
};

export default NotificationSystem;
```

## 7. Backend-Frontend Connection Validation

### 7.1 Health Check Service

```typescript
// frontend/src/services/health-check-service.ts
import apiClient from './api/api-client';
import { toast } from 'react-toastify';

interface HealthCheckResponse {
  status: string;
  api: string;
  database: string;
  services: Record<string, string>;
}

export class HealthCheckService {
  private isCheckingHealth = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  // Check backend health
  public async checkHealth(): Promise<boolean> {
    if (this.isCheckingHealth) return true;
    
    this.isCheckingHealth = true;
    
    try {
      const response = await apiClient.get<HealthCheckResponse>('/health');
      
      // All systems operational
      if (response.status === 'ok') {
        this.isCheckingHealth = false;
        return true;
      }
      
      // Check for specific subsystem failures
      if (response.database !== 'ok') {
        console.error('Database health check failed');
        toast.error('Database connection issue. Some features may be unavailable.');
      }
      
      // Check for failing services
      const failingServices = Object.entries(response.services)
        .filter(([_, status]) => status !== 'ok')
        .map(([name, _]) => name);
      
      if (failingServices.length > 0) {
        console.error('Service health check failed:', failingServices);
        toast.warning(`Some services are experiencing issues: ${failingServices.join(', ')}`);
      }
      
      this.isCheckingHealth = false;
      return response.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Unable to connect to the server. Please check your connection.');
      
      this.isCheckingHealth = false;
      return false;
    }
  }
  
  // Start periodic health checks
  public startPeriodicHealthChecks(intervalMs: number = 60000): void {
    // Stop any existing interval
    this.stopPeriodicHealthChecks();
    
    // Start new interval
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
  }
  
  // Stop periodic health checks
  public stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const healthCheckService = new HealthCheckService();
```

### 7.2 App-wide Health Check Integration

```tsx
// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { healthCheckService } from './services/health-check-service';
import { checkAuthStatus } from './store/thunks/auth-thunks';
import { wsService } from './services/websocket-service';
import ErrorBoundary from './components/errorHandling/ErrorBoundary';
import NotificationSystem from './components/notifications/NotificationSystem';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthGuard } from './components/auth/AuthGuard';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordReset from './pages/auth/PasswordReset';
import Dashboard from './pages/Dashboard';
import ContextPage from './pages/ContextPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Initial health check
    healthCheckService.checkHealth();
    
    // Start periodic health checks in production
    if (process.env.NODE_ENV === 'production') {
      healthCheckService.startPeriodicHealthChecks();
    }
    
    // Check auth status on app load
    dispatch(checkAuthStatus());
    
    // Clean up on unmount
    return () => {
      healthCheckService.stopPeriodicHealthChecks();
      wsService.disconnect();
    };
  }, [dispatch]);
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationSystem />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          
          <Route path="/context/:contextId" element={
            <AuthGuard>
              <ContextPage />
            </AuthGuard>
          } />
          
          <Route path="/profile" element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          } />
          
          {/* Admin routes with role check */}
          <Route path="/admin" element={
            <AuthGuard roles={['admin']}>
              <AdminPage />
            </AuthGuard>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
```

## 8. Final Integration Checklist

1. **Authentication Flow**
   - [ ] Login works with proper token storage
   - [ ] Token refresh works automatically
   - [ ] Protected routes redirect to login when not authenticated
   - [ ] Role-based access control works correctly
   - [ ] User session persists across page refreshes
   - [ ] Logout clears all tokens and state

2. **API Integration**
   - [ ] All API endpoints are properly wrapped in service methods
   - [ ] Error handling is consistent across all API calls
   - [ ] Response transformations are correct
   - [ ] Authentication headers are correctly attached
   - [ ] File uploads/downloads work correctly
   - [ ] Streaming responses are handled properly

3. **State Management**
   - [ ] Redux state properly syncs with backend state
   - [ ] Optimistic updates work correctly
   - [ ] Complex state derivations use memoized selectors
   - [ ] State changes trigger appropriate UI updates
   - [ ] Error states handled gracefully

4. **WebSocket Integration**
   - [ ] Connection established on authenticated routes
   - [ ] Authentication token properly passed
   - [ ] Reconnection logic works
   - [ ] Messages correctly dispatched to Redux
   - [ ] Collaborative features update in real-time

5. **Error Handling**
   - [ ] API errors show user-friendly messages
   - [ ] Component errors caught by ErrorBoundary
   - [ ] Network errors handled gracefully
   - [ ] Authentication errors trigger proper flows
   - [ ] Error reporting set up for production

6. **Performance**
   - [ ] Large lists are virtualized
   - [ ] API calls are debounced where appropriate
   - [ ] Heavy computations are memoized
   - [ ] Assets are properly optimized
   - [ ] Code splitting implemented for routes

This comprehensive backend-frontend integration plan covers all the essential aspects needed for a robust, production-ready application. The implementation includes detailed error handling, authentication flows, real-time capabilities, and the performance optimizations necessary for a complex application like ContextNexus.