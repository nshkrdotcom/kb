/**
 * PerformanceUtils.js
 * 
 * Utilities for monitoring and optimizing performance.
 */

class PerformanceUtils {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      
      // Performance tracking
      this.frameCount = 0;
      this.lastFpsUpdateTime = 0;
      this.fps = 60;
      this.frameTimes = [];
      this.maxFrameTimes = 60; // Track last 60 frames
      
      // Frame timing
      this.lastFrameTime = 0;
      this.currentFrameStart = 0;
      
      // System capabilities
      this.detected = false;
      this.capabilities = {
        gpu: 'unknown',
        maxTextureSize: 2048,
        maxVertices: 100000,
        supportsInstancedArrays: false,
        supportsMRT: false
      };
      
      // Detect capabilities if possible
      this._detectCapabilities();
    }
    
    /**
     * Detect system capabilities
     */
    _detectCapabilities() {
      // Skip if already detected
      if (this.detected) return;
      
      try {
        // Create temporary canvas and get GL context
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          // Get extensions and capabilities
          this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          this.capabilities.maxVertices = gl.getParameter(gl.MAX_ELEMENTS_VERTICES);
          
          // Check for extensions
          const instancedArrays = gl.getExtension('ANGLE_instanced_arrays');
          this.capabilities.supportsInstancedArrays = !!instancedArrays;
          
          const drawBuffers = gl.getExtension('WEBGL_draw_buffers');
          this.capabilities.supportsMRT = !!drawBuffers;
          
          // Try to identify GPU
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            this.capabilities.gpu = `${vendor} - ${renderer}`;
          }
          
          // Clean up
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
        
        this.detected = true;
      } catch (error) {
        console.warn('Failed to detect GPU capabilities:', error);
      }
    }
    
    /**
     * Begin timing a new frame
     */
    beginFrame() {
      this.currentFrameStart = performance.now();
    }
    
    /**
     * End frame timing and update statistics
     */
    endFrame() {
      const now = performance.now();
      const frameDuration = now - this.currentFrameStart;
      
      // Add to frame times
      this.frameTimes.push(frameDuration);
      if (this.frameTimes.length > this.maxFrameTimes) {
        this.frameTimes.shift();
      }
      
      // Update FPS every second
      if (now - this.lastFpsUpdateTime > 1000) {
        this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdateTime));
        this.frameCount = 0;
        this.lastFpsUpdateTime = now;
        
        // Log performance for debugging
        if (this.nexusCore.config.debug) {
          console.log(`FPS: ${this.fps}, Avg Frame Time: ${this.getAverageFrameTime().toFixed(2)}ms`);
        }
      }
      
      this.frameCount++;
      this.lastFrameTime = now;
    }
    
    /**
     * Get the current FPS
     */
    getCurrentFps() {
      return this.fps;
    }
    
    /**
     * Get the average frame time
     */
    getAverageFrameTime() {
      if (this.frameTimes.length === 0) return 0;
      
      const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
      return sum / this.frameTimes.length;
    }
    
    /**
     * Get performance status information
     */
    getPerformanceStatus() {
      return {
        fps: this.fps,
        frameTime: this.getAverageFrameTime(),
        detailLevel: this.nexusCore.core.currentDetailLevel,
        performanceScaling: this.nexusCore.performanceScaling,
        nodeCount: this.nexusCore.graph.getNodeCount(),
        connectionCount: this.nexusCore.graph.getConnectionCount()
      };
    }
    
    /**
     * Get system capability information
     */
    getSystemCapabilities() {
      return this.capabilities;
    }
  }