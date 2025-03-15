/**
 * DataUtils.js
 * 
 * Utilities for processing and transforming data.
 */

class DataUtils {
    constructor() {
      // Empty constructor
    }
    
    /**
     * Process input data and normalize for visualization
     */
    static processData(inputData) {
      const { nodes, connections } = inputData;
      
      // Process nodes
      const processedNodes = nodes.map(node => {
        return {
          ...node,
          // Default position if not provided
          x: node.x || (Math.random() * 1000 - 500),
          y: node.y || (Math.random() * 1000 - 500),
          z: node.z || 0,
          // Default radius based on tokens
          radius: node.radius || this._calculateRadius(node.tokens || 500),
          // Default color if not provided
          color: node.color || this._getDefaultColor(node.type)
        };
      });
      
      // Process connections
      const processedConnections = connections.map(conn => {
        return {
          ...conn,
          // Default weight if not provided
          weight: conn.weight || 0.5,
          // Generate ID if not provided
          id: conn.id || `${conn.source}-${conn.target}`
        };
      });
      
      return { nodes: processedNodes, connections: processedConnections };
    }
    
    /**
     * Calculate node radius based on token count
     */
    static _calculateRadius(tokens) {
      // Logarithmic scale to handle wide range of token counts
      return Math.max(20, Math.min(50, 15 + Math.log2(tokens) * 3));
    }
    
    /**
     * Get default color based on node type
     */
    static _getDefaultColor(type) {
      const colors = {
        concept: '#0066cc',
        implementation: '#0084ff',
        property: '#5ebaff',
        example: '#805ad5',
        default: '#0066cc'
      };
      
      return colors[type] || colors.default;
    }
    
    /**
     * Calculate hierarchical layout positions
     */
    static calculateHierarchicalLayout(nodes, connections) {
      // Implement hierarchical layout algorithm
      // For brevity, we'll skip the detailed implementation
      return nodes;
    }
    
    /**
     * Calculate force-directed layout positions
     */
    static calculateForceLayout(nodes, connections) {
      // Implement force-directed layout algorithm
      // For brevity, we'll skip the detailed implementation
      return nodes;
    }
    
    /**
     * Calculate radial layout positions
     */
    static calculateRadialLayout(nodes, connections, centerNodeId) {
      // Implement radial layout algorithm
      // For brevity, we'll skip the detailed implementation
      return nodes;
    }
    
    /**
     * Find shortest path between two nodes
     */
    static findShortestPath(nodes, connections, sourceId, targetId) {
      // Implement Dijkstra's algorithm for path finding
      // For brevity, we'll skip the detailed implementation
      return [];
    }
  }