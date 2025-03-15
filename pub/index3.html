<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContextNexus Spatial Canvas</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React Dependencies -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>


  <!-- Add these before the closing </head> tag -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@21.0.0/dist/tween.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/d3-force@3.0.0/dist/d3-force.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/regl@2.1.0/dist/regl.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/gl-matrix.min.js"></script>

  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #333;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #777;
    }

    /* Custom slider styling */
    .custom-range {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #333;
      outline: none;
    }

    .custom-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #0084ff;
      cursor: pointer;
    }

    .custom-range::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #0084ff;
      cursor: pointer;
    }

    /* Custom toggle switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #333;
      transition: .4s;
      border-radius: 20px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked+.toggle-slider {
      background-color: #0084ff;
    }

    input:checked+.toggle-slider:before {
      transform: translateX(16px);
    }

    /* Pulse animation for suggestions */
    @keyframes pulse {
      0% {
        opacity: 0.7;
      }

      50% {
        opacity: 1;
      }

      100% {
        opacity: 0.7;
      }
    }

    .suggestion-pulse {
      animation: pulse 2s infinite;
    }

    /* Canvas container */
    #canvasContainer {
      width: 100%;
      height: 100%;
      touch-action: none;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  </style>
</head>

<body class="bg-[#1a1a1a] text-gray-200 overflow-hidden">
  <div id="root"></div>

  <script type="text/babel">
    // Destructure React hooks
    const { useState, useEffect, useRef, useCallback } = React;

    // =============================================
    // ICON COMPONENTS
    // =============================================
    const Icon = {
      Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
      ChevronDown: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      ),
      Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ),
      Zap: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      ),
      Bot: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
          <circle cx="12" cy="5" r="2"></circle>
          <path d="M12 7v4"></path>
          <line x1="8" y1="16" x2="8" y2="16"></line>
          <line x1="16" y1="16" x2="16" y2="16"></line>
        </svg>
      ),
      Bookmark: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      Eye: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      Edit: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      ),
      Move: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ),
      Grid: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      Lock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      Cube: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
      ZoomIn: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      ),
      ZoomOut: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      ),
    };

    // =============================================
    // SAMPLE DATA
    // =============================================
    const CONCEPT_CATEGORIES = [
      {
        id: 'core',
        name: 'Core Concepts',
        concepts: [
          { id: 'nn-types', name: 'Neural Network Types', desc: 'CNN, RNN, Transformer...', tokens: 980 },
          { id: 'activation', name: 'Activation Functions', desc: 'ReLU, Sigmoid, Tanh...', tokens: 720 },
          { id: 'loss', name: 'Loss Functions', desc: 'Cross Entropy, MSE...', tokens: 850 },
        ]
      },
      {
        id: 'impl',
        name: 'Implementations',
        concepts: [
          { id: 'tf-code', name: 'TensorFlow Code', desc: 'Model implementation...', tokens: 1240 },
          { id: 'pytorch', name: 'PyTorch Examples', desc: 'Training loops, modules...', tokens: 1450 },
        ]
      },
      {
        id: 'research',
        name: 'Research Papers',
        concepts: [
          { id: 'attention', name: 'Attention Mechanisms', desc: 'Self-attention, multi-head...', tokens: 2100 },
          { id: 'architectures', name: 'Model Architectures', desc: 'BERT, GPT, ResNet...', tokens: 1820 },
        ]
      }
    ];

    const SAMPLE_NODES = [
      { 
        id: 'transformer',
        type: 'concept',
        name: 'Transformer',
        subtext: 'Architecture',
        tokens: 1540,
        x: 600,
        y: 350,
        radius: 50,
        color: '#0066cc',
        importance: 0.9
      },
      { 
        id: 'self-attention',
        type: 'concept',
        name: 'Self-Attention',
        subtext: 'Mechanism',
        tokens: 920,
        x: 700,
        y: 250,
        radius: 40,
        color: '#0084ff',
        importance: 0.8
      },
      { 
        id: 'feed-forward',
        type: 'concept',
        name: 'Feed',
        subtext: 'Forward',
        tokens: 820,
        x: 500, 
        y: 250,
        radius: 40,
        color: '#0084ff',
        importance: 0.7
      },
      { 
        id: 'layer-norm',
        type: 'concept',
        name: 'Layer',
        subtext: 'Normalization',
        tokens: 650,
        x: 600,
        y: 180,
        radius: 35,
        color: '#29a3ff',
        importance: 0.6
      },
      { 
        id: 'encoder',
        type: 'concept',
        name: 'Encoder',
        subtext: 'Block',
        tokens: 1200,
        x: 450,
        y: 380,
        radius: 40,
        color: '#5ebaff',
        importance: 0.8
      },
      { 
        id: 'decoder',
        type: 'concept',
        name: 'Decoder',
        subtext: 'Block',
        tokens: 1250,
        x: 750,
        y: 380,
        radius: 40, 
        color: '#5ebaff',
        importance: 0.8
      }
    ];

    const SAMPLE_CONNECTIONS = [
      { source: 'transformer', target: 'self-attention', weight: 0.9 },
      { source: 'transformer', target: 'feed-forward', weight: 0.8 },
      { source: 'transformer', target: 'encoder', weight: 0.9 },
      { source: 'transformer', target: 'decoder', weight: 0.9 },
      { source: 'self-attention', target: 'layer-norm', weight: 0.7 },
      { source: 'feed-forward', target: 'layer-norm', weight: 0.7 },
      { source: 'encoder', target: 'self-attention', weight: 0.8 },
      { source: 'decoder', target: 'self-attention', weight: 0.8 },
    ];

