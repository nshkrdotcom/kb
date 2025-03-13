// src/types/core.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  settings: Record<string, any>;
  role?: string;
  lastLogin?: Date;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  ownerId: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isArchived?: boolean;
}

export enum ContentType {
  TEXT = 'text',
  CODE = 'code',
  IMAGE = 'image',
  PDF = 'pdf',
  AUDIO = 'audio',
  VIDEO = 'video',
  DIAGRAM = 'diagram',
  TABLE = 'table',
  LIST = 'list',
  EMBED = 'embed'
}

export enum StorageType {
  POSTGRES = 'postgres',
  NEO4J = 'neo4j',
  MINIO = 'minio',
  PINECONE = 'pinecone'
}

export interface ContentItem extends BaseEntity {
  projectId: string;
  contentType: ContentType;
  storageType: StorageType;
  storageKey: string;
  title?: string;
  creatorId: string;
  metadata: Record<string, any>;
  embeddingId?: string;
  tokens: number;
  version: number;
  isActive: boolean;
  content?: any; // The actual content, loaded when needed
}

export interface TextContent {
  contentId: string;
  content: string;
}

export interface CodeContent {
  contentId: string;
  code: string;
  language: string;
  highlightedHtml?: string;
}

export interface Context extends BaseEntity {
  projectId: string;
  name: string;
  description?: string;
  parentContextId?: string;
  creatorId: string;
  isActive: boolean;
  settings: Record<string, any>;
  position?: number;
}

export interface ContextItem {
  contextId: string;
  contentId: string;
  relevanceScore: number;
  addedAt: Date;
  addedBy: string;
  orderPosition?: number;
}

export interface Tag extends BaseEntity {
  name: string;
  projectId: string;
  color?: string;
}

export interface ContentTag {
  contentId: string;
  tagId: string;
}

// Enums for relationship types
export enum RelationshipType {
  REFERENCES = 'references',
  EXPLAINS = 'explains',
  DEPENDS_ON = 'depends_on',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  PART_OF = 'part_of',
  EXAMPLE_OF = 'example_of',
  RELATED_TO = 'related_to'
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Embedding {
  id: string;
  contentId: string;
  vector: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SelectionOptions {
  relevanceThreshold?: number;
  maxTokens?: number;
  contentTypes?: ContentType[];
  excludeContentIds?: string[];
  prioritizeContentIds?: string[];
}

export interface TokenUsage {
  totalTokens: number;
  contentCount: number;
  averageTokensPerItem: number;
  tokenLimit: number;
  percentUsed: number;
}