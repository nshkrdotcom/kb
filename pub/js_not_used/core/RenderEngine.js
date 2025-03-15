/**
 * RenderEngine.js
 * 
 * Rendering abstraction layer that handles the visual representation
 * using Three.js as the rendering backend.
 */

class RenderEngine {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.canvas = nexusCore.canvas;
      this.config = nexusCore.config;
      
      this._initRenderer();
      this._initScene();
      this._initCamera();
      this._initLights();
      this._initNodeMaterials();
      this._initEdgeMaterials();
      this._initHelpers();
      
      // Collections for scene objects
      this.nodeObjects = new Map();
      this.edgeObjects = new Map();
      this.labelObjects = new Map();
      
      // Track current detail level
      this.currentDetailLevel = 3;
      
      // Handle resize
      this._setupResizeHandler();
    }
    
    /**
     * Initialize the Three.js renderer
     */
    _initRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      
      this.renderer.setSize(this.config.width, this.config.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x1e1e1e, 1);
      this.renderer.shadowMap.enabled = true;
      
      // Initialize post-processing if high detail
      if (this.nexusCore.performanceScaling > 1.3) {
        this._initPostProcessing();
      }
    }
    
    /**
     * Initialize post-processing effects
     */
    _initPostProcessing() {
      // This would set up effects like bloom, SSAO, etc.
      // For brevity, we'll skip the detailed implementation
      this.postProcessingEnabled = true;
    }
    
    /**
     * Initialize the Three.js scene
     */
    _initScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1e1e1e);
      this.scene.fog = new THREE.FogExp2(0x1e1e1e, 0.0015);
    }
    
    /**
     * Initialize the camera
     */
    _initCamera() {
      const aspect = this.config.width / this.config.height;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 5000);
      this.camera.position.set(0, 0, 1000);
      this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Initialize scene lighting
     */
    _initLights() {
      // Ambient light for overall illumination
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(this.ambientLight);
      
      // Main directional light with shadows
      this.mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
      this.mainLight.position.set(200, 200, 200);
      
      // Configure shadows based on detail level
      if (this.nexusCore.performanceScaling > 1.0) {
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 1024;
        this.mainLight.shadow.mapSize.height = 1024;
        this.mainLight.shadow.camera.near = 100;
        this.mainLight.shadow.camera.far = 1000;
        this.mainLight.shadow.camera.left = -500;
        this.mainLight.shadow.camera.right = 500;
        this.mainLight.shadow.camera.top = 500;
        this.mainLight.shadow.camera.bottom = -500;
      }
      
      this.scene.add(this.mainLight);
      
      // Add some rim lighting for 3D definition
      this.rimLight = new THREE.DirectionalLight(0x5ebaff, 0.3);
      this.rimLight.position.set(-200, 100, -200);
      this.scene.add(this.rimLight);
    }
    
    /**
     * Initialize materials for nodes
     */
    _initNodeMaterials() {
      // Create a collection of materials for different node types
      this.nodeMaterials = {
        primary: new THREE.MeshPhongMaterial({
          color: 0x0066cc,
          specular: 0x111111,
          shininess: 30
        }),
        secondary: new THREE.MeshPhongMaterial({
          color: 0x0084ff,
          specular: 0x111111,
          shininess: 30
        }),
        tertiary: new THREE.MeshPhongMaterial({
          color: 0x5ebaff,
          specular: 0x111111,
          shininess: 30
        }),
        quaternary: new THREE.MeshPhongMaterial({
          color: 0x805ad5,
          specular: 0x111111,
          shininess: 30
        }),
        highlighted: new THREE.MeshPhongMaterial({
          color: 0xffcc00,
          specular: 0x555555,
          shininess: 60,
          emissive: 0xffcc00,
          emissiveIntensity: 0.2
        }),
        selected: new THREE.MeshPhongMaterial({
          color: 0xff3300,
          specular: 0x555555,
          shininess: 60,
          emissive: 0xff3300,
          emissiveIntensity: 0.3
        })
      };
      
      // Inner sphere materials for core concept appearance
      this.innerMaterials = {
        primary: new THREE.MeshPhongMaterial({
          color: 0x1e293b,
          specular: 0x222222,
          shininess: 20
        }),
        selected: new THREE.MeshPhongMaterial({
          color: 0x2d3748,
          specular: 0x222222,
          shininess: 20,
          emissive: 0xff3300,
          emissiveIntensity: 0.1
        })
      };
    }
    
    /**
     * Initialize materials for edges
     */
    _initEdgeMaterials() {
      // Create materials for connection edges
      this.edgeMaterials = {
        primary: new THREE.LineBasicMaterial({
          color: 0x0084ff,
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        }),
        secondary: new THREE.LineBasicMaterial({
          color: 0x5ebaff,
          linewidth: 1.5,
          transparent: true,
          opacity: 0.6
        }),
        tertiary: new THREE.LineBasicMaterial({
          color: 0x805ad5,
          linewidth: 1,
          transparent: true,
          opacity: 0.4
        }),
        highlighted: new THREE.LineBasicMaterial({
          color: 0xffcc00,
          linewidth: 3,
          transparent: true,
          opacity: 0.9
        })
      };
      
      // For higher detail levels, use MeshLineMaterial
      if (this.nexusCore.performanceScaling > 1.0) {
        // This would be implemented using custom shaders or a library like MeshLine
        // For brevity, we'll skip the detailed implementation
      }
    }
    
    /**
     * Initialize helper objects for the scene
     */
    _initHelpers() {
      // Create a grid helper for spatial reference
      this.gridHelper = new THREE.GridHelper(2000, 20, 0x2a2a2a, 0x2a2a2a);
      this.gridHelper.position.y = -300;
      this.scene.add(this.gridHelper);
      
      // Create proximity rings
      this._createProximityRings();
    }
    
    /**
     * Create proximity rings that show relationship strength zones
     */
    _createProximityRings() {
      this.proximityRings = [];
      
      const ringGeometry1 = new THREE.RingGeometry(250, 252, 64);
      const ringMaterial1 = new THREE.MeshBasicMaterial({
        color: 0x0066cc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.1
      });
      const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial1);
      ring1.rotation.x = Math.PI / 2;
      this.scene.add(ring1);
      this.proximityRings.push(ring1);
      
      const ringGeometry2 = new THREE.RingGeometry(150, 152, 48);
      const ringMaterial2 = new THREE.MeshBasicMaterial({
        color: 0x0066cc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2);
      ring2.rotation.x = Math.PI / 2;
      this.scene.add(ring2);
      this.proximityRings.push(ring2);
      
      const ringGeometry3 = new THREE.RingGeometry(80, 82, 32);
      const ringMaterial3 = new THREE.MeshBasicMaterial({
        color: 0x0066cc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const ring3 = new THREE.Mesh(ringGeometry3, ringMaterial3);
      ring3.rotation.x = Math.PI / 2;
      this.scene.add(ring3);
      this.proximityRings.push(ring3);
    }
    
    /**
     * Set up the resize handler
     */
    _setupResizeHandler() {
      window.addEventListener('resize', () => {
        if (this.nexusCore.config.width !== this.canvas.clientWidth ||
            this.nexusCore.config.height !== this.canvas.clientHeight) {
          
          this.nexusCore.config.width = this.canvas.clientWidth;
          this.nexusCore.config.height = this.canvas.clientHeight;
          
          this.camera.aspect = this.nexusCore.config.width / this.nexusCore.config.height;
          this.camera.updateProjectionMatrix();
          
          this.renderer.setSize(this.nexusCore.config.width, this.nexusCore.config.height);
        }
      });
    }
    
    /**
     * Update the camera position and look-at point
     */
    updateCamera(position, lookAt) {
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    }
    
    /**
     * Update the detail level settings
     */
    updateDetailLevel(detailLevel) {
      this.currentDetailLevel = detailLevel;
      
      // Adjust visual quality based on detail level
      this.renderer.shadowMap.enabled = detailLevel >= 4;
      this.postProcessingEnabled = detailLevel >= 4;
      
      // Update lighting intensity
      const core = this.nexusCore.core;
      this.ambientLight.intensity = core.visualParameters.ambientLightIntensity;
      this.mainLight.intensity = core.visualParameters.directionalLightIntensity;
      
      // Update materials
      this._updateMaterials();
    }
    
    /**
     * Update materials based on detail level
     */
    _updateMaterials() {
      // Update material quality settings
      const highQuality = this.currentDetailLevel >= 4;
      
      Object.values(this.nodeMaterials).forEach(material => {
        material.flatShading = !highQuality;
      });
      
      Object.values(this.innerMaterials).forEach(material => {
        material.flatShading = !highQuality;
      });
    }
    
    /**
     * Update configuration when global config changes
     */
    updateConfig() {
      this.renderer.setSize(this.nexusCore.config.width, this.nexusCore.config.height);
      this.camera.aspect = this.nexusCore.config.width / this.nexusCore.config.height;
      this.camera.updateProjectionMatrix();
      
      this.updateDetailLevel(this.currentDetailLevel);
    }
    
    /**
     * Create visual representation of a node
     */
    createNodeObject(node) {
      // Get appropriate material based on node properties
      let material;
      if (node.color === '#0066cc') {
        material = this.nodeMaterials.primary;
      } else if (node.color === '#0084ff') {
        material = this.nodeMaterials.secondary;
      } else if (node.color === '#5ebaff') {
        material = this.nodeMaterials.tertiary;
      } else {
        material = this.nodeMaterials.quaternary;
      }
      
      // Create outer sphere (colored shell)
      const radius = node.radius || 30;
      const segments = Math.max(16, Math.floor(this.currentDetailLevel * 8));
      const geometry = new THREE.SphereGeometry(radius, segments, segments);
      const outerSphere = new THREE.Mesh(geometry, material);
      
      // Create inner sphere (dark core)
      const innerGeometry = new THREE.SphereGeometry(radius * 0.9, segments, segments);
      const innerSphere = new THREE.Mesh(innerGeometry, this.innerMaterials.primary);
      
      // Create group and add both spheres
      const nodeGroup = new THREE.Group();
      nodeGroup.add(outerSphere);
      nodeGroup.add(innerSphere);
      
      // Position the node
      nodeGroup.position.set(node.x, node.y, 0);
      
      // Add to scene
      this.scene.add(nodeGroup);
      
      // Store reference
      this.nodeObjects.set(node.id, {
        group: nodeGroup,
        outer: outerSphere,
        inner: innerSphere,
        label: this._createLabel(node)
      });
      
      return nodeGroup;
    }
    
    /**
     * Create a text label for a node
     */
    _createLabel(node) {
      // Skip labels for low detail levels
      if (this.currentDetailLevel < 2) return null;
      
      // Create canvas for text rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      
      // Clear background
      context.fillStyle = 'rgba(30, 41, 59, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.font = 'bold 24px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(node.name, canvas.width / 2, 40);
      
      if (node.subtext) {
        context.font = '18px Arial';
        context.fillStyle = '#e0e0e0';
        context.fillText(node.subtext, canvas.width / 2, 70);
      }
      
      if (node.tokens) {
        context.font = '16px Arial';
        context.fillStyle = '#0084ff';
        context.fillText(`${node.tokens} tokens`, canvas.width / 2, 100);
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      
      // Create sprite material
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(100, 50, 1);
      sprite.position.set(node.x, node.y - node.radius - 40, 0);
      
      // Add to scene
      this.scene.add(sprite);
      
      return sprite;
    }
    
    /**
     * Create visual representation of an edge
     */
    createEdgeObject(edge, sourceNode, targetNode) {
      // Calculate edge strength for visual weight
      const weight = edge.weight || 0.5;
      
      // Get appropriate material based on edge properties
      let material;
      if (weight > 0.8) {
        material = this.edgeMaterials.primary;
      } else if (weight > 0.5) {
        material = this.edgeMaterials.secondary;
      } else {
        material = this.edgeMaterials.tertiary;
      }
      
      // Create line geometry
      const points = [];
      points.push(new THREE.Vector3(sourceNode.x, sourceNode.y, 0));
      points.push(new THREE.Vector3(targetNode.x, targetNode.y, 0));
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      
      // Add to scene
      this.scene.add(line);
      
      // Create weight indicator (circle with number)
      const weightIndicator = this._createWeightIndicator(
        (sourceNode.x + targetNode.x) / 2,
        (sourceNode.y + targetNode.y) / 2,
        weight
      );
      
      // Store reference
      this.edgeObjects.set(edge.source + '-' + edge.target, {
        line: line,
        indicator: weightIndicator,
        source: edge.source,
        target: edge.target,
        weight: weight
      });
      
      return line;
    }
    
    /**
     * Create a weight indicator for an edge
     */
    _createWeightIndicator(x, y, weight) {
      // Skip for low detail levels
      if (this.currentDetailLevel < 3) return null;
      
      // Create canvas for weight indicator
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 64;
      
      // Draw circle
      context.beginPath();
      context.arc(32, 32, 20, 0, Math.PI * 2);
      context.fillStyle = '#2a2a2a';
      context.fill();
      context.strokeStyle = '#0084ff';
      context.lineWidth = 2;
      context.stroke();
      
      // Draw text
      context.font = 'bold 16px Arial';
      context.fillStyle = '#0084ff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(weight.toFixed(1), 32, 32);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      
      // Create sprite material
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(30, 30, 1);
      sprite.position.set(x, y, 0);
      
      // Add to scene
      this.scene.add(sprite);
      
      return sprite;
    }
    
    /**
     * Update node position and appearance
     */
    updateNodeObject(nodeId, position, properties = {}) {
      const nodeObject = this.nodeObjects.get(nodeId);
      if (!nodeObject) return;
      
      // Update position
      nodeObject.group.position.set(position.x, position.y, position.z || 0);
      
      // Update label position if exists
      if (nodeObject.label) {
        nodeObject.label.position.set(
          position.x,
          position.y - (properties.radius || 30) - 40,
          position.z || 0
        );
      }
      
      // Update appearance based on properties
      if (properties.highlighted) {
        nodeObject.outer.material = this.nodeMaterials.highlighted;
        nodeObject.inner.material = this.innerMaterials.selected;
      } else if (properties.selected) {
        nodeObject.outer.material = this.nodeMaterials.selected;
        nodeObject.inner.material = this.innerMaterials.selected;
      }
    }
    
    /**
     * Update edge position and appearance
     */
    updateEdgeObject(edgeId, sourcePos, targetPos, properties = {}) {
      const edgeObject = this.edgeObjects.get(edgeId);
      if (!edgeObject) return;
      
      // Update line geometry
      const positions = edgeObject.line.geometry.attributes.position.array;
      positions[0] = sourcePos.x;
      positions[1] = sourcePos.y;
      positions[2] = sourcePos.z || 0;
      positions[3] = targetPos.x;
      positions[4] = targetPos.y;
      positions[5] = targetPos.z || 0;
      
      edgeObject.line.geometry.attributes.position.needsUpdate = true;
      
      // Update indicator position
      if (edgeObject.indicator) {
        edgeObject.indicator.position.set(
          (sourcePos.x + targetPos.x) / 2,
          (sourcePos.y + targetPos.y) / 2,
          (sourcePos.z + targetPos.z) / 2 || 0
        );
      }
      
      // Update appearance based on properties
      if (properties.highlighted) {
        edgeObject.line.material = this.edgeMaterials.highlighted;
      }
    }
    
    /**
     * Render the scene
     */
    render() {
      // Standard rendering or post-processing
      if (this.postProcessingEnabled) {
        // Use composer for post-processing
        // this.composer.render();
        // Simplified: just use standard renderer
        this.renderer.render(this.scene, this.camera);
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
      // Dispose of Three.js resources
      this.renderer.dispose();
      
      // Dispose geometries and materials
      this.nodeObjects.forEach(obj => {
        obj.outer.geometry.dispose();
        obj.inner.geometry.dispose();
        if (obj.label && obj.label.material.map) {
          obj.label.material.map.dispose();
        }
      });
      
      this.edgeObjects.forEach(obj => {
        obj.line.geometry.dispose();
        if (obj.indicator && obj.indicator.material.map) {
          obj.indicator.material.map.dispose();
        }
      });
    }
  }