# Frontend Development Implementation: Authentication & Conversation UI

I'll create a comprehensive implementation for the ContextNexus frontend, focusing on authentication flow and conversation interface. This implementation uses React with TypeScript, Redux for state management, and a responsive design system.

## 1. Project Setup and Dependencies

First, let's set up the React application with TypeScript and install necessary dependencies:

```bash
# Create React application with TypeScript template
npx create-react-app frontend --template typescript
cd frontend

# Install core dependencies
npm install react-router-dom axios formik yup @reduxjs/toolkit react-redux
npm install react-markdown react-syntax-highlighter jwt-decode
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npm install react-toastify

# Install dev dependencies
npm install --save-dev @types/react-router-dom @types/react-syntax-highlighter

# Initialize Tailwind CSS
npx tailwindcss init -p
```

Configure Tailwind CSS in `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1fe',
          100: '#cce3fd',
          200: '#99c7fb',
          300: '#66aaf9',
          400: '#338ef7',
          500: '#0072f5',
          600: '#005bc4',
          700: '#004493',
          800: '#002e62',
          900: '#001731',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

## 2. Type Definitions

Let's define our core types for authentication and conversation:

```typescript
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
```

```typescript
// src/types/conversation.ts
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface QueryRequest {
  query: string;
  contextId: string;
  options?: {
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
    includeMetadata?: boolean;
    stream?: boolean;
  };
}

export interface QueryResponse {
  id: string;
  query: string;
  response: string;
  contextId: string;
  modelId: string;
  metadata?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
```

## 3. API Client Service

This service handles all communication with the backend API, including token management and streaming:

```typescript
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
```

## 4. Authentication Service

```typescript
// src/services/auth-service.ts
import apiClient from './api-client';
import { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse 
} from '../types/auth';
import { setTokens, clearTokens, getAccessToken } from '../utils/token';
import jwtDecode from 'jwt-decode';

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', credentials);
      const { user, token, refreshToken } = response;
      
