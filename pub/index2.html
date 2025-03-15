<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContextNexus - Advanced Context Management</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- React Dependencies -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #999;
    }

    /* Animations */
    .highlight-pulse {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    /* Token visualization */
    .token-bar {
      transition: width 0.5s ease-in-out;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div id="root"></div>

  <script type="text/babel">
    // Destructure React hooks
    const { useState, useReducer, useEffect, useMemo, useRef, useCallback } = React;

    // =============================================
    // SAMPLE DATA
    // =============================================
    const SAMPLE_DOCUMENTS = [
      {
        id: 'doc1',
        title: 'Context Management System Overview',
        source: 'claude',
        category: 'Core Concept',
        content: 'We have designed a revolutionary context management system that transforms how users interact with large language models. The fundamental innovation is making the traditionally hidden and implicit context mechanism explicit, visual, and user-manipulable through an intuitive interface.',
        tokens: 387,
        relevance: 0.95,
        created: '2025-03-01T12:00:00Z',
        updated: '2025-03-12T09:30:00Z',
      },
      {
        id: 'doc2',
        title: 'Context Window Limitations',
        source: 'docs',
        category: 'Core Concept',
        content: 'Current systems have fixed token limits that constrain conversation length and complexity. Users have minimal control over what information is included in context. Most systems include all previous messages regardless of relevance.',
        tokens: 242,
        relevance: 0.90,
        created: '2025-03-02T14:20:00Z',
        updated: '2025-03-10T11:15:00Z',
      },
      {
        id: 'doc3',
        title: 'Rapid Content Selection',
        source: 'claude',
        category: 'Key Innovations',
        content: 'The system provides multiple mechanisms for quickly selecting relevant content: one-click paragraph selection, content-type aware selection (code, lists, diagrams), keyboard shortcuts for power users, and visual indicators showing what\'s in context.',
        tokens: 315,
        relevance: 0.88,
        created: '2025-03-04T09:45:00Z',
        updated: '2025-03-11T16:20:00Z',
      },
      {
        id: 'doc4',
        title: 'Multi-Level Context Organization',
        source: 'gemini',
        category: 'Key Innovations',
        content: 'Content can be organized into hierarchical structures: main context thread with sub-contexts, categorization by topic, relevance, or content type, visual organization through drag-and-drop interfaces, and relationship visualization through knowledge graphs.',
        tokens: 276,
        relevance: 0.85,
        created: '2025-03-05T11:30:00Z',
        updated: '2025-03-12T10:45:00Z',
      },
      {
        id: 'doc5',
        title: 'Dynamic Context Branching',
        source: 'docs',
        category: 'Key Innovations',
        content: 'Users can create specialized conversation branches: focus on specific knowledge nodes, include only relevant context elements, maintain connections to the main knowledge structure, and merge insights back into the primary context.',
        tokens: 252,
        relevance: 0.82,
        created: '2025-03-06T13:15:00Z',
        updated: '2025-03-10T15:30:00Z',
      },
      {
        id: 'doc6',
        title: 'Token Optimization',
        source: 'github',
        category: 'Key Innovations',
        content: 'Intelligent token management dramatically increases effective context size: selective inclusion of only relevant content, relevance weighting for prioritization, compression and summarization of verbose content, and content-type awareness (prioritizing code, lists, key concepts).',
        tokens: 294,
        relevance: 0.92,
        created: '2025-03-07T10:00:00Z',
        updated: '2025-03-09T17:40:00Z',
      },
      {
        id: 'doc7',
        title: 'Interface Components',
        source: 'github',
        category: 'Detailed Diagram Analysis',
        content: 'The KnowChat UI mockups demonstrate the primary interface patterns: three-panel layout (knowledge hierarchy/graph visualization, conversation interface, context inspection and management), knowledge visualization options, context management controls, selection mechanisms, and collaborative features.',
        tokens: 305,
        relevance: 0.78,
        created: '2025-03-08T16:20:00Z',
        updated: '2025-03-11T13:05:00Z',
      },
      {
        id: 'doc8',
        title: 'Core Functionality',
        source: 'claude',
        category: 'Detailed Diagram Analysis',
        content: 'The Context Workflow diagram illustrates the transformation process: starting with raw conversation data, applying rapid selection techniques, organizing into structured knowledge, and applying optimized context with dramatic token savings (81.5%).',
        tokens: 232,
        relevance: 0.75,
        created: '2025-03-09T09:10:00Z',
        updated: '2025-03-12T08:50:00Z',
      },
      {
        id: 'doc9',
        title: 'User Experience Benefits',
        source: 'gemini',
        category: 'Value Proposition',
        content: '5x faster context creation, intuitive visual management of context, multiple selection methods for different content types, and keyboard shortcuts for power users.',
        tokens: 185,
        relevance: 0.80,
        created: '2025-03-10T14:40:00Z',
        updated: '2025-03-12T11:25:00Z',
      },
      {
        id: 'doc10',
        title: 'Context Quality Improvements',
        source: 'docs',
        category: 'Value Proposition',
        content: '95% higher content precision, structured organization by relevance and topic, relationship visualization between concepts, and dynamic branching for specialized inquiries.',
        tokens: 168,
        relevance: 0.83,
        created: '2025-03-11T11:30:00Z',
        updated: '2025-03-12T14:15:00Z',
      },
      {
        id: 'doc11',
        title: 'Token Efficiency Metrics',
        source: 'github',
        category: 'Value Proposition',
        content: '4.3x more effective context utilization, 67% reduction in token costs, ability to maintain longer effective conversation history, and higher quality AI responses through relevance weighting.',
        tokens: 198,
        relevance: 0.89,
        created: '2025-03-11T16:50:00Z',
        updated: '2025-03-13T09:05:00Z',
      },
      {
        id: 'doc12',
        title: 'Knowledge Management Evolution',
        source: 'claude',
        category: 'Value Proposition',
        content: 'Evolution from ephemeral conversations to persistent knowledge, multi-dimensional organization versus linear history, relationship visualization and navigation, and reusable context patterns through templates.',
        tokens: 190,
        relevance: 0.86,
        created: '2025-03-12T10:20:00Z',
        updated: '2025-03-13T13:45:00Z',
      },
    ];

    // =============================================
    // ICON COMPONENTS
    // =============================================
    const Icon = {
      ChevronUp: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      ),
      ChevronDown: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      ),
      PanelLeft: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      ),
      PanelRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
      ),
      X: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ),
      Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
      FileCode: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M10 12l-2 2 2 2"></path>
          <path d="M14 12l2 2-2 2"></path>
        </svg>
      ),
      FileText: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      Graph: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      ),
      List: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      ),
      ZapFast: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      ),
      User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
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
      BookOpen: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      ),
    };

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================
    
    // Format date to relative time (e.g., "2 days ago")
    const formatRelativeTime = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 30) {
        return `${date.toLocaleDateString()}`;
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    };
    
    // Get color based on source
    const getSourceColor = (source) => {
      switch (source) {
        case 'claude':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'gemini':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'github':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'docs':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };
    
    // Get background color for document item
    const getSourceBg = (source) => {
      switch (source) {
        case 'claude':
          return 'border-l-blue-400';
        case 'gemini':
          return 'border-l-green-400';
        case 'github':
          return 'border-l-orange-400';
        case 'docs':
          return 'border-l-purple-400';
        default:
          return 'border-l-gray-400';
      }
    };

    // =============================================
    // STATE MANAGEMENT
    // =============================================
    
    // Initial state
    const initialState = {
      // Panel visibility
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      activeLeftTab: 'documents', // 'documents', 'knowledge', 'history'
      activeRightTab: 'preview', // 'preview', 'analysis', 'settings'
      
      // Documents
      documents: SAMPLE_DOCUMENTS,
      sourceFilter: 'all',
      categoryFilter: 'all',
      searchQuery: '',
      
      // Selected content
      selectedDocuments: [],
      
      // Editor settings
      editorMode: 'selection', // 'selection', 'organization', 'edit', 'test'
      showSelectionHighlights: true,
      
      // LLM settings
      selectedModel: 'claude-3',
      maxTokens: 4000,
      temperature: 0.7,
      
      // Preview state
      previewPrompt: 'Explain the context management system based on the provided context.',
      previewResponse: '',
      
      // Token statistics
      tokenStats: {
        originalTotal: 0,
        currentTotal: 0,
        optimizedSavings: 0,
        estimatedCost: 0,
      },
      
      // UI state
      showTokenVisualization: true,
      showGraphView: true,
    };
    
    // Reducer function
    const appReducer = (state, action) => {
      switch (action.type) {
        // Panel actions
        case 'TOGGLE_LEFT_PANEL':
          return {
            ...state,
            leftPanelCollapsed: !state.leftPanelCollapsed,
          };
        case 'TOGGLE_RIGHT_PANEL':
          return {
            ...state,
            rightPanelCollapsed: !state.rightPanelCollapsed,
          };
        case 'SET_LEFT_TAB':
          return {
            ...state,
            activeLeftTab: action.payload,
          };
        case 'SET_RIGHT_TAB':
          return {
            ...state,
            activeRightTab: action.payload,
          };
        
        // Filter actions
        case 'SET_SOURCE_FILTER':
          return {
            ...state,
            sourceFilter: action.payload,
          };
        case 'SET_CATEGORY_FILTER':
          return {
            ...state,
            categoryFilter: action.payload,
          };
        case 'SET_SEARCH_QUERY':
          return {
            ...state,
            searchQuery: action.payload,
          };
        
        // Document selection actions
        case 'SELECT_DOCUMENT': {
          // Don't add if already selected
          if (state.selectedDocuments.some(doc => doc.id === action.payload.id)) {
            return state;
          }
          
          const selectedDocuments = [...state.selectedDocuments, action.payload];
          const totalTokens = selectedDocuments.reduce((sum, doc) => sum + doc.tokens, 0);
          
          return {
            ...state,
            selectedDocuments,
            tokenStats: {
              ...state.tokenStats,
              originalTotal: totalTokens,
              currentTotal: totalTokens,
              estimatedCost: totalTokens * 0.000016, // Approx cost at $0.016 per 1K tokens
            },
          };
        }
        case 'REMOVE_DOCUMENT': {
          const selectedDocuments = state.selectedDocuments.filter(
            doc => doc.id !== action.payload
          );
          const totalTokens = selectedDocuments.reduce((sum, doc) => sum + doc.tokens, 0);
          
          return {
            ...state,
            selectedDocuments,
            tokenStats: {
              ...state.tokenStats,
              originalTotal: totalTokens,
              currentTotal: totalTokens,
              optimizedSavings: 0,
              estimatedCost: totalTokens * 0.000016,
            },
          };
        }
        case 'MOVE_DOCUMENT_UP': {
          const index = state.selectedDocuments.findIndex(doc => doc.id === action.payload);
          if (index <= 0) return state;
          
          const selectedDocuments = [...state.selectedDocuments];
          selectedDocuments[index] = selectedDocuments[index - 1];
          selectedDocuments[index - 1] = state.selectedDocuments[index];
          
          return {
            ...state,
            selectedDocuments,
          };
        }
        case 'MOVE_DOCUMENT_DOWN': {
          const index = state.selectedDocuments.findIndex(doc => doc.id === action.payload);
          if (index === -1 || index >= state.selectedDocuments.length - 1) return state;
          
          const selectedDocuments = [...state.selectedDocuments];
          selectedDocuments[index] = selectedDocuments[index + 1];
          selectedDocuments[index + 1] = state.selectedDocuments[index];
          
          return {
            ...state,
            selectedDocuments,
          };
        }
        
        // Editor actions
        case 'SET_EDITOR_MODE':
          return {
            ...state,
            editorMode: action.payload,
          };
        case 'TOGGLE_SELECTION_HIGHLIGHTS':
          return {
            ...state,
            showSelectionHighlights: !state.showSelectionHighlights,
          };
        
        // LLM actions
        case 'SET_MODEL':
          return {
            ...state,
            selectedModel: action.payload,
          };
        case 'SET_MAX_TOKENS':
          return {
            ...state,
            maxTokens: action.payload,
          };
        case 'SET_TEMPERATURE':
          return {
            ...state,
            temperature: action.payload,
          };
        case 'SET_PREVIEW_PROMPT':
          return {
            ...state,
            previewPrompt: action.payload,
          };
        
        // Token optimization actions
        case 'OPTIMIZE_TOKENS': {
          // Simulate token optimization (reduce by ~35-45%)
          const originalTotal = state.tokenStats.originalTotal;
          const reductionRate = 0.40 + (Math.random() * 0.10); // 40-50% reduction
          const optimizedSavings = Math.floor(originalTotal * reductionRate);
          const currentTotal = originalTotal - optimizedSavings;
          
          return {
            ...state,
            tokenStats: {
              ...state.tokenStats,
              currentTotal,
              optimizedSavings,
              estimatedCost: currentTotal * 0.000016,
            },
          };
        }
        
        // Preview actions
        case 'GENERATE_PREVIEW': {
          // Simulate LLM response
          let previewContent = '';
          
          if (state.selectedDocuments.length === 0) {
            previewContent = 'Please select documents to include in the context.';
          } else {
            // Generate a reasonable preview based on selected documents
            const intro = `Based on the provided context, I can explain the next-generation context management system:\n\n`;
            
            const keyPoints = state.selectedDocuments.map((doc, index) => {
              return `${index + 1}. **${doc.title}**: ${doc.content.substring(0, 120)}...`;
            }).join('\n\n');
            
            const conclusion = `\n\nThis system represents a significant advancement in how users interact with language models by making context explicit, visual, and controllable, resulting in more efficient token usage and higher quality AI responses.`;
            
            previewContent = intro + keyPoints + conclusion;
          }
          
          return {
            ...state,
            previewResponse: previewContent,
          };
        }
        
        // UI actions
        case 'TOGGLE_TOKEN_VISUALIZATION':
          return {
            ...state,
            showTokenVisualization: !state.showTokenVisualization,
          };
        case 'TOGGLE_GRAPH_VIEW':
          return {
            ...state,
            showGraphView: !state.showGraphView,
          };
        
        default:
          return state;
      }
    };

    // =============================================
    // COMPONENTS
    // =============================================
    
    // Document item component
    const DocumentItem = React.memo(({ document, onSelect }) => {
      return (
        <div 
          className={`p-3 mb-2 border-l-4 ${getSourceBg(document.source)} bg-white rounded shadow-sm hover:bg-gray-50 cursor-pointer transition-colors`}
          onClick={() => onSelect(document)}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium truncate text-sm">{document.title}</h3>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">{document.tokens} tokens</span>
              <span className={`px-1.5 py-0.5 text-xs rounded ${getSourceColor(document.source)}`}>
                {document.source}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-700 my-1 line-clamp-2">{document.content}</p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">{document.category}</span>
            <span className="text-xs text-gray-400">Updated {formatRelativeTime(document.updated)}</span>
          </div>
        </div>
      );
    });
    
    // Selected document item component
    const SelectedDocumentItem = React.memo(({ 
      document, 
      onRemove, 
      onMoveUp, 
      onMoveDown,
      canMoveUp,
      canMoveDown,
      editorMode,
    }) => {
      return (
        <div className="p-3 mb-3 border rounded shadow-sm bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm flex items-center">
              <span className={`w-2 h-2 rounded-full ${document.relevance > 0.8 ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></span>
              {document.title}
            </h3>
            <div className="flex space-x-1">
              <button 
                onClick={() => onMoveUp(document.id)}
                disabled={!canMoveUp}
                className={`h-6 w-6 flex items-center justify-center rounded ${canMoveUp ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                title="Move up"
              >
                <Icon.ChevronUp />
              </button>
              <button 
                onClick={() => onMoveDown(document.id)}
                disabled={!canMoveDown}
                className={`h-6 w-6 flex items-center justify-center rounded ${canMoveDown ? 'hover:bg-gray-200 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                title="Move down"
              >
                <Icon.ChevronDown />
              </button>
              <button 
                onClick={() => onRemove(document.id)}
                className="h-6 w-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50"
                title="Remove"
              >
                <Icon.X />
              </button>
            </div>
          </div>
          
          {editorMode === 'edit' ? (
            <textarea 
              className="w-full p-2 border rounded mt-2 text-sm"
              defaultValue={document.content}
              rows={3}
            />
          ) : (
            <p className="text-xs mt-2 text-gray-700">{document.content}</p>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <span className={`px-1.5 py-0.5 text-xs rounded mr-2 ${getSourceColor(document.source)}`}>
                {document.source}
              </span>
              <span className="text-xs text-gray-500">{document.tokens} tokens</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Relevance:</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                <div 
                  className="h-1.5 bg-green-500 rounded-full" 
                  style={{ width: `${document.relevance * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {editorMode === 'organization' && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                Core Concept
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                Important
              </span>
              <button className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-xs border border-blue-100 hover:bg-blue-100">
                + Add Tag
              </button>
            </div>
          )}
        </div>
      );
    });
    
    // Knowledge Graph component
    const KnowledgeGraph = ({ documents }) => {
      const canvasRef = useRef(null);
      
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
          title: doc.title.substring(0, 15) + (doc.title.length > 15 ? '...' : ''),
          x: 80 + Math.random() * (width - 160),
          y: 80 + Math.random() * (height - 160),
          radius: 15 + (doc.tokens / 100) * 0.5,
          color: getNodeColor(doc.source),
          textColor: getNodeTextColor(doc.source),
          relevance: doc.relevance || 0.5,
        }));
        
        // Create edges (connections between docs)
        const edges = [];
        
        // Connect sequential documents
        for (let i = 0; i < nodes.length - 1; i++) {
          edges.push({
            source: nodes[i],
            target: nodes[i + 1],
            strength: 0.7,
          });
        }
        
        // Connect documents in same category
        const docsByCategory = {};
        documents.forEach((doc, i) => {
          if (!docsByCategory[doc.category]) {
            docsByCategory[doc.category] = [];
          }
          docsByCategory[doc.category].push(i);
        });
        
        // Add category-based connections
        Object.values(docsByCategory).forEach(indices => {
          if (indices.length > 1) {
            for (let i = 0; i < indices.length; i++) {
              for (let j = i + 1; j < indices.length; j++) {
                // Avoid duplicate edges
                if (!edges.some(e => 
                  (e.source === nodes[indices[i]] && e.target === nodes[indices[j]]) || 
                  (e.source === nodes[indices[j]] && e.target === nodes[indices[i]])
                )) {
                  edges.push({
                    source: nodes[indices[i]],
                    target: nodes[indices[j]],
                    strength: 0.3,
                  });
                }
              }
            }
          }
        });
        
        // Simple force-directed layout
        for (let iteration = 0; iteration < 50; iteration++) {
          // Apply repulsive forces between nodes
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[j].x - nodes[i].x;
              const dy = nodes[j].y - nodes[i].y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = 500 / (distance * distance);
              
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
            const force = distance * edge.strength / 10;
            
            edge.source.x += (dx / distance) * force;
            edge.source.y += (dy / distance) * force;
            edge.target.x -= (dx / distance) * force;
            edge.target.y -= (dy / distance) * force;
          }
          
          // Keep nodes within bounds
          for (const node of nodes) {
            node.x = Math.max(node.radius + 5, Math.min(width - node.radius - 5, node.x));
            node.y = Math.max(node.radius + 5, Math.min(height - node.radius - 5, node.y));
          }
        }
        
        // Draw edges
        ctx.lineWidth = 1;
        for (const edge of edges) {
          ctx.strokeStyle = edge.strength > 0.5 ? 'rgba(100, 100, 100, 0.7)' : 'rgba(180, 180, 180, 0.4)';
          ctx.beginPath();
          ctx.moveTo(edge.source.x, edge.source.y);
          ctx.lineTo(edge.target.x, edge.target.y);
          ctx.stroke();
        }
        
        // Draw nodes
        for (const node of nodes) {
          // Draw node circle
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw node border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw relevance indicator
          if (node.relevance > 0) {
            ctx.fillStyle = node.relevance > 0.7 ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(node.x + node.radius - 3, node.y - node.radius + 3, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw node label
          ctx.fillStyle = node.textColor || '#333';
          ctx.font = '9px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x, node.y + node.radius + 10);
        }
      }, [documents]);
      
      // Helper functions for graph colors
      function getNodeColor(source) {
        switch (source) {
          case 'claude': return '#dbeafe';
          case 'gemini': return '#dcfce7';
          case 'github': return '#ffedd5';
          case 'docs': return '#f3e8ff';
          default: return '#f1f5f9';
        }
      }
      
      function getNodeTextColor(source) {
        switch (source) {
          case 'claude': return '#1e40af';
          case 'gemini': return '#166534';
          case 'github': return '#9a3412';
          case 'docs': return '#7e22ce';
          default: return '#334155';
        }
      }
      
      return (
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={180} 
          className="border rounded bg-gray-50"
        />
      );
    };
    
    // Token Visualization component
    const TokenVisualization = ({ tokenStats }) => {
      const { originalTotal, currentTotal, optimizedSavings } = tokenStats;
      const savingsPercentage = originalTotal > 0 
        ? Math.round((optimizedSavings / originalTotal) * 100) 
        : 0;
      
      return (
        <div className="p-3 border rounded bg-white">
          <h3 className="text-sm font-medium mb-2">Token Analysis</h3>
          
          <div className="flex justify-between items-center text-xs mb-1">
            <span>Original:</span>
            <span>{originalTotal.toLocaleString()} tokens</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full token-bar" style={{ width: '100%' }}></div>
          </div>
          
          {optimizedSavings > 0 && (
            <>
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Current:</span>
                <span>{currentTotal.toLocaleString()} tokens</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full token-bar" style={{ width: `${100 - savingsPercentage}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Savings:</span>
                <span className="text-green-600 font-medium">{savingsPercentage}% ({optimizedSavings.toLocaleString()} tokens)</span>
              </div>
            </>
          )}
          
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between items-center text-xs">
              <span>Estimated cost:</span>
              <span>${(currentTotal * 0.000016).toFixed(4)}</span>
            </div>
          </div>
        </div>
      );
    };
    
    // Main Application
    const ContextNexus = () => {
      const [state, dispatch] = useReducer(appReducer, initialState);
      
      // Keyboard shortcuts
      useEffect(() => {
        const handleKeyDown = (e) => {
          // Only handle keyboard shortcuts with modifier keys
          if (!(e.ctrlKey || e.metaKey)) return;
          
          switch (e.key) {
            case '[':
              dispatch({ type: 'TOGGLE_LEFT_PANEL' });
              e.preventDefault();
              break;
            case ']':
              dispatch({ type: 'TOGGLE_RIGHT_PANEL' });
              e.preventDefault();
              break;
            case 'o':
              dispatch({ type: 'OPTIMIZE_TOKENS' });
              e.preventDefault();
              break;
            case 'Enter':
              if (e.shiftKey) {
                dispatch({ type: 'GENERATE_PREVIEW' });
                e.preventDefault();
              }
              break;
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);
      
      // Filter documents based on filters
      const filteredDocuments = useMemo(() => {
        let filtered = [...state.documents];
        
        // Apply source filter
        if (state.sourceFilter !== 'all') {
          filtered = filtered.filter(doc => doc.source === state.sourceFilter);
        }
        
        // Apply category filter
        if (state.categoryFilter !== 'all') {
          filtered = filtered.filter(doc => doc.category === state.categoryFilter);
        }
        
        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(query) || 
            doc.content.toLowerCase().includes(query)
          );
        }
        
        return filtered;
      }, [state.documents, state.sourceFilter, state.categoryFilter, state.searchQuery]);
      
      // Group documents by category
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
      
      // Get unique categories
      const categories = useMemo(() => {
        return ['all', ...new Set(state.documents.map(doc => doc.category))];
      }, [state.documents]);
      
      return (
        <div className="h-screen flex flex-col bg-gray-100">
          {/* Header */}
          <header className="bg-gray-900 text-white px-4 py-2 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-lg font-bold mr-2">ContextNexus</h1>
              <span className="text-sm text-gray-400 hidden md:inline">Advanced Context Management System</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gray-800 rounded-md overflow-hidden hidden md:flex">
                <button className="px-3 py-1 text-sm font-medium bg-blue-600 text-white">Knowledge</button>
                <button className="px-3 py-1 text-sm font-medium text-gray-300 hover:bg-gray-700">Analytics</button>
                <button className="px-3 py-1 text-sm font-medium text-gray-300 hover:bg-gray-700">Settings</button>
              </div>
              
              <div className="flex items-center">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white">
                  CN
                </button>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex flex-1 overflow-hidden">
            {/* Left Panel - Source Navigator */}
            <aside className={`${state.leftPanelCollapsed ? 'w-0 overflow-hidden p-0' : 'w-1/4'} border-r border-gray-200 bg-white transition-all duration-200 ease-in-out flex flex-col`}>
              {/* Panel header with tabs */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeLeftTab === 'documents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: 'documents' })}
                  >
                    Documents
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeLeftTab === 'knowledge' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: 'knowledge' })}
                  >
                    Knowledge
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeLeftTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: 'history' })}
                  >
                    History
                  </button>
                </div>
              </div>
              
              {/* Panel content */}
              <div className="p-3 flex-shrink-0">
                {/* Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full pl-8 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={state.searchQuery}
                    onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                  />
                  <div className="absolute left-2.5 top-2 text-gray-400">
                    <Icon.Search />
                  </div>
                  {state.searchQuery && (
                    <button 
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                      onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
                    >
                      <Icon.X />
                    </button>
                  )}
                </div>
                
                {/* Filter tabs */}
                <div className="mb-3">
                  <h3 className="text-xs text-gray-500 mb-1.5">Source Filter:</h3>
                  <div className="flex flex-wrap gap-1">
                    <button 
                      className={`px-2 py-1 text-xs rounded-md ${state.sourceFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => dispatch({ type: 'SET_SOURCE_FILTER', payload: 'all' })}
                    >
                      All
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded-md ${state.sourceFilter === 'claude' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                      onClick={() => dispatch({ type: 'SET_SOURCE_FILTER', payload: 'claude' })}
                    >
                      Claude
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded-md ${state.sourceFilter === 'gemini' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                      onClick={() => dispatch({ type: 'SET_SOURCE_FILTER', payload: 'gemini' })}
                    >
                      Gemini
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded-md ${state.sourceFilter === 'github' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                      onClick={() => dispatch({ type: 'SET_SOURCE_FILTER', payload: 'github' })}
                    >
                      GitHub
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded-md ${state.sourceFilter === 'docs' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                      onClick={() => dispatch({ type: 'SET_SOURCE_FILTER', payload: 'docs' })}
                    >
                      Docs
                    </button>
                  </div>
                </div>
                
                {/* Knowledge navigator (when Knowledge tab is active) */}
                {state.activeLeftTab === 'knowledge' && (
                  <div className="mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Project: Context Management</span>
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 rounded text-blue-700">Active</span>
                      </div>
                    </div>
                    
                    <div className="mb-2 border rounded-lg overflow-hidden">
                      <div className="p-2 bg-gray-50 border-b flex items-center">
                        <Icon.BookOpen />
                        <span className="ml-1.5 text-sm font-medium">Knowledge Hierarchy</span>
                      </div>
                      <div className="p-2">
                        <div className="p-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center">
                          <span className="mr-1 text-xs">📂</span>
                          <span>Core Concepts</span>
                        </div>
                        <div className="ml-4">
                          <div className="p-1 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer text-sm flex items-center">
                            <span className="mr-1 text-xs">📄</span>
                            <span>System Overview</span>
                          </div>
                          <div className="p-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center">
                            <span className="mr-1 text-xs">📄</span>
                            <span>Limitations</span>
                          </div>
                        </div>
                        <div className="p-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center">
                          <span className="mr-1 text-xs">📂</span>
                          <span>Key Innovations</span>
                        </div>
                        <div className="p-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center">
                          <span className="mr-1 text-xs">📂</span>
                          <span>Implementation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* History view (when History tab is active) */}
                {state.activeLeftTab === 'history' && (
                  <div className="mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Recent Sessions</span>
                      <button className="text-xs text-blue-600 hover:text-blue-800">View All</button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Architecture Review</span>
                          <span className="text-xs text-gray-500">1h ago</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Context: 8 documents, 2.4K tokens</p>
                      </div>
                      
                      <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Implementation Planning</span>
                          <span className="text-xs text-gray-500">Yesterday</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Context: 15 documents, 4.1K tokens</p>
                      </div>
                      
                      <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Token Optimization Tests</span>
                          <span className="text-xs text-gray-500">Mar 10</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Context: 5 documents, 1.8K tokens</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Document list (when Documents tab is active) */}
              {state.activeLeftTab === 'documents' && (
                <div className="flex-1 overflow-y-auto p-3 pt-0">
                  {/* Category selector */}
                  <div className="sticky top-0 pt-3 pb-2 bg-white z-10">
                    <h3 className="text-xs text-gray-500 mb-1.5">Category Filter:</h3>
                    <select
                      className="w-full p-1.5 text-sm border rounded"
                      value={state.categoryFilter}
                      onChange={(e) => dispatch({ type: 'SET_CATEGORY_FILTER', payload: e.target.value })}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Document groups by category */}
                  {Object.entries(documentsByCategory).length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>No documents match your filters.</p>
                      <button 
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => {
                          dispatch({ type: 'SET_SOURCE_FILTER', payload: 'all' });
                          dispatch({ type: 'SET_CATEGORY_FILTER', payload: 'all' });
                          dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    Object.entries(documentsByCategory).map(([category, docs]) => (
                      <div key={category} className="mb-4">
                        <div className="bg-gray-50 p-2 text-sm font-medium rounded-lg flex items-center mb-2">
                          <span className="mr-2">
                            <Icon.FileText />
                          </span>
                          {category}
                          <span className="ml-2 text-xs text-gray-500">({docs.length})</span>
                        </div>
                        
                        <div className="space-y-2">
                          {docs.map(document => (
                            <DocumentItem
                              key={document.id}
                              document={document}
                              onSelect={(doc) => dispatch({ type: 'SELECT_DOCUMENT', payload: doc })}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </aside>
            
            {/* Middle Panel - Ninja Editor */}
            <section className={`flex-1 flex flex-col ${state.leftPanelCollapsed && state.rightPanelCollapsed ? 'w-full' : ''} ${state.leftPanelCollapsed && !state.rightPanelCollapsed ? 'w-2/3' : ''} ${!state.leftPanelCollapsed && state.rightPanelCollapsed ? 'w-3/4' : ''} transition-all duration-200`}>
              {/* Editor header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                <div className="flex items-center">
                  <button 
                    onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-200 mr-1"
                    title={state.leftPanelCollapsed ? "Show source panel" : "Hide source panel"}
                  >
                    <Icon.PanelLeft />
                  </button>
                  <h2 className="font-semibold">Ninja Editor</h2>
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">4.0</span>
                </div>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => dispatch({ type: 'TOGGLE_RIGHT_PANEL' })}
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-200"
                    title={state.rightPanelCollapsed ? "Show preview panel" : "Hide preview panel"}
                  >
                    <Icon.PanelRight />
                  </button>
                </div>
              </div>
              
              {/* Editor toolbar */}
              <div className="px-4 py-2 border-b border-gray-200 bg-white flex flex-wrap gap-2 items-center">
                <div className="flex">
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium rounded-l border ${state.editorMode === 'selection' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'selection' })}
                  >
                    Selection
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium border-t border-b ${state.editorMode === 'organization' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'organization' })}
                  >
                    Organization
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium border-t border-b ${state.editorMode === 'edit' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'edit' })}
                  >
                    Edit
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium rounded-r border ${state.editorMode === 'test' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => dispatch({ type: 'SET_EDITOR_MODE', payload: 'test' })}
                  >
                    Test
                  </button>
                </div>
                
                <div className="ml-auto flex items-center">
                  <button 
                    className="mr-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm border border-blue-200 flex items-center"
                    onClick={() => dispatch({ type: 'TOGGLE_SELECTION_HIGHLIGHTS' })}
                  >
                    <span className="mr-1">
                      <Icon.ZapFast />
                    </span>
                    Ninja Mode {state.showSelectionHighlights ? 'On' : 'Off'}
                  </button>
                  
                  <button 
                    className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm border border-green-200 flex items-center"
                    onClick={() => dispatch({ type: 'OPTIMIZE_TOKENS' })}
                    disabled={state.selectedDocuments.length === 0}
                  >
                    <span className="mr-1">
                      <Icon.ZapFast />
                    </span>
                    Optimize Tokens
                  </button>
                </div>
              </div>
              
              {/* Context path breadcrumb */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Active Context:</span>
                <span className="ml-1 text-blue-600 font-medium">Projects</span>
                <span className="mx-1 text-gray-500">⟩</span>
                <span className="text-blue-600 font-medium">Context Management</span>
                <span className="mx-1 text-gray-500">⟩</span>
                <span className="text-blue-800 font-medium">Core Concepts</span>
              </div>
              
              {/* Test conversation (when in test mode) */}
              {state.editorMode === 'test' && (
                <div className="border-b border-gray-200 p-4">
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium flex items-center">
                        <Icon.User className="mr-1" />
                        You - 10:24 AM
                      </span>
                    </div>
                    <p className="text-sm">Can you explain the main innovations in the context management system?</p>
                  </div>
                  
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium flex items-center">
                        <Icon.Bot className="mr-1" />
                        Assistant - 10:25 AM
                      </span>
                    </div>
                    <p className="text-sm">Based on the provided context, the main innovations in the context management system include rapid content selection, multi-level context organization, dynamic context branching, and intelligent token optimization. These features transform how users interact with LLMs by making the context mechanism explicit, visual, and user-manipulable.</p>
                    <div className="mt-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded mr-1">Core Concepts</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Key Innovations</span>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l text-sm"
                      placeholder="Enter a test message..."
                      defaultValue="How does the token optimization work?"
                    />
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-r hover:bg-blue-700">
                      Send
                    </button>
                  </div>
                </div>
              )}
              
              {/* Selected documents section */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">Selected Context Elements</h3>
                    <span className="text-xs text-gray-500">
                      {state.selectedDocuments.length} document{state.selectedDocuments.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3">
                  {state.selectedDocuments.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <p>No documents selected.</p>
                      <p className="text-sm mt-1">Select documents from the source panel to begin.</p>
                    </div>
                  ) : (
                    <div>
                      {state.selectedDocuments.map((doc, index) => (
                        <SelectedDocumentItem
                          key={doc.id}
                          document={doc}
                          onRemove={(id) => dispatch({ type: 'REMOVE_DOCUMENT', payload: id })}
                          onMoveUp={(id) => dispatch({ type: 'MOVE_DOCUMENT_UP', payload: id })}
                          onMoveDown={(id) => dispatch({ type: 'MOVE_DOCUMENT_DOWN', payload: id })}
                          canMoveUp={index > 0}
                          canMoveDown={index < state.selectedDocuments.length - 1}
                          editorMode={state.editorMode}
                        />
                      ))}
                      
                      {/* AI Suggestions */}
                      {state.selectedDocuments.length > 0 && (
                        <div className="p-3 mb-3 border rounded-lg shadow-sm bg-blue-50 border-blue-200">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-sm flex items-center text-blue-800">
                              <Icon.Bot className="mr-1" />
                              AI Suggestion
                            </h3>
                          </div>
                          <p className="text-xs mt-1 text-blue-800">
                            Based on your selection, I recommend adding "Token Optimization" document for a complete overview.
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <button 
                              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                              onClick={() => {
                                const suggestion = state.documents.find(doc => doc.title === 'Token Optimization');
                                if (suggestion) {
                                  dispatch({ type: 'SELECT_DOCUMENT', payload: suggestion });
                                }
                              }}
                            >
                              Add to context
                            </button>
                            <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">
                              Ignore
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            {/* Right Panel - Preview & Testing */}
            <aside className={`${state.rightPanelCollapsed ? 'w-0 overflow-hidden p-0' : 'w-1/3'} border-l border-gray-200 bg-white transition-all duration-200 ease-in-out flex flex-col`}>
              {/* Panel header with tabs */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeRightTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'preview' })}
                  >
                    Preview
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeRightTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'analysis' })}
                  >
                    Analysis
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${state.activeRightTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'settings' })}
                  >
                    Settings
                  </button>
                </div>
              </div>
              
              {/* Panel content */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* Preview Tab */}
                {state.activeRightTab === 'preview' && (
                  <div>
                    {/* Model selector */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">LLM Model:</label>
                      <select 
                        className="w-full p-2 border rounded text-sm"
                        value={state.selectedModel}
                        onChange={(e) => dispatch({ type: 'SET_MODEL', payload: e.target.value })}
                      >
                        <option value="claude-3">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gpt-4">GPT-4</option>
                      </select>
                    </div>
                    
                    {/* Context Visualization */}
                    {state.showGraphView && (
                      <div className="mb-3 border rounded overflow-hidden">
                        <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
                          <h3 className="text-sm font-medium flex items-center">
                            <Icon.Graph className="mr-1" />
                            Context Visualization
                          </h3>
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => dispatch({ type: 'TOGGLE_GRAPH_VIEW' })}
                          >
                            Hide
                          </button>
                        </div>
                        <div className="p-2 flex justify-center">
                          <KnowledgeGraph documents={state.selectedDocuments} />
                        </div>
                      </div>
                    )}
                    
                    {/* Token Visualization */}
                    {state.showTokenVisualization && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-medium flex items-center">
                            <Icon.List className="mr-1" />
                            Token Analysis
                          </h3>
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => dispatch({ type: 'TOGGLE_TOKEN_VISUALIZATION' })}
                          >
                            Hide
                          </button>
                        </div>
                        <TokenVisualization tokenStats={state.tokenStats} />
                      </div>
                    )}
                    
                    {/* Prompt Testing */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Test Prompt:</label>
                      <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                        value={state.previewPrompt}
                        onChange={(e) => dispatch({ type: 'SET_PREVIEW_PROMPT', payload: e.target.value })}
                      />
                      <button 
                        className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                        onClick={() => dispatch({ type: 'GENERATE_PREVIEW' })}
                        disabled={state.selectedDocuments.length === 0}
                      >
                        <Icon.Bot className="mr-1" />
                        Generate Preview
                      </button>
                    </div>
                    
                    {/* Preview Response */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Response Preview:</label>
                      <div className="w-full p-3 border rounded bg-gray-50 text-sm h-48 overflow-y-auto whitespace-pre-line">
                        {state.previewResponse || 'Generate a preview to see LLM output based on your context.'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Analysis Tab */}
                {state.activeRightTab === 'analysis' && (
                  <div>
                    {/* Document Analysis */}
                    <div className="mb-3 border rounded overflow-hidden">
                      <div className="p-2 border-b bg-gray-50">
                        <h3 className="text-sm font-medium">Context Inspector</h3>
                      </div>
                      
                      {state.selectedDocuments.length > 0 ? (
                        <div className="p-3 text-sm">
                          <h4 className="font-medium text-sm">{state.selectedDocuments[0].title}</h4>
                          <p className="text-xs text-gray-500 mt-1">Part of: Core Concepts</p>
                          
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <span className="ml-1">{formatRelativeTime(state.selectedDocuments[0].created)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Updated:</span>
                              <span className="ml-1">{formatRelativeTime(state.selectedDocuments[0].updated)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-500">Status:</span>
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-500">Relevance:</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${state.selectedDocuments[0].relevance * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Source:</span>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${getSourceColor(state.selectedDocuments[0].source)}`}>
                                {state.selectedDocuments[0].source}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="text-gray-500 mb-1">Tags:</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Core</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Overview</span>
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">High Priority</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="text-gray-500 mb-1">Related Documents:</div>
                            <ul className="space-y-1">
                              <li className="flex justify-between">
                                <span className="text-blue-600 hover:underline cursor-pointer">Context Window Limitations</span>
                                <span className="text-xs text-gray-500">80% related</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-blue-600 hover:underline cursor-pointer">User Experience Benefits</span>
                                <span className="text-xs text-gray-500">75% related</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          Select a document to view details
                        </div>
                      )}
                    </div>
                    
                    {/* Branching Preview */}
                    {state.selectedDocuments.length > 0 && (
                      <div className="mb-3 border rounded overflow-hidden">
                        <div className="p-2 border-b bg-gray-50">
                          <h3 className="text-sm font-medium">Context Branching</h3>
                        </div>
                        <div className="p-3 text-sm">
                          <p className="text-xs text-gray-600 mb-2">Create a specialized branch to focus on specific aspects of the knowledge:</p>
                          
                          <ul className="space-y-1.5 mb-3">
                            <li className="flex items-start">
                              <span className="text-green-500 mr-1">✓</span>
                              <span className="text-xs">Include 5 related knowledge nodes</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-green-500 mr-1">✓</span>
                              <span className="text-xs">Focus on token optimization aspects</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-green-500 mr-1">✓</span>
                              <span className="text-xs">Exclude lower-relevance content</span>
                            </li>
                          </ul>
                          
                          <button className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            Create Branch
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Settings Tab */}
                {state.activeRightTab === 'settings' && (
                  <div>
                    {/* LLM Settings */}
                    <div className="mb-4 border rounded overflow-hidden">
                      <div className="p-2 border-b bg-gray-50">
                        <h3 className="text-sm font-medium">Model Settings</h3>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Tokens:</label>
                          <input
                            type="range"
                            min="1000"
                            max="8000"
                            step="1000"
                            value={state.maxTokens}
                            onChange={(e) => dispatch({ type: 'SET_MAX_TOKENS', payload: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>1,000</span>
                            <span>{state.maxTokens.toLocaleString()}</span>
                            <span>8,000</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Temperature:</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={state.temperature}
                            onChange={(e) => dispatch({ type: 'SET_TEMPERATURE', payload: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Precise (0.0)</span>
                            <span>{state.temperature}</span>
                            <span>Creative (1.0)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interface Settings */}
                    <div className="mb-4 border rounded overflow-hidden">
                      <div className="p-2 border-b bg-gray-50">
                        <h3 className="text-sm font-medium">Interface Settings</h3>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between py-1">
                          <label className="text-sm" htmlFor="show-graph">Show Knowledge Graph</label>
                          <div className="relative inline-block w-10 h-6 cursor-pointer">
                            <input 
                              type="checkbox" 
                              id="show-graph" 
                              className="sr-only"
                              checked={state.showGraphView}
                              onChange={() => dispatch({ type: 'TOGGLE_GRAPH_VIEW' })}
                            />
                            <div className={`block w-10 h-6 rounded-full transition ${state.showGraphView ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${state.showGraphView ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-1">
                          <label className="text-sm" htmlFor="show-tokens">Show Token Analysis</label>
                          <div className="relative inline-block w-10 h-6 cursor-pointer">
                            <input 
                              type="checkbox" 
                              id="show-tokens" 
                              className="sr-only"
                              checked={state.showTokenVisualization}
                              onChange={() => dispatch({ type: 'TOGGLE_TOKEN_VISUALIZATION' })}
                            />
                            <div className={`block w-10 h-6 rounded-full transition ${state.showTokenVisualization ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${state.showTokenVisualization ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between py-1">
                          <label className="text-sm" htmlFor="ninja-mode">Ninja Mode</label>
                          <div className="relative inline-block w-10 h-6 cursor-pointer">
                            <input 
                              type="checkbox" 
                              id="ninja-mode" 
                              className="sr-only"
                              checked={state.showSelectionHighlights}
                              onChange={() => dispatch({ type: 'TOGGLE_SELECTION_HIGHLIGHTS' })}
                            />
                            <div className={`block w-10 h-6 rounded-full transition ${state.showSelectionHighlights ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${state.showSelectionHighlights ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Keyboard Shortcuts */}
                    <div className="border rounded overflow-hidden">
                      <div className="p-2 border-b bg-gray-50">
                        <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
                      </div>
                      <div className="p-3 text-sm">
                        <table className="w-full text-xs">
                          <tbody>
                            <tr>
                              <td className="py-1">Toggle Left Panel</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">[</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Toggle Right Panel</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">]</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Optimize Tokens</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">O</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Generate Preview</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Enter</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Selection Mode</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">1</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Organization Mode</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">2</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Edit Mode</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">3</kbd></td>
                            </tr>
                            <tr>
                              <td className="py-1">Test Mode</td>
                              <td className="text-right"><kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">4</kbd></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </main>
          
          {/* Footer/Status bar */}
          <footer className="bg-gray-900 text-white px-4 py-1 text-xs flex items-center">
            <div className="flex items-center">
              <span className="mr-2">Status:</span>
              <span className="px-1.5 py-0.5 bg-green-600 text-white rounded-full text-xs">Active</span>
            </div>
            <div className="ml-4 flex items-center">
              <span className="mr-2">Project:</span>
              <span>Context Management System</span>
            </div>
            <div className="ml-auto flex items-center">
              <span className="mr-2">Last updated:</span>
              <span>March 14, 2025 - 10:42 AM</span>
            </div>
          </footer>
        </div>
      );
    };

    // Render the application
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ContextNexus />
      </React.StrictMode>
    );
  </script>
</body>
</html>