// SpatialCanvas component with integrated class definitions
const SpatialCanvas = ({ width, height }) => {
  const canvasRef = useRef(null);
  const nexusCoreRef = useRef(null);
  
  useEffect(() => {

    // Load only external dependencies
    const loadExternalScripts = async () => {
      const externalScripts = [
        'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
        'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@21.0.0/dist/tween.umd.min.js',
        'https://cdn.jsdelivr.net/npm/d3-force@3.0.0/dist/d3-force.min.js'
      ];
      
      for (const src of externalScripts) {
        await new Promise((resolve, reject) => {
          // Skip if script is already loaded
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Initialize after external scripts are loaded
      if (canvasRef.current) {


    
    
    
        // Create the core module system
        initializeNexusCore();
        canvasRef.current.style.width = '100%';
      canvasRef.current.style.height = '100%';
      // width = '100%';
      // height = '100%';

      }
      
    };
    
    loadExternalScripts().catch(error => console.error('Error loading external scripts:', error));
    
    // Cleanup function
    return () => {
      if (nexusCoreRef.current) {
        nexusCoreRef.current.dispose();
      }
    };
  }, [width, height]);

  // Add to SpatialCanvas component
  const initializeControls = () => {
    if (nexusCoreRef.current && nexusCoreRef.current.controls) {
      // Set initial camera angles based on current position
      const core = nexusCoreRef.current.core;
      const camera = nexusCoreRef.current.renderer.camera;
      
      // Reset angles when switching view modes
      nexusCoreRef.current.controls.cameraAngleHorizontal = 0;
      nexusCoreRef.current.controls.cameraAngleVertical = 0;
      
      // Update control sensitivity based on scale
      nexusCoreRef.current.controls.panSensitivity = 1.0 * scale;
      nexusCoreRef.current.controls.zoomSensitivity = 0.1 * scale;
    }
  }


  
  // Function to initialize the NexusCore after dependencies are loaded
  const initializeNexusCore = () => {
    // Define all necessary classes inline instead of loading them externally
    
    // 1. Define SpatialCore, SpatialGraph, PhysicsSystem, RenderEngine classes
    class SpatialCore {
      constructor(nexusCore) {
        this.nexusCore = nexusCore;
        this.config = nexusCore.config;
        
        // Camera positioning
        this.cameraPosition = { x: 400, y: 200, z: 800  };
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
          ambientLightIntensity: 0.6,
          directionalLightIntensity: 0.8
        };
        
        this.updateDetailLevel();
      }
      
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
        
        // Notify other systems - only if they exist
        if (this.nexusCore.renderer) {
          this.nexusCore.renderer.updateDetailLevel(this.currentDetailLevel);
        }
        if (this.nexusCore.physics) {
          this.nexusCore.physics.updateDetailLevel(this.currentDetailLevel);
        }
      }
      
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
      
      updateConfig() {
        // Update internal parameters based on global config
        this.updateDetailLevel();
      }
      
      focusOn(node) {
        // Calculate target position
        const position = node.position;
        const targetLookAt = {
          x: position.x,
          y: position.y,
          z: position.z
        };
        
        // Calculate camera position based on node size
        const distance = 200 + (node.radius || 30) * 10;
        const targetCamera = {
          x: position.x,
          y: position.y - 50, // Slight angle
          z: position.z + distance
        };
        
        // Animate the transition
        this._animateCameraMove(targetCamera, targetLookAt);
      }
      
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
      
      update() {
        // Update animations
        TWEEN.update();
        
        // Update camera
        this.nexusCore.renderer.updateCamera(this.cameraPosition, this.lookAtPoint);
      }
    }
    
    class SpatialGraph {
      constructor(nexusCore) {
        this.nexusCore = nexusCore;
        this.nodes = new Map();
        this.connections = [];
        this.selectedNodeId = null;
        this.highlightedNodeIds = new Set();
      }

      updateNodeSizes(scaleFactor) {
        this.nodes.forEach(node => {
          // Store original radius if not already stored
          if (node.originalRadius === undefined) {
            node.originalRadius = node.radius;
          }
          
          // Scale the radius
          node.radius = node.originalRadius * Math.sqrt(scaleFactor);
          
          // Update the visual representation
          this.nexusCore.renderer.updateNodeObject(
            node.id,
            node.position,
            { radius: node.radius, selected: node.selected, highlighted: node.highlighted }
          );
        });
      }
      
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
      
      _calculateNodeMass(nodeData) {
        // Base mass on tokens and importance
        const tokenFactor = nodeData.tokens ? Math.log(nodeData.tokens) / 10 : 1;
        const importanceFactor = nodeData.importance || 1;
        
        return Math.max(1, tokenFactor * importanceFactor * 2);
      }
      
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
      
      getNode(nodeId) {
        return this.nodes.get(nodeId);
      }
      
      getAllNodes() {
        return Array.from(this.nodes.values());
      }
      
      getNodeCount() {
        return this.nodes.size;
      }
      
      getAllConnections() {
        return this.connections;
      }
      
      getConnectionCount() {
        return this.connections.length;
      }
      
      getNodeConnections(nodeId) {
        return this.connections.filter(
          conn => conn.source === nodeId || conn.target === nodeId
        );
      }
      
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
    
    class PhysicsSystem {
      constructor(nexusCore) {
        this.nexusCore = nexusCore;
        this.config = nexusCore.config;
        
        this.detailLevelThresholds = [0.4, 0.7, 1.0, 1.3, 1.6];

        // Physics simulation parameters
        this.simulationActive = true;
        this.simulationDamping = 0.9;  // Increase from 0.8 to 0.9 to maintain movement
        this.gravitationalConstant = -40;  // Reduced from -50
        this.springConstant = 0.08;  // Reduced from 0.1
        this.repulsionConstant = 4000;  // Reduced from 5000
        this.centeringForce = 0.02;  // Reduced from 0.03
              
        // Timestep for simulation
        this.timestep = 0.8;
        
        // Layout bounds
        this.layoutBounds = { width: 1000, height: 1000, depth: 500 };
        
        // Optional: use D3-force for more sophisticated layout
        this.useD3Force = this.nexusCore.performanceScaling > 1.0;
        
        if (this.useD3Force) {
          this._initD3Simulation();
        }
      }
      
      _initD3Simulation() {
        // This would set up D3 force simulation
        // For brevity, we'll skip the detailed implementation
        this.d3Simulation = true;
      }
      
      updateDetailLevel(detailLevel) {
        // Safely handle missing detailLevelThresholds
        if (!this.detailLevelThresholds) {
          this.detailLevelThresholds = [0.4, 0.7, 1.0, 1.3, 1.6];
        }

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

      updateLayout(bounds) {
        this.layoutBounds = bounds || this.layoutBounds;
        this.resetSimulation();
      }
      
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
      }
      
      update() {
        if (!this.simulationActive) return;
        
        // Get nodes and connections
        const graph = this.nexusCore.graph;
        const nodes = graph.getAllNodes();
        const connections = graph.getAllConnections();
        const nodeMap = graph.nodes;
        
        if (this.useD3Force) {
          // For simplicity, fall back to basic simulation
          this._updateBasicSimulation(nodes, connections, nodeMap);
        } else {
          this._updateBasicSimulation(nodes, connections, nodeMap);
        }
        
        // Update node positions in the renderer
        graph.updateNodePositions();
      }
      
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
      
      updateConfig() {
        this.updateDetailLevel(this.nexusCore.core.currentDetailLevel);
      }
    }
    
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
      
      _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true
        });
        
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x222233, 1);  // Slightly bluer dark background
        this.renderer.shadowMap.enabled = true;
        
        // Initialize post-processing if high detail
        if (this.nexusCore.performanceScaling > 1.3) {
          this._initPostProcessing();
        }
      }
      
      _initPostProcessing() {
        // For brevity, we'll skip the detailed implementation
        this.postProcessingEnabled = true;
      }
      
      _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222233);  // Match renderer background
        this.scene.fog = new THREE.FogExp2(0x222233, 0.001);  // Reduced fog density
      }
      
      _initCamera() {
        const aspect = this.config.width / this.config.height;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 5000);
        this.camera.position.set(0, 0, 1000);
        this.camera.lookAt(0, 0, 0);
      }
      
      _initLights() {
        // Ambient light for overall illumination
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);
        
        // Main directional light with shadows
        this.mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
  
          // Add brighter rim light (from 0.3 to 0.5)
  this.rimLight = new THREE.DirectionalLight(0x5ebaff, 0.5);
  this.rimLight.position.set(-200, 100, -200);
  this.scene.add(this.rimLight);
  
  // Add additional fill light from below for better visibility
  this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  this.fillLight.position.set(0, -200, 100);
  this.scene.add(this.fillLight);


      }
      
      _initNodeMaterials() {
  // Brighter materials for better visibility
  this.nodeMaterials = {
    primary: new THREE.MeshPhongMaterial({
      color: 0x0088ff,  // Brighter blue
      specular: 0x555555,  // More specular highlight
      shininess: 60,  // Increased shininess
      emissive: 0x0033aa,  // Add slight emissive glow
      emissiveIntensity: 0.2
    }),
    secondary: new THREE.MeshPhongMaterial({
      color: 0x22aaff,  // Brighter secondary blue
      specular: 0x555555,
      shininess: 60,
      emissive: 0x0044bb,
      emissiveIntensity: 0.2
    }),
    tertiary: new THREE.MeshPhongMaterial({
      color: 0x7ecfff,  // Brighter tertiary blue
      specular: 0x555555,
      shininess: 60,
      emissive: 0x0055cc,
      emissiveIntensity: 0.15
    }),
    quaternary: new THREE.MeshPhongMaterial({
      color: 0xa07cff,  // Brighter purple
      specular: 0x555555,
      shininess: 60,
      emissive: 0x6633cc,
      emissiveIntensity: 0.15
    }),
    highlighted: new THREE.MeshPhongMaterial({
      color: 0xffdd00,  // Brighter highlight
      specular: 0x777777,
      shininess: 80,
      emissive: 0xffcc00,
      emissiveIntensity: 0.4  // Brighter emission
    }),
    selected: new THREE.MeshPhongMaterial({
      color: 0xff5500,  // Brighter selection
      specular: 0x777777,
      shininess: 80,
      emissive: 0xff3300,
      emissiveIntensity: 0.5  // Brighter emission
    })
  };
  
  // Lighter inner materials
  this.innerMaterials = {
    primary: new THREE.MeshPhongMaterial({
      color: 0x2d3e50,  // Lighter inner color
      specular: 0x444444,
      shininess: 40,
      emissive: 0x112233,
      emissiveIntensity: 0.1
    }),
    selected: new THREE.MeshPhongMaterial({
      color: 0x3d4e60,  // Lighter selected inner color
      specular: 0x444444,
      shininess: 40,
      emissive: 0xff4400,
      emissiveIntensity: 0.2
    })
  };
}