      setTokens(token, refreshToken);
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users/register', credentials);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Only make the API call if we have a token
      const token = getAccessToken();
      if (token) {
        await apiClient.post('/users/logout', {});
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear tokens regardless of API success/failure
      clearTokens();
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/users/reset-password', { email });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/users/change-password', { oldPassword, newPassword });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserProfile(): Promise<User> {
    try {
      const user = await apiClient.get<User>('/users/profile');
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const user = await apiClient.put<User>('/users/profile', updates);
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  isAuthenticated(): boolean {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with an error status
      const message = error.response.data.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response from server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();
```

## 5. Token Utilities

```typescript
// src/utils/token.ts
// Token storage and management utilities

const ACCESS_TOKEN_KEY = 'contextnexus_access_token';
const REFRESH_TOKEN_KEY = 'contextnexus_refresh_token';

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
```

## 6. Authentication Redux Slice

```typescript
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types/auth';
import authService from '../../services/auth-service';
import { getAccessToken, getRefreshToken } from '../../utils/token';
import jwtDecode from 'jwt-decode';

// Initial state
const initialState: AuthState = {
  user: null,
  token: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getAccessToken(),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      return await authService.register(credentials);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getUserProfile();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates: Partial<User>, { rejectWithValue }) => {
    try {
      return await authService.updateUserProfile(updates);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    restoreSession: (state) => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            state.token = token;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.user = {
              id: decoded.userId,
              email: decoded.email,
              name: decoded.name || '',
              role: decoded.role || 'user',
            };
          }
        } catch {
          // Invalid token
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    });

    // Get User Profile
    builder.addCase(getUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(getUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update User Profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, restoreSession } = authSlice.actions;
export default authSlice.reducer;
```

## 7. Conversation Redux Slice

```typescript
// src/store/slices/conversationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../../services/api-client';
import { 
  ConversationState, 
  Conversation, 
  Message, 
  QueryRequest, 
  QueryResponse 
} from '../../types/conversation';

const initialState: ConversationState = {
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

// Async thunks
export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async ({ message, conversationId, contextId }: { 
    message: string, 
    conversationId: string, 
    contextId: string 
  }, { rejectWithValue, getState }) => {
    try {
      // Create request payload
      const request: QueryRequest = {
        query: message,
        contextId,
        options: {
          includeMetadata: true,
        },
      };

      // Send the query to the API
      const response = await apiClient.post<QueryResponse>('/queries', request);
      
      return {
        conversationId,
        userMessage: {
          id: uuidv4(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          status: 'sent',
        } as Message,
        aiMessage: {
          id: uuidv4(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          status: 'sent',
          metadata: response.metadata,
        } as Message,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendStreamingMessage = createAsyncThunk(
  'conversation/sendStreamingMessage',
  async ({ message, conversationId, contextId, onChunk }: { 
    message: string, 
    conversationId: string, 
    contextId: string,
    onChunk: (chunk: string) => void 
  }, { rejectWithValue, dispatch }) => {
    try {
      // Create user message immediately
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      // Create placeholder for AI response
      const aiMessageId = uuidv4();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      // Add both messages to the state
      dispatch(addMessage({ conversationId, message: userMessage }));
      dispatch(addMessage({ conversationId, message: aiMessage }));

      // Create request payload
      const request: QueryRequest = {
        query: message,
        contextId,
        options: {
          includeMetadata: true,
          stream: true,
        },
      };

      let fullContent = '';

      // Start streaming request
      await apiClient.streamRequest<any>(
        '/queries', 
        request, 
        (eventData) => {
          if (eventData.type === 'chunk') {
            fullContent += eventData.content;
            onChunk(eventData.content);
            dispatch(updateMessageContent({ 
              conversationId, 
              messageId: aiMessageId, 
              content: fullContent 
            }));
          } else if (eventData.type === 'end') {
            // Complete the message
            dispatch(updateMessageStatus({ 
              conversationId, 
              messageId: aiMessageId, 
              status: 'sent' 
            }));
          }
        }
      );

      return { conversationId, success: true };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'conversation/createConversation',
  async ({ title, contextId }: { title: string, contextId: string }, { rejectWithValue }) => {
    try {
      // In a real app, you might create this via API
      const conversation: Conversation = {
        id: uuidv4(),
        title,
        messages: [],
        contextId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadConversations = createAsyncThunk(
  'conversation/loadConversations',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch from API
      // For now, we'll just return empty
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string, message: Message }>) => {
      const { conversationId, message } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(message);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
      }
    },
    updateMessageContent: (state, action: PayloadAction<{ 
      conversationId: string, 
      messageId: string, 
      content: string 
    }>) => {
      const { conversationId, messageId, content } = action.payload;
      const conversation = state.conversations[conversationId];
      
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          conversation.messages[messageIndex].content = content;
        }
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ 
      conversationId: string, 
      messageId: string, 
      status: 'sending' | 'sent' | 'error' 
    }>) => {
      const { conversationId, messageId, status } = action.payload;
      const conversation = state.conversations[conversationId];
      
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          conversation.messages[messageIndex].status = status;
        }
      }
    },
    clearConversations: (state) => {
      state.conversations = {};
      state.activeConversationId = null;
    },
  },
  extraReducers: (builder) => {
    // Create conversation
    builder.addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
      state.conversations[action.payload.id] = action.payload;
      state.activeConversationId = action.payload.id;
    });

    // Send message
    builder.addCase(sendMessage.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isLoading = false;
      const { conversationId, userMessage, aiMessage } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(userMessage);
        state.conversations[conversationId].messages.push(aiMessage);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Send streaming message
    builder.addCase(sendStreamingMessage.pending, (state) => {
      state.isStreaming = true;
      state.error = null;
    });
    builder.addCase(sendStreamingMessage.fulfilled, (state) => {
      state.isStreaming = false;
    });
    builder.addCase(sendStreamingMessage.rejected, (state, action) => {
      state.isStreaming = false;
      state.error = action.payload as string;
    });

    // Load conversations
    builder.addCase(loadConversations.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
      state.isLoading = false;
      
      // Convert array to record
      const conversationsRecord: Record<string, Conversation> = {};
      action.payload.forEach(conversation => {
        conversationsRecord[conversation.id] = conversation;
      });
      
      state.conversations = conversationsRecord;
      
      // Set active conversation to the most recent one if none is selected
      if (!state.activeConversationId && action.payload.length > 0) {
        // Sort by updatedAt and get most recent
        const sortedConversations = [...action.payload].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        state.activeConversationId = sortedConversations[0].id;
      }
    });
    builder.addCase(loadConversations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  setActiveConversation, 
  addMessage, 
  updateMessageContent,
  updateMessageStatus,
  clearConversations 
} = conversationSlice.actions;
export default conversationSlice.reducer;
```

## 8. Redux Store Setup

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 9. Authentication Components

### 9.1 Login Form Component

```tsx
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { LoginCredentials } from '../../types/auth';

const LoginForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    } as LoginCredentials,
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        await dispatch(login(values)).unwrap();
        navigate('/');
      } catch (error) {
        // Error is handled by the auth slice
      }
    },
  });

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to ContextNexus
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  formik.touched.email && formik.errors.email 
                    ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                } text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    formik.touched.password && formik.errors.password 
                      ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                  } text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    {showPassword ? (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    ) : (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    )}
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {formik.touched.password && formik.errors.password ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.password}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/reset-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
```

### 9.2 Register Form Component

```tsx
// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { RegisterCredentials } from '../../types/auth';

const RegisterForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
    } as RegisterCredentials,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        await dispatch(register(values)).unwrap();
        // On successful registration, redirect to login
        navigate('/login', { state: { message: 'Registration successful. Please sign in.' } });
      } catch (error) {
        // Error is handled by the auth slice
      }
    },
  });

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  formik.touched.name && formik.errors.name 
                    ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                } text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Full name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.name}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  formik.touched.email && formik.errors.email 
                    ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                } text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    formik.touched.password && formik.errors.password 
                      ? 'border-red-300 placeholder-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500'
                  } text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    {showPassword ? (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    ) : (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    )}
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {formik.touched.password && formik.errors.password ? (
                <p className="mt-2 text-sm text-red-600">{formik.errors.password}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-sm">
              By registering, you agree to our{' '}
              <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
```

### 9.3 Password Reset Component

```tsx
// src/components/auth/PasswordReset.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/auth-service';

const PasswordReset: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      
      try {
        await authService.resetPassword(values.email);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  We've sent a password reset link to your email.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formik.touched.email && formik.errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm`}
                  placeholder="you@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email ? (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
                ) : null}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Reset Password
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
```

### 9.4 User Profile Component

```tsx
// src/components/auth/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, updateUserProfile } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import authService from '../../services/auth-service';

const UserProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);
  
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      await dispatch(updateUserProfile(values));
    },
  });
  
  const passwordFormik = useFormik({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      oldPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values) => {
      setPasswordError(null);
      setPasswordSuccess(false);
      
      try {
        await authService.changePassword(values.oldPassword, values.newPassword);
        setPasswordSuccess(true);
        passwordFormik.resetForm();
      } catch (err: any) {
        setPasswordError(err.message);
      }
    },
  });

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={profileFormik.handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        profileFormik.touched.name && profileFormik.errors.name ? 'border-red-300' : ''
                      }`}
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                    />
                    {profileFormik.touched.name && profileFormik.errors.name ? (
                      <p className="mt-2 text-sm text-red-600">{profileFormik.errors.name}</p>
                    ) : null}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        profileFormik.touched.email && profileFormik.errors.email ? 'border-red-300' : ''
                      }`}
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                    />
                    {profileFormik.touched.email && profileFormik.errors.email ? (
                      <p className="mt-2 text-sm text-red-600">{profileFormik.errors.email}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div className="mt-10 sm:mt-0">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Password</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            {!changePasswordMode ? (
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <p className="text-sm text-gray-700">
                    Your password is securely stored and never shared with anyone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setChangePasswordMode(true)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={passwordFormik.handleSubmit}>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    {passwordError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{passwordError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">Password updated successfully.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="oldPassword"
                          id="oldPassword"
                          autoComplete="current-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.oldPassword && passwordFormik.errors.oldPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.oldPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.oldPassword && passwordFormik.errors.oldPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.oldPassword}</p>
                        ) : null}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          autoComplete="new-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.newPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.newPassword}</p>
                        ) : null}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          autoComplete="new-password"
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? 'border-red-300' : ''
                          }`}
                          value={passwordFormik.values.confirmPassword}
                          onChange={passwordFormik.handleChange}
                          onBlur={passwordFormik.handleBlur}
                        />
                        {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? (
                          <p className="mt-2 text-sm text-red-600">{passwordFormik.errors.confirmPassword}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordMode(false);
                        passwordFormik.resetForm();
                        setPasswordError(null);
                        setPasswordSuccess(false);
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
```

## 10. Conversation Interface Components

### 10.1 Chat Interface Component

```tsx
// src/components/conversation/ChatInterface.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  createConversation, 
  sendStreamingMessage, 
  setActiveConversation 
} from '../../store/slices/conversationSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  contextId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    conversations, 
    activeConversationId, 
    isLoading, 
    isStreaming 
  } = useSelector((state: RootState) => state.conversation);
  
  const [error, setError] = useState<string | null>(null);
  
  // Create a new conversation when component mounts if no active conversation
  useEffect(() => {
    if (!activeConversationId && contextId) {
      dispatch(createConversation({
        title: 'New Conversation',
        contextId
      }));
    }
  }, [activeConversationId, contextId, dispatch]);
  
  const handleSendMessage = async (message: string) => {
    if (!activeConversationId) {
      setError('No active conversation');
      return;
    }
    
    setError(null);
    
    try {
      await dispatch(sendStreamingMessage({
        message,
        conversationId: activeConversationId,
        contextId,
        onChunk: () => { /* handled by the slice */ }
      })).unwrap();
    } catch (err: any) {
      setError(err.toString());
    }
  };
  
  // Get the active conversation
  const activeConversation = activeConversationId 
    ? conversations[activeConversationId] 
    : null;
  
  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {activeConversation?.title || 'New Conversation'}
        </h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {/* Menu or additional controls can go here */}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {activeConversation ? (
          <MessageList 
            messages={activeConversation.messages} 
            isTyping={isStreaming}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 px-4 py-3">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isDisabled={isLoading || isStreaming || !activeConversationId}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
```

### 10.2 Message List Component

```tsx
// src/components/conversation/MessageList.tsx
import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/conversation';
import StreamingMessage from './StreamingMessage';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as codeTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // If there are no messages, show a welcome message
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900">Welcome to ContextNexus</h3>
          <p className="mt-2 text-sm text-gray-500">
            I'm ready to help you with your questions and tasks.
            Start by sending a message below.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-3xl rounded-lg px-4 py-2 ${
              message.role === 'user' 
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.status === 'sending' ? (
              <StreamingMessage content={message.content} />
            ) : (
              <ReactMarkdown
                components={{
                  // Render code blocks with syntax highlighting
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={codeTheme}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} px-1 py-0.5 rounded bg-gray-200`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Customize other elements
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary-600 hover:underline" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            
            {/* Message metadata */}
            <div className="mt-1 text-xs text-gray-500 flex justify-end">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {message.status === 'error' && (
                <span className="ml-2 text-red-500">Error</span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* AI typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-100"></div>
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-200"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible element for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
```

### 10.3 Message Input Component

```tsx
// src/components/conversation/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isDisabled = false 
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isDisabled) {
      return;
    }
    
    onSendMessage(message);
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isDisabled}
        className="w-full pr-12 resize-none border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
        rows={1}
      />
      <button
        type="submit"
        disabled={!message.trim() || isDisabled}
        className="absolute right-2 bottom-1.5 rounded-full p-1.5 text-primary-600 hover:bg-primary-100 focus:outline-none disabled:opacity-50 disabled:hover:bg-transparent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v5.69a.75.75 0 001.5 0v-5.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
```

### 10.4 Streaming Message Component

```tsx
// src/components/conversation/StreamingMessage.tsx
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as codeTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface StreamingMessageProps {
  content: string;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  const [visibleContent, setVisibleContent] = useState('');
  const contentRef = useRef('');
  const cursorRef = useRef<HTMLSpanElement>(null);
  
  // Update content with typewriter effect
  useEffect(() => {
    contentRef.current = content;
    
    // If the content length has decreased, reset the visible content
    if (content.length < visibleContent.length) {
      setVisibleContent('');
    }
    
    // Only animate if we have new content to show
    if (content.length > visibleContent.length) {
      const interval = setInterval(() => {
        if (visibleContent.length < contentRef.current.length) {
          setVisibleContent(prev => contentRef.current.substring(0, prev.length + 1));
        } else {
          clearInterval(interval);
        }
      }, 10); // Adjust speed here
      
      return () => clearInterval(interval);
    }
  }, [content, visibleContent]);
  
  // Blinking cursor animation
  useEffect(() => {
    if (!cursorRef.current) return;
    
    const blink = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = cursorRef.current.style.opacity === '0' ? '1' : '0';
      }
    };
    
    const interval = setInterval(blink, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <ReactMarkdown
        components={{
          // Render code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={codeTheme}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} px-1 py-0.5 rounded bg-gray-200`} {...props}>
                {children}
              </code>
            );
          },
          // Customize other elements
          p: ({ node, ...props }) => <p className="mb-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2" {...props} />,
          a: ({ node, ...props }) => <a className="text-primary-600 hover:underline" {...props} />,
        }}
      >
        {visibleContent}
      </ReactMarkdown>
      <span ref={cursorRef} className="text-gray-500">▎</span>
    </div>
  );
};

export default StreamingMessage;
```

## 11. Routing with Protected Routes

```tsx
// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { restoreSession } from './store/slices/authSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Authentication pages
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PasswordReset from './components/auth/PasswordReset';
import UserProfile from './components/auth/UserProfile';

// Layout components
import MainLayout from './components/layout/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import ConversationPage from './pages/ConversationPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Try to restore user session from token on app load
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);
  
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="conversation/:contextId" element={<ConversationPage />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
```

## 12. Main Layout Component

```tsx
// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-primary-600">
                  ContextNexus
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ContextNexus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
```

## 13. Dashboard and Conversation Pages

```tsx
// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// In a real app, this would be fetched from an API
interface Context {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate fetching contexts from API
    const fetchContexts = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      setTimeout(() => {
        const mockContexts: Context[] = [
          {
            id: 'context-1',
            title: 'Project Documentation',
            description: 'Technical documentation for the ContextNexus project.',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'context-2',
            title: 'Research Notes',
            description: 'Research findings and literature review notes.',
            updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: 'context-3',
            title: 'Meeting Minutes',
            description: 'Notes from team meetings and discussions.',
            updatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
        ];
        
        setContexts(mockContexts);
        setIsLoading(false);
      }, 1000);
    };
    
    fetchContexts();
  }, []);
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Context
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Welcome, {user?.name}!</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a context to start a conversation or create a new one.
        </p>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Your Contexts</h3>
        
        {isLoading ? (
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : contexts.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contexts.map((context) => (
              <Link
                key={context.id}
                to={`/conversation/${context.id}`}
                className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <h4 className="text-lg font-medium text-gray-900">{context.title}</h4>
                  <p className="mt-1 text-sm text-gray-500">{context.description}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Last updated: {new Date(context.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 bg-white shadow rounded-lg p-6 text-center">
            <h4 className="text-lg font-medium text-gray-900">No contexts found</h4>
            <p className="mt-1 text-sm text-gray-500">
              Create your first context to get started.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Context
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
```

```tsx
// src/pages/ConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/conversation/ChatInterface';

interface Context {
  id: string;
  title: string;
  description: string;
}

const ConversationPage: React.FC = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const [context, setContext] = useState<Context | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!contextId) return;
    
    // Simulate fetching context details from API
    const fetchContext = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      setTimeout(() => {
        // Mock context data based on ID
        const mockContext: Context = {
          id: contextId,
          title: contextId === 'context-1' 
            ? 'Project Documentation' 
            : contextId === 'context-2'
              ? 'Research Notes'
              : 'Meeting Minutes',
          description: 'Conversation with ContextNexus AI about this content.',
        };
        
        setContext(mockContext);
        setIsLoading(false);
      }, 500);
    };
    
    fetchContext();
  }, [contextId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (!context) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900">Context not found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The context you're looking for doesn't exist.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{context.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{context.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar for context navigation (optional) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Context</h3>
            
            {/* Context content list would go here */}
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-primary-50 text-primary-700 rounded-md">
                Introduction
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Technical Specifications
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Implementation Details
              </button>
            </div>
          </div>
        </div>
        
        {/* Main conversation area */}
        <div className="lg:col-span-9 h-[calc(100vh-220px)]">
          <ChatInterface contextId={contextId || ''} />
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
```

```tsx
// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Page Not Found
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
```

## 14. Entry Point

```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

## Implementation Highlights

This implementation includes several key features:

1. **Robust Authentication System**:
   - Complete authentication flow with login, registration, and password reset
   - Secure token management with refresh capabilities
   - Persistent login across page refreshes
   - Protected routes for authenticated users

2. **Rich Conversation Interface**:
   - Real-time streaming response visualization
   - Markdown and code syntax highlighting support
   - Auto-resizing message input
   - Message typing indicators

3. **Redux State Management**:
   - Well-organized slices for auth and conversation state
   - Thunks for asynchronous operations
   - Caching of conversation history

4. **API Client Service**:
   - Token-based authentication
   - Automatic token refresh
   - Error handling and retry logic
   - Support for both RESTful and streaming responses

5. **Responsive Design**:
   - Mobile-friendly layouts
   - Appropriate spacing and typography
   - Loading indicators and error states
   - Accessibility considerations

This implementation provides a solid foundation for the ContextNexus frontend, focusing on the auth flow and conversation interface as requested. The design is clean, responsive, and follows modern React best practices with TypeScript for type safety.