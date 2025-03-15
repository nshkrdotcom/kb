/**
 * SpatialGraph.js
 * 
 * Graph data structure that manages the nodes and connections
 * in the knowledge network.
 */

class SpatialGraph {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.nodes = new Map();
      this.connections = [];
      this.selectedNodeId = null;
      this.highlightedNodeIds = new Set();
    }
    
    /**
     * Set the graph data
     */
    setData(nodes, connections) {
      // Reset existing data
      this.nodes.clear();
      this.connections = [];
      this.selectedNodeId = null;
      this.highlightedNodeIds.clear();
      
      // Process nodes
      nodes.forEach(nodeData => {
        this.nodes.set(nodeData.id, {
          ...nodeData,
          position: {
            x: nodeData.x || 0,
            y: nodeData.y || 0,
            z: nodeData.z || 0
          },
          velocity: { x: 0, y: 0, z: 0 },
          mass: this._calculateNodeMass(nodeData),
          connections: []
        });
      });
      
      // Process connections
      connections.forEach(connData => {
        const connection = {
          source: connData.source,
          target: connData.target,
          weight: connData.weight || 0.5,
          id: `${connData.source}-${connData.target}`
        };
        
        this.connections.push(connection);
        
        // Add connection reference to nodes
        const sourceNode = this.nodes.get(connData.source);
        const targetNode = this.nodes.get(connData.target);
        
        if (sourceNode) sourceNode.connections.push(connection);
        if (targetNode) targetNode.connections.push(connection);
      });
      
      // Create visual representations
      this._createVisualRepresentations();
    }
    
    /**
     * Calculate node mass based on properties
     */
    _calculateNodeMass(nodeData) {
      // Base mass on tokens and importance
      const tokenFactor = nodeData.tokens ? Math.log(nodeData.tokens) / 10 : 1;
      const importanceFactor = nodeData.importance || 1;
      
      return Math.max(1, tokenFactor * importanceFactor * 2);
    }
    
    /**
     * Create visual representations for nodes and edges
     */
    _createVisualRepresentations() {
      // Create node objects
      this.nodes.forEach(node => {
        this.nexusCore.renderer.createNodeObject(node);
      });
      
      // Create edge objects
      this.connections.forEach(conn => {
        const sourceNode = this.nodes.get(conn.source);
        const targetNode = this.nodes.get(conn.target);
        
        if (sourceNode && targetNode) {
          this.nexusCore.renderer.createEdgeObject(conn, sourceNode, targetNode);
        }
      });
    }
    
    /**
     * Get a node by ID
     */
    getNode(nodeId) {
      return this.nodes.get(nodeId);
    }
    
    /**
     * Get all nodes
     */
    getAllNodes() {
      return Array.from(this.nodes.values());
    }
    
    /**
     * Get the number of nodes
     */
    getNodeCount() {
      return this.nodes.size;
    }
    
    /**
     * Get all connections
     */
    getAllConnections() {
      return this.connections;
    }
    
    /**
     * Get the number of connections
     */
    getConnectionCount() {
      return this.connections.length;
    }
    
    /**
     * Get connections for a specific node
     */
    getNodeConnections(nodeId) {
      return this.connections.filter(
        conn => conn.source === nodeId || conn.target === nodeId
      );
    }
    
    /**
     * Select a node
     */
    selectNode(nodeId) {
      // Clear previous selection
      if (this.selectedNodeId) {
        const prevNode = this.nodes.get(this.selectedNodeId);
        if (prevNode) {
          prevNode.selected = false;
          this.nexusCore.renderer.updateNodeObject(
            this.selectedNodeId,
            prevNode.position,
            { selected: false }
          );
        }
      }
      
      // Set new selection
      this.selectedNodeId = nodeId;
      
      // Update node appearance
      const node = this.nodes.get(nodeId);
      if (node) {
        node.selected = true;
        this.nexusCore.renderer.updateNodeObject(
          nodeId,
          node.position,
          { selected: true }
        );
        
        // Highlight connections
        this.highlightConnections(nodeId);
      }
    }
    
    /**
     * Highlight connections for a node
     */
    highlightConnections(nodeId) {
      // Clear previous highlights
      this.highlightedNodeIds.forEach(id => {
        const node = this.nodes.get(id);
        if (node && id !== this.selectedNodeId) {
          node.highlighted = false;
          this.nexusCore.renderer.updateNodeObject(
            id,
            node.position,
            { highlighted: false }
          );
        }
      });
      
      this.highlightedNodeIds.clear();
      
      // Highlight connections for the selected node
      const connections = this.getNodeConnections(nodeId);
      
      connections.forEach(conn => {
        // Highlight the connection
        this.nexusCore.renderer.updateEdgeObject(
          conn.id,
          this.nodes.get(conn.source).position,
          this.nodes.get(conn.target).position,
          { highlighted: true }
        );
        
        // Highlight connected node
        const connectedId = conn.source === nodeId ? conn.target : conn.source;
        const connectedNode = this.nodes.get(connectedId);
        
        if (connectedNode) {
          connectedNode.highlighted = true;
          this.highlightedNodeIds.add(connectedId);
          
          this.nexusCore.renderer.updateNodeObject(
            connectedId,
            connectedNode.position,
            { highlighted: true }
          );
        }
      });
    }
    
    /**
     * Update node positions after physics calculations
     */
    updateNodePositions() {
      this.nodes.forEach((node, nodeId) => {
        this.nexusCore.renderer.updateNodeObject(
          nodeId,
          node.position,
          {
            selected: node.selected,
            highlighted: node.highlighted,
            radius: node.radius
          }
        );
      });
      
      // Update edge positions
      this.connections.forEach(conn => {
        const sourceNode = this.nodes.get(conn.source);
        const targetNode = this.nodes.get(conn.target);
        
        if (sourceNode && targetNode) {
          this.nexusCore.renderer.updateEdgeObject(
            conn.id,
            sourceNode.position,
            targetNode.position,
            { highlighted: conn.highlighted }
          );
        }
      });
    }
  }