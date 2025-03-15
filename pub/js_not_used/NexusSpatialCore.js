/**
 * NexusSpatialCore.js
 * 
 * Main entry point for the spatial visualization system.
 * Orchestrates all components and provides the public API.
 */

class NexusSpatialCore {
    constructor(canvas, options = {}) {
      // Default configuration with performance scaling factor
      this.config = {
        width: options.width || 800,
        height: options.height || 600,
        performanceMode: options.performanceMode || 'balanced',
        adaptiveDetail: options.adaptiveDetail !== false,
        maxNodes: options.maxNodes || 1000,
        maxEdges: options.maxEdges || 2000,
        fpsTarget: options.fpsTarget || 60,
        ...options
      };
      
      // Calculate performance scaling factor based on mode
      this.performanceScaling = this._calculatePerformanceScaling();
      
      // Initialize subsystems
      this.canvas = canvas;
      this.core = new SpatialCore(this);
      this.graph = new SpatialGraph(this);
      this.physics = new PhysicsSystem(this);
      this.renderer = new RenderEngine(this);
      this.controls = new Controls(this);
      this.events = new Events(this);
      
      // Initialize data if provided
      if (options.data) {
        this.setData(options.data);
      }
      
      // Start rendering
      this._startRenderLoop();
      
      // Setup performance monitoring
      this.perfMonitor = new PerformanceUtils(this);
    }
    
    /**
     * Calculate the performance scaling factor
     * This is the master variable that controls detail levels
     */
    _calculatePerformanceScaling() {
      const modes = {
        'performance': 0.5,   // Lower detail, higher performance
        'balanced': 1.0,      // Standard detail level
        'quality': 1.5        // Higher detail, lower performance
      };
      
      return modes[this.config.performanceMode] || 1.0;
    }
    
    /**
     * Set the data to visualize
     */
    setData(data) {
      this.graph.setData(data.nodes || [], data.connections || []);
      this.physics.resetSimulation();
      this.core.updateLayout();
    }
    
    /**
     * Update the configuration
     */
    updateConfig(newConfig) {
      this.config = {...this.config, ...newConfig};
      this.performanceScaling = this._calculatePerformanceScaling();
      
      // Update subsystems with new configuration
      this.core.updateConfig();
      this.renderer.updateConfig();
      this.physics.updateConfig();
      this.controls.updateConfig();
    }
    
    /**
     * Start the render loop
     */
    _startRenderLoop() {
      const animate = () => {
        this.perfMonitor.beginFrame();
        
        this.physics.update();
        this.core.update();
        this.renderer.render();
        this.controls.update();
        
        this.perfMonitor.endFrame();
        
        // Adapt detail level if needed
        if (this.config.adaptiveDetail) {
          this._adaptDetailLevel();
        }
        
        this.animationFrame = requestAnimationFrame(animate);
      };
      
      this.animationFrame = requestAnimationFrame(animate);
    }
    
    /**
     * Adapt detail level based on performance
     */
    _adaptDetailLevel() {
      const fps = this.perfMonitor.getCurrentFps();
      const targetFps = this.config.fpsTarget;
      
      // Adjust detail level if framerate is too low
      if (fps < targetFps * 0.8 && this.performanceScaling > 0.3) {
        this.performanceScaling = Math.max(0.3, this.performanceScaling - 0.05);
        this.core.updateDetailLevel();
      } 
      // Increase detail if we have headroom
      else if (fps > targetFps * 1.2 && this.performanceScaling < 2.0) {
        this.performanceScaling = Math.min(2.0, this.performanceScaling + 0.05);
        this.core.updateDetailLevel();
      }
    }
    
    /**
     * Focus on a specific node
     */
    focusNode(nodeId) {
      const node = this.graph.getNode(nodeId);
      if (node) {
        this.core.focusOn(node);
      }
    }
    
    /**
     * Highlight connections for a node
     */
    highlightConnections(nodeId) {
      this.graph.highlightConnections(nodeId);
    }
    
    /**
     * Select a node
     */
    selectNode(nodeId) {
      this.graph.selectNode(nodeId);
      this.events.dispatch('nodeSelected', { nodeId });
    }
    
    /**
     * Clean up resources
     */
    dispose() {
      cancelAnimationFrame(this.animationFrame);
      this.renderer.dispose();
      this.controls.dispose();
      this.events.dispose();
    }
  }