// 4. BRIGHTER EDGE MATERIALS
// In RenderEngine, update _initEdgeMaterials:

_initEdgeMaterials() {
  // Brighter and more visible connections
  this.edgeMaterials = {
    primary: new THREE.LineBasicMaterial({
      color: 0x44aaff,  // Brighter primary connection
      linewidth: 2,
      transparent: true,
      opacity: 0.9  // Increased opacity
    }),
    secondary: new THREE.LineBasicMaterial({
      color: 0x88ccff,  // Brighter secondary connection
      linewidth: 1.5,
      transparent: true,
      opacity: 0.8  // Increased opacity
    }),
    tertiary: new THREE.LineBasicMaterial({
      color: 0xa088ff,  // Brighter tertiary connection
      linewidth: 1,
      transparent: true,
      opacity: 0.7  // Increased opacity
    }),
    highlighted: new THREE.LineBasicMaterial({
      color: 0xffdd00,  // Brighter highlighted connection
      linewidth: 3,
      transparent: true,
      opacity: 1.0  // Full opacity
    })
  };
}
      
      _initHelpers() {
        // Create a grid helper for spatial reference
        this.gridHelper = new THREE.GridHelper(2000, 20, 0x2a2a2a, 0x2a2a2a);
        this.gridHelper.position.y = -300;
        this.scene.add(this.gridHelper);
        
        // Create proximity rings
        this._createProximityRings();
      }
      
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
      
      updateCamera(position, lookAt) {
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
      }
      
      updateDetailLevel(detailLevel) {
        this.currentDetailLevel = detailLevel;
        
        // Adjust visual quality based on detail level
        this.renderer.shadowMap.enabled = detailLevel >= 4;
        this.postProcessingEnabled = detailLevel >= 4;
        
        // Update lighting intensity
        const core = this.nexusCore.core;
        if (core && core.visualParameters) {
          this.ambientLight.intensity = core.visualParameters.ambientLightIntensity;
          this.mainLight.intensity = core.visualParameters.directionalLightIntensity;
        }
        
        // Update materials
        this._updateMaterials();
      }
      
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
      
      updateConfig() {
        this.renderer.setSize(this.nexusCore.config.width, this.nexusCore.config.height);
        this.camera.aspect = this.nexusCore.config.width / this.nexusCore.config.height;
        this.camera.updateProjectionMatrix();
        
        this.updateDetailLevel(this.currentDetailLevel);
      }
      
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
        nodeGroup.position.set(node.position.x || node.x || 0, node.position.y || node.y || 0, node.position.z || node.z || 0);
        
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
        sprite.position.set(
          node.position.x || node.x || 0, 
          (node.position.y || node.y || 0) - (node.radius || 30) - 40, 
          node.position.z || node.z || 0
        );
        
        // Add to scene
        this.scene.add(sprite);
        
        return sprite;
      }
      
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
        points.push(new THREE.Vector3(
          sourceNode.position.x || sourceNode.x || 0, 
          sourceNode.position.y || sourceNode.y || 0, 
          sourceNode.position.z || sourceNode.z || 0
        ));
        points.push(new THREE.Vector3(
          targetNode.position.x || targetNode.x || 0, 
          targetNode.position.y || targetNode.y || 0, 
          targetNode.position.z || targetNode.z || 0
        ));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        
        // Add to scene
        this.scene.add(line);
        
        // Create weight indicator (circle with number)
        const weightIndicator = this._createWeightIndicator(
          ((sourceNode.position.x || sourceNode.x || 0) + (targetNode.position.x || targetNode.x || 0)) / 2,
          ((sourceNode.position.y || sourceNode.y || 0) + (targetNode.position.y || targetNode.y || 0)) / 2,
          weight
        );
        
        // Store reference
        this.edgeObjects.set(edge.id || `${edge.source}-${edge.target}`, {
          line: line,
          indicator: weightIndicator,
          source: edge.source,
          target: edge.target,
          weight: weight
        });
        
        return line;
      }
      
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
      
      updateNodeObject(nodeId, position, properties = {}) {
        const nodeObject = this.nodeObjects.get(nodeId);
        if (!nodeObject) return;
        
        // Update position
        nodeObject.group.position.set(position.x, position.y, position.z || 0);
        
        // Update node size if radius changed
        if (properties.radius && nodeObject.outer.geometry.parameters.radius !== properties.radius) {
          // Dispose old geometries
          nodeObject.outer.geometry.dispose();
          nodeObject.inner.geometry.dispose();
          
          // Create new geometries with updated radius
          const segments = Math.max(16, Math.floor(this.currentDetailLevel * 8));
          const newOuterGeometry = new THREE.SphereGeometry(properties.radius, segments, segments);
          const newInnerGeometry = new THREE.SphereGeometry(properties.radius * 0.9, segments, segments);
          
          // Update meshes
          nodeObject.outer.geometry = newOuterGeometry;
          nodeObject.inner.geometry = newInnerGeometry;
        }
        
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
      
      render() {
        // Standard rendering or post-processing
        this.renderer.render(this.scene, this.camera);
      }
      
      dispose() {
        // Dispose of Three.js resources
        this.renderer.dispose();
        
        // Dispose geometries and materials
        this.nodeObjects.forEach(obj => {
          obj.outer.geometry.dispose();
          obj.inner.geometry.dispose();
          if (obj.label && obj.label.material && obj.label.material.map) {
            obj.label.material.map.dispose();
          }
        });
        
        this.edgeObjects.forEach(obj => {
          obj.line.geometry.dispose();
          if (obj.indicator && obj.indicator.material && obj.indicator.material.map) {
            obj.indicator.material.map.dispose();
          }
        });
      }
    }
    
    // Define PerformanceUtils class
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
      
      beginFrame() {
        this.currentFrameStart = performance.now();
      }
      
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

        // Only run physics calculations every other frame
        if (this._frameCount % 2 !== 0) {
          this._frameCount++;
          // return;
        }
        // this._frameCount++;

        this.lastFrameTime = now;
      }
      
      getCurrentFps() {
        return this.fps;
      }
      
      getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        
        const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
        return sum / this.frameTimes.length;
      }
      
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
      
      getSystemCapabilities() {
        return this.capabilities;
      }
    }
    
    // Define DataUtils class as a static utility class
    class DataUtils {
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
      
      static _calculateRadius(tokens) {
        // Logarithmic scale to handle wide range of token counts
        return Math.max(20, Math.min(50, 15 + Math.log2(tokens) * 3));
      }
      
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
    }
    
    // Define Controls class
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
      
      // Other methods from Controls class would be implemented here
      // For brevity, we're only showing the core functionality
      
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


        if (this.navMode === 'select') {
    // Visual indicator of click
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.left = `${event.clientX}px`;
    indicator.style.top = `${event.clientY}px`;
    indicator.style.width = '20px';
    indicator.style.height = '20px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = 'rgba(0, 132, 255, 0.5)';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.pointerEvents = 'none';
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      document.body.removeChild(indicator);
    }, 300);
  }


      }
      
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
      
      _handleMouseMove(event) {
        // Always update current mouse position
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
        
        // Only handle movement if currently dragging
        if (!this.isDragging) return;
        
        // Calculate delta
        const deltaX = event.clientX - this.lastMousePosition.x;
        const deltaY = event.clientY - this.lastMousePosition.y;
        
        // Handle different navigation modes
        switch (this.navMode) {
          case 'pan':
            // Pan the camera
            this._handlePan(deltaX, deltaY);
            break;
            
          case 'orbit':
            // Orbit the camera
            this._handleOrbit(deltaX, deltaY);
            break;
            
          case 'group':
            // Handle group selection
            this._handleGroupSelection(deltaX, deltaY);
            break;
        }
        
        // Update last position
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
      }

      _handleMouseLeave(event) {
        // Reset dragging state when mouse leaves canvas
        this.isDragging = false;
        this.isRotating = false;
        
        // Reset cursor for pan mode
        if (this.navMode === 'pan') {
          this.canvas.style.cursor = 'grab';
        }
      }

      _handleWheel(event) {
        event.preventDefault();
        
        // Determine zoom direction and amount
        const zoomAmount = event.deltaY * 0.001 * this.zoomSensitivity;
        
        // Get current camera settings from core
        const core = this.nexusCore.core;
        if (!core) return;
        
        // Calculate new camera position
        const cameraPos = core.cameraPosition;
        const lookAtPoint = core.lookAtPoint;
        
        // Calculate direction vector from lookAt to camera
        const dirX = cameraPos.x - lookAtPoint.x;
        const dirY = cameraPos.y - lookAtPoint.y;
        const dirZ = cameraPos.z - lookAtPoint.z;
        
        // Current distance
        const distance = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
        
        // Limit how close/far we can zoom
        const newDistance = Math.max(100, Math.min(2000, distance * (1 + zoomAmount)));
        const distanceRatio = newDistance / distance;
        
        // Update camera position
        cameraPos.x = lookAtPoint.x + dirX * distanceRatio;
        cameraPos.y = lookAtPoint.y + dirY * distanceRatio;
        cameraPos.z = lookAtPoint.z + dirZ * distanceRatio;
        
        // Visual feedback for zoom
        this._showZoomIndicator(zoomAmount < 0);
      }

      
        
      
      _handlePan(deltaX, deltaY) {
        // Get current camera settings
        const core = this.nexusCore.core;
        if (!core) return;
        
        // Calculate right and up vectors in camera's frame
        const camera = this.nexusCore.renderer.camera;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        
        // Scale movements by sensitivity and camera distance
        const lookAtToCam = new THREE.Vector3(
          core.cameraPosition.x - core.lookAtPoint.x,
          core.cameraPosition.y - core.lookAtPoint.y,
          core.cameraPosition.z - core.lookAtPoint.z
        );
        const distance = lookAtToCam.length();
        const moveScale = distance * 0.001 * this.panSensitivity;
        
        // Calculate movement vectors
        const moveRight = right.multiplyScalar(-deltaX * moveScale);
        const moveUp = up.multiplyScalar(deltaY * moveScale);
        const moveVector = moveRight.add(moveUp);
        
        // Apply movement to both camera and lookAt point
        core.cameraPosition.x += moveVector.x;
        core.cameraPosition.y += moveVector.y;
        core.cameraPosition.z += moveVector.z;
        
        core.lookAtPoint.x += moveVector.x;
        core.lookAtPoint.y += moveVector.y;
        core.lookAtPoint.z += moveVector.z;
      }

      _handleOrbit(deltaX, deltaY) {
        // Get current camera settings
        const core = this.nexusCore.core;
        if (!core) return;
        
        // Calculate angles for horizontal and vertical rotation
        this.cameraAngleHorizontal += deltaX * this.rotateSensitivity;
        this.cameraAngleVertical += deltaY * this.rotateSensitivity;
        
        // Limit vertical angle to prevent flipping
        this.cameraAngleVertical = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleVertical));
        
        // Calculate camera position based on spherical coordinates
        const lookAtPoint = core.lookAtPoint;
        
        // Get current distance
        const currentPos = core.cameraPosition;
        const dx = currentPos.x - lookAtPoint.x;
        const dy = currentPos.y - lookAtPoint.y;
        const dz = currentPos.z - lookAtPoint.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Calculate new position
        core.cameraPosition.x = lookAtPoint.x + distance * Math.sin(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
        core.cameraPosition.y = lookAtPoint.y + distance * Math.sin(this.cameraAngleVertical);
        core.cameraPosition.z = lookAtPoint.z + distance * Math.cos(this.cameraAngleHorizontal) * Math.cos(this.cameraAngleVertical);
      }

      // Visual feedback when zooming
      _showZoomIndicator(zoomingIn) {
        // Create a temporary zoom indicator
        const indicator = document.createElement('div');
        indicator.style.position = 'absolute';
        indicator.style.left = '50%';
        indicator.style.top = '50%';
        indicator.style.transform = 'translate(-50%, -50%)';
        indicator.style.width = '80px';
        indicator.style.height = '80px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = 'rgba(0, 132, 255, 0.2)';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';
        indicator.style.pointerEvents = 'none';
        indicator.style.transition = 'opacity 0.3s ease-out';
        
        // Add icon
        const icon = document.createElement('div');
        icon.innerHTML = zoomingIn ? 
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0084ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>' :
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0084ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
        
        indicator.appendChild(icon);
        document.body.appendChild(indicator);
        
        // Remove after animation
        setTimeout(() => {
          indicator.style.opacity = '0';
          setTimeout(() => document.body.removeChild(indicator), 300);
        }, 300);
      }

      // Selection ripple effect
      _createSelectionRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '40px';
        ripple.style.height = '40px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid #0084ff';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.opacity = '1';
        ripple.style.pointerEvents = 'none';
        ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        
        document.body.appendChild(ripple);
        
        // Trigger animation
        setTimeout(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(1)';
          ripple.style.opacity = '0';
          
          // Remove after animation
          setTimeout(() => document.body.removeChild(ripple), 400);
        }, 10);
      }

      // Properly handle touch events
      _handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 1) {
          // Single touch = pan or select
          const touch = event.touches[0];
          this.lastMousePosition.x = touch.clientX;
          this.lastMousePosition.y = touch.clientY;
          this.isDragging = true;
          
          if (this.navMode === 'select') {
            this._selectNodeAtPosition(touch.clientX, touch.clientY);
          }
        } else if (event.touches.length === 2) {
          // Two fingers = pinch to zoom
          this.isPinching = true;
          this.lastPinchDistance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
          );
        }
      }

      _handleTouchMove(event) {
        event.preventDefault();
        
        if (this.isDragging && event.touches.length === 1) {
          // Handle single finger drag
          const touch = event.touches[0];
          const deltaX = touch.clientX - this.lastMousePosition.x;
          const deltaY = touch.clientY - this.lastMousePosition.y;
          
          if (this.navMode === 'pan') {
            this._handlePan(deltaX, deltaY);
          } else if (this.navMode === 'orbit') {
            this._handleOrbit(deltaX, deltaY);
          }
          
          this.lastMousePosition.x = touch.clientX;
          this.lastMousePosition.y = touch.clientY;
        } else if (this.isPinching && event.touches.length === 2) {
          // Handle pinch to zoom
          const currentDistance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
          );
          
          const pinchDelta = currentDistance - this.lastPinchDistance;
          // Convert pinch to wheel delta (negative = zoom in)
          const wheelDelta = -pinchDelta * 0.5;
          
          // Create synthetic wheel event
          const pinchCenterX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
          const pinchCenterY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
          
          const syntheticEvent = {
            preventDefault: () => {},
            clientX: pinchCenterX,
            clientY: pinchCenterY,
            deltaY: wheelDelta
          };
          
          this._handleWheel(syntheticEvent);
          
          this.lastPinchDistance = currentDistance;
        }
      }

      _handleTouchEnd(event) {
        event.preventDefault();
        
        this.isDragging = false;
        this.isPinching = false;
      }
 
      
      _handleKeyDown(event) {
        // Implementation details omitted for brevity
      }
      
      _selectNodeAtPosition(x, y) {
        // Convert screen coordinates to normalized device coordinates (NDC)
        // Get canvas bounds
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate normalized coordinates (-1 to 1)
        const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.nexusCore.renderer.camera);
        
        // Get all node objects for intersection testing
        const nodeObjects = [];
        this.nexusCore.graph.nodes.forEach(node => {
          const nodeObj = this.nexusCore.renderer.nodeObjects.get(node.id);
          if (nodeObj && nodeObj.outer) {
            nodeObjects.push({ id: node.id, object: nodeObj.outer });
          }
        });
        
        // Filter scene objects to only include nodes
        const targets = nodeObjects.map(item => item.object);
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(targets);
        
        if (intersects.length > 0) {
          // Find the node ID that was intersected
          const intersectedObject = intersects[0].object;
          const nodeInfo = nodeObjects.find(node => node.object === intersectedObject);
          
          if (nodeInfo) {
            // Select the node and signal the event
            this.nexusCore.selectNode(nodeInfo.id);
            
            // Create a ripple effect at click position
            this._createSelectionRipple(x, y);
            
            return nodeInfo.id;
          }
        }
        
        return null;
      }
      
      update() {
        // Handle continuous interactions or animations
      }
      
      updateConfig() {
        // Update sensitivity settings
        this.panSensitivity = this.nexusCore.config.panSensitivity || 1.0;
        this.rotateSensitivity = this.nexusCore.config.rotateSensitivity || 0.005;
        this.zoomSensitivity = this.nexusCore.config.zoomSensitivity || 0.1;
      }
      
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
    
    // Define Events class
    class Events {
      constructor(nexusCore) {
        this.nexusCore = nexusCore;
        this.listeners = new Map();
      }
      
      on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
          this.listeners.set(eventType, []);
        }
        
        this.listeners.get(eventType).push(callback);
        
        // Return function to remove listener
        return () => {
          this.off(eventType, callback);
        };
      }
      
      off(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        const index = callbacks.indexOf(callback);
        
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
      
      dispatch(eventType, data) {
        if (!this.listeners.has(eventType)) return;
        
        // Call all registered callbacks
        const callbacks = this.listeners.get(eventType);
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${eventType}:`, error);
          }
        });
        
        // Also dispatch to parent application if React component
        this._dispatchToReact(eventType, data);
      }
      
      _dispatchToReact(eventType, data) {
        if (this.nexusCore.canvas && this.nexusCore.canvas.dispatchEvent) {
          const customEvent = new CustomEvent(`nexuscore:${eventType}`, {
            bubbles: true,
            detail: data
          });
          
          this.nexusCore.canvas.dispatchEvent(customEvent);
        }
      }
      
      dispose() {
        this.listeners.clear();
      }
    }
    
    // Define the main NexusSpatialCore class that ties everything together
    class NexusSpatialCore {
      constructor(canvas, options = {}) {
        // Default configuration with performance scaling factor
        this.config = {
          width: options.width || 800,
          height: options.height || 600,
          // performanceMode: 'performance', // Change from 'balanced' for better performance
          performanceMode: options.performanceMode || 'balanced',
          adaptiveDetail: options.adaptiveDetail !== false,
          maxNodes: options.maxNodes || 1000,
          maxEdges: options.maxEdges || 2000,
          fpsTarget: options.fpsTarget || 60,
          ...options
        };
        

        this.scaleFactor = 1.0;

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

      setScale(scale) {
        // Limit scale to reasonable bounds (0.25 to 4.0)
        this.scaleFactor = Math.max(0.25, Math.min(4.0, scale));
        
        // Update camera distance based on scale
        const cameraPos = this.core.cameraPosition;
        const lookAtPoint = this.core.lookAtPoint;
        
        // Calculate direction vector from lookAt to camera
        const dirX = cameraPos.x - lookAtPoint.x;
        const dirY = cameraPos.y - lookAtPoint.y;
        const dirZ = cameraPos.z - lookAtPoint.z;
        
        // Scale the distance (inverse relationship - smaller scale = camera moves further away)
        const distanceScale = 1 / this.scaleFactor;
        
        // Update camera position
        cameraPos.x = lookAtPoint.x + dirX * distanceScale;
        cameraPos.y = lookAtPoint.y + dirY * distanceScale;
        cameraPos.z = lookAtPoint.z + dirZ * distanceScale;
        
        // Update node and edge sizes
        if (this.graph) {
          this.graph.updateNodeSizes(this.scaleFactor);
        }
        
        // Dispatch event so UI can update
        this.events.dispatch('scaleChanged', { scale: this.scaleFactor });
      }

      
      _calculatePerformanceScaling() {
        const modes = {
          'performance': 0.5,   // Lower detail, higher performance
          'balanced': 1.0,      // Standard detail level
          'quality': 1.5        // Higher detail, lower performance
        };
        
        return modes[this.config.performanceMode] || 1.0;
      }
      
      setData(data) {
        this.graph.setData(data.nodes || [], data.connections || []);
        this.physics.resetSimulation();
        this.core.updateLayout();
      }
      
      updateConfig(newConfig) {
        this.config = {...this.config, ...newConfig};
        this.performanceScaling = this._calculatePerformanceScaling();
        
        // Update subsystems with new configuration
        this.core.updateConfig();
        this.renderer.updateConfig();
        this.physics.updateConfig();
        this.controls.updateConfig();
      }
      
      _startRenderLoop() {
  // Define frame counter to ensure physics updates keep running
  this._frameCount = 0;
  
  const animate = () => {
    // Add error handling around the animation frame
    try {
      this._frameCount++;
      
      if (this.perfMonitor) this.perfMonitor.beginFrame();
      
      // Always update physics - don't limit by frame count
      if (this.physics) this.physics.update();
      
      if (this.core) this.core.update();
      if (this.renderer) this.renderer.render();
      if (this.controls) this.controls.update();
      
      if (this.perfMonitor) this.perfMonitor.endFrame();
      
      // Adapt detail level if needed
      if (this.config.adaptiveDetail) {
        this._adaptDetailLevel();
      }
      
      // Add small random forces occasionally to prevent stagnation
      if (this._frameCount % 180 === 0) {
        this._addRandomForces();
      }
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
    
    this.animationFrame = requestAnimationFrame(animate);
  };
  
  this.animationFrame = requestAnimationFrame(animate);
}
    

// Add method to introduce small random forces to keep simulation lively
_addRandomForces() {
  if (!this.graph) return;
  
  const nodes = this.graph.getAllNodes();
  nodes.forEach(node => {
    // Add small random velocity
    node.velocity.x += (Math.random() - 0.5) * 0.5;
    node.velocity.y += (Math.random() - 0.5) * 0.5;
    node.velocity.z += (Math.random() - 0.5) * 0.3;
  });
}


      _adaptDetailLevel() {
        if (!this.perfMonitor || !this.core) return; // Safety check
        
        const fps = this.perfMonitor.getCurrentFps();
        const targetFps = this.config.fpsTarget;
        
        // Adjust detail level if framerate is too low
        if (fps < targetFps * 0.8 && this.performanceScaling > 0.3) {
          this.performanceScaling = Math.max(0.3, this.performanceScaling - 0.05);
          if (this.core && typeof this.core.updateDetailLevel === 'function') {
            this.core.updateDetailLevel();
          }
        } 
        // Increase detail if we have headroom
        else if (fps > targetFps * 1.2 && this.performanceScaling < 2.0) {
          this.performanceScaling = Math.min(2.0, this.performanceScaling + 0.05);
          if (this.core && typeof this.core.updateDetailLevel === 'function') {
            this.core.updateDetailLevel();
          }
        }
      }
      
      focusNode(nodeId) {
        const node = this.graph.getNode(nodeId);
        if (node) {
          this.core.focusOn(node);
        }
      }
      
      highlightConnections(nodeId) {
        this.graph.highlightConnections(nodeId);
      }
      
      selectNode(nodeId) {
        this.graph.selectNode(nodeId);
        this.events.dispatch('nodeSelected', { nodeId });
      }
      
      dispose() {
        cancelAnimationFrame(this.animationFrame);
        this.renderer.dispose();
        this.controls.dispose();
        this.events.dispose();
      }
    }
    
    // Create the NexusSpatialCore instance
    nexusCoreRef.current = new NexusSpatialCore(canvasRef.current, {
      width: width,
      height: height,
      performanceMode: 'balanced',
      data: {
        nodes: SAMPLE_NODES,
        connections: SAMPLE_CONNECTIONS
      }
    });

    window.nexusCoreRef = nexusCoreRef;
    
    // Make the navigation mode accessible globally
    window.setNavMode = (mode) => {
      if (nexusCoreRef.current && nexusCoreRef.current.controls) {
        nexusCoreRef.current.controls.setNavMode(mode);
      }
    };
  };
  
  // Update nexusCore when navMode changes
  const setNavMode = useCallback((mode) => {
    if (nexusCoreRef.current && nexusCoreRef.current.controls) {
      nexusCoreRef.current.controls.setNavMode(mode);
    }
  }, []);
  
  // Expose setNavMode for parent component to use
  useEffect(() => {
    // This could be called from the parent when navigation buttons are clicked
    if (window.setNavMode === undefined) {
      window.setNavMode = setNavMode;
    }
    
    return () => {
      delete window.setNavMode;
    };
  }, [setNavMode]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="cursor-grab"
    />
  );
};
    // Modified ContextNexusSpatial Component with integrated SpatialCanvas
    const ContextNexusSpatial = () => {
      // States
      const [viewMode, setViewMode] = useState('3d');
      const [navMode, setNavMode] = useState('pan');
      const [sidebarLeft, setSidebarLeft] = useState(true);
      const [sidebarRight, setSidebarRight] = useState(true);
      const [activeCategory, setActiveCategory] = useState('core');
      const [searchQuery, setSearchQuery] = useState('');
      const [selectedNodeId, setSelectedNodeId] = useState('transformer');
      const [showAIPanel, setShowAIPanel] = useState(true);
      const [showShortcuts, setShowShortcuts] = useState(true);
      const [canvasWidth, setCanvasWidth] = useState(810);
      const [canvasHeight, setCanvasHeight] = useState(720);
      const [scale, setScale] = useState(1.0); // Default scale is 1.0
      
      const mainContainerRef = useRef(null);
      
      // Update canvas dimensions on sidebar toggle
      useEffect(() => {
        if (mainContainerRef.current) {
          setCanvasWidth(mainContainerRef.current.offsetWidth);
          setCanvasHeight(mainContainerRef.current.offsetHeight);
        }
      }, [sidebarLeft, sidebarRight]);

      useEffect(() => {
        if (window.nexusCoreRef && window.nexusCoreRef.current) {
          window.nexusCoreRef.current.setScale(scale);
        }
      }, [scale]);

      useEffect(() => {
        if (window.nexusCoreRef && window.nexusCoreRef.current) {
          initializeControls();
        }
      }, [scale, viewMode]);

      
      
      // Find selected node
      const selectedNode = SAMPLE_NODES.find(node => node.id === selectedNodeId) || SAMPLE_NODES[0];
      
      // Filter connections for selected node
      const selectedNodeConnections = SAMPLE_CONNECTIONS.filter(
        conn => conn.source === selectedNodeId || conn.target === selectedNodeId
      );
      
      // Get connected node ids
      const connectedNodeIds = selectedNodeConnections.map(conn => 
        conn.source === selectedNodeId ? conn.target : conn.source
      );
      
      // Get connected nodes
      const connectedNodes = SAMPLE_NODES.filter(node => 
        connectedNodeIds.includes(node.id)
      );
      
      // Calculate token usage
      const totalTokens = 12000; // Max tokens
      const usedTokens = 8560; // Current usage
      const tokenPercentage = (usedTokens / totalTokens) * 100;
      
      // Handle navigation mode changes
      const handleNavModeChange = (mode) => {
        setNavMode(mode);
        if (window.setNavMode) {
          window.setNavMode(mode);
        }
      };
      
      return (
        <div className="h-screen flex flex-col">
          {/* Header Bar */}
          <header className="bg-[#2d2d2d] h-10 flex items-center px-5">
            <div className="font-bold text-gray-200">ContextNexus Spatial Canvas</div>
            
            <div className="mx-auto bg-[#3d3d3d] rounded px-4 py-1 flex items-center">
              <span className="text-gray-200">Project: Deep Learning Architecture Design</span>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-1 rounded-full text-sm ${viewMode === '2d' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => setViewMode('2d')}
              >
                2D
              </button>
              <button 
                className={`px-4 py-1 rounded-full text-sm ${viewMode === '3d' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => setViewMode('3d')}
              >
                3D
              </button>
              <button 
                className={`px-4 py-1 rounded-full text-sm ${viewMode === 'ar' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => setViewMode('ar')}
              >
                AR Mode
              </button>
            </div>
          </header>
          
          {/* Control Bar */}
          <div className="bg-[#2d2d2d] h-10 flex items-center justify-between px-5">
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-1 rounded-full text-xs ${navMode === 'pan' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => handleNavModeChange('pan')}
              >
                Pan
              </button>
              <button 
                className={`px-4 py-1 rounded-full text-xs ${navMode === 'orbit' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => handleNavModeChange('orbit')}
              >
                Orbit
              </button>
              <button 
                className={`px-4 py-1 rounded-full text-xs ${navMode === 'select' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => handleNavModeChange('select')}
              >
                Select
              </button>
              <button 
                className={`px-4 py-1 rounded-full text-xs ${navMode === 'group' ? 'bg-[#0084ff] text-white' : 'bg-[#3d3d3d] text-gray-400'}`}
                onClick={() => handleNavModeChange('group')}
              >
                Group
              </button>
            </div>
            
            <div className="bg-[#3d3d3d] rounded-full px-4 py-1 flex items-center">
              <span className="text-gray-200 text-xs">Layers:</span>
              <span className="ml-2 text-[#0084ff] text-xs">All Active</span>
            </div>
            
            <div className="bg-[#333] rounded-full px-1 py-1 flex items-center">
              <div className="w-40 h-5 bg-[#444] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0066cc] rounded-full" 
                  style={{ width: `${tokenPercentage}%` }}
                ></div>
              </div>
              <span className="text-white text-xs ml-2">8,560 / 12,000 tokens</span>
              <span className="text-[#0084ff] text-xs ml-2">71.3%</span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Concept Library */}
            {sidebarLeft && (
              <aside className="w-[200px] bg-[#2a2a2a] flex flex-col">
                <div className="bg-[#333] p-4 flex justify-between items-center">
                  <h2 className="font-bold text-sm">Concept Library</h2>
                  <button 
                    className="text-gray-400 hover:text-white"
                    onClick={() => setSidebarLeft(false)}
                  >
                    <Icon.Close />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search concepts..."
                      className="w-full bg-[#444] border-none rounded px-3 py-1.5 pl-8 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-2 top-2 text-gray-400">
                      <Icon.Search />
                    </div>
                  </div>
                  
                  {CONCEPT_CATEGORIES.map(category => (
                    <div key={category.id} className="mb-4">
                      <div 
                        className="bg-[#333] py-1.5 px-2 cursor-pointer" 
                        onClick={() => setActiveCategory(category.id === activeCategory ? null : category.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">{category.name}</span>
                          <Icon.ChevronDown />
                        </div>
                      </div>
                      
                      {(activeCategory === category.id || activeCategory === 'all') && (
                        <div className="mt-2 space-y-2">
                          {category.concepts.map(concept => (
                            <div 
                              key={concept.id} 
                              className="bg-[#3d3d3d] rounded p-2 cursor-pointer hover:bg-[#444]"
                              onClick={() => setSelectedNodeId(concept.id)}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs">{concept.name}</span>
                                <span className="text-[#0084ff] text-xs">{concept.tokens} tk</span>
                              </div>
                              <p className="text-gray-400 text-xs">{concept.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            )}
            
            {/* Main Canvas */}
            <main 
              ref={mainContainerRef} 
              className="flex-1 bg-[#1e1e1e] relative overflow-hidden"
            >
              {!sidebarLeft && (
                <button 
                  className="absolute left-2 top-2 z-10 text-gray-400 hover:text-white bg-[#333] rounded-full w-8 h-8 flex items-center justify-center"
                  onClick={() => setSidebarLeft(true)}
                >
                  <Icon.ChevronDown className="transform rotate-90" />
                </button>
              )}
              
              {!sidebarRight && (
                <button 
                  className="absolute right-2 top-2 z-10 text-gray-400 hover:text-white bg-[#333] rounded-full w-8 h-8 flex items-center justify-center"
                  onClick={() => setSidebarRight(true)}
                >
                  <Icon.ChevronDown className="transform -rotate-90" />
                </button>
              )}
              
              <div className="absolute left-4 top-4 z-10">
                <h2 className="font-bold text-base text-gray-200">Transformer Architecture Canvas</h2>
                <p className="text-gray-400 text-xs">Spatial arrangement: closer items have stronger relationships</p>
              </div>
              
              {/* Canvas */}
              <div id="canvasContainer">
                <SpatialCanvas 
                  width={canvasWidth} 
                  height={canvasHeight} 
                />
              </div>
              
              {/* AI Assistant Panel */}
              {showAIPanel && (
                <div className="absolute left-[300px] bottom-[150px] w-[250px] bg-[#333] bg-opacity-90 rounded-xl overflow-hidden">
                  <div className="bg-[#38a169] px-4 py-1.5 flex justify-between items-center">
                    <div className="font-bold text-sm flex items-center">
                      <Icon.Bot className="mr-1" />
                      Context AI Assistant
                    </div>
                    <button 
                      className="text-gray-200 hover:text-white"
                      onClick={() => setShowAIPanel(false)}
                    >
                      <Icon.Close />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-xs mb-2">I notice you're building a Transformer model.</p>
                    <p className="text-xs mb-1">Suggested additions:</p>
                    
                    <div className="space-y-2">
                      <div className="bg-[#1e293b] rounded p-1.5 text-xs text-[#0084ff] cursor-pointer hover:bg-[#2d3748]">
                        + Add Word Embeddings layer
                      </div>
                      <div className="bg-[#1e293b] rounded p-1.5 text-xs text-[#0084ff] cursor-pointer hover:bg-[#2d3748]">
                        + Include "Attention Is All You Need" paper
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Keyboard Shortcuts Panel */}
              {showShortcuts && (
                <div className="absolute right-[20px] top-[130px] w-[190px] bg-[#333] bg-opacity-70 rounded-xl p-4">
                  <div className="font-bold text-sm mb-3">Spatial Shortcuts</div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Space: Focus on Node</div>
                    <div className="text-xs text-gray-400">Alt+Drag: Create Connection</div>
                    <div className="text-xs text-gray-400">Shift+Scroll: Zoom In/Out</div>
                    <div className="text-xs text-gray-400">Middle Click: Orbit View</div>
                    <div className="text-xs text-gray-400">Ctrl+G: Group Selected</div>
                    <div className="text-xs text-gray-400">F: Find Path Between Nodes</div>
                  </div>
                  
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={() => setShowShortcuts(false)}
                  >
                    <Icon.Close />
                  </button>
                </div>
              )}
                            
              {/* Scale Controls */}
              <div className="absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-[#333] bg-opacity-90 rounded-xl p-3 flex flex-col items-center">
                <div className="text-xs mb-2 flex items-center">
                  <Icon.ZoomOut className="mr-2" />
                  <span className="mr-1">Scale:</span>
                  <span className="text-[#0084ff]">{Math.round(scale * 100)}%</span>
                  <Icon.ZoomIn className="ml-2" />
                </div>
                
                <div className="flex items-center w-full">
                  <input
                    type="range"
                    className="custom-range flex-1 mx-2"
                    min="0.25" 
                    max="4" 
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <button 
                    className="bg-[#444] text-gray-200 rounded px-2 py-1 text-xs hover:bg-[#555]"
                    onClick={() => setScale(0.5)}
                  >
                    Small
                  </button>
                  <button 
                    className="bg-[#444] text-gray-200 rounded px-2 py-1 text-xs hover:bg-[#555]"
                    onClick={() => setScale(1.0)}
                  >
                    Medium
                  </button>
                  <button 
                    className="bg-[#444] text-gray-200 rounded px-2 py-1 text-xs hover:bg-[#555]"
                    onClick={() => setScale(2.0)}
                  >
                    Large
                  </button>
                  <button 
                    className="bg-[#444] text-gray-200 rounded px-2 py-1 text-xs hover:bg-[#555]"
                    onClick={() => setScale(3.5)}
                  >
                    Huge
                  </button>
                </div>
              </div>

              <div className="absolute right-5 top-16 bg-[#333] bg-opacity-70 rounded p-2 text-xs">
                <div className="text-gray-300 mb-1">Mode: <span className="text-[#0084ff]">{navMode}</span></div>
                <div className="text-gray-300 mb-1">Scale: <span className="text-[#0084ff]">{Math.round(scale * 100)}%</span></div>
                {navMode === 'pan' && <div className="text-gray-400">Drag to pan</div>}
                {navMode === 'orbit' && <div className="text-gray-400">Drag to orbit</div>}
                {navMode === 'select' && <div className="text-gray-400">Click to select</div>}
              </div>

              {/* Context Building Controls */}
              <div className="absolute right-[220px] bottom-[90px] w-[200px] bg-[#0066cc] bg-opacity-90 rounded-xl p-4">
                <div className="font-bold text-sm mb-2">Context Building</div>
                
                <div className="space-y-1 mb-3">
                  <div className="text-xs">Selected: 6 active nodes</div>
                  <div className="text-xs">Token allocation: 8,560 / 12,000</div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="bg-[#1e293b] text-[#0084ff] rounded px-3 py-1 text-sm flex-1 hover:bg-[#2d3748]">
                    Apply
                  </button>
                  <button className="bg-[#1e293b] text-[#0084ff] rounded px-3 py-1 text-sm flex-1 hover:bg-[#2d3748]">
                    Reset
                  </button>
                </div>
              </div>
            </main>
            
            {/* Right Sidebar - Node Inspector */}
            {sidebarRight && (
              <aside className="w-[190px] bg-[#2a2a2a] flex flex-col">
                <div className="bg-[#333] p-4 flex justify-between items-center">
                  <h2 className="font-bold text-sm">Node Inspector</h2>
                  <button 
                    className="text-gray-400 hover:text-white"
                    onClick={() => setSidebarRight(false)}
                  >
                    <Icon.Close />
                  </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                  {/* Selected Node Info */}
                  <div className="bg-[#1e293b] rounded p-3 mb-4">
                    <h3 className="font-bold text-sm mb-1">{selectedNode.name} {selectedNode.subtext}</h3>
                    <p className="text-gray-400 text-xs mb-3">Core concept node</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token Count:</span>
                        <span className="text-[#0084ff]">{selectedNode.tokens}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Connections:</span>
                        <span>{selectedNodeConnections.length} direct, {connectedNodeIds.length} indirect</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Importance:</span>
                          <span>{Math.round(selectedNode.importance * 100)}%</span>
                        </div>
                        <div className="w-full bg-[#333] rounded-full h-1.5">
                          <div 
                            className="bg-[#0084ff] h-1.5 rounded-full"
                            style={{ width: `${selectedNode.importance * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Source:</span>
                        <span>Research Papers</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Modified:</span>
                        <span>10 min ago</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Node Controls */}
                  <div className="flex space-x-2 mb-4">
                    <button className="bg-[#0084ff] text-white rounded px-3 py-1 text-xs flex-1">
                      Edit
                    </button>
                    <button className="bg-[#333] text-gray-200 rounded px-3 py-1 text-xs flex-1">
                      Merge
                    </button>
                  </div>
                  
                  {/* Relationships Section */}
                  <div className="bg-[#333] px-4 py-2 mb-4">
                    <h3 className="font-bold text-sm">Relationships</h3>
                  </div>
                  
                  {connectedNodes.map((node, index) => {
                    const connection = selectedNodeConnections.find(conn => 
                      conn.source === node.id || conn.target === node.id
                    );
                    const weight = connection ? connection.weight : 0;
                    
                    return (
                      <div key={node.id} className="bg-[#1e293b] rounded p-2 mb-2">
                        <div className="text-xs mb-1">{node.name}</div>
                        <div className="w-full bg-[#333] rounded-full h-1.5 mb-1">
                          <div 
                            className="bg-[#0084ff] h-1.5 rounded-full"
                            style={{ width: `${weight * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-gray-400">Connected concept</span>
                          <span>{Math.round(weight * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Spatial Navigation Section */}
                  <div className="bg-[#333] px-4 py-2 mb-4">
                    <h3 className="font-bold text-sm">Spatial Navigation</h3>
                  </div>
                  
                  {/* Mini-map View */}
                  <div className="bg-[#1e293b] rounded p-2 h-[120px] relative">
                    {/* Central node */}
                    <div 
                      className="absolute w-4 h-4 rounded-full bg-[#0066cc]"
                      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                    
                    {/* Connected nodes (simplified) */}
                    <div 
                      className="absolute w-3 h-3 rounded-full bg-[#0084ff]"
                      style={{ left: '60%', top: '30%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                    <div 
                      className="absolute w-3 h-3 rounded-full bg-[#0084ff]"
                      style={{ left: '40%', top: '30%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                    <div 
                      className="absolute w-3 h-3 rounded-full bg-[#5ebaff]"
                      style={{ left: '30%', top: '60%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                    <div 
                      className="absolute w-3 h-3 rounded-full bg-[#5ebaff]"
                      style={{ left: '70%', top: '60%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                    
                    {/* Viewport indicator */}
                    <div 
                      className="absolute border border-[#0084ff] w-16 h-16"
                      style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)' }}
                    ></div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      );
    };

    // Render the application
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ContextNexusSpatial />
      </React.StrictMode>
    );
  </script>
</body>

</html>