// src/repositories/neo4j/graph-repository.ts
import { v4 as uuidv4 } from 'uuid';
import { runQuery, runInTransaction } from '../../db/neo4j/connection';
import { GraphRepository } from '../interfaces';
import { Relationship, RelationshipType } from '../../types/core';
import logger from '../../utils/logger';
import { ApplicationError } from '../../utils/errors';

/**
 * Neo4j implementation of the GraphRepository interface
 */
export class Neo4jGraphRepository implements GraphRepository {
  /**
   * Create a node with specified labels and properties
   */
  async createNode(labels: string[], properties: Record<string, any>): Promise<string> {
    try {
      // Ensure the node has an ID
      if (!properties.id) {
        properties.id = uuidv4();
      }
      
      // Convert labels array to Neo4j label string for Cypher query
      const labelString = labels.map(label => `:${label}`).join('');
      
      // Build parameters object for query
      const params = { props: properties };
      
      const result = await runQuery<{ id: string }>(
        `CREATE (n${labelString} $props) RETURN n.id as id`,
        params
      );
      
      if (result.length === 0) {
        throw new Error('Failed to create node');
      }
      
      logger.debug('Node created in Neo4j', { 
        id: result[0].id, 
        labels 
      });
      
      return result[0].id;
    } catch (error: any) {
      logger.error('Error creating node in Neo4j', { 
        error: error.message, 
        labels, 
        properties 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Update an existing node's properties
   */
  async updateNode(id: string, properties: Record<string, any>): Promise<boolean> {
    try {
      // Remove id from properties to avoid duplication
      const { id: _, ...props } = properties;
      
      // Only update if there are properties to update
      if (Object.keys(props).length === 0) {
        return true;
      }
      
      const result = await runQuery<{ n: any }>(
        `MATCH (n {id: $id})
         SET n += $props
         RETURN n`,
        { id, props }
      );
      
      logger.debug('Node updated in Neo4j', { 
        id, 
        propertiesUpdated: Object.keys(props).length 
      });
      
      return result.length > 0;
    } catch (error: any) {
      logger.error('Error updating node in Neo4j', { 
        error: error.message, 
        id 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Delete a node and all its relationships
   */
  async deleteNode(id: string): Promise<boolean> {
    try {
      return await runInTransaction(async (session) => {
        // First, delete all relationships
        await session.run(
          `MATCH (n {id: $id})-[r]-() DELETE r`,
          { id }
        );
        
        // Then delete the node
        const result = await session.run(
          `MATCH (n {id: $id}) DELETE n RETURN count(n) as deleted`,
          { id }
        );
        
        const deleted = result.records[0].get('deleted').toNumber() > 0;
        
        logger.debug('Node deleted from Neo4j', { 
          id, 
          deleted 
        });
        
        return deleted;
      });
    } catch (error: any) {
      logger.error('Error deleting node from Neo4j', { 
        error: error.message, 
        id 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Create a relationship between two nodes
   */
  async createRelationship(
    sourceId: string, 
    targetId: string, 
    type: string, 
    properties: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Generate a UUID for the relationship if not provided
      const relationshipId = properties.id || uuidv4();
      
      // Add the id to properties
      const props = {
        id: relationshipId,
        createdAt: new Date().toISOString(),
        ...properties
      };
      
      const result = await runQuery<{ id: string }>(
        `MATCH (source {id: $sourceId}), (target {id: $targetId})
         CREATE (source)-[r:${type} $props]->(target)
         RETURN r.id as id`,
        { sourceId, targetId, props }
      );
      
      if (result.length === 0) {
        throw new Error('Failed to create relationship');
      }
      
      logger.debug('Relationship created in Neo4j', { 
        id: result[0].id, 
        sourceId, 
        targetId, 
        type 
      });
      
      return result[0].id;
    } catch (error: any) {
      logger.error('Error creating relationship in Neo4j', { 
        error: error.message, 
        sourceId, 
        targetId, 
        type 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Update a relationship's properties
   */
  async updateRelationship(
    relationshipId: string, 
    properties: Record<string, any>
  ): Promise<boolean> {
    try {
      // Remove id from properties to avoid duplication
      const { id: _, ...props } = properties;
      
      // Only update if there are properties to update
      if (Object.keys(props).length === 0) {
        return true;
      }
      
      // Add updatedAt timestamp
      props.updatedAt = new Date().toISOString();
      
      const result = await runQuery<{ r: any }>(
        `MATCH ()-[r {id: $relationshipId}]->()
         SET r += $props
         RETURN r`,
        { relationshipId, props }
      );
      
      logger.debug('Relationship updated in Neo4j', { 
        relationshipId,
        propertiesUpdated: Object.keys(props).length 
      });
      
      return result.length > 0;
    } catch (error: any) {
      logger.error('Error updating relationship in Neo4j', { 
        error: error.message, 
        relationshipId 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Delete a relationship by ID
   */
  async deleteRelationship(relationshipId: string): Promise<boolean> {
    try {
      const result = await runQuery<{ count: number }>(
        `MATCH ()-[r {id: $relationshipId}]->()
         DELETE r
         RETURN count(r) as count`,
        { relationshipId }
      );
      
      const deleted = result[0]?.count > 0;
      
      logger.debug('Relationship deleted from Neo4j', { 
        relationshipId, 
        deleted 
      });
      
      return deleted;
    } catch (error: any) {
      logger.error('Error deleting relationship from Neo4j', { 
        error: error.message, 
        relationshipId 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Find nodes related to a given node
   */
  async findRelatedNodes(
    nodeId: string, 
    relationshipType?: string, 
    direction: 'INCOMING' | 'OUTGOING' | 'BOTH' = 'BOTH'
  ): Promise<any[]> {
    try {
      let query = '';
      const typeFilter = relationshipType ? `:${relationshipType}` : '';
      
      if (direction === 'BOTH') {
        query = `
          MATCH (n {id: $nodeId})-[r${typeFilter}]-(related)
          RETURN related, r, 
            CASE 
              WHEN startNode(r).id = $nodeId THEN 'OUTGOING' 
              ELSE 'INCOMING' 
            END as direction
        `;
      } else if (direction === 'OUTGOING') {
        query = `
          MATCH (n {id: $nodeId})-[r${typeFilter}]->(related)
          RETURN related, r, 'OUTGOING' as direction
        `;
      } else {
        query = `
          MATCH (n {id: $nodeId})<-[r${typeFilter}]-(related)
          RETURN related, r, 'INCOMING' as direction
        `;
      }
      
      const result = await runQuery(query, { nodeId });
      
      logger.debug('Found related nodes in Neo4j', { 
        nodeId, 
        relationshipType, 
        direction, 
        count: result.length 
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error finding related nodes in Neo4j', { 
        error: error.message, 
        nodeId, 
        relationshipType, 
        direction 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Find the shortest path between two nodes
   */
  async findPath(
    sourceId: string, 
    targetId: string, 
    maxDepth: number = 5
  ): Promise<any[]> {
    try {
      const result = await runQuery(
        `MATCH path = shortestPath((source {id: $sourceId})-[*..${maxDepth}]-(target {id: $targetId}))
         RETURN path`,
        { sourceId, targetId }
      );
      
      if (result.length === 0) {
        return [];
      }
      
      logger.debug('Found path in Neo4j', { 
        sourceId, 
        targetId, 
        pathFound: result.length > 0 
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error finding path in Neo4j', { 
        error: error.message, 
        sourceId, 
        targetId 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Get a knowledge graph centered on a project or specific node
   */
  async getKnowledgeGraph(
    projectId: string, 
    depth: number = 3, 
    centerNodeId?: string
  ): Promise<{ nodes: any[]; edges: any[] }> {
    try {
      let query;
      let params;
      
      if (centerNodeId) {
        // Graph centered on a specific node
        query = `
          MATCH (center {id: $centerId})
          OPTIONAL MATCH path = (center)-[r*1..${depth}]-(related)
          WHERE related.projectId = $projectId
          WITH center, related, r
          RETURN 
            collect(distinct center) + collect(distinct related) as nodes,
            collect(distinct r) as relationships
        `;
        params = { centerId: centerNodeId, projectId };
      } else {
        // Graph for entire project
        query = `
          MATCH (p:Project {id: $projectId})
          OPTIONAL MATCH path = (p)-[r*1..${depth}]-(related)
          WHERE related.projectId = $projectId OR related.id = $projectId
          WITH p, related, r
          RETURN 
            collect(distinct p) + collect(distinct related) as nodes,
            collect(distinct r) as relationships
        `;
        params = { projectId };
      }
      
      const result = await runQuery<{ 
        nodes: any[]; 
        relationships: any[];
      }>(query, params);
      
      if (result.length === 0) {
        return { nodes: [], edges: [] };
      }
      
      // Process nodes and relationships into a consistent format
      const graphData = result[0];
      
      // Flatten and deduplicate nodes
      const nodeMap = new Map();
      if (graphData.nodes) {
        for (const node of graphData.nodes) {
          if (node && node.id && !nodeMap.has(node.id)) {
            // Extract label from Neo4j metadata if available
            const labels = node.__labels || [];
            nodeMap.set(node.id, {
              id: node.id,
              type: labels[0] || 'Unknown',
              ...node
            });
          }
        }
      }
      
      // Process relationships (edges)
      const edges: any[] = [];
      if (graphData.relationships) {
        for (const relationship of graphData.relationships) {
          if (relationship && Array.isArray(relationship)) {
            // Handle relationship collections
            for (const rel of relationship) {
              if (rel && rel.id) {
                edges.push({
                  id: rel.id,
                  source: rel.sourceId || rel.startNodeId,
                  target: rel.targetId || rel.endNodeId,
                  type: rel.type,
                  ...rel
                });
              }
            }
          } else if (relationship && relationship.id) {
            // Handle single relationships
            edges.push({
              id: relationship.id,
              source: relationship.sourceId || relationship.startNodeId,
              target: relationship.targetId || relationship.endNodeId,
              type: relationship.type,
              ...relationship
            });
          }
        }
      }
      
      logger.debug('Generated knowledge graph', { 
        projectId, 
        nodeCount: nodeMap.size, 
        edgeCount: edges.length 
      });
      
      return {
        nodes: Array.from(nodeMap.values()),
        edges
      };
    } catch (error: any) {
      logger.error('Error getting knowledge graph from Neo4j', { 
        error: error.message, 
        projectId, 
        centerNodeId 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Run a custom Cypher query
   */
  async runCypherQuery<T = any>(
    query: string, 
    params?: Record<string, any>
  ): Promise<T[]> {
    try {
      const result = await runQuery<T>(query, params);
      
      logger.debug('Executed custom Cypher query', { 
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramCount: params ? Object.keys(params).length : 0,
        resultCount: result.length
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error executing custom Cypher query', { 
        error: error.message, 
        query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }

  /**
   * Get relationships between two nodes
   */
  async getRelationships(
    sourceId: string, 
    targetId: string
  ): Promise<Relationship[]> {
    try {
      const result = await runQuery<Relationship>(
        `MATCH (source {id: $sourceId})-[r]-(target {id: $targetId})
         RETURN r.id AS id, 
                source.id AS sourceId, 
                target.id AS targetId, 
                type(r) AS type, 
                r.strength AS strength,
                r.metadata AS metadata,
                r.createdAt AS createdAt`,
        { sourceId, targetId }
      );
      
      logger.debug('Found relationships between nodes', { 
        sourceId, 
        targetId, 
        count: result.length 
      });
      
      return result;
    } catch (error: any) {
      logger.error('Error getting relationships between nodes', { 
        error: error.message, 
        sourceId, 
        targetId 
      });
      throw new ApplicationError('Graph database error', 500, error);
    }
  }
}