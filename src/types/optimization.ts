// src/types/optimization.ts
import { ContentType } from './core';

/**
 * Optimized context containing selected content items
 */
export interface OptimizedContext {
  items: OptimizedContentItem[];
  totalTokens: number;
  remainingTokens: number;
  originalContentCount: number;
  selectedContentCount: number;
  query?: string;
}

/**
 * Content item optimized for inclusion in context
 */
export interface OptimizedContentItem {
  id: string;
  content: string;
  title: string;
  contentType: ContentType;
  tokens: number;
  relevance: number;
  chunkIndex?: number;
  metadata?: Record<string, any>;
}

/**
 * Available chunking strategies
 */
export enum ChunkStrategy {
  PARAGRAPH = 'paragraph',
  SEMANTIC = 'semantic',
  FIXED_SIZE = 'fixed-size',
  CODE_AWARE = 'code-aware',
  LIST_AWARE = 'list-aware'
}

/**
 * Content chunk
 */
export interface ContentChunk {
  content: string;
  tokens: number;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

/**
 * Prompt for sending to LLM
 */
export interface Prompt {
  text: string;
  tokens: number;
  messages?: Array<{
    role: string;
    content: string;
  }>;
  modelType: string;
}

/**
 * Factors used for relevance scoring
 */
export interface ScoringFactors {
  recency?: number; // 0-1 factor for recency
  userInteraction?: number; // 0-1 factor for user interaction history
  contentTypeWeights?: Record<string, number>; // weights for different content types
  manualRelevance?: number; // 0-1 factor for manually assigned relevance
  selectedByUser?: boolean; // whether the user manually selected this content
}

/**
 * Selection status information
 */
export interface SelectionStatus {
  contextId: string;
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  selectedItems: number;
  totalItems: number;
  breakdown: {
    [ContentType.TEXT]?: number;
    [ContentType.CODE]?: number;
    [ContentType.IMAGE]?: number;
  };
}