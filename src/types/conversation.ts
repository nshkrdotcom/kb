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