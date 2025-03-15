/**
 * PhysicsSystem.js
 * 
 * Physics simulation for the spatial graph layout.
 * Uses a force-directed approach with multiple forces.
 */

class PhysicsSystem {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.config = nexusCore.config;
      
      // Physics simulation parameters
      this.simulationActive = true;
      this.simulationDamping = 0.8;
      this.gravitationalConstant = -50;
      this.springConstant = 0.1;
      this.repulsionConstant = 5000;
      this.centeringForce = 0.03;
      
      // Timestep for simulation
      this.timestep = 1.0;
      
      // Layout bounds
      this.layoutBounds = { width: 1000, height: 1000, depth: 500 };
      
      // Optional: use D3-force for more sophisticated layout
      this.useD3Force = this.nexusCore.performanceScaling > 1.0;
      
      if (this.useD3Force) {
        this._initD3Simulation();
      }
    }
    
    /**
     * Initialize D3 force simulation
     */
    _initD3Simulation() {
      // This would set up D3 force simulation
      // For brevity, we'll skip the detailed implementation
      this.d3Simulation = true;
    }
    
    /**
     * Update the physics detail level
     */
    updateDetailLevel(detailLevel) {
      // Adjust physics parameters based on detail level
      switch (detailLevel) {
        case 1: // Lowest detail
          this.timestep = 2.0;
          this.simulationDamping = 0.7;
          break;
        case 2:
          this.timestep = 1.5;
          this.simulationDamping = 0.75;
          break;
        case 3: // Medium detail (default)
          this.timestep = 1.0;
          this.simulationDamping = 0.8;
          break;
        case 4:
          this.timestep = 0.8;
          this.simulationDamping = 0.85;
          break;
        case 5: // Highest detail
          this.timestep = 0.5;
          this.simulationDamping = 0.9;
          break;
      }
      
      // Use D3 force simulation for higher detail levels
      this.useD3Force = detailLevel >= 3;
      
      if (this.useD3Force && !this.d3Simulation) {
        this._initD3Simulation();
      }
    }
    
    /**
     * Update the layout bounds
     */
    updateLayout(bounds) {
      this.layoutBounds = bounds || this.layoutBounds;
      this.resetSimulation();
    }
    
    /**
     * Reset the simulation
     */
    resetSimulation() {
      // Reset nodes to initial positions
      const graph = this.nexusCore.graph;
      const nodes = graph.getAllNodes();
      
      // Set up initial positions
      if (nodes.length > 0) {
        // Center the first node
        const firstNode = nodes[0];
        firstNode.position.x = 0;
        firstNode.position.y = 0;
        firstNode.position.z = 0;
        
        // Position other nodes in a circle
        const radius = Math.min(this.layoutBounds.width, this.layoutBounds.height) * 0.3;
        const angleStep = (2 * Math.PI) / (nodes.length - 1);
        
        for (let i = 1; i < nodes.length; i++) {
          const angle = angleStep * (i - 1);
          nodes[i].position.x = Math.cos(angle) * radius;
          nodes[i].position.y = Math.sin(angle) * radius;
          nodes[i].position.z = 0;
        }
      }
      
      // Reset velocities
      nodes.forEach(node => {
        node.velocity = { x: 0, y: 0, z: 0 };
      });
      
      // If using D3, reinitialize the simulation
      if (this.useD3Force) {
        // this._reinitializeD3Simulation();
      }
    }
    
    /**
     * Apply gravitational forces between nodes
     */
    _applyGravitationalForces(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          
          // Calculate distance vector
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const dz = nodeB.position.z - nodeA.position.z;
          
          // Calculate distance (with minimum to avoid infinite forces)
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
          
          // Gravitational force
          const force = this.gravitationalConstant * nodeA.mass * nodeB.mass / (distance * distance);
          
          // Direction vector
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;
          const fz = (force * dz) / distance;
          
          // Apply forces (equal and opposite)
          nodeA.velocity.x += fx / nodeA.mass;
          nodeA.velocity.y += fy / nodeA.mass;
          nodeA.velocity.z += fz / nodeA.mass;
          
          nodeB.velocity.x -= fx / nodeB.mass;
          nodeB.velocity.y -= fy / nodeB.mass;
          nodeB.velocity.z -= fz / nodeB.mass;
        }
      }
    }
    
    /**
     * Apply spring forces for connections
     */
    _applySpringForces(connections, nodeMap) {
      connections.forEach(conn => {
        const sourceNode = nodeMap.get(conn.source);
        const targetNode = nodeMap.get(conn.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Calculate distance vector
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const dz = targetNode.position.z - sourceNode.position.z;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
        
        // Calculate target length based on connection weight
        // Stronger connections should be closer
        const weight = conn.weight || 0.5;
        const targetLength = 200 * (1 - weight) + 50;
        
        // Spring force
        const springForce = this.springConstant * (distance - targetLength);
        
        // Direction vector
        const fx = (springForce * dx) / distance;
        const fy = (springForce * dy) / distance;
        const fz = (springForce * dz) / distance;
        
        // Apply forces
        sourceNode.velocity.x += fx;
        sourceNode.velocity.y += fy;
        sourceNode.velocity.z += fz;
        
        targetNode.velocity.x -= fx;
        targetNode.velocity.y -= fy;
        targetNode.velocity.z -= fz;
      });
    }
    
    /**
     * Apply repulsion forces to maintain distance
     */
    _applyRepulsionForces(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          
          // Calculate distance vector
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const dz = nodeB.position.z - nodeA.position.z;
          
          // Calculate distance (with minimum to avoid infinite forces)
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
          
          // Repulsion force (inverse square law)
          const repulsion = this.repulsionConstant / (distance * distance);
          
          // Direction vector
          const fx = (repulsion * dx) / distance;
          const fy = (repulsion * dy) / distance;
          const fz = (repulsion * dz) / distance;
          
          // Apply forces (equal and opposite)
          nodeA.velocity.x -= fx;
          nodeA.velocity.y -= fy;
          nodeA.velocity.z -= fz;
          
          nodeB.velocity.x += fx;
          nodeB.velocity.y += fy;
          nodeB.velocity.z += fz;
        }
      }
    }
    
    /**
     * Apply centering force to keep nodes within bounds
     */
    _applyCenteringForce(nodes) {
      nodes.forEach(node => {
        // Calculate direction vector to center
        const dx = -node.position.x;
        const dy = -node.position.y;
        const dz = -node.position.z;
        
        // Apply gentle force toward center
        node.velocity.x += dx * this.centeringForce;
        node.velocity.y += dy * this.centeringForce;
        node.velocity.z += dz * this.centeringForce;
      });
    }
    
    /**
     * Constrain nodes within layout bounds
     */
    _constrainToBounds(nodes) {
      const halfWidth = this.layoutBounds.width / 2;
      const halfHeight = this.layoutBounds.height / 2;
      const halfDepth = this.layoutBounds.depth / 2;
      
      nodes.forEach(node => {
        // Bounce off boundaries
        if (Math.abs(node.position.x) > halfWidth) {
          node.position.x = Math.sign(node.position.x) * halfWidth;
          node.velocity.x *= -0.5;
        }
        
        if (Math.abs(node.position.y) > halfHeight) {
          node.position.y = Math.sign(node.position.y) * halfHeight;
          node.velocity.y *= -0.5;
        }
        
        if (Math.abs(node.position.z) > halfDepth) {
          node.position.z = Math.sign(node.position.z) * halfDepth;
          node.velocity.z *= -0.5;
        }
      });
    }
    
    /**
     * Update physics simulation for one timestep
     */
    update() {
      if (!this.simulationActive) return;
      
      // Get nodes and connections
      const graph = this.nexusCore.graph;
      const nodes = graph.getAllNodes();
      const connections = graph.getAllConnections();
      const nodeMap = graph.nodes;
      
      if (this.useD3Force) {
        // Use D3 force simulation for more sophisticated layout
        // this._updateD3Simulation();
        
        // For simplicity, fall back to basic simulation
        this._updateBasicSimulation(nodes, connections, nodeMap);
      } else {
        this._updateBasicSimulation(nodes, connections, nodeMap);
      }
      
      // Update node positions in the renderer
      graph.updateNodePositions();
    }
    
    /**
     * Basic force-directed simulation
     */
    _updateBasicSimulation(nodes, connections, nodeMap) {
      // Apply various forces
      this._applyGravitationalForces(nodes);
      this._applySpringForces(connections, nodeMap);
      this._applyRepulsionForces(nodes);
      this._applyCenteringForce(nodes);
      
      // Update positions
      nodes.forEach(node => {
        // Apply velocity
        node.position.x += node.velocity.x * this.timestep;
        node.position.y += node.velocity.y * this.timestep;
        node.position.z += node.velocity.z * this.timestep;
        
        // Apply damping
        node.velocity.x *= this.simulationDamping;
        node.velocity.y *= this.simulationDamping;
        node.velocity.z *= this.simulationDamping;
      });
      
      // Constrain to bounds
      this._constrainToBounds(nodes);
    }
    
    /**
     * Update configuration when global config changes
     */
    updateConfig() {
      this.updateDetailLevel(this.nexusCore.core.currentDetailLevel);
    }
  }