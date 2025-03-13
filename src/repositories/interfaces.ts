// src/repositories/interfaces.ts
import { 
    BaseEntity, User, Project, ContentItem, TextContent, CodeContent,
    Context, ContextItem, Tag, Relationship, Embedding, RelationshipType,
    SelectionOptions, TokenUsage
  } from '../types/core';
  
  // Generic repository interface
  export interface Repository<T extends BaseEntity> {
    findById(id: string): Promise<T | null>;
    findAll(filter?: Partial<T>): Promise<T[]>;
    create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    update(id: string, entity: Partial<T>): Promise<T>;
    delete(id: string): Promise<boolean>;
    count(filter?: Partial<T>): Promise<number>;
  }
  
  // Specialized repositories
  export interface UserRepository extends Repository<User> {
    findByEmail(email: string): Promise<User | null>;
    updateLastLogin(id: string): Promise<User>;
    findByIds(ids: string[]): Promise<User[]>;
  }
  
  export interface ProjectRepository extends Repository<Project> {
    findByOwnerId(ownerId: string): Promise<Project[]>;
    findCollaborations(userId: string): Promise<Project[]>;
    findActiveProjects(userId: string): Promise<Project[]>;
    archive(id: string): Promise<boolean>;
    unarchive(id: string): Promise<boolean>;
    addCollaborator(projectId: string, userId: string, role: string): Promise<boolean>;
    removeCollaborator(projectId: string, userId: string): Promise<boolean>;
    getCollaborators(projectId: string): Promise<{userId: string, role: string}[]>;
  }
  
  export interface ContentRepository extends Repository<ContentItem> {
    findByProjectId(projectId: string, options?: { limit?: number, offset?: number }): Promise<ContentItem[]>;
    findByContextId(contextId: string): Promise<ContentItem[]>;
    createTextContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>, text: string): Promise<ContentItem>;
    createCodeContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>, code: string, language: string): Promise<ContentItem>;
    getTextContent(id: string): Promise<TextContent | null>;
    getCodeContent(id: string): Promise<CodeContent | null>;
    updateContent(id: string, content: any): Promise<ContentItem>;
    countTokens(id: string): Promise<number>;
    searchContent(projectId: string, query: string, options?: { limit?: number, contentTypes?: string[] }): Promise<ContentItem[]>;
    findWithEmbeddings(projectId: string): Promise<ContentItem[]>;
    findByTag(tagId: string): Promise<ContentItem[]>;
    addTag(contentId: string, tagId: string): Promise<boolean>;
    removeTag(contentId: string, tagId: string): Promise<boolean>;
    getTags(contentId: string): Promise<Tag[]>;
    getVersionHistory(id: string): Promise<{version: number, updatedAt: Date, creatorId: string}[]>;
    createVersion(id: string): Promise<number>; // Returns new version number
  }
  
  export interface ContextRepository extends Repository<Context> {
    findByProjectId(projectId: string): Promise<Context[]>;
    findChildren(contextId: string): Promise<Context[]>;
    findAncestors(contextId: string): Promise<Context[]>;
    getFullPath(contextId: string): Promise<Context[]>;
    addContentItem(contextId: string, contentId: string, relevance?: number, position?: number): Promise<ContextItem>;
    removeContentItem(contextId: string, contentId: string): Promise<boolean>;
    getContentItems(contextId: string, options?: SelectionOptions): Promise<ContextItem[]>;
    updateContentItemRelevance(contextId: string, contentId: string, relevance: number): Promise<boolean>;
    reorderContentItems(contextId: string, orderedContentIds: string[]): Promise<boolean>;
    getTokenUsage(contextId: string): Promise<TokenUsage>;
    optimizeContext(contextId: string, tokenBudget: number): Promise<{ removedItems: string[], remainingTokens: number }>;
    cloneContext(sourceContextId: string, targetProjectId: string, newName?: string): Promise<Context>;
    mergeContexts(sourceContextId: string, targetContextId: string): Promise<boolean>;
  }
  
  export interface TagRepository extends Repository<Tag> {
    findByProjectId(projectId: string): Promise<Tag[]>;
    findByName(projectId: string, name: string): Promise<Tag | null>;
    findOrCreate(projectId: string, name: string, color?: string): Promise<Tag>;
    getTaggedContent(tagId: string): Promise<ContentItem[]>;
  }
  
  export interface GraphRepository {
    createNode(labels: string[], properties: Record<string, any>): Promise<string>; // Returns node ID
    updateNode(id: string, properties: Record<string, any>): Promise<boolean>;
    deleteNode(id: string): Promise<boolean>;
    createRelationship(sourceId: string, targetId: string, type: string, properties?: Record<string, any>): Promise<string>;
    updateRelationship(relationshipId: string, properties: Record<string, any>): Promise<boolean>;
    deleteRelationship(relationshipId: string): Promise<boolean>;
    findRelatedNodes(nodeId: string, relationshipType?: string, direction?: 'INCOMING' | 'OUTGOING' | 'BOTH'): Promise<any[]>;
    findPath(sourceId: string, targetId: string, maxDepth?: number): Promise<any[]>;
    getKnowledgeGraph(projectId: string, depth?: number, centerNodeId?: string): Promise<{ nodes: any[], edges: any[] }>;
    runCypherQuery(query: string, params?: Record<string, any>): Promise<any[]>;
    getRelationships(sourceId: string, targetId: string): Promise<Relationship[]>;
  }
  
  export interface VectorRepository {
    storeEmbedding(contentId: string, vector: number[], metadata?: Record<string, any>): Promise<string>;
    findSimilar(vector: number[], limit?: number, filters?: Record<string, any>): Promise<{ id: string, score: number }[]>;
    deleteEmbedding(id: string): Promise<boolean>;
    findEmbedding(contentId: string): Promise<Embedding | null>;
    semanticSearch(projectId: string, query: string, limit?: number): Promise<{ contentId: string, score: number }[]>;
  }
  
  export interface ObjectStorageRepository {
    uploadObject(key: string, data: Buffer, contentType: string, metadata?: Record<string, any>): Promise<string>; // Returns URL
    getObject(key: string): Promise<Buffer>;
    deleteObject(key: string): Promise<boolean>;
    getObjectURL(key: string, expirySeconds?: number): Promise<string>;
    copyObject(sourceKey: string, destinationKey: string): Promise<string>; // Returns new URL
    getMetadata(key: string): Promise<Record<string, any>>;
  }