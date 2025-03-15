/**
 * Controls.js
 * 
 * Handles user interactions with the spatial visualization.
 */

class Controls {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.canvas = nexusCore.canvas;
      this.config = nexusCore.config;
      
      // Interaction state
      this.isDragging = false;
      this.isRotating = false;
      this.lastMousePosition = { x: 0, y: 0 };
      this.mousePosition = { x: 0, y: 0 };
      this.cameraDistance = 1000;
      this.cameraAngleHorizontal = 0;
      this.cameraAngleVertical = 0;
      
      // Navigation mode
      this.navMode = 'pan'; // 'pan', 'orbit', 'select', 'group'
      
      // Interaction sensitivity
      this.panSensitivity = 1.0;
      this.rotateSensitivity = 0.005;
      this.zoomSensitivity = 0.1;
      
      // Set up event listeners
      this._setupEventListeners();
    }
    
    /**
     * Set up event listeners for user interactions
     */
    _setupEventListeners() {
      // Mouse events
      this.canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
      this.canvas.addEventListener('mousemove', this._handleMouseMove.bind(this));
      this.canvas.addEventListener('mouseup', this._handleMouseUp.bind(this));
      this.canvas.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
      this.canvas.addEventListener('wheel', this._handleWheel.bind(this));
      
      // Touch events for mobile
      this.canvas.addEventListener('touchstart', this._handleTouchStart.bind(this));
      this.canvas.addEventListener('touchmove', this._handleTouchMove.bind(this));
      this.canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));
      
      // Key events for keyboard shortcuts
      window.addEventListener('keydown', this._handleKeyDown.bind(this));
    }
    
    /**
     * Set the navigation mode
     */
    setNavMode(mode) {
      if (['pan', 'orbit', 'select', 'group'].includes(mode)) {
        this.navMode = mode;
        
        // Update cursor style
        switch (mode) {
          case 'pan':
            this.canvas.style.cursor = 'grab';
            break;
          case 'orbit':
            this.canvas.style.cursor = 'move';
            break;
          case 'select':
            this.canvas.style.cursor = 'pointer';
            break;
          case 'group':
            this.canvas.style.cursor = 'crosshair';
            break;
        }
      }
    }
    
    /**
     * Handle mouse down events
     */
    _handleMouseDown(event) {
      event.preventDefault();
      
      // Store the starting position
      this.lastMousePosition.x = event.clientX;
      this.lastMousePosition.y = event.clientY;
      
      // Set dragging flag
      this.isDragging = true;
      
      // Special handling for different navigation modes
      switch (this.navMode) {
        case 'pan':
          this.canvas.style.cursor = 'grabbing';
          break;
        case 'orbit':
          this.isRotating = true;
          break;
        case 'select':
          // Try to select a node under the cursor
          this._selectNodeAtPosition(event.clientX, event.clientY);
          break;
      }
    }
    
    /**
     * Handle mouse move events
     */
    _handleMouseMove(event) {
      event.preventDefault();
      
      // Update mouse position
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
      
      if (this.isDragging) {
        // Calculate movement delta
        const deltaX = event.clientX - this.lastMousePosition.x;
        const deltaY = event.clientY - this.lastMousePosition.y;
        
        switch (this.navMode) {
          case 'pan':
            this._handlePan(deltaX, deltaY);
            break;
          case 'orbit':
            this._handleOrbit(deltaX, deltaY);
            break;
          case 'group':
            // Handle group selection drag
            break;
        }
        
        // Update last position
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
      } else {
        // Hover effects
        this._handleHover(event.clientX, event.clientY);
      }
    }
    
    /**
     * Handle mouse up events
     */
    _handleMouseUp(event) {
      event.preventDefault();
      
      // Reset flags
      this.isDragging = false;
      this.isRotating = false;
      
      // Reset cursor for pan mode
      if (this.navMode === 'pan') {
        this.canvas.style.cursor = 'grab';
      }
    }
    
    /**
     * Handle mouse leave events
     */
    _handleMouseLeave(event) {
      event.preventDefault();
      
      // Reset flags
      this.isDragging = false;
      this.isRotating = false;
      
      // Reset cursor for pan mode
      if (this.navMode === 'pan') {
        this.canvas.style.cursor = 'grab';
      }
    }
    
    /**
     * Handle mouse wheel events for zooming
     */
    _handleWheel(event) {
      event.preventDefault();
      
      // Get scroll direction (normalize across browsers)
      const delta = event.deltaY || event.detail || event.wheelDelta;
      
      // Zoom in/out
      this._handleZoom(delta > 0 ? -1 : 1);
    }
    
    /**
     * Handle touch start events (mobile)
     */
    _handleTouchStart(event) {
      event.preventDefault();
      
      if (event.touches.length === 1) {
        // Single touch - similar to mouse down
        const touch = event.touches[0];
        this.lastMousePosition.x = touch.clientX;
        this.lastMousePosition.y = touch.clientY;
        this.isDragging = true;
      } else if (event.touches.length === 2) {
        // Two touches - pinch to zoom
        this.initialTouchDistance = this._getTouchDistance(event);
      }
    }
    
    /**
     * Handle touch move events (mobile)
     */
    _handleTouchMove(event) {
      event.preventDefault();
      
      if (event.touches.length === 1 && this.isDragging) {
        // Single touch - similar to mouse move
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.lastMousePosition.x;
        const deltaY = touch.clientY - this.lastMousePosition.y;
        
        this._handlePan(deltaX, deltaY);
        
        this.lastMousePosition.x = touch.clientX;
        this.lastMousePosition.y = touch.clientY;
      } else if (event.touches.length === 2) {
        // Two touches - pinch to zoom
        const currentDistance = this._getTouchDistance(event);
        const deltaDistance = currentDistance - this.initialTouchDistance;
        
        this._handleZoom(deltaDistance * 0.01);
        
        this.initialTouchDistance = currentDistance;
      }
    }
    
    /**
     * Handle touch end events (mobile)
     */
    _handleTouchEnd(event) {
      event.preventDefault();
      
      // Reset flags
      this.isDragging = false;
      this.isRotating = false;
      
      // If a touch still remains, update last position
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        this.lastMousePosition.x = touch.clientX;
        this.lastMousePosition.y = touch.clientY;
      }
    }
    
    /**
     * Get distance between two touch points
     */
    _getTouchDistance(event) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Handle key down events for keyboard shortcuts
     */
    _handleKeyDown(event) {
      // Focus key
      if (event.key === ' ') {
        // Focus on selected node
        if (this.nexusCore.graph.selectedNodeId) {
          const node = this.nexusCore.graph.getNode(this.nexusCore.graph.selectedNodeId);
          if (node) {
            this.nexusCore.core.focusOn(node);
          }
        }
      }
      
      // Navigation mode shortcuts
      if (event.key === '1') {
        this.setNavMode('pan');
      } else if (event.key === '2') {
        this.setNavMode('orbit');
      } else if (event.key === '3') {
        this.setNavMode('select');
      } else if (event.key === '4' || event.key === 'g') {
        this.setNavMode('group');
      }
      
      // Find path (F key)
      if (event.key === 'f') {
        // Find path between selected nodes (implementation omitted)
      }
    }
    
    /**
     * Handle panning
     */
    _handlePan(deltaX, deltaY) {
      // Calculate camera-relative direction
      // This would need to account for camera orientation
      
      // For simplicity, we'll use a basic approach
      const movementSpeed = 1.5 * this.panSensitivity;
      
      // Update camera position
      this.nexusCore.core.cameraPosition.x -= deltaX * movementSpeed;
      this.nexusCore.core.cameraPosition.y += deltaY * movementSpeed;
      
      // Update look-at point
      this.nexusCore.core.lookAtPoint.x -= deltaX * movementSpeed;
      this.nexusCore.core.lookAtPoint.y += deltaY * movementSpeed;
    }
    
    /**
     * Handle orbiting
     */
    _handleOrbit(deltaX, deltaY) {
      // Update camera angles
      this.cameraAngleHorizontal += deltaX * this.rotateSensitivity;
      this.cameraAngleVertical += deltaY * this.rotateSensitivity;
      
      // Limit vertical angle to prevent flipping
      this.cameraAngleVertical = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.cameraAngleVertical));
      
      // Calculate new camera position based on angles
      const lookAt = this.nexusCore.core.lookAtPoint;
      
      // Spherical to Cartesian conversion
      this.nexusCore.core.cameraPosition.x = lookAt.x + this.cameraDistance * Math.sin(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
      this.nexusCore.core.cameraPosition.y = lookAt.y + this.cameraDistance * Math.sin(this.cameraAngleVertical);
      this.nexusCore.core.cameraPosition.z = lookAt.z + this.cameraDistance * Math.cos(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
    }
    
    /**
     * Handle zooming
     */
    _handleZoom(direction) {
      // Update camera distance
      const zoomFactor = 1 + (direction * this.zoomSensitivity);
      this.cameraDistance = Math.max(100, Math.min(2000, this.cameraDistance * zoomFactor));
      
      // Recalculate camera position (similar to orbit)
      const lookAt = this.nexusCore.core.lookAtPoint;
      
      this.nexusCore.core.cameraPosition.x = lookAt.x + this.cameraDistance * Math.sin(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
      this.nexusCore.core.cameraPosition.y = lookAt.y + this.cameraDistance * Math.sin(this.cameraAngleVertical);
      this.nexusCore.core.cameraPosition.z = lookAt.z + this.cameraDistance * Math.cos(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
    }
    
    /**
     * Handle hover effects
     */
    _handleHover(x, y) {
      // This would check for nodes under the cursor and provide visual feedback
      // Implementation would use raycasting to find intersections
    }
    
    /**
     * Select a node at the given screen position
     */
    _selectNodeAtPosition(x, y) {
      // This would use raycasting to find node intersections
      // For simplicity, we'll just select a random node for demonstration
      
      const nodes = this.nexusCore.graph.getAllNodes();
      if (nodes.length > 0) {
        const randomIndex = Math.floor(Math.random() * nodes.length);
        const randomNode = nodes[randomIndex];
        this.nexusCore.selectNode(randomNode.id);
      }
    }
    
    /**
     * Update method called every frame
     */
    update() {
      // Handle continuous interactions or animations
    }
    
    /**
     * Update configuration when global config changes
     */
    updateConfig() {
      // Update sensitivity settings
      this.panSensitivity = this.nexusCore.config.panSensitivity || 1.0;
      this.rotateSensitivity = this.nexusCore.config.rotateSensitivity || 0.005;
      this.zoomSensitivity = this.nexusCore.config.zoomSensitivity || 0.1;
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
      this.canvas.removeEventListener('mousedown', this._handleMouseDown);
      this.canvas.removeEventListener('mousemove', this._handleMouseMove);
      this.canvas.removeEventListener('mouseup', this._handleMouseUp);
      this.canvas.removeEventListener('mouseleave', this._handleMouseLeave);
      this.canvas.removeEventListener('wheel', this._handleWheel);
      
      this.canvas.removeEventListener('touchstart', this._handleTouchStart);
      this.canvas.removeEventListener('touchmove', this._handleTouchMove);
      this.canvas.removeEventListener('touchend', this._handleTouchEnd);
      
      window.removeEventListener('keydown', this._handleKeyDown);
    }
  }