import React, { useReducer, useEffect, useState, useMemo, useCallback, useRef } from 'react';

// Simple UI components (replacing shadcn)
const Button = ({ onClick, disabled, className, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 rounded ${className}`}
  >
    {children}
  </button>
);

// Simple icon components to replace Lucide
const PanelLeft = () => <span>⬅️</span>;
const PanelRight = () => <span>➡️</span>;
const ChevronUp = () => <span>↑</span>;
const ChevronDown = () => <span>↓</span>;
const X = () => <span>×</span>;

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Sample data
const SAMPLE_DOCUMENTS = [
  {
    id: 'doc1',
    title: 'Microservices architecture',
    source: 'claude',
    category: 'System Architecture',
    content: 'ContextNexus uses a microservices architecture deployed on Kubernetes. Each service is containerized using Docker and orchestrated with Kubernetes. This approach provides scalability, resilience, and isolation between components.',
    tokens: 387,
  },
  {
    id: 'doc2',
    title: 'Database selection rationale',
    source: 'gemini',
    category: 'System Architecture',
    content: 'We selected PostgreSQL as the primary database for structured data and Neo4j as a graph database for relationship management. PostgreSQL offers ACID compliance, robust querying capabilities, and excellent performance for relational data. Neo4j provides intuitive modeling of interconnected knowledge.',
    tokens: 412,
  },
  {
    id: 'doc3',
    title: 'Three-panel layout design',
    source: 'github',
    category: 'Interface & User Experience',
    content: 'The three-panel layout provides an intuitive workflow for context management. The left panel shows document sources, the middle panel allows for content organization, and the right panel shows previews and testing. This separation of concerns mimics the mental model of context development.',
    tokens: 329,
  },
  {
    id: 'doc4',
    title: 'Token optimization techniques',
    source: 'claude',
    category: 'Optimization & Performance',
    content: 'ContextNexus implements several token optimization techniques. These include semantic chunking, redundancy elimination, and intelligent summarization. Our benchmarks show an average of 81.5% reduction in token usage while preserving semantic meaning.',
    tokens: 276,
  },
  {
    id: 'doc5',
    title: 'Knowledge graph implementation',
    source: 'github',
    category: 'Core Features',
    content: 'The knowledge graph visualization uses a force-directed layout to show relationships between context elements. Nodes represent concepts or document segments, while edges show semantic relationships. The visualization helps users understand knowledge structure and identify gaps.',
    tokens: 305,
  },
  {
    id: 'doc6',
    title: 'Keyboard shortcuts system',
    source: 'gemini',
    category: 'Interface & User Experience',
    content: 'The keyboard shortcut system is designed for power users. Common operations can be performed without touching the mouse, significantly speeding up workflow. The shortcut system is customizable and context-aware, showing different options based on the current panel and mode.',
    tokens: 343,
  },
  {
    id: 'doc7',
    title: 'Security implementation',
    source: 'claude',
    category: 'Security & Authentication',
    content: 'ContextNexus implements JWT-based authentication with role-based access control. All API endpoints are protected with appropriate authorization checks. The system supports SSO integration with major providers including Google, Microsoft, and GitHub.',
    tokens: 291,
  },
  {
    id: 'doc8',
    title: 'Collaborative features',
    source: 'github',
    category: 'Collaboration & Sharing',
    content: 'The collaboration system allows multiple users to work on the same context simultaneously. Changes are synchronized in real-time using WebSockets. Users can see each other\'s selections and edits, with visual indicators showing who is working on what.',
    tokens: 309,
  },
];

/**
 * Initial state structure
 * 
 * Using a flat structure for reduced nesting and easier updates
 * All IDs reference into the appropriate collections
 */
const initialState = {
  // Document source panel
  documents: SAMPLE_DOCUMENTS,
  selectedFilter: 'all',
  
  // Editor panel
  selectedDocuments: [],
  editorMode: 'selection',
  
  // Preview panel
  llmModel: 'claude-3',
  previewContent: '',
  tokenStats: {
    total: 0,
    optimized: 0,
    cost: 0,
  },
  
  // UI state
  activePanel: 'source',
  sidebarCollapsed: false,
};

/**
 * Unified reducer for the entire application
 * 
 * Instead of splitting into multiple reducers, using a single reducer with
 * a well-structured state makes coordination simpler and prevents
 * synchronization issues.
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        selectedFilter: action.payload,
      };
      
    case 'SELECT_DOCUMENT': {
      // Don't add if already selected
      if (state.selectedDocuments.some(doc => doc.id === action.payload.id)) {
        return state;
      }
      
      const selectedDocuments = [...state.selectedDocuments, action.payload];
      
      // Recalculate token stats
      const total = selectedDocuments.reduce((sum, doc) => sum + doc.tokens, 0);
      
      return {
        ...state,
        selectedDocuments,
        tokenStats: {
          ...state.tokenStats,
          total,
          cost: total * 0.000016, // Approximate cost at $0.016 per 1K tokens
        },
      };
    }
    
    case 'REMOVE_DOCUMENT': {
      const selectedDocuments = state.selectedDocuments.filter(
        doc => doc.id !== action.payload
      );
      
      // Recalculate token stats
      const total = selectedDocuments.reduce((sum, doc) => sum + doc.tokens, 0);
      
      return {
        ...state,
        selectedDocuments,
        tokenStats: {
          ...state.tokenStats,
          total,
          cost: total * 0.000016,
        },
      };
    }
    
    case 'MOVE_DOCUMENT_UP': {
      const index = state.selectedDocuments.findIndex(doc => doc.id === action.payload);
      if (index <= 0) return state;
      
      const selectedDocuments = [...state.selectedDocuments];
      const temp = selectedDocuments[index];
      selectedDocuments[index] = selectedDocuments[index - 1];
      selectedDocuments[index - 1] = temp;
      
      return {
        ...state,
        selectedDocuments,
      };
    }
    
    case 'MOVE_DOCUMENT_DOWN': {
      const index = state.selectedDocuments.findIndex(doc => doc.id === action.payload);
      if (index === -1 || index >= state.selectedDocuments.length - 1) return state;
      
      const selectedDocuments = [...state.selectedDocuments];
      const temp = selectedDocuments[index];
      selectedDocuments[index] = selectedDocuments[index + 1];
      selectedDocuments[index + 1] = temp;
      
      return {
        ...state,
        selectedDocuments,
      };
    }
    
    case 'SET_EDITOR_MODE':
      return {
        ...state,
        editorMode: action.payload,
      };
      
    case 'SET_LLM_MODEL':
      return {
        ...state,
        llmModel: action.payload,
      };
      
    case 'SET_ACTIVE_PANEL':
      return {
        ...state,
        activePanel: action.payload,
      };
      
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
      
    case 'OPTIMIZE_TOKENS': {
      // Simple optimization strategy: remove redundant information
      const optimizedDocs = [...state.selectedDocuments];
      // Just simulating optimization here
      const optimizedTokens = Math.floor(state.tokenStats.total * 0.815);
      
      return {
        ...state,
        tokenStats: {
          ...state.tokenStats,
          optimized: optimizedTokens,
          original: state.tokenStats.total,
          total: state.tokenStats.total - optimizedTokens,
          cost: (state.tokenStats.total - optimizedTokens) * 0.000016,
        },
      };
    }
    
    case 'GENERATE_PREVIEW': {
      // In a real implementation, this would call the LLM API
      // For demo purposes, we'll generate a simple preview
      const content = state.selectedDocuments.length > 0 
        ? `Based on the provided context, ContextNexus is a knowledge management system for LLMs with the following features:

1. ${state.selectedDocuments[0]?.title || 'Architecture'}: ${state.selectedDocuments[0]?.content.substring(0, 100)}...

2. ${state.selectedDocuments.length > 1 ? state.selectedDocuments[1]?.title || 'Database' : 'Database'}: ${state.selectedDocuments.length > 1 ? state.selectedDocuments[1]?.content.substring(0, 100) : 'No information provided'}...

3. ${state.selectedDocuments.length > 2 ? state.selectedDocuments[2]?.title || 'Interface' : 'Interface'}: ${state.selectedDocuments.length > 2 ? state.selectedDocuments[2]?.content.substring(0, 100) : 'No information provided'}...

This system aims to optimize token usage and provide a seamless experience for context management.`
        : 'Select documents to generate a preview.';
      
      return {
        ...state,
        previewContent: content,
      };
    }
    
    default:
      return state;
  }
}

/**
 * Knowledge graph implementation using Canvas
 * 
 * Canvas provides better performance than SVG for larger graphs
 * and allows for more interactive features.
 */
const KnowledgeGraph = ({ documents }) => {
  const canvasRef = useRef(null);
  
  // Simple force-directed layout
  useEffect(() => {
    if (!canvasRef.current || documents.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create nodes
    const nodes = documents.map((doc, i) => ({
      id: doc.id,
      title: doc.title.substring(0, 10) + '...',
      x: 100 + Math.random() * (width - 200),
      y: 100 + Math.random() * (height - 200),
      radius: 15 + (doc.tokens / 100),
      color: getSourceColor(doc.source),
    }));
    
    // Create edges (simple connections between consecutive docs)
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: nodes[i],
        target: nodes[i + 1],
      });
    }
    
    // Add a few random edges for more interesting visualization
    for (let i = 0; i < Math.min(3, nodes.length); i++) {
      const source = Math.floor(Math.random() * nodes.length);
      let target = Math.floor(Math.random() * nodes.length);
      if (target === source) target = (target + 1) % nodes.length;
      
      edges.push({
        source: nodes[source],
        target: nodes[target],
      });
    }
    
    // Simple force-directed layout simulation (just for visuals)
    for (let iteration = 0; iteration < 50; iteration++) {
      // Apply repulsive forces between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (distance * distance);
          
          nodes[i].x -= (dx / distance) * force;
          nodes[i].y -= (dy / distance) * force;
          nodes[j].x += (dx / distance) * force;
          nodes[j].y += (dy / distance) * force;
        }
      }
      
      // Apply attractive forces along edges
      for (const edge of edges) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = distance / 10;
        
        edge.source.x += (dx / distance) * force;
        edge.source.y += (dy / distance) * force;
        edge.target.x -= (dx / distance) * force;
        edge.target.y -= (dy / distance) * force;
      }
      
      // Keep nodes within bounds
      for (const node of nodes) {
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      }
    }
    
    // Draw edges
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (const edge of edges) {
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      ctx.stroke();
    }
    
    // Draw nodes
    for (const node of nodes) {
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw node label
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 12);
    }
  }, [documents]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={250} 
      height={150} 
      className="border rounded"
    />
  );
};

/**
 * Helper functions for UI rendering
 */
const getSourceColor = (source) => {
  switch (source) {
    case 'claude':
      return '#e3f2fd';
    case 'gemini':
      return '#e8f5e9';
    case 'github':
      return '#fff3e0';
    default:
      return '#f5f5f5';
  }
};

const getSourceBorderColor = (source) => {
  switch (source) {
    case 'claude':
      return 'border-blue-300';
    case 'gemini':
      return 'border-green-300';
    case 'github':
      return 'border-orange-300';
    default:
      return 'border-gray-300';
  }
};

/**
 * DocumentItem component - used in source panel
 * 
 * Optimized for rendering in a virtualized list
 */
const DocumentItem = React.memo(({ document, onSelect }) => {
  return (
    <div 
      className={`p-3 mb-2 border-l-4 ${getSourceBorderColor(document.source)} bg-white rounded shadow-sm hover:bg-gray-50 cursor-pointer`}
      onClick={() => onSelect(document)}
    >
      <div className="flex justify-between">
        <h3 className="font-medium truncate">{document.title}</h3>
        <span className="text-xs text-gray-500">{document.tokens} tokens</span>
      </div>
      <p className="text-sm text-gray-700 truncate">{document.content}</p>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">{document.source}</span>
        <span className="text-xs text-gray-500">{document.category}</span>
      </div>
    </div>
  );
});

/**
 * SelectedDocumentItem component - used in editor panel
 * 
 * Handles reordering, editing, and removal of selected documents
 */
const SelectedDocumentItem = React.memo(({ 
  document, 
  onRemove, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  return (
    <div className="p-3 mb-3 border rounded shadow-sm bg-white">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{document.title}</h3>
        <div className="flex space-x-1">
          <button 
            onClick={() => onMoveUp(document.id)}
            disabled={!canMoveUp}
            className={`h-6 w-6 flex items-center justify-center rounded ${canMoveUp ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
          >
            ↑
          </button>
          <button 
            onClick={() => onMoveDown(document.id)}
            disabled={!canMoveDown}
            className={`h-6 w-6 flex items-center justify-center rounded ${canMoveDown ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
          >
            ↓
          </button>
          <button 
            onClick={() => onRemove(document.id)}
            className="h-6 w-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50"
          >
            ×
          </button>
        </div>
      </div>
      <p className="text-sm mt-1">{document.content}</p>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">Source: {document.source}</span>
        <span className="text-xs text-gray-500">{document.tokens} tokens</span>
      </div>
    </div>
  );
});

/**
 * Main ContextNexus component
 */
const ContextNexus = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard shortcuts with modifier keys
      if (!(e.ctrlKey || e.metaKey)) return;
      
      switch (e.key) {
        case '1':
          dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'source' });
          e.preventDefault();
          break;
        case '2':
          dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'editor' });
          e.preventDefault();
          break;
        case '3':
          dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'preview' });
          e.preventDefault();
          break;
        case 'b':
          dispatch({ type: 'TOGGLE_SIDEBAR' });
          e.preventDefault();
          break;
        case 'o':
          dispatch({ type: 'OPTIMIZE_TOKENS' });
          e.preventDefault();
          break;
        case 'p':
          dispatch({ type: 'GENERATE_PREVIEW' });
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Filter documents based on selected filter
  const filteredDocuments = useMemo(() => {
    if (state.selectedFilter === 'all') return state.documents;
    return state.documents.filter(doc => doc.source === state.selectedFilter);
  }, [state.documents, state.selectedFilter]);
  
  // Group documents by category for easier browsing
  const documentsByCategory = useMemo(() => {
    const grouped = {};
    filteredDocuments.forEach(doc => {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc);
    });
    return grouped;
  }, [filteredDocuments]);
  
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">ContextNexus</h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm text-white border border-gray-700 rounded hover:bg-gray-800">
            Projects
          </button>
          <button className="px-3 py-1 text-sm text-white border border-gray-700 rounded hover:bg-gray-800">
            Settings
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Source panel */}
        <div className={`${state.sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-1/4'} border-r border-gray-200 bg-white transition-all duration-200`}>
          <div className="p-3 bg-gray-50 border-b">
            <h2 className="font-semibold">Source Navigator</h2>
          </div>
          
          <div className="p-2">
            <div className="grid grid-cols-4 mb-2">
              <button 
                className={`py-1 px-2 text-sm font-medium rounded-l ${state.selectedFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}
              >
                All
              </button>
              <button 
                className={`py-1 px-2 text-sm font-medium ${state.selectedFilter === 'claude' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_FILTER', payload: 'claude' })}
              >
                Claude
              </button>
              <button 
                className={`py-1 px-2 text-sm font-medium ${state.selectedFilter === 'gemini' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_FILTER', payload: 'gemini' })}
              >
                Gemini
              </button>
              <button 
                className={`py-1 px-2 text-sm font-medium rounded-r ${state.selectedFilter === 'github' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_FILTER', payload: 'github' })}
              >
                GitHub
              </button>
            </div>
            
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            
            <div className="h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <div key={category} className="mb-4">
                  <div className="bg-blue-50 p-2 text-sm font-medium rounded flex items-center">
                    <span className="mr-2">🤖</span>
                    {category}
                  </div>
                  <div className="mt-2">
                    {docs.map(document => (
                      <DocumentItem
                        key={document.id}
                        document={document}
                        onSelect={(doc) => dispatch({ type: 'SELECT_DOCUMENT', payload: doc })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Editor panel */}
        <div className={`${state.sidebarCollapsed ? 'w-2/3' : 'w-5/12'} transition-all duration-200`}>
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-semibold">Ninja Editor</h2>
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-200"
            >
              {state.sidebarCollapsed ? '⬅️' : '➡️'}
            </button>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-4 mb-3">
              <button 
                className={`py-2 px-3 text-sm font-medium rounded-l ${state.editorMode === 'selection' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'selection' })}
              >
                Selection
              </button>
              <button 
                className={`py-2 px-3 text-sm font-medium ${state.editorMode === 'organize' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'organize' })}
              >
                Organize
              </button>
              <button 
                className={`py-2 px-3 text-sm font-medium ${state.editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'edit' })}
              >
                Edit
              </button>
              <button 
                className={`py-2 px-3 text-sm font-medium rounded-r ${state.editorMode === 'test' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'test' })}
              >
                Test
              </button>
            </div>
            
            <div className="bg-green-50 p-2 text-sm font-medium rounded mb-3 flex items-center">
              <span className="mr-2">🔍</span>
              Selected Context Elements ({state.selectedDocuments.length})
            </div>
            
            <div className="h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {state.selectedDocuments.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No documents selected. Select documents from the source panel.</p>
                </div>
              ) : (
                state.selectedDocuments.map((doc, index) => (
                  <SelectedDocumentItem
                    key={doc.id}
                    document={doc}
                    onRemove={(id) => dispatch({ type: 'REMOVE_DOCUMENT', payload: id })}
                    onMoveUp={(id) => dispatch({ type: 'MOVE_DOCUMENT_UP', payload: id })}
                    onMoveDown={(id) => dispatch({ type: 'MOVE_DOCUMENT_DOWN', payload: id })}
                    canMoveUp={index > 0}
                    canMoveDown={index < state.selectedDocuments.length - 1}
                  />
                ))
              )}
              
              {/* AI Suggestion */}
              {state.selectedDocuments.length > 0 && (
                <div className="p-3 mb-3 border rounded shadow-sm bg-blue-50 border-blue-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center">
                      <span className="mr-2">🤖</span>
                      Suggested addition: Knowledge graph implementation
                    </h3>
                  </div>
                  <p className="text-sm mt-1">This would complement your architecture documents with visualization details.</p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                      onClick={() => {
                        const suggestion = state.documents.find(doc => doc.title === 'Knowledge graph implementation');
                        if (suggestion) {
                          dispatch({ type: 'SELECT_DOCUMENT', payload: suggestion });
                        }
                      }}
                    >
                      Add to context
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                      Ignore
                    </button>
                  </div>
                </div>
              )}
              
              {/* Token Optimization */}
              {state.selectedDocuments.length > 0 && (
                <div className="p-3 mb-3 border rounded shadow-sm bg-orange-50 border-orange-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center">
                      <span className="mr-2">⚡</span>
                      Token Optimization
                    </h3>
                  </div>
                  <p className="text-sm mt-1">
                    Current selection: {state.tokenStats.total} tokens
                    {state.tokenStats.optimized > 0 && ` (optimized from ${state.tokenStats.original})`}
                  </p>
                  <p className="text-sm mt-1">
                    AI suggests removing redundant architecture explanation (save ~500 tokens)
                  </p>
                  <div className="mt-2">
                    <button 
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                      onClick={() => dispatch({ type: 'OPTIMIZE_TOKENS' })}
                    >
                      Apply optimization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Preview panel */}
        <div className={`${state.sidebarCollapsed ? 'w-1/3' : 'w-1/3'} border-l border-gray-200 bg-white transition-all duration-200`}>
          <div className="p-3 bg-gray-50 border-b">
            <h2 className="font-semibold">Preview & Testing</h2>
          </div>
          
          <div className="p-3">
            <div className="mb-3">
              <select 
                defaultValue="claude-3"
                onChange={(e) => dispatch({ type: 'SET_LLM_MODEL', payload: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="claude-3">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            
            <div className="mb-3 border rounded bg-white shadow-sm">
              <div className="p-2 border-b">
                <h3 className="text-sm font-medium">Context Visualization</h3>
              </div>
              <div className="p-2 text-center">
                <KnowledgeGraph documents={state.selectedDocuments} />
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="font-medium mb-2 text-sm">Prompt Testing</h3>
              <textarea
                placeholder="Enter test prompt..."
                className="w-full p-2 border rounded text-sm h-20"
                defaultValue="Explain the system architecture and its key components."
              />
              <button 
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => dispatch({ type: 'GENERATE_PREVIEW' })}
              >
                Generate Preview
              </button>
            </div>
            
            <div className="mb-3">
              <h3 className="font-medium mb-2 text-sm">Preview Response:</h3>
              <div className="w-full p-2 border rounded text-sm bg-gray-50 h-40 overflow-y-auto">
                {state.previewContent || 'Generate a preview to see LLM output based on your context.'}
              </div>
            </div>
            
            <div className="border rounded bg-white shadow-sm">
              <div className="py-2 px-3 border-b">
                <h3 className="text-sm font-medium">Context Statistics</h3>
              </div>
              <div className="p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total tokens:</span>
                  <span>{state.tokenStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated cost:</span>
                  <span>${state.tokenStats.cost.toFixed(4)}</span>
                </div>
                {state.tokenStats.optimized > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Token reduction:</span>
                    <span>{Math.round((state.tokenStats.optimized / state.tokenStats.original) * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextNexus;
