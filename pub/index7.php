<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContextNexus Spatial Canvas</title>
  
  <!-- React and ReactDOM CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- D3.js for visualization -->
  <script src="https://d3js.org/d3.v7.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }
    
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      overflow: hidden;
    }
    
    .app-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* Header Styles */
    .header {
      background-color: #2d2d2d;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 20px;
    }
    
    .header-title {
      font-size: 16px;
      font-weight: bold;
      margin-right: 20px;
    }
    
    .project-title {
      background-color: #3d3d3d;
      border-radius: 5px;
      padding: 5px 15px;
      font-size: 14px;
      margin-right: auto;
    }
    
    .view-controls {
      display: flex;
      gap: 10px;
    }
    
    .view-button {
      background-color: #3d3d3d;
      border: none;
      border-radius: 15px;
      color: #aaa;
      padding: 5px 15px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .view-button.active {
      background-color: #0084ff;
      color: white;
    }
    
    /* Navigation Controls */
    .nav-controls {
      background-color: #2d2d2d;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 10px;
    }
    
    .nav-button {
      background-color: #3d3d3d;
      border: none;
      border-radius: 15px;
      color: #aaa;
      padding: 5px 15px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .nav-button.active {
      background-color: #0084ff;
      color: white;
    }
    
    .layer-controls {
      background-color: #3d3d3d;
      border-radius: 15px;
      padding: 5px 15px;
      font-size: 12px;
      margin-left: 20px;
    }
    
    .layer-controls span {
      color: #0084ff;
      margin-left: 5px;
    }
    
    .token-display {
      background-color: #333;
      border-radius: 15px;
      padding: 5px 15px;
      font-size: 12px;
      margin-left: auto;
      display: flex;
      align-items: center;
    }
    
    .token-progress {
      background-color: #444;
      border-radius: 10px;
      width: 160px;
      height: 20px;
      overflow: hidden;
      margin-right: 10px;
    }
    
    .token-progress-bar {
      background-color: #0066cc;
      height: 100%;
      width: 76%;
    }
    
    .token-percentage {
      color: #0084ff;
      margin-left: 10px;
    }
    
    /* Main Content Area */
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    /* Left Sidebar */
    .left-sidebar {
      width: 200px;
      background-color: #2a2a2a;
      overflow-y: auto;
    }
    
    .sidebar-header {
      background-color: #333;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
    }
    
    .search-box {
      margin: 10px 20px;
      background-color: #444;
      border-radius: 5px;
      padding: 8px;
      color: #aaa;
      font-size: 12px;
    }
    
    .category-header {
      background-color: #333;
      padding: 5px 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .concept-item {
      margin: 10px;
      background-color: #3d3d3d;
      border-radius: 5px;
      padding: 10px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .concept-item:hover {
      background-color: #444;
    }
    
    .concept-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    
    .concept-description {
      font-size: 10px;
      color: #aaa;
    }
    
    .token-count {
      font-size: 10px;
      color: #0084ff;
    }
    
    /* Canvas Area */
    .canvas-area {
      flex: 1;
      background-color: #1e1e1e;
      position: relative;
      overflow: hidden;
    }
    
    .canvas-title {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
    }
    
    .canvas-title h2 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .canvas-title p {
      font-size: 12px;
      color: #aaa;
    }
    
    /* Right Sidebar */
    .right-sidebar {
      width: 190px;
      background-color: #2a2a2a;
      overflow-y: auto;
    }
    
    .node-inspector {
      margin: 10px;
    }
    
    .node-info {
      background-color: #1e293b;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 10px;
    }
    
    .node-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .node-type {
      font-size: 10px;
      color: #aaa;
      margin-bottom: 10px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .info-label {
      color: #aaa;
    }
    
    .info-value {
      color: #e0e0e0;
    }
    
    .info-value.blue {
      color: #0084ff;
    }
    
    .progress-bar {
      background-color: #333;
      border-radius: 5px;
      height: 10px;
      width: 70px;
      overflow: hidden;
    }
    
    .progress-fill {
      background-color: #0084ff;
      height: 100%;
    }
    
    .button-row {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    .action-button {
      background-color: #0084ff;
      border: none;
      border-radius: 5px;
      color: white;
      padding: 5px 10px;
      flex: 1;
      cursor: pointer;
      font-size: 12px;
      text-align: center;
    }
    
    .action-button.secondary {
      background-color: #333;
      color: #e0e0e0;
    }
    
    .section-header {
      background-color: #333;
      padding: 10px 20px;
      font-size: 12px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .relationship-item {
      background-color: #1e293b;
      border-radius: 5px;
      padding: 10px;
      margin: 10px;
      font-size: 10px;
    }
    
    .relationship-title {
      font-size: 10px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .relationship-type {
      font-size: 8px;
      color: #aaa;
    }
    
    /* Mini-map */
    .mini-map {
      background-color: #1e293b;
      border-radius: 5px;
      margin: 10px;
      height: 120px;
      position: relative;
    }
    
    /* Floating panels */
    .floating-panel {
      position: absolute;
      background-color: #333;
      border-radius: 10px;
      opacity: 0.9;
      z-index: 100;
    }
    
    .ai-assistant {
      bottom: 20px;
      left: 100px;
      width: 250px;
    }
    
    .ai-header {
      background-color: #38a169;
      color: white;
      border-radius: 10px 10px 0 0;
      padding: 5px 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .ai-content {
      padding: 10px 20px;
    }
    
    .ai-message {
      font-size: 10px;
      margin-bottom: 10px;
    }
    
    .suggestion-item {
      background-color: #1e293b;
      border-radius: 5px;
      padding: 5px 10px;
      margin: 5px 0;
      font-size: 10px;
      color: #0084ff;
      cursor: pointer;
    }
    
    .shortcuts-panel {
      top: 50px;
      right: 220px;
      width: 190px;
      padding: 10px 20px;
    }
    
    .shortcuts-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .shortcut-item {
      font-size: 10px;
      color: #aaa;
      margin-bottom: 5px;
    }
    
    .context-building {
      bottom: 20px;
      right: 340px;
      width: 200px;
      background-color: #0066cc;
      padding: 10px 20px;
      border-radius: 10px;
    }
    
    .context-building-title {
      font-size: 12px;
      font-weight: bold;
      color: white;
      margin-bottom: 10px;
    }
    
    .context-building-info {
      font-size: 10px;
      color: white;
      margin-bottom: 5px;
    }
    
    .context-building-buttons {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    .context-button {
      background-color: #1e293b;
      border: none;
      border-radius: 5px;
      color: #0084ff;
      padding: 5px 10px;
      flex: 1;
      cursor: pointer;
      font-size: 12px;
      text-align: center;
    }
    
    /* D3 Visualization Styles */
    .node {
      cursor: pointer;
    }
    
    .node:hover {
      opacity: 0.8;
    }
    
    .node-outer {
      stroke-width: 2px;
    }
    
    .node-inner {
      opacity: 0.8;
    }
    
    .node-text {
      text-anchor: middle;
      pointer-events: none;
      font-family: Arial, sans-serif;
    }
    
    .node-label {
      fill: white;
      font-weight: bold;
      font-size: 12px;
    }
    
    .node-sublabel {
      fill: #e0e0e0;
      font-size: 10px;
    }
    
    .node-tokens {
      fill: #0084ff;
      font-size: 10px;
    }
    
    .link {
      pointer-events: none;
    }
    
    .link-weight {
      fill: #2a2a2a;
      stroke: #0084ff;
      stroke-width: 1px;
    }
    
    .link-weight-text {
      fill: #0084ff;
      text-anchor: middle;
      font-size: 10px;
      pointer-events: none;
    }
    
    .proximity-ring {
      stroke: #0066cc;
      fill: none;
      pointer-events: none;
    }
    
    .drag-node {
      stroke-dasharray: 5,3;
    }
    
    .drag-link {
      stroke-dasharray: 5,3;
      pointer-events: none;
    }
    
    .suggestion-node {
      stroke-dasharray: 4,2;
    }
    
    .viewport-indicator {
      stroke: #0084ff;
      stroke-width: 1px;
      fill: none;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // --------------------------
    // Destructure React hooks
    // --------------------------
    const { useState, useEffect, useRef } = React;
    
    // --------------------------
    // Application Data
    // --------------------------
    
    // Concept library data
    const conceptLibraryData = {
      coreConcepts: [
        { id: "neural-networks", title: "Neural Network Types", description: "CNN, RNN, Transformer...", tokens: 980 },
        { id: "activation-functions", title: "Activation Functions", description: "ReLU, Sigmoid, Tanh...", tokens: 720 },
        { id: "loss-functions", title: "Loss Functions", description: "Cross Entropy, MSE...", tokens: 850 }
      ],
      implementations: [
        { id: "tensorflow", title: "TensorFlow Code", description: "Model implementation...", tokens: 1240 },
        { id: "pytorch", title: "PyTorch Examples", description: "Training loops, modules...", tokens: 1450 }
      ],
      researchPapers: [
        { id: "attention", title: "Attention Mechanisms", description: "Self-attention, multi-head...", tokens: 2100 },
        { id: "architectures", title: "Model Architectures", description: "BERT, GPT, ResNet...", tokens: 1820 }
      ]
    };
    
    // Initial graph data
    const initialNodeData = [
      { 
        id: "transformer", 
        type: "core", 
        x: 600, 
        y: 350, 
        radius: 50, 
        color: "#0066cc", 
        innerColor: "#1e293b", 
        label: "Transformer", 
        sublabel: "Architecture", 
        tokens: 1540,
        importance: 0.9,
        source: "Research Papers",
        lastModified: "10 min ago"
      },
      { 
        id: "self-attention", 
        type: "level1", 
        x: 700, 
        y: 250, 
        radius: 40, 
        color: "#0084ff", 
        innerColor: "#1e293b", 
        label: "Self-Attention", 
        sublabel: "Mechanism" 
      },
      { 
        id: "feed-forward", 
        type: "level1", 
        x: 500, 
        y: 250, 
        radius: 40, 
        color: "#0084ff", 
        innerColor: "#1e293b", 
        label: "Feed", 
        sublabel: "Forward" 
      },
      { 
        id: "layer-norm", 
        type: "level1", 
        x: 600, 
        y: 180, 
        radius: 35, 
        color: "#29a3ff", 
        innerColor: "#1e293b", 
        label: "Layer", 
        sublabel: "Normalization" 
      },
      { 
        id: "encoder", 
        type: "level2", 
        x: 450, 
        y: 380, 
        radius: 40, 
        color: "#5ebaff", 
        innerColor: "#1e293b", 
        label: "Encoder", 
        sublabel: "Block" 
      },
      { 
        id: "decoder", 
        type: "level2", 
        x: 750, 
        y: 380, 
        radius: 40, 
        color: "#5ebaff", 
        innerColor: "#1e293b", 
        label: "Decoder", 
        sublabel: "Block" 
      },
      { 
        id: "multi-head", 
        type: "level2", 
        x: 800, 
        y: 280, 
        radius: 35, 
        color: "#5ebaff", 
        innerColor: "#1e293b", 
        label: "Multi-Head", 
        sublabel: "Attention" 
      },
      { 
        id: "positional", 
        type: "level2", 
        x: 480, 
        y: 450, 
        radius: 35, 
        color: "#5ebaff", 
        innerColor: "#1e293b", 
        label: "Positional", 
        sublabel: "Encoding" 
      },
      { 
        id: "tensorflow-impl", 
        type: "level3", 
        x: 685, 
        y: 475, 
        radius: 25, 
        shape: "rect", 
        width: 70, 
        height: 50, 
        color: "#805ad5", 
        innerColor: "#1e293b", 
        label: "TensorFlow", 
        sublabel: "Implementation" 
      },
      { 
        id: "pytorch-impl", 
        type: "level3", 
        x: 765, 
        y: 475, 
        radius: 25, 
        shape: "rect", 
        width: 70, 
        height: 50, 
        color: "#805ad5", 
        innerColor: "#1e293b", 
        label: "PyTorch", 
        sublabel: "Implementation" 
      },
      { 
        id: "code-snippet", 
        type: "level3", 
        x: 440, 
        y: 350, 
        radius: 25, 
        shape: "rect", 
        width: 80, 
        height: 60, 
        color: "#805ad5", 
        innerColor: "#1e293b", 
        label: "Attention", 
        sublabel: "Code Snippet",
        extraLabel: "def attention(...)"
      },
      { 
        id: "paper", 
        type: "level3", 
        x: 540, 
        y: 520, 
        radius: 25, 
        shape: "rect", 
        width: 80, 
        height: 40, 
        color: "#805ad5", 
        innerColor: "#1e293b", 
        label: "\"Attention Is All", 
        sublabel: "You Need\"" 
      },
      { 
        id: "bert", 
        type: "level4", 
        x: 850, 
        y: 420, 
        radius: 30, 
        color: "#2a2a2a", 
        innerColor: "#2a2a2a", 
        stroke: "#805ad5", 
        strokeWidth: 1, 
        label: "BERT", 
        sublabel: "Related Model" 
      },
      { 
        id: "gpt", 
        type: "level4", 
        x: 900, 
        y: 350, 
        radius: 30, 
        color: "#2a2a2a", 
        innerColor: "#2a2a2a", 
        stroke: "#805ad5", 
        strokeWidth: 1, 
        label: "GPT", 
        sublabel: "Related Model" 
      },
      { 
        id: "embeddings", 
        type: "dragging", 
        x: 350, 
        y: 220, 
        radius: 35, 
        color: "#38a169", 
        innerColor: "#1e293b", 
        stroke: "#4fd1c5", 
        strokeWidth: 2, 
        strokeDasharray: "5,3", 
        label: "Embeddings", 
        sublabel: "Layer" 
      },
      { 
        id: "word-embeddings", 
        type: "suggestion", 
        x: 400, 
        y: 180, 
        radius: 25, 
        color: "#dd6b20", 
        innerColor: "#1e293b", 
        stroke: "#f6ad55", 
        strokeWidth: 2, 
        strokeDasharray: "4,2", 
        label: "Word", 
        sublabel: "Embeddings",
        note: "Suggested"
      }
    ];
    
    const initialLinkData = [
      { source: "transformer", target: "self-attention", weight: 0.9 },
      { source: "transformer", target: "feed-forward", weight: 0.8 },
      { source: "transformer", target: "encoder", weight: 0.9 },
      { source: "transformer", target: "decoder", weight: 0.9 },
      { source: "self-attention", target: "layer-norm", weight: 0 },
      { source: "feed-forward", target: "layer-norm", weight: 0 },
      { source: "transformer", target: "layer-norm", weight: 0 },
      { source: "self-attention", target: "multi-head", weight: 0 },
      { source: "decoder", target: "multi-head", weight: 0 },
      { source: "encoder", target: "positional", weight: 0 },
      { source: "decoder", target: "tensorflow-impl", weight: 0 },
      { source: "decoder", target: "pytorch-impl", weight: 0 },
      { source: "encoder", target: "code-snippet", weight: 0 },
      { source: "transformer", target: "paper", weight: 0 },
      { source: "decoder", target: "bert", weight: 0 },
      { source: "decoder", target: "gpt", weight: 0 },
      { source: "embeddings", target: "code-snippet", type: "dragging" }
    ];
    
    // --------------------------
    // Component: App
    // --------------------------
    const App = () => {
      const [activeView, setActiveView] = useState('3d');
      const [activeTool, setActiveTool] = useState('pan');
      const [selectedNode, setSelectedNode] = useState(initialNodeData[0]);
      const [nodes, setNodes] = useState(initialNodeData);
      const [links, setLinks] = useState(initialLinkData);
      const [tokenUsage, setTokenUsage] = useState({ current: 8560, max: 12000 });
      const [isDragging, setIsDragging] = useState(false);
      const [viewportPosition, setViewportPosition] = useState({ x: 600, y: 350, scale: 1 });
      
      return (
        <div className="app-container">
          {/* Header */}
          <div className="header">
            <div className="header-title">ContextNexus Spatial Canvas</div>
            <div className="project-title">Project: Deep Learning Architecture Design</div>
            
            <div className="view-controls">
              <button 
                className={`view-button ${activeView === '2d' ? 'active' : ''}`}
                onClick={() => setActiveView('2d')}
              >
                2D
              </button>
              <button 
                className={`view-button ${activeView === '3d' ? 'active' : ''}`}
                onClick={() => setActiveView('3d')}
              >
                3D
              </button>
              <button 
                className={`view-button ${activeView === 'ar' ? 'active' : ''}`}
                onClick={() => setActiveView('ar')}
              >
                AR Mode
              </button>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="nav-controls">
            <button 
              className={`nav-button ${activeTool === 'pan' ? 'active' : ''}`}
              onClick={() => setActiveTool('pan')}
            >
              Pan
            </button>
            <button 
              className={`nav-button ${activeTool === 'orbit' ? 'active' : ''}`}
              onClick={() => setActiveTool('orbit')}
            >
              Orbit
            </button>
            <button 
              className={`nav-button ${activeTool === 'select' ? 'active' : ''}`}
              onClick={() => setActiveTool('select')}
            >
              Select
            </button>
            <button 
              className={`nav-button ${activeTool === 'group' ? 'active' : ''}`}
              onClick={() => setActiveTool('group')}
            >
              Group
            </button>
            
            <div className="layer-controls">
              Layers: <span>All Active</span>
            </div>
            
            <div className="token-display">
              <div className="token-progress">
                <div className="token-progress-bar" style={{ width: `${(tokenUsage.current / tokenUsage.max) * 100}%` }}></div>
              </div>
              <div>{tokenUsage.current.toLocaleString()} / {tokenUsage.max.toLocaleString()} tokens</div>
              <div className="token-percentage">71.3%</div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="main-content">
            {/* Left Sidebar - Concept Library */}
            <ConceptLibrary 
              concepts={conceptLibraryData} 
              onSelectConcept={(concept) => {
                console.log("Selected concept:", concept);
              }}
            />
            
            {/* Canvas Area */}
            <CanvasArea 
              nodes={nodes} 
              links={links}
              viewportPosition={viewportPosition}
              setViewportPosition={setViewportPosition}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              setNodes={setNodes}
              setLinks={setLinks}
              activeTool={activeTool}
            />
            
            {/* Right Sidebar - Node Inspector */}
            <NodeInspector 
              selectedNode={selectedNode} 
              links={links}
              nodes={nodes}
              viewportPosition={viewportPosition}
              setViewportPosition={setViewportPosition}
            />
          </div>
        </div>
      );
    };
    
    // --------------------------
    // Component: ConceptLibrary
    // --------------------------
    const ConceptLibrary = ({ concepts, onSelectConcept }) => {
      return (
        <div className="left-sidebar">
          <div className="sidebar-header">Concept Library</div>
          
          <div className="search-box">Search concepts...</div>
          
          <div className="category-header">Core Concepts</div>
          {concepts.coreConcepts.map(concept => (
            <div key={concept.id} className="concept-item" onClick={() => onSelectConcept(concept)}>
              <div className="concept-title">
                {concept.title}
                <span className="token-count">{concept.tokens} tk</span>
              </div>
              <div className="concept-description">{concept.description}</div>
            </div>
          ))}
          
          <div className="category-header">Implementations</div>
          {concepts.implementations.map(concept => (
            <div key={concept.id} className="concept-item" onClick={() => onSelectConcept(concept)}>
              <div className="concept-title">
                {concept.title}
                <span className="token-count">{concept.tokens} tk</span>
              </div>
              <div className="concept-description">{concept.description}</div>
            </div>
          ))}
          
          <div className="category-header">Research Papers</div>
          {concepts.researchPapers.map(concept => (
            <div key={concept.id} className="concept-item" onClick={() => onSelectConcept(concept)}>
              <div className="concept-title">
                {concept.title}
                <span className="token-count">{concept.tokens} tk</span>
              </div>
              <div className="concept-description">{concept.description}</div>
            </div>
          ))}
        </div>
      );
    };
    
    // --------------------------
    // Component: NodeInspector
    // --------------------------
    const NodeInspector = ({ selectedNode, links, nodes, viewportPosition, setViewportPosition }) => {
      // Filter relationships for the selected node
      const relationships = links
        .filter(link => link.source === selectedNode.id || (typeof link.source === 'object' && link.source.id === selectedNode.id))
        .map(link => {
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const targetNode = nodes.find(node => node.id === targetId);
          return {
            id: targetId,
            name: targetNode ? (targetNode.label + (targetNode.sublabel ? ` ${targetNode.sublabel}` : '')) : targetId,
            weight: link.weight || 0,
            type: targetNode && targetNode.type === 'level1' ? 'Connected concept' : 'Implementation component'
          };
        });
      
      // Function to focus on a specific node
      const focusOnNode = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          setViewportPosition({
            ...viewportPosition,
            x: node.x,
            y: node.y
          });
        }
      };
      
      return (
        <div className="right-sidebar">
          <div className="sidebar-header">Node Inspector</div>
          
          {selectedNode && (
            <div className="node-inspector">
              <div className="node-info">
                <div className="node-title">{selectedNode.label} {selectedNode.sublabel}</div>
                <div className="node-type">Core concept node</div>
                
                <div className="info-row">
                  <div className="info-label">Token Count:</div>
                  <div className="info-value blue">{selectedNode.tokens?.toLocaleString() || "N/A"}</div>
                </div>
                
                <div className="info-row">
                  <div className="info-label">Connections:</div>
                  <div className="info-value">6 direct, 8 indirect</div>
                </div>
                
                <div className="info-row">
                  <div className="info-label">Importance:</div>
                  <div className="info-value">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(selectedNode.importance || 0.8) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="info-value">{Math.round((selectedNode.importance || 0.8) * 100)}%</div>
                </div>
                
                <div className="info-row">
                  <div className="info-label">Source:</div>
                  <div className="info-value">{selectedNode.source || "Research Papers"}</div>
                </div>
                
                <div className="info-row">
                  <div className="info-label">Last Modified:</div>
                  <div className="info-value">{selectedNode.lastModified || "10 min ago"}</div>
                </div>
                
                <div className="button-row">
                  <div className="action-button">Edit</div>
                  <div className="action-button secondary">Merge</div>
                </div>
              </div>
              
              <div className="section-header">Relationships</div>
              
              {relationships.map(rel => (
                <div key={rel.id} className="relationship-item" onClick={() => focusOnNode(rel.id)}>
                  <div className="relationship-title">
                    {rel.name}
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${rel.weight * 100}%` }}></div>
                    </div>
                    <div>{Math.round(rel.weight * 100)}%</div>
                  </div>
                  <div className="relationship-type">{rel.type}</div>
                </div>
              ))}
              
              <div className="section-header">Spatial Navigation</div>
              
              <MiniMap 
                nodes={nodes} 
                selectedNode={selectedNode} 
                viewportPosition={viewportPosition}
                setViewportPosition={setViewportPosition}
              />
            </div>
          )}
        </div>
      );
    };
    
    // --------------------------
    // Component: MiniMap
    // --------------------------
    const MiniMap = ({ nodes, selectedNode, viewportPosition, setViewportPosition }) => {
      const miniMapRef = useRef(null);
      
      useEffect(() => {
        if (!miniMapRef.current) return;
        
        const width = 170;
        const height = 120;
        
        // Clear previous content
        d3.select(miniMapRef.current).selectAll("*").remove();
        
        // Create SVG
        const svg = d3.select(miniMapRef.current)
          .append("svg")
          .attr("width", width)
          .attr("height", height);
        
        // Calculate center and scale
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 0.1;
        
        // Draw mini nodes
        nodes.forEach(node => {
          const x = centerX + (node.x - 600) * scale;
          const y = centerY + (node.y - 350) * scale;
          const r = Math.max(3, node.radius * scale);
          
          if (node.shape === 'rect') {
            svg.append("rect")
              .attr("x", x - r)
              .attr("y", y - r/2)
              .attr("width", r * 2)
              .attr("height", r)
              .attr("rx", 2)
              .attr("fill", node.color)
              .attr("cursor", "pointer")
              .on("click", () => {
                setViewportPosition({
                  ...viewportPosition,
                  x: node.x,
                  y: node.y
                });
              });
          } else {
            svg.append("circle")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", r)
              .attr("fill", node.color)
              .attr("stroke", node.stroke || "none")
              .attr("stroke-width", node.strokeWidth ? node.strokeWidth * scale : 0)
              .attr("cursor", "pointer")
              .on("click", () => {
                setViewportPosition({
                  ...viewportPosition,
                  x: node.x,
                  y: node.y
                });
              });
          }
        });
        
        // Draw viewport indicator
        const viewportWidth = 60;
        const viewportHeight = 60;
        svg.append("rect")
          .attr("x", centerX - viewportWidth/2)
          .attr("y", centerY - viewportHeight/2)
          .attr("width", viewportWidth)
          .attr("height", viewportHeight)
          .attr("class", "viewport-indicator");
        
      }, [nodes, selectedNode, viewportPosition]);
      
      return <div className="mini-map" ref={miniMapRef}></div>;
    };
    
    // --------------------------
    // Component: CanvasArea
    // --------------------------
    const CanvasArea = ({ 
      nodes, 
      links, 
      viewportPosition, 
      setViewportPosition,
      selectedNode,
      setSelectedNode,
      setNodes,
      setLinks,
      activeTool
    }) => {
      const canvasRef = useRef(null);
      const svgRef = useRef(null);
      const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
      const [isDragging, setIsDragging] = useState(false);
      const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
      
      // Initialize and resize canvas
      useEffect(() => {
        const updateDimensions = () => {
          if (canvasRef.current) {
            const { width, height } = canvasRef.current.getBoundingClientRect();
            setCanvasDimensions({ width, height });
          }
        };
        
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        
        return () => window.removeEventListener('resize', updateDimensions);
      }, []);
      
      // D3 Visualization
      useEffect(() => {
        if (!svgRef.current || !canvasDimensions.width) return;
        
        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove();
        
        // Create SVG
        const svg = d3.select(svgRef.current)
          .attr("width", canvasDimensions.width)
          .attr("height", canvasDimensions.height);
        
        // Add grid floor
        svg.append("line")
          .attr("x1", 0)
          .attr("y1", 650)
          .attr("x2", canvasDimensions.width)
          .attr("y2", 650)
          .attr("stroke", "#2a2a2a")
          .attr("stroke-width", 1);
          
        [
          { y: 600, strokeWidth: 0.7 },
          { y: 550, strokeWidth: 0.5 },
          { y: 500, strokeWidth: 0.3 },
        ].forEach(line => {
          svg.append("line")
            .attr("x1", 100)
            .attr("y1", line.y)
            .attr("x2", canvasDimensions.width - 100)
            .attr("y2", line.y)
            .attr("stroke", "#2a2a2a")
            .attr("stroke-width", line.strokeWidth);
        });
        
        // Vertical grid lines
        [300, 400, 500, 600, 700, 800, 900].forEach(x => {
          svg.append("line")
            .attr("x1", x)
            .attr("y1", 450)
            .attr("x2", x)
            .attr("y2", 700)
            .attr("stroke", "#2a2a2a")
            .attr("stroke-width", 1);
        });
        
        // Add proximity indicator rings
        [250, 150, 80].forEach((radius, index) => {
          svg.append("circle")
            .attr("cx", 600)
            .attr("cy", 350)
            .attr("r", radius)
            .attr("class", "proximity-ring")
            .attr("opacity", 0.1 + index * 0.1);
        });
        
        // Create links
        links.forEach(link => {
          // Find source and target nodes
          const sourceNode = nodes.find(n => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
          const targetNode = nodes.find(n => n.id === (typeof link.target === 'object' ? link.target.id : link.target));
          
          if (!sourceNode || !targetNode) return;
          
          // Calculate link properties
          const sourceX = sourceNode.x;
          const sourceY = sourceNode.y;
          const targetX = targetNode.x;
          const targetY = targetNode.y;
          
          // Add normal link line
          svg.append("line")
            .attr("x1", sourceX)
            .attr("y1", sourceY)
            .attr("x2", targetX)
            .attr("y2", targetY)
            .attr("stroke", link.type === "dragging" ? "#38a169" : 
                          link.weight ? "#0084ff" : 
                          sourceNode.type === "level2" ? "#5ebaff" : 
                          sourceNode.type === "level3" ? "#805ad5" : "#0084ff")
            .attr("stroke-width", link.weight ? 3 : (sourceNode.type === "level3" ? 0.7 : 1.5))
            .attr("class", `link ${link.type === "dragging" ? "drag-link" : ""}`)
            .attr("opacity", link.weight ? 1 : (sourceNode.type === "level4" ? 0.7 : 1))
            .attr("stroke-dasharray", link.type === "dragging" ? "5,3" : null);
          
          // Add weight indicator if specified
          if (link.weight) {
            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;
            
            svg.append("circle")
              .attr("cx", midX)
              .attr("cy", midY)
              .attr("r", 12)
              .attr("class", "link-weight");
              
            svg.append("text")
              .attr("x", midX)
              .attr("y", midY + 4)
              .text(link.weight.toFixed(1))
              .attr("class", "link-weight-text");
          }
        });
        
        // Create nodes
        nodes.forEach(node => {
          const nodeGroup = svg.append("g")
            .attr("class", `node ${node.id === selectedNode.id ? 'selected' : ''}`)
            .on("click", () => {
              setSelectedNode(node);
            });
            
          if (node.shape === 'rect') {
            // Create rectangle node
            nodeGroup.append("rect")
              .attr("x", node.x - node.width / 2)
              .attr("y", node.y - node.height / 2)
              .attr("width", node.width)
              .attr("height", node.height)
              .attr("rx", 5)
              .attr("class", "node-outer")
              .attr("fill", node.color)
              .attr("opacity", node.color === "#2a2a2a" ? 0.6 : 0.7)
              .attr("stroke", node.stroke || "none")
              .attr("stroke-width", node.strokeWidth || 0)
              .attr("stroke-dasharray", node.strokeDasharray || null);
          } else {
            // Create outer circle
            nodeGroup.append("circle")
              .attr("cx", node.x)
              .attr("cy", node.y)
              .attr("r", node.radius)
              .attr("class", `node-outer ${node.type === "dragging" ? "drag-node" : ""} ${node.type === "suggestion" ? "suggestion-node" : ""}`)
              .attr("fill", node.color)
              .attr("opacity", node.color === "#2a2a2a" ? 0.6 : 0.9)
              .attr("stroke", node.stroke || "none")
              .attr("stroke-width", node.strokeWidth || 0)
              .attr("stroke-dasharray", node.strokeDasharray || null);
              
            // Create inner circle
            nodeGroup.append("circle")
              .attr("cx", node.x)
              .attr("cy", node.y)
              .attr("r", node.radius - 5)
              .attr("class", "node-inner")
              .attr("fill", node.innerColor);
          }
          
          // Add main label
          nodeGroup.append("text")
            .attr("x", node.x)
            .attr("y", node.y - (node.sublabel ? 5 : 0))
            .attr("class", "node-text node-label")
            .attr("font-size", node.type === "level4" ? 9 : 12)
            .text(node.label);
            
          // Add sublabel if exists
          if (node.sublabel) {
            nodeGroup.append("text")
              .attr("x", node.x)
              .attr("y", node.y + (node.shape === 'rect' ? 15 : 10))
              .attr("class", "node-text node-sublabel")
              .attr("font-size", node.type === "level4" ? 7 : 10)
              .text(node.sublabel);
          }
          
          // Add extra label if exists (for code snippets)
          if (node.extraLabel) {
            nodeGroup.append("text")
              .attr("x", node.x)
              .attr("y", node.y + 25)
              .attr("class", "node-text node-sublabel")
              .attr("font-size", 7)
              .text(node.extraLabel);
          }
          
          // Add token count if exists
          if (node.tokens) {
            nodeGroup.append("text")
              .attr("x", node.x)
              .attr("y", node.y + 25)
              .attr("class", "node-text node-tokens")
              .text(`${node.tokens.toLocaleString()} tokens`);
          }
          
          // Add "Suggested" note if applicable
          if (node.note) {
            nodeGroup.append("text")
              .attr("x", node.x)
              .attr("y", node.y + 30)
              .attr("class", "node-text")
              .attr("font-size", 8)
              .attr("fill", "#f6ad55")
              .text(node.note);
          }
        });
        
        // Add pan functionality
        if (activeTool === 'pan') {
          svg.on("mousedown", (event) => {
            setIsDragging(true);
            setDragStartPos({
              x: event.clientX,
              y: event.clientY
            });
          });
          
          svg.on("mousemove", (event) => {
            if (isDragging) {
              const dx = event.clientX - dragStartPos.x;
              const dy = event.clientY - dragStartPos.y;
              setDragStartPos({
                x: event.clientX,
                y: event.clientY
              });
              
              // Update nodes
              setNodes(nodes.map(node => ({
                ...node,
                x: node.x + dx,
                y: node.y + dy
              })));
            }
          });
          
          svg.on("mouseup", () => {
            setIsDragging(false);
          });
          
          svg.on("mouseleave", () => {
            setIsDragging(false);
          });
        }
        
      }, [nodes, links, canvasDimensions, selectedNode, activeTool, isDragging, dragStartPos]);
      
      return (
        <div className="canvas-area" ref={canvasRef}>
          <div className="canvas-title">
            <h2>Transformer Architecture Canvas</h2>
            <p>Spatial arrangement: closer items have stronger relationships</p>
          </div>
          
          <svg ref={svgRef}></svg>
          
          {/* AI Assistant Panel */}
          <div className="floating-panel ai-assistant">
            <div className="ai-header">Context AI Assistant</div>
            <div className="ai-content">
              <div className="ai-message">I notice you're building a Transformer model.</div>
              <div className="ai-message">Suggested additions:</div>
              
              <div className="suggestion-item">+ Add Word Embeddings layer</div>
              <div className="suggestion-item">+ Include "Attention Is All You Need" paper</div>
            </div>
          </div>
          
          {/* Keyboard Shortcuts Panel */}
          <div className="floating-panel shortcuts-panel">
            <div className="shortcuts-title">Spatial Shortcuts</div>
            <div className="shortcut-item">Space: Focus on Node</div>
            <div className="shortcut-item">Alt+Drag: Create Connection</div>
            <div className="shortcut-item">Shift+Scroll: Zoom In/Out</div>
            <div className="shortcut-item">Middle Click: Orbit View</div>
            <div className="shortcut-item">Ctrl+G: Group Selected</div>
            <div className="shortcut-item">F: Find Path Between Nodes</div>
          </div>
          
          {/* Context Building Panel */}
          <div className="floating-panel context-building">
            <div className="context-building-title">Context Building</div>
            <div className="context-building-info">Selected: 6 active nodes</div>
            <div className="context-building-info">Token allocation: 8,560 / 12,000</div>
            
            <div className="context-building-buttons">
              <div className="context-button">Apply</div>
              <div className="context-button">Reset</div>
            </div>
          </div>
        </div>
      );
    };
    
    // --------------------------
    // Render the App
    // --------------------------
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>