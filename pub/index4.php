<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContextNexus - Ninja Selection Mode</title>
  
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

    /* Selection indicators */
    .selection-indicator {
      transition: background-color 0.2s ease-in-out;
    }
    
    .selection-indicator.selected {
      background-color: #dbeafe;
    }
    
    .selected-content {
      position: relative;
    }
    
    .selected-content:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #bae6fd;
      opacity: 0.3;
      border-radius: 0.375rem;
      pointer-events: none;
    }
    
    /* Token heat map */
    .token-bar {
      transition: width 0.5s ease-in-out;
    }

    /* Focus style for keyboard navigation */
    .selectable:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    
    /* Keyboard shortcut badges */
    .shortcut-badge {
      background-color: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
  </style>
</head>
<body class="bg-gray-100 h-screen overflow-hidden">
  <div id="root"></div>

  <script type="text/babel">
    // Destructure React hooks
    const { useState, useReducer, useEffect, useRef } = React;

    // =============================================
    // SAMPLE DATA
    // =============================================
    const SAMPLE_MESSAGES = [
      {
        id: 'msg1',
        type: 'user',
        author: 'You',
        avatar: 'VP',
        time: '10:15 AM',
        content: "I need to analyze a large dataset of customer transactions to identify purchasing patterns and predict future behavior. What machine learning techniques would you recommend?",
        tokens: 650,
        isSelected: true,
        shortcut: 'Ctrl+1'
      },
      {
        id: 'msg2',
        type: 'assistant',
        author: 'Assistant',
        avatar: 'AI',
        time: '10:16 AM',
        paragraphs: [
          {
            id: 'para1',
            content: "For analyzing customer transaction data and predicting future behavior, several machine learning approaches can be effective. Let me outline the key techniques and their applications.",
            tokens: 420,
            isSelected: true,
          },
          {
            id: 'para2',
            content: "Recommended ML Techniques:\n1. Clustering (K-means, DBSCAN) - Identify natural groupings of similar customers\n2. Classification (Random Forest, XGBoost) - Predict categorical outcomes like churn\n3. Regression models - Forecast continuous values like future spending",
            tokens: 750,
            isSelected: true,
          },
          {
            id: 'para3',
            content: "Implementation Approach:\nI recommend starting with exploratory data analysis, then feature engineering before applying these models. This will help identify meaningful patterns in your transaction data.",
            tokens: 280,
            isSelected: false,
          }
        ],
        tokens: 1450,
        shortcut: 'Ctrl+2'
      },
      {
        id: 'msg3',
        type: 'code',
        author: 'Code: Customer Clustering Example',
        avatar: 'AI',
        time: '10:17 AM',
        content: `import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Load and prepare transaction data
df = pd.read_csv('customer_transactions.csv')
features = ['frequency', 'recency', 'monetary_value']`,
        tokens: 910,
        isSelected: true,
        shortcut: 'Ctrl+3'
      }
    ];

    // =============================================
    // ICON COMPONENTS
    // =============================================
    const Icon = {
      Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
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
      Code: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      )
    };

    // =============================================
    // STATE MANAGEMENT
    // =============================================
    
    // Initial state
    const initialState = {
      messages: SAMPLE_MESSAGES,
      selectionMode: 'ninja', // 'ninja', 'visual', 'smart'
      contentFilter: 'all', // 'all', 'code', 'lists', 'images', 'user', 'ai'
      tokens: {
        total: 10000,
        selected: 7021,
        percentSelected: 70
      }
    };
    
    // Reducer function
    const appReducer = (state, action) => {
      switch (action.type) {
        case 'SET_SELECTION_MODE':
          return {
            ...state,
            selectionMode: action.payload
          };
        
        case 'SET_CONTENT_FILTER':
          return {
            ...state,
            contentFilter: action.payload
          };
        
        case 'TOGGLE_MESSAGE_SELECTION': {
          const messageId = action.payload;
          const updatedMessages = state.messages.map(message => {
            if (message.id === messageId) {
              // If this is a normal message, toggle its selection
              if (!message.paragraphs) {
                return {
                  ...message,
                  isSelected: !message.isSelected
                };
              }
              // If this is a message with paragraphs, toggle all paragraphs
              else {
                const allSelected = message.paragraphs.every(p => p.isSelected);
                const updatedParagraphs = message.paragraphs.map(p => ({
                  ...p,
                  isSelected: !allSelected
                }));
                return {
                  ...message,
                  paragraphs: updatedParagraphs
                };
              }
            }
            return message;
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        case 'TOGGLE_PARAGRAPH_SELECTION': {
          const { messageId, paragraphId } = action.payload;
          const updatedMessages = state.messages.map(message => {
            if (message.id === messageId && message.paragraphs) {
              const updatedParagraphs = message.paragraphs.map(p => {
                if (p.id === paragraphId) {
                  return {
                    ...p,
                    isSelected: !p.isSelected
                  };
                }
                return p;
              });
              return {
                ...message,
                paragraphs: updatedParagraphs
              };
            }
            return message;
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        case 'SELECT_ALL_CODE': {
          const updatedMessages = state.messages.map(message => {
            if (message.type === 'code') {
              return {
                ...message,
                isSelected: true
              };
            }
            return message;
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        case 'SELECT_ALL_LISTS': {
          // Find paragraphs that contain lists (starting with numbers or bullets)
          const listRegex = /^\s*(\d+\.\s|\*\s|-\s)/m;
          
          const updatedMessages = state.messages.map(message => {
            if (message.paragraphs) {
              const updatedParagraphs = message.paragraphs.map(p => {
                if (listRegex.test(p.content)) {
                  return {
                    ...p,
                    isSelected: true
                  };
                }
                return p;
              });
              return {
                ...message,
                paragraphs: updatedParagraphs
              };
            }
            return message;
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        case 'INVERT_SELECTION': {
          const updatedMessages = state.messages.map(message => {
            if (message.paragraphs) {
              const updatedParagraphs = message.paragraphs.map(p => ({
                ...p,
                isSelected: !p.isSelected
              }));
              return {
                ...message,
                paragraphs: updatedParagraphs
              };
            }
            return {
              ...message,
              isSelected: !message.isSelected
            };
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        case 'ADD_IMPLEMENTATION_SECTION': {
          const updatedMessages = state.messages.map(message => {
            if (message.id === 'msg2' && message.paragraphs) {
              const updatedParagraphs = message.paragraphs.map(p => {
                if (p.id === 'para3') {
                  return {
                    ...p,
                    isSelected: true
                  };
                }
                return p;
              });
              return {
                ...message,
                paragraphs: updatedParagraphs
              };
            }
            return message;
          });
          
          // Recalculate token stats
          const selected = countSelectedTokens(updatedMessages);
          
          return {
            ...state,
            messages: updatedMessages,
            tokens: {
              ...state.tokens,
              selected,
              percentSelected: Math.round((selected / state.tokens.total) * 100)
            }
          };
        }
        
        default:
          return state;
      }
    };
    
    // Helper function to count selected tokens
    const countSelectedTokens = (messages) => {
      let count = 0;
      
      messages.forEach(message => {
        if (message.paragraphs) {
          message.paragraphs.forEach(p => {
            if (p.isSelected) {
              count += p.tokens;
            }
          });
        } else if (message.isSelected) {
          count += message.tokens;
        }
      });
      
      return count;
    };

    // =============================================
    // COMPONENTS
    // =============================================
    
    // Header Component
    const Header = ({ tokens }) => {
      return (
        <header className="bg-gray-900 text-white px-6 py-3 flex items-center">
          <h1 className="text-xl font-semibold mr-4">ContextNexus</h1>
          <span className="text-gray-400 mr-6">Advanced Selection Mode</span>
          
          {/* Status Bar - Token Selection */}
          <div className="bg-gray-800 rounded-full w-48 h-7 flex items-center px-1 mr-4">
            <div className="h-5 bg-gray-700 rounded-full overflow-hidden" style={{ width: `${tokens.percentSelected}%` }}>
              <div className="h-full bg-blue-500 rounded-full"></div>
            </div>
            <span className="ml-2 text-sm">{tokens.percentSelected}% selected</span>
          </div>
          
          {/* Token Counter */}
          <div className="bg-gray-800 rounded-full px-4 py-1 mr-4">
            <span className="text-sm">{tokens.selected.toLocaleString()} / {tokens.total.toLocaleString()} tokens</span>
          </div>
          
          {/* Apply Button */}
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-full">
            Apply
          </button>
          
          {/* User Avatar */}
          <div className="ml-auto bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center">
            <span>VP</span>
          </div>
        </header>
      );
    };
    
    // Selection Toolbar Component
    const SelectionToolbar = ({ selectionMode, contentFilter, dispatch }) => {
      return (
        <div className="bg-gray-200 px-6 py-2 flex items-center">
          {/* Selection Modes */}
          <div className="flex space-x-2 mr-10">
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${selectionMode === 'ninja' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_SELECTION_MODE', payload: 'ninja' })}
            >
              Ninja Mode
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${selectionMode === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_SELECTION_MODE', payload: 'visual' })}
            >
              Visual Mode
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${selectionMode === 'smart' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_SELECTION_MODE', payload: 'smart' })}
            >
              Smart Select
            </button>
          </div>
          
          {/* Content Filters */}
          <div className="flex space-x-2">
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'all' })}
            >
              All
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'code' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'code' })}
            >
              Code
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'lists' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'lists' })}
            >
              Lists
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'images' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'images' })}
            >
              Images
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'user' })}
            >
              User
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm ${contentFilter === 'ai' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => dispatch({ type: 'SET_CONTENT_FILTER', payload: 'ai' })}
            >
              AI
            </button>
          </div>
        </div>
      );
    };
    
    // Message Component
    const Message = ({ message, dispatch }) => {
      if (message.type === 'user') {
        return (
          <UserMessage message={message} dispatch={dispatch} />
        );
      } else if (message.type === 'assistant') {
        return (
          <AssistantMessage message={message} dispatch={dispatch} />
        );
      } else if (message.type === 'code') {
        return (
          <CodeMessage message={message} dispatch={dispatch} />
        );
      }
      
      return null;
    };
    
    // User Message Component
    const UserMessage = ({ message, dispatch }) => {
      return (
        <div className="mb-4 flex">
          {/* Selection control */}
          <div className="w-8 bg-gray-50 rounded-l-lg flex flex-col items-center pt-2.5">
            <div 
              className={`w-5 h-5 rounded ${message.isSelected ? 'bg-blue-100' : 'bg-gray-200'} flex items-center justify-center cursor-pointer selectable`}
              tabIndex="0"
              onClick={() => dispatch({ type: 'TOGGLE_MESSAGE_SELECTION', payload: message.id })}
              data-id={message.id}
            >
              {message.isSelected && <Icon.Check className="text-blue-500" />}
            </div>
            <div className="text-xs text-gray-500 mt-1">{message.id.replace('msg', '')}</div>
          </div>
          
          {/* Message content */}
          <div className={`flex-1 p-4 rounded-r-lg border ${message.isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            {/* Message header */}
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                {message.avatar}
              </div>
              <div className="font-medium">{message.author}</div>
              <div className="text-gray-500 text-sm ml-2">{message.time}</div>
              
              {/* Keyboard shortcut */}
              <div className="ml-auto shortcut-badge">
                {message.shortcut}
              </div>
            </div>
            
            {/* Message body */}
            <div className={`whitespace-pre-line ${message.isSelected ? 'selected-content' : ''}`}>
              {message.content}
            </div>
          </div>
        </div>
      );
    };
    
    // Assistant Message Component with Paragraph-Level Selection
    const AssistantMessage = ({ message, dispatch }) => {
      return (
        <div className="mb-4 flex">
          {/* Selection control */}
          <div className="w-8 bg-gray-50 rounded-l-lg flex flex-col items-center pt-2.5">
            <div 
              className={`w-5 h-5 rounded bg-gray-200 flex items-center justify-center cursor-pointer selectable`}
              tabIndex="0"
              onClick={() => dispatch({ type: 'TOGGLE_MESSAGE_SELECTION', payload: message.id })}
              data-id={message.id}
            >
              {message.paragraphs && message.paragraphs.every(p => p.isSelected) && 
                <Icon.Check className="text-blue-500" />
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">{message.id.replace('msg', '')}</div>
            
            {/* Paragraph selectors */}
            {message.paragraphs && message.paragraphs.map((para, index) => (
              <div 
                key={para.id} 
                className="mt-6 first:mt-3"
              >
                <div 
                  className={`w-5 h-5 rounded ${para.isSelected ? 'bg-blue-100' : 'bg-gray-200'} flex items-center justify-center cursor-pointer selectable`}
                  tabIndex="0"
                  onClick={() => dispatch({ 
                    type: 'TOGGLE_PARAGRAPH_SELECTION', 
                    payload: { messageId: message.id, paragraphId: para.id } 
                  })}
                  data-id={para.id}
                >
                  {para.isSelected && <Icon.Check className="text-blue-500" />}
                </div>
                <div className="text-xs text-gray-500 mt-1">{message.id.replace('msg', '')}.{index + 1}</div>
              </div>
            ))}
          </div>
          
          {/* Message content */}
          <div className="flex-1 p-4 rounded-r-lg border bg-white border-gray-200">
            {/* Message header */}
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                {message.avatar}
              </div>
              <div className="font-medium">{message.author}</div>
              <div className="text-gray-500 text-sm ml-2">{message.time}</div>
              
              {/* Keyboard shortcut */}
              <div className="ml-auto shortcut-badge">
                {message.shortcut}
              </div>
            </div>
            
            {/* Message body with paragraph-level selection */}
            <div>
              {message.paragraphs.map((para, index) => (
                <div 
                  key={para.id} 
                  className={`py-2 ${index !== 0 ? 'mt-3' : ''} ${para.isSelected ? 'selected-content' : ''}`}
                >
                  {index === 1 && <div className="font-medium text-blue-800 mb-1">Recommended ML Techniques:</div>}
                  {index === 2 && <div className="font-medium text-blue-800 mb-1">Implementation Approach:</div>}
                  {para.content.split('\n').map((line, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      {line}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };
    
    // Code Message Component
    const CodeMessage = ({ message, dispatch }) => {
      return (
        <div className="mb-4 flex">
          {/* Selection control */}
          <div className="w-8 bg-gray-50 rounded-l-lg flex flex-col items-center pt-2.5">
            <div 
              className={`w-5 h-5 rounded ${message.isSelected ? 'bg-blue-100' : 'bg-gray-200'} flex items-center justify-center cursor-pointer selectable`}
              tabIndex="0"
              onClick={() => dispatch({ type: 'TOGGLE_MESSAGE_SELECTION', payload: message.id })}
              data-id={message.id}
            >
              {message.isSelected && <Icon.Check className="text-blue-500" />}
            </div>
            <div className="text-xs text-gray-500 mt-1">{message.id.replace('msg', '')}</div>
          </div>
          
          {/* Message content */}
          <div className={`flex-1 p-4 rounded-r-lg border ${message.isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
            {/* Message header */}
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                {message.avatar}
              </div>
              <div className="font-medium">{message.author}</div>
              <div className="text-gray-500 text-sm ml-2">{message.time}</div>
              
              {/* Keyboard shortcut */}
              <div className="ml-auto shortcut-badge">
                {message.shortcut}
              </div>
            </div>
            
            {/* Code block */}
            <div className={`${message.isSelected ? 'selected-content' : ''}`}>
              <pre className="bg-gray-100 p-3 rounded border border-gray-300 text-sm font-mono overflow-x-auto whitespace-pre">
                {message.content}
              </pre>
            </div>
          </div>
        </div>
      );
    };
    
    // Active Selection Footer
    const ActiveSelectionFooter = ({ state, dispatch }) => {
      const selectedItems = [];
      
      // Collect all selected items
      state.messages.forEach(message => {
        if (message.paragraphs) {
          message.paragraphs.forEach(para => {
            if (para.isSelected) {
              if (para.id === 'para1') {
                selectedItems.push('Intro');
              } else if (para.id === 'para2') {
                selectedItems.push('ML Techniques');
              } else if (para.id === 'para3') {
                selectedItems.push('Implementation');
              }
            }
          });
        } else if (message.isSelected) {
          if (message.type === 'user') {
            selectedItems.push('Message 1');
          } else if (message.type === 'code') {
            selectedItems.push('Code Block');
          }
        }
      });
      
      return (
        <div className="bg-gray-800 text-white p-4 rounded-lg fixed bottom-4 left-4 right-4 mx-auto max-w-[850px] flex items-center justify-between">
          <div>
            <span className="font-medium">Active Selection:</span> {selectedItems.join(', ')} ({state.tokens.selected.toLocaleString()} tokens) — 
            <span className="ml-1 text-gray-300">
              Space to toggle • Tab to navigate • F to filter
            </span>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-1.5 rounded-full">
            Apply
          </button>
        </div>
      );
    };
    
    // Context Panel Components
    
    // Token Heat Map Component
    const TokenHeatMap = ({ messages }) => {
      return (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-blue-900 font-medium mb-2">Token Heat Map</h2>
          
          <div className="space-y-2">
            {messages.map(message => {
              let rows = [];
              
              if (message.paragraphs) {
                message.paragraphs.forEach((para, index) => {
                  let bgColor, textColor;
                  
                  if (para.isSelected) {
                    if (para.tokens > 700) {
                      bgColor = 'bg-blue-600';
                      textColor = 'text-white';
                    } else if (para.tokens > 400) {
                      bgColor = 'bg-blue-500';
                      textColor = 'text-white';
                    } else {
                      bgColor = 'bg-blue-400';
                      textColor = 'text-white';
                    }
                  } else {
                    bgColor = 'bg-blue-100 opacity-30';
                    textColor = 'text-gray-400';
                  }
                  
                  let label;
                  if (index === 0) {
                    label = 'Message 2.1 (Intro)';
                  } else if (index === 1) {
                    label = 'Message 2.2 (Techniques)';
                  } else {
                    label = 'Message 2.3 (Implementation)';
                  }
                  
                  rows.push(
                    <div key={para.id} className={`${bgColor} ${textColor} rounded-full px-3 py-1 flex justify-between`}>
                      <span>{label}</span>
                      <span>{para.tokens.toLocaleString()} tokens</span>
                    </div>
                  );
                });
              } else {
                let bgColor, textColor;
                
                if (message.isSelected) {
                  if (message.tokens > 700) {
                    bgColor = 'bg-blue-600';
                    textColor = 'text-white';
                  } else if (message.tokens > 400) {
                    bgColor = 'bg-blue-500';
                    textColor = 'text-white';
                  } else {
                    bgColor = 'bg-blue-400';
                    textColor = 'text-white';
                  }
                } else {
                  bgColor = 'bg-blue-100 opacity-30';
                  textColor = 'text-gray-400';
                }
                
                let label;
                if (message.type === 'user') {
                  label = 'Message 1 (User)';
                } else if (message.type === 'code') {
                  label = 'Message 3 (Code)';
                }
                
                rows.push(
                  <div key={message.id} className={`${bgColor} ${textColor} rounded-full px-3 py-1 flex justify-between`}>
                    <span>{label}</span>
                    <span>{message.tokens.toLocaleString()} tokens</span>
                  </div>
                );
              }
              
              return rows;
            })}
          </div>
        </div>
      );
    };
    
    // Ninja Selection Tools Component
    const NinjaSelectionTools = ({ dispatch }) => {
      return (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-blue-900 font-medium mb-2">Ninja Selection Tools</h2>
          
          <div className="space-y-2">
            <div 
              className="bg-blue-100 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-blue-200"
              onClick={() => dispatch({ type: 'SELECT_ALL_CODE' })}
            >
              <span className="text-blue-900">Ctrl+Alt+C</span>
              <span className="text-blue-900">Select All Code Blocks</span>
            </div>
            
            <div 
              className="bg-blue-100 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-blue-200"
              onClick={() => dispatch({ type: 'SELECT_ALL_LISTS' })}
            >
              <span className="text-blue-900">Ctrl+Alt+L</span>
              <span className="text-blue-900">Select All Lists</span>
            </div>
            
            <div 
              className="bg-blue-100 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-blue-200"
              onClick={() => dispatch({ type: 'INVERT_SELECTION' })}
            >
              <span className="text-blue-900">Ctrl+I</span>
              <span className="text-blue-900">Invert Selection</span>
            </div>
            
            <div 
              className="bg-blue-100 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-blue-200"
            >
              <span className="text-blue-900">Alt+R</span>
              <span className="text-blue-900">Select by Relevance</span>
            </div>
          </div>
        </div>
      );
    };
    
    // Smart Suggestion Component
    const SmartSuggestion = ({ dispatch }) => {
      return (
        <div className="p-4 bg-blue-100 rounded-lg">
          <h2 className="text-blue-900 font-medium mb-2">Smart Context Suggestion</h2>
          
          <p className="text-blue-800 mb-3">
            Consider adding the implementation section to balance theoretical and practical context (+ 280 tokens)
          </p>
          
          <div className="flex justify-end">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full flex items-center"
              onClick={() => dispatch({ type: 'ADD_IMPLEMENTATION_SECTION' })}
            >
              <Icon.Plus className="mr-1" />
              Add Section
            </button>
          </div>
        </div>
      );
    };
    
    // Main Application
    const App = () => {
      const [state, dispatch] = useReducer(appReducer, initialState);
      
      // Keyboard shortcuts
      useEffect(() => {
        const handleKeyDown = (e) => {
          // Toggle selection on space
          if (e.code === 'Space' && document.activeElement.classList.contains('selectable')) {
            e.preventDefault();
            const id = document.activeElement.dataset.id;
            
            if (id.startsWith('para')) {
              // Find which message this paragraph belongs to
              const messageId = state.messages.find(m => 
                m.paragraphs && m.paragraphs.some(p => p.id === id)
              )?.id;
              
              if (messageId) {
                dispatch({ 
                  type: 'TOGGLE_PARAGRAPH_SELECTION', 
                  payload: { messageId, paragraphId: id } 
                });
              }
            } else {
              dispatch({ type: 'TOGGLE_MESSAGE_SELECTION', payload: id });
            }
          }
          
          // Ctrl+Alt+C to select all code
          if (e.ctrlKey && e.altKey && e.code === 'KeyC') {
            e.preventDefault();
            dispatch({ type: 'SELECT_ALL_CODE' });
          }
          
          // Ctrl+Alt+L to select all lists
          if (e.ctrlKey && e.altKey && e.code === 'KeyL') {
            e.preventDefault();
            dispatch({ type: 'SELECT_ALL_LISTS' });
          }
          
          // Ctrl+I to invert selection
          if (e.ctrlKey && e.code === 'KeyI') {
            e.preventDefault();
            dispatch({ type: 'INVERT_SELECTION' });
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [state.messages]);
      
      return (
        <div className="h-screen flex flex-col overflow-hidden">
          <Header tokens={state.tokens} />
          <SelectionToolbar 
            selectionMode={state.selectionMode} 
            contentFilter={state.contentFilter} 
            dispatch={dispatch} 
          />
          
          <div className="flex flex-1 overflow-hidden">
            {/* Main content area */}
            <div className="w-2/3 bg-gray-100 p-4 overflow-y-auto">
              {state.messages.map(message => (
                <Message key={message.id} message={message} dispatch={dispatch} />
              ))}
              
              {/* Spacer for the fixed footer */}
              <div className="h-20"></div>
            </div>
            
            {/* Right context panel */}
            <div className="w-1/3 bg-white p-4 border-l border-gray-200 overflow-y-auto">
              {/* Selection Stats */}
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-blue-900 font-medium mb-2">Current Selection</h2>
                <p>5 items selected (70% of context)</p>
                <p className="mt-1">Focused on ML techniques and code</p>
              </div>
              
              {/* Token Heat Map */}
              <TokenHeatMap messages={state.messages} />
              
              {/* Ninja Selection Tools */}
              <NinjaSelectionTools dispatch={dispatch} />
              
              {/* Smart Suggestion */}
              <SmartSuggestion dispatch={dispatch} />
            </div>
          </div>
          
          {/* Active Selection Footer */}
          <ActiveSelectionFooter state={state} dispatch={dispatch} />
        </div>
      );
    };

    // Render the application
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>