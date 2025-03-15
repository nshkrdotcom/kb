/**
 * SpatialCore.js
 * 
 * Core visualization engine that manages the spatial representation
 * of knowledge concepts and their relationships.
 */

class SpatialCore {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.config = nexusCore.config;
      
      // Camera positioning
      this.cameraPosition = { x: 0, y: 0, z: 1000 };
      this.lookAtPoint = { x: 0, y: 0, z: 0 };
      
      // Detail level management
      this.currentDetailLevel = 3; // 1-5, with 5 being highest detail
      this.detailLevelThresholds = [0.4, 0.7, 1.0, 1.3, 1.6]; // Performance scaling thresholds
      
      // Visual parameters
      this.visualParameters = {
        nodeBaseSize: 20,
        nodeSizeVariance: 30,
        edgeBaseWidth: 2,
        edgeWidthVariance: 5,
        colorPrimary: new THREE.Color('#0066cc'),
        colorSecondary: new THREE.Color('#5ebaff'),
        colorTertiary: new THREE.Color('#805ad5'),
        backgroundIntensity: 0.1,
        ambientLightIntensity: 0.4,
        directionalLightIntensity: 0.6
      };
      
      this.updateDetailLevel();
    }
    
    /**
     * Update the detail level based on performance scaling
     */
    updateDetailLevel() {
      const scaling = this.nexusCore.performanceScaling;
      
      // Determine detail level based on performance scaling
      for (let i = 0; i < this.detailLevelThresholds.length; i++) {
        if (scaling <= this.detailLevelThresholds[i]) {
          this.currentDetailLevel = i + 1;
          break;
        }
      }
      
      // If we're at the highest threshold, use highest detail
      if (scaling > this.detailLevelThresholds[this.detailLevelThresholds.length - 1]) {
        this.currentDetailLevel = 5;
      }
      
      // Update visual parameters based on detail level
      this._updateVisualParameters();
      
      // Notify other systems
      this.nexusCore.renderer.updateDetailLevel(this.currentDetailLevel);
      this.nexusCore.physics.updateDetailLevel(this.currentDetailLevel);
    }
    
    /**
     * Update visual parameters based on current detail level
     */
    _updateVisualParameters() {
      // Scale visual parameters based on detail level
      const detailFactor = this.currentDetailLevel / 3; // Normalize to 1.0 at level 3
      
      this.visualParameters.edgeSegments = Math.max(1, Math.floor(10 * detailFactor));
      this.visualParameters.nodeTessellation = Math.max(8, Math.floor(24 * detailFactor));
      this.visualParameters.edgeCurvature = 0.2 * detailFactor;
      this.visualParameters.particleCount = Math.floor(500 * detailFactor);
      this.visualParameters.shadowQuality = this.currentDetailLevel >= 4;
      this.visualParameters.postProcessing = this.currentDetailLevel >= 4;
      this.visualParameters.ambientOcclusion = this.currentDetailLevel >= 3;
    }
    
    /**
     * Update the layout of the visualization
     */
    updateLayout() {
      // Calculate layout dimensions based on node count
      const nodeCount = this.nexusCore.graph.getNodeCount();
      const connectionCount = this.nexusCore.graph.getConnectionCount();
      
      // Scale the layout space based on content
      const spaceScale = Math.sqrt(nodeCount) * 100;
      
      // Set layout bounds
      this.layoutBounds = {
        width: spaceScale,
        height: spaceScale,
        depth: spaceScale
      };
      
      // Trigger physics system to update layout
      this.nexusCore.physics.updateLayout(this.layoutBounds);
    }
    
    /**
     * Update configuration when global config changes
     */
    updateConfig() {
      // Update internal parameters based on global config
      this.updateDetailLevel();
    }
    
    /**
     * Focus the visualization on a specific node
     */
    focusOn(node) {
      // Calculate target position
      const position = node.position;
      const targetLookAt = {
        x: position.x,
        y: position.y,
        z: position.z
      };
      
      // Calculate camera position based on node size
      const distance = 200 + node.size * 10;
      const targetCamera = {
        x: position.x,
        y: position.y - 50, // Slight angle
        z: position.z + distance
      };
      
      // Animate the transition
      this._animateCameraMove(targetCamera, targetLookAt);
    }
    
    /**
     * Animate camera movement to new position
     */
    _animateCameraMove(targetPos, targetLookAt) {
      // Create tweens for smooth camera movement
      new TWEEN.Tween(this.cameraPosition)
        .to(targetPos, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
        
      new TWEEN.Tween(this.lookAtPoint)
        .to(targetLookAt, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    }
    
    /**
     * Main update function called every frame
     */
    update() {
      // Update animations
      TWEEN.update();
      
      // Update camera
      this.nexusCore.renderer.updateCamera(this.cameraPosition, this.lookAtPoint);
    }
  }