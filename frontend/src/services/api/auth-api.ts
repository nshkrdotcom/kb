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