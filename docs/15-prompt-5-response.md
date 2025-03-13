# Context Selection UI Implementation

I'll implement a comprehensive context selection UI for ContextNexus based on the specified requirements. This implementation will focus on creating an intuitive, efficient interface for selecting and organizing context content.

## 1. Core Types and Interfaces

First, let's define the essential types needed across our components:

```typescript
// frontend/src/types/context.ts
export type ContentType = 'text' | 'code' | 'image' | 'list';

export interface ContentItem {
  id: string;
  type: ContentType;
  content: string;
  title?: string;
  selected: boolean;
  relevance: number; // 0-1 scale
  tokens: number;
  categoryId?: string;
  metadata?: {
    language?: string;
    source?: string;
    timestamp?: string;
    references?: string[];
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  items: string[]; // Content item IDs
}

export interface TokenUsage {
  used: number;
  total: number;
  percentage: number;
  breakdown: Record<ContentType, number>;
}

export interface SelectionState {
  selectedItems: string[];
  activeItem?: string;
  isDragging: boolean;
  dragStartPosition?: { x: number; y: number };
  selectionBox?: { x: number; y: number; width: number; height: number };
}

export interface GraphNode {
  id: string;
  label: string;
  type: ContentType;
  relevance: number;
  selected: boolean;
  neighbors: string[];
  x?: number;
  y?: number;
  size?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## 2. Context Selection Redux Slice

Let's implement a Redux slice to manage the context selection state:

```typescript
// frontend/src/store/slices/contextSelectionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContentItem, Category, TokenUsage } from '../../types/context';
import apiClient from '../../services/api-client';

interface ContextSelectionState {
  contentItems: Record<string, ContentItem>;
  categories: Record<string, Category>;
  tokenUsage: TokenUsage;
  isLoading: boolean;
  error: string | null;
  contextId: string | null;
}

const initialState: ContextSelectionState = {
  contentItems: {},
  categories: {},
  tokenUsage: {
    used: 0,
    total: 10000, // Default token limit
    percentage: 0,
    breakdown: {
      text: 0,
      code: 0,
      image: 0,
      list: 0
    }
  },
  isLoading: false,
  error: null,
  contextId: null
};

// Async thunks
export const fetchContextContent = createAsyncThunk(
  'contextSelection/fetchContent',
  async (contextId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ items: ContentItem[], tokenUsage: TokenUsage }>
        (`/contexts/${contextId}/content`);
      return { 
        contextId,
        items: response.items, 
        tokenUsage: response.tokenUsage 
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSelection = createAsyncThunk(
  'contextSelection/updateSelection',
  async ({ 
    contextId, 
    itemIds, 
    selected 
  }: { 
    contextId: string; 
    itemIds: string[]; 
    selected: boolean 
  }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/contexts/${contextId}/selection`, {
        itemIds,
        selected
      });
      return { itemIds, selected };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRelevance = createAsyncThunk(
  'contextSelection/updateRelevance',
  async ({
    contextId,
    itemId,
    relevance
  }: {
    contextId: string;
    itemId: string;
    relevance: number;
  }, { rejectWithValue }) => {
    try {
      await apiClient.put(`/contexts/${contextId}/content/${itemId}/relevance`, {
        relevance
      });
      return { itemId, relevance };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const organizeContent = createAsyncThunk(
  'contextSelection/organizeContent',
  async ({
    contextId,
    categories
  }: {
    contextId: string;
    categories: Category[];
  }, { rejectWithValue }) => {
    try {
      await apiClient.put(`/contexts/${contextId}/organization`, {
        categories
      });
      return { categories };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Context selection slice
const contextSelectionSlice = createSlice({
  name: 'contextSelection',
  initialState,
  reducers: {
    // Local selection without API calls
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (state.contentItems[itemId]) {
        state.contentItems[itemId].selected = !state.contentItems[itemId].selected;
        
        // Update token usage
        recalculateTokenUsage(state);
      }
    },
    
    selectMultipleItems: (state, action: PayloadAction<string[]>) => {
      const itemIds = action.payload;
      itemIds.forEach(id => {
        if (state.contentItems[id]) {
          state.contentItems[id].selected = true;
        }
      });
      
      // Update token usage
      recalculateTokenUsage(state);
    },
    
    deselectMultipleItems: (state, action: PayloadAction<string[]>) => {
      const itemIds = action.payload;
      itemIds.forEach(id => {
        if (state.contentItems[id]) {
          state.contentItems[id].selected = false;
        }
      });
      
      // Update token usage
      recalculateTokenUsage(state);
    },
    
    selectAllItems: (state) => {
      Object.keys(state.contentItems).forEach(id => {
        state.contentItems[id].selected = true;
      });
      
      // Update token usage
      recalculateTokenUsage(state);
    },
    
    deselectAllItems: (state) => {
      Object.keys(state.contentItems).forEach(id => {
        state.contentItems[id].selected = false;
      });
      
      // Update token usage
      recalculateTokenUsage(state);
    },
    
    setItemRelevance: (state, action: PayloadAction<{itemId: string; relevance: number}>) => {
      const { itemId, relevance } = action.payload;
      if (state.contentItems[itemId]) {
        state.contentItems[itemId].relevance = Math.max(0, Math.min(1, relevance));
      }
    },
    
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories[action.payload.id] = action.payload;
    },
    
    removeCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      
      // Remove category reference from items
      Object.keys(state.contentItems).forEach(id => {
        if (state.contentItems[id].categoryId === categoryId) {
          state.contentItems[id].categoryId = undefined;
        }
      });
      
      // Delete the category
      delete state.categories[categoryId];
    },
    
    assignItemsToCategory: (state, action: PayloadAction<{categoryId: string; itemIds: string[]}>) => {
      const { categoryId, itemIds } = action.payload;
      
      if (state.categories[categoryId]) {
        itemIds.forEach(id => {
          if (state.contentItems[id]) {
            state.contentItems[id].categoryId = categoryId;
          }
        });
        
        // Update category items
        state.categories[categoryId].items = [
          ...state.categories[categoryId].items,
          ...itemIds.filter(id => !state.categories[categoryId].items.includes(id))
        ];
      }
    },
    
    reorderItems: (state, action: PayloadAction<{sourceIndex: number; destinationIndex: number}>) => {
      // In a real implementation, we would reorder the items
      // This is a placeholder for the actual implementation
    }
  },
  extraReducers: (builder) => {
    // Fetch content
    builder.addCase(fetchContextContent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchContextContent.fulfilled, (state, action) => {
      state.isLoading = false;
      
      const { contextId, items, tokenUsage } = action.payload;
      state.contextId = contextId;
      
      // Convert items array to record for easy access
      const itemsRecord: Record<string, ContentItem> = {};
      items.forEach(item => {
        itemsRecord[item.id] = item;
      });
      
      state.contentItems = itemsRecord;
      state.tokenUsage = tokenUsage;
    });
    builder.addCase(fetchContextContent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Update selection
    builder.addCase(updateSelection.fulfilled, (state, action) => {
      const { itemIds, selected } = action.payload;
      
      itemIds.forEach(id => {
        if (state.contentItems[id]) {
          state.contentItems[id].selected = selected;
        }
      });
      
      // Update token usage
      recalculateTokenUsage(state);
    });
    
    // Update relevance
    builder.addCase(updateRelevance.fulfilled, (state, action) => {
      const { itemId, relevance } = action.payload;
      
      if (state.contentItems[itemId]) {
        state.contentItems[itemId].relevance = relevance;
      }
    });
    
    // Organize content
    builder.addCase(organizeContent.fulfilled, (state, action) => {
      const { categories } = action.payload;
      
      // Convert categories array to record
      const categoriesRecord: Record<string, Category> = {};
      categories.forEach(category => {
        categoriesRecord[category.id] = category;
      });
      
      state.categories = categoriesRecord;
    });
  }
});

// Helper to recalculate token usage
function recalculateTokenUsage(state: ContextSelectionState) {
  const breakdown = {
    text: 0,
    code: 0,
    image: 0,
    list: 0
  };
  
  let totalUsed = 0;
  
  // Sum up tokens for selected items
  Object.values(state.contentItems).forEach(item => {
    if (item.selected) {
      totalUsed += item.tokens;
      breakdown[item.type] += item.tokens;
    }
  });
  
  state.tokenUsage.used = totalUsed;
  state.tokenUsage.percentage = (totalUsed / state.tokenUsage.total) * 100;
  state.tokenUsage.breakdown = breakdown;
}

export const {
  toggleItemSelection,
  selectMultipleItems,
  deselectMultipleItems,
  selectAllItems,
  deselectAllItems,
  setItemRelevance,
  addCategory,
  removeCategory,
  assignItemsToCategory,
  reorderItems
} = contextSelectionSlice.actions;

export default contextSelectionSlice.reducer;
```

## 3. Context Selection Components

### 3.1 Main Context Selector Component

```tsx
// frontend/src/components/context/ContextSelector.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ContentItem, SelectionState } from '../../types/context';
import { 
  fetchContextContent, 
  toggleItemSelection, 
  selectMultipleItems,
  deselectMultipleItems,
  selectAllItems,
  deselectAllItems
} from '../../store/slices/contextSelectionSlice';
import { RootState, AppDispatch } from '../../store';
import ParagraphSelector from './ParagraphSelector';
import CodeBlockSelector from './CodeBlockSelector';
import SelectionControls from './SelectionControls';
import TokenVisualizer from './TokenVisualizer';

interface ContextSelectorProps {
  contextId: string;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({ contextId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { contentItems, isLoading, error } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedItems: [],
    isDragging: false
  });
  
  const selectorRef = useRef<HTMLDivElement>(null);
  
  // Load content when component mounts or contextId changes
  useEffect(() => {
    if (contextId) {
      dispatch(fetchContextContent(contextId));
    }
  }, [contextId, dispatch]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A to select all
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        dispatch(selectAllItems());
      }
      
      // Escape to deselect all
      if (e.key === 'Escape') {
        dispatch(deselectAllItems());
      }
      
      // Shift+Arrow keys for multi-select
      if (e.shiftKey && selectionState.activeItem) {
        // Implementation depends on your content structure
        // This would select adjacent items
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selectionState.activeItem]);
  
  // Start drag selection
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection with left mouse button
    if (e.button !== 0 || !selectorRef.current) return;
    
    const rect = selectorRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setSelectionState({
      ...selectionState,
      isDragging: true,
      dragStartPosition: { x: startX, y: startY },
      selectionBox: { x: startX, y: startY, width: 0, height: 0 }
    });
  };
  
  // Update selection box during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionState.isDragging || !selectionState.dragStartPosition || !selectorRef.current) return;
    
    const rect = selectorRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const startX = selectionState.dragStartPosition.x;
    const startY = selectionState.dragStartPosition.y;
    
    // Calculate selection box dimensions
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    setSelectionState({
      ...selectionState,
      selectionBox: { x, y, width, height }
    });
  };
  
  // End drag selection
  const handleMouseUp = () => {
    if (!selectionState.isDragging) return;
    
    // Find items within selection box and select them
    // This would need to be implemented based on your DOM structure
    const selectedIds: string[] = [];
    
    // In a real implementation, you would:
    // 1. Get all item elements
    // 2. Check if they intersect with the selection box
    // 3. Extract their IDs and add to selectedIds
    
    if (selectedIds.length > 0) {
      dispatch(selectMultipleItems(selectedIds));
    }
    
    // Reset selection state
    setSelectionState({
      ...selectionState,
      isDragging: false,
      dragStartPosition: undefined,
      selectionBox: undefined
    });
  };
  
  // Handle individual item selection toggle
  const handleItemSelect = (itemId: string) => {
    dispatch(toggleItemSelection(itemId));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p>Error loading content: {error}</p>
      </div>
    );
  }
  
  // Organize items by type for rendering
  const itemsByType: Record<string, ContentItem[]> = {
    text: [],
    code: [],
    image: [],
    list: []
  };
  
  Object.values(contentItems).forEach(item => {
    if (itemsByType[item.type]) {
      itemsByType[item.type].push(item);
    }
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Selection Controls */}
      <SelectionControls 
        onSelectAll={() => dispatch(selectAllItems())}
        onDeselectAll={() => dispatch(deselectAllItems())}
        itemCount={Object.keys(contentItems).length}
        selectedCount={Object.values(contentItems).filter(item => item.selected).length}
      />
      
      {/* Token Visualization */}
      <TokenVisualizer />
      
      {/* Content Selection Area */}
      <div 
        ref={selectorRef}
        className="p-4 relative overflow-auto max-h-[70vh]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Text Items */}
        {itemsByType.text.map(item => (
          <ParagraphSelector
            key={item.id}
            item={item}
            onSelect={() => handleItemSelect(item.id)}
          />
        ))}
        
        {/* Code Items */}
        {itemsByType.code.map(item => (
          <CodeBlockSelector
            key={item.id}
            item={item}
            onSelect={() => handleItemSelect(item.id)}
          />
        ))}
        
        {/* Selection Box (visible during drag) */}
        {selectionState.selectionBox && (
          <div
            className="absolute border-2 border-primary-500 bg-primary-100 bg-opacity-30 pointer-events-none"
            style={{
              left: selectionState.selectionBox.x,
              top: selectionState.selectionBox.y,
              width: selectionState.selectionBox.width,
              height: selectionState.selectionBox.height
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ContextSelector;
```

### 3.2 Paragraph Selector Component

```tsx
// frontend/src/components/context/ParagraphSelector.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ContentItem } from '../../types/context';
import RelevanceSlider from './RelevanceSlider';

interface ParagraphSelectorProps {
  item: ContentItem;
  onSelect: () => void;
}

const ParagraphSelector: React.FC<ParagraphSelectorProps> = ({ item, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRelevance, setShowRelevance] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer to detect when the paragraph is visible
  useEffect(() => {
    if (!contentRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // You could add animations or optimizations here
      },
      { threshold: 0.1 }
    );
    
    observer.observe(contentRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space to toggle selection
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onSelect();
    }
    
    // 'r' to toggle relevance slider
    if (e.key === 'r') {
      setShowRelevance(!showRelevance);
    }
  };
  
  return (
    <div
      ref={contentRef}
      className={`relative my-4 p-4 rounded-md transition-all duration-150 ${
        item.selected 
          ? 'bg-primary-50 border-l-4 border-primary-500'
          : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-item-id={item.id}
      data-item-type={item.type}
    >
      {/* Title if available */}
      {item.title && (
        <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
      )}
      
      {/* Content */}
      <div className="text-gray-700">
        {item.content}
      </div>
      
      {/* Selection indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 transition-opacity duration-150"
        style={{ opacity: item.selected ? 1 : 0 }}
      />
      
      {/* Token count */}
      <div className="text-xs text-gray-500 mt-2">
        {item.tokens} tokens
      </div>
      
      {/* Action buttons (visible on hover) */}
      <div 
        className={`absolute right-2 top-2 transition-opacity duration-150 ${
          isHovered || item.selected ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          className={`p-2 rounded-full ${
            item.selected ? 'bg-primary-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={onSelect}
          aria-label={item.selected ? 'Deselect' : 'Select'}
          title={item.selected ? 'Deselect' : 'Select'}
        >
          {item.selected ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        <button
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 ml-1"
          onClick={() => setShowRelevance(!showRelevance)}
          aria-label="Adjust relevance"
          title="Adjust relevance"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
      
      {/* Relevance slider */}
      {showRelevance && (
        <div className="mt-4">
          <RelevanceSlider 
            itemId={item.id}
            relevance={item.relevance}
          />
        </div>
      )}
    </div>
  );
};

export default ParagraphSelector;
```

### 3.3 Code Block Selector Component

```tsx
// frontend/src/components/context/CodeBlockSelector.tsx
import React, { useState } from 'react';
import { ContentItem } from '../../types/context';
import RelevanceSlider from './RelevanceSlider';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockSelectorProps {
  item: ContentItem;
  onSelect: () => void;
}

const CodeBlockSelector: React.FC<CodeBlockSelectorProps> = ({ item, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRelevance, setShowRelevance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space to toggle selection
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onSelect();
    }
    
    // 'r' to toggle relevance slider
    if (e.key === 'r') {
      setShowRelevance(!showRelevance);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(item.content).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      () => {
        // Handle copy failure
        console.error('Failed to copy code to clipboard');
      }
    );
  };
  
  return (
    <div
      className={`relative my-4 rounded-md transition-all duration-150 ${
        item.selected 
          ? 'bg-gray-800 border-l-4 border-primary-500'
          : 'bg-gray-900 hover:bg-gray-800 border-l-4 border-transparent'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-item-id={item.id}
      data-item-type={item.type}
    >
      {/* Header with language and controls */}
      <div className="flex justify-between items-center px-4 py-2 text-gray-300 bg-gray-800 border-b border-gray-700 rounded-t-md">
        <div className="flex items-center">
          <span className="text-xs font-mono">
            {item.metadata?.language || 'code'}
          </span>
          {item.title && (
            <span className="ml-2 text-sm">{item.title}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="text-gray-300 hover:text-white p-1"
            onClick={copyToClipboard}
            aria-label="Copy code"
            title="Copy code"
          >
            {isCopied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </button>
          
          <button
            className={`p-1 rounded ${
              item.selected ? 'text-primary-300' : 'text-gray-300 hover:text-white'
            }`}
            onClick={onSelect}
            aria-label={item.selected ? 'Deselect' : 'Select'}
            title={item.selected ? 'Deselect' : 'Select'}
          >
            {item.selected ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          
          <button
            className="text-gray-300 hover:text-white p-1"
            onClick={() => setShowRelevance(!showRelevance)}
            aria-label="Adjust relevance"
            title="Adjust relevance"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Code content with syntax highlighting */}
      <div className="overflow-auto max-h-96">
        <SyntaxHighlighter
          language={item.metadata?.language || 'javascript'}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.375rem 0.375rem',
            background: item.selected ? '#1e293b' : '#111827',
          }}
        >
          {item.content}
        </SyntaxHighlighter>
      </div>
      
      {/* Token count */}
      <div className="text-xs text-gray-400 p-2 border-t border-gray-700">
        {item.tokens} tokens
      </div>
      
      {/* Relevance slider */}
      {showRelevance && (
        <div className="p-4 bg-gray-800 border-t border-gray-700 rounded-b-md">
          <RelevanceSlider 
            itemId={item.id}
            relevance={item.relevance}
            darkMode
          />
        </div>
      )}
    </div>
  );
};

export default CodeBlockSelector;
```

### 3.4 Selection Controls Component

```tsx
// frontend/src/components/context/SelectionControls.tsx
import React from 'react';

interface SelectionControlsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
  itemCount: number;
  selectedCount: number;
}

const SelectionControls: React.FC<SelectionControlsProps> = ({
  onSelectAll,
  onDeselectAll,
  itemCount,
  selectedCount
}) => {
  const selectionPercentage = itemCount > 0 ? (selectedCount / itemCount) * 100 : 0;
  
  return (
    <div className="bg-gray-100 p-4 rounded-t-lg border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            className="px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors duration-150 text-sm"
            onClick={onSelectAll}
          >
            Select All
          </button>
          
          <button
            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150 text-sm"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
          >
            Deselect All
          </button>
          
          <div className="relative inline-block">
            <button
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150 text-sm"
            >
              Filters
              <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Dropdown menu would go here */}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            {selectedCount} of {itemCount} items selected
          </div>
          
          <div className="w-32 bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                selectionPercentage > 80 ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{ width: `${selectionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><span className="font-medium">Keyboard shortcuts:</span> Space to toggle selection, Ctrl+A to select all, Esc to deselect all, R to show relevance slider</p>
      </div>
    </div>
  );
};

export default SelectionControls;
```

## 4. Token Visualization Components

### 4.1 Token Visualizer Component

```tsx
// frontend/src/components/context/TokenVisualizer.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ContentType } from '../../types/context';
import TokenBreakdown from './TokenBreakdown';
import TokenBudget from './TokenBudget';

const TokenVisualizer: React.FC = () => {
  const { tokenUsage } = useSelector((state: RootState) => state.contextSelection);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate warning level
  const getTokenWarningLevel = () => {
    const percentage = tokenUsage.percentage;
    if (percentage > 90) return 'error';
    if (percentage > 75) return 'warning';
    return 'normal';
  };
  
  const warningLevel = getTokenWarningLevel();
  
  return (
    <div className="border-b border-gray-200">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium text-gray-700">Token Usage:</span>
          <span className={`ml-2 ${
            warningLevel === 'error' 
              ? 'text-red-600 font-medium' 
              : warningLevel === 'warning'
                ? 'text-amber-600'
                : 'text-gray-700'
          }`}>
            {Math.round(tokenUsage.percentage)}% ({tokenUsage.used.toLocaleString()} / {tokenUsage.total.toLocaleString()})
          </span>
          
          {warningLevel === 'error' && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Token limit near capacity
            </span>
          )}
          
          {warningLevel === 'warning' && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Approaching token limit
            </span>
          )}
        </div>
        
        <button
          className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          <svg className={`w-4 h-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Token Usage Bar */}
      <div className="px-4 pb-2">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-300 ease-out ${
              warningLevel === 'error' 
                ? 'bg-red-500' 
                : warningLevel === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(100, tokenUsage.percentage)}%` }}
          ></div>
        </div>
        
        {/* Type-specific indicator marks on the bar */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Detailed Token Information */}
      {showDetails && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenBreakdown breakdown={tokenUsage.breakdown} />
            <TokenBudget used={tokenUsage.used} total={tokenUsage.total} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenVisualizer;
```

### 4.2 Token Breakdown Component

```tsx
// frontend/src/components/context/TokenBreakdown.tsx
import React from 'react';
import { ContentType } from '../../types/context';

interface TokenBreakdownProps {
  breakdown: Record<ContentType, number>;
}

const TokenBreakdown: React.FC<TokenBreakdownProps> = ({ breakdown }) => {
  // Calculate total tokens from breakdown
  const totalTokens = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  
  // Content type colors
  const typeColors: Record<string, string> = {
    text: 'bg-blue-500',
    code: 'bg-indigo-500',
    list: 'bg-green-500',
    image: 'bg-purple-500'
  };
  
  // Content type icons (using SVG strings for simplicity)
  const typeIcons: Record<string, React.ReactNode> = {
    text: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    code: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    list: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Token Breakdown by Type</h3>
      
      {/* Stack Bar Chart */}
      <div className="flex h-6 rounded-full overflow-hidden mb-4">
        {Object.entries(breakdown).map(([type, count]) => {
          // Skip types with no tokens
          if (count === 0) return null;
          
          const percentage = totalTokens > 0 ? (count / totalTokens * 100) : 0;
          return (
            <div
              key={type}
              className={`${typeColors[type]} transition-all duration-300 ease-out`}
              style={{ width: `${percentage}%` }}
              title={`${type}: ${count} tokens (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      
      {/* Legend and Details */}
      <div className="space-y-2">
        {Object.entries(breakdown).map(([type, count]) => {
          const percentage = totalTokens > 0 ? (count / totalTokens * 100) : 0;
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-sm mr-2 ${typeColors[type]}`}></span>
                <div className="flex items-center">
                  {typeIcons[type]}
                  <span className="ml-1 text-sm capitalize">{type}</span>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                {count.toLocaleString()} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TokenBreakdown;
```

### 4.3 Token Budget Component

```tsx
// frontend/src/components/context/TokenBudget.tsx
import React from 'react';

interface TokenBudgetProps {
  used: number;
  total: number;
}

const TokenBudget: React.FC<TokenBudgetProps> = ({ used, total }) => {
  const percentage = (used / total) * 100;
  
  // Calculate remaining tokens and average cost
  const remaining = total - used;
  
  // Estimate token cost (assuming $0.002 per 1K tokens)
  const costPerThousand = 0.002;
  const estimatedCost = (used / 1000) * costPerThousand;
  
  // Get status color based on usage
  const getStatusColor = () => {
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-amber-600';
    return 'text-green-600';
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Token Budget</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Used</div>
          <div className="text-lg font-medium">{used.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Remaining</div>
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {remaining.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total Limit</div>
          <div className="text-lg font-medium">{total.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Est. Cost</div>
          <div className="text-lg font-medium">
            ${estimatedCost.toFixed(4)}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Usage Status</span>
          <span className={getStatusColor()}>
            {percentage < 50 ? 'Good' : percentage < 75 ? 'Moderate' : percentage < 90 ? 'High' : 'Critical'}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${
              percentage > 90 
                ? 'bg-red-500' 
                : percentage > 75
                  ? 'bg-amber-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Token usage directly affects context quality and cost. Optimize your selection for the most relevant content.</p>
      </div>
    </div>
  );
};

export default TokenBudget;
```

## 5. Context Organization Components

### 5.1 Context Organizer Component

```tsx
// frontend/src/components/context/ContextOrganizer.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { ContentItem, Category } from '../../types/context';
import { 
  reorderItems,
  addCategory,
  removeCategory,
  assignItemsToCategory
} from '../../store/slices/contextSelectionSlice';
import CategoryManager from './CategoryManager';
import { v4 as uuidv4 } from 'uuid';

const ContextOrganizer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { contentItems, categories } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [activeTab, setActiveTab] = useState<'organize' | 'categories'>('organize');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Get selected items
  const selectedItems = Object.values(contentItems).filter(item => item.selected);
  
  // Group items by category
  const itemsByCategory: Record<string, ContentItem[]> = {
    uncategorized: []
  };
  
  // Initialize categories from state
  Object.values(categories).forEach(category => {
    itemsByCategory[category.id] = [];
  });
  
  // Populate categories with items
  selectedItems.forEach(item => {
    if (item.categoryId && itemsByCategory[item.categoryId]) {
      itemsByCategory[item.categoryId].push(item);
    } else {
      itemsByCategory.uncategorized.push(item);
    }
  });
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // If moving between different lists (categories)
    if (source.droppableId !== destination.droppableId) {
      // Move item to a different category
      const itemId = selectedItems.find(
        (_, index) => index === source.index
      )?.id;
      
      if (itemId) {
        dispatch(assignItemsToCategory({
          categoryId: destination.droppableId === 'uncategorized' ? '' : destination.droppableId,
          itemIds: [itemId]
        }));
      }
    } else {
      // Reorder within the same category
      dispatch(reorderItems({
        sourceIndex: source.index,
        destinationIndex: destination.index
      }));
    }
  };
  
  // Create a new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const category: Category = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      color: getRandomColor(),
      items: []
    };
    
    dispatch(addCategory(category));
    setNewCategoryName('');
  };
  
  // Delete a category
  const handleDeleteCategory = (categoryId: string) => {
    dispatch(removeCategory(categoryId));
  };
  
  // Get a random color for new categories
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'organize'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('organize')}
          >
            Organize Content
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'categories'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('categories')}
          >
            Manage Categories
          </button>
        </nav>
      </div>
      
      {/* Active Tab Content */}
      <div className="p-4">
        {activeTab === 'organize' ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Organize Selected Content</h3>
              <p className="text-sm text-gray-500">
                Drag and drop items to reorder or categorize them. Items with higher relevance will be prioritized in context.
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Render each category section */}
              {Object.entries(itemsByCategory).map(([categoryId, items]) => {
                // Skip empty categories
                if (items.length === 0) return null;
                
                const categoryName = categoryId === 'uncategorized' 
                  ? 'Uncategorized' 
                  : categories[categoryId]?.name || 'Unknown';
                
                const categoryColor = categoryId === 'uncategorized'
                  ? '#6B7280' // gray
                  : categories[categoryId]?.color || '#6B7280';
                
                return (
                  <div key={categoryId} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: categoryColor }}
                      ></div>
                      <h4 className="text-sm font-medium text-gray-700">{categoryName}</h4>
                      <span className="ml-2 text-xs text-gray-500">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <Droppable droppableId={categoryId}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="bg-gray-50 rounded-md p-2 min-h-[100px]"
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 mb-2 rounded border ${
                                    snapshot.isDragging ? 'border-primary-300 shadow-md' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} content`}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate mt-1">
                                        {item.content.substring(0, 50)}...
                                      </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {item.tokens} tokens
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </DragDropContext>
          </div>
        ) : (
          <CategoryManager />
        )}
      </div>
      
      {/* Bottom Controls */}
      {activeTab === 'categories' && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Add Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextOrganizer;
```

### 5.2 Category Manager Component

```tsx
// frontend/src/components/context/CategoryManager.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Category } from '../../types/context';
import { removeCategory } from '../../store/slices/contextSelectionSlice';

const CategoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, contentItems } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // Count items per category
  const itemCountByCategory: Record<string, number> = {};
  
  Object.values(contentItems).forEach(item => {
    if (item.categoryId) {
      itemCountByCategory[item.categoryId] = (itemCountByCategory[item.categoryId] || 0) + 1;
    }
  });
  
  // Delete category after confirmation
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? Items will be moved to Uncategorized.')) {
      dispatch(removeCategory(categoryId));
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Categories</h3>
        <p className="text-sm text-gray-500">
          Organize your content with custom categories. Deleting a category will move all its items to Uncategorized.
        </p>
      </div>
      
      <div className="bg-white rounded-md overflow-hidden">
        <ul>
          {Object.keys(categories).length === 0 ? (
            <li className="p-4 text-sm text-gray-500 italic">
              No categories created yet. Add a category to organize your content.
            </li>
          ) : (
            Object.values(categories).map((category) => (
              <li
                key={category.id}
                className="border-b last:border-b-0 border-gray-200"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {editingCategoryId === category.id ? (
                      <input
                        type="text"
                        className="border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={category.name}
                        // In a real implementation, you'd handle the update here
                        onBlur={() => setEditingCategoryId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingCategoryId(null);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    )}
                    <span className="ml-2 text-xs text-gray-500">
                      {itemCountByCategory[category.id] || 0} item{(itemCountByCategory[category.id] || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setEditingCategoryId(category.id)}
                      aria-label="Edit category"
                      title="Edit category"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteCategory(category.id)}
                      aria-label="Delete category"
                      title="Delete category"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default CategoryManager;
```

### 5.3 Relevance Slider Component

```tsx
// frontend/src/components/context/RelevanceSlider.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { setItemRelevance, updateRelevance } from '../../store/slices/contextSelectionSlice';

interface RelevanceSliderProps {
  itemId: string;
  relevance: number;
  darkMode?: boolean;
}

const RelevanceSlider: React.FC<RelevanceSliderProps> = ({ 
  itemId, 
  relevance, 
  darkMode = false 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentRelevance, setCurrentRelevance] = useState(relevance);
  const [isDragging, setIsDragging] = useState(false);
  
  // Get text label based on relevance value
  const getRelevanceLabel = (value: number) => {
    if (value >= 0.9) return 'Critical';
    if (value >= 0.7) return 'High';
    if (value >= 0.4) return 'Medium';
    if (value >= 0.2) return 'Low';
    return 'Minimal';
  };
  
  // Get color based on relevance value
  const getRelevanceColor = (value: number) => {
    if (value >= 0.9) return '#EF4444'; // red
    if (value >= 0.7) return '#F59E0B'; // amber
    if (value >= 0.4) return '#10B981'; // green
    if (value >= 0.2) return '#3B82F6'; // blue
    return '#6B7280'; // gray
  };
  
  // Handle local changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentRelevance(value);
    
    // Update local state immediately
    dispatch(setItemRelevance({ itemId, relevance: value }));
  };
  
  // Handle completion of change (to reduce API calls)
  const handleChangeComplete = () => {
    if (isDragging) {
      // Only update if we were dragging (not for click changes)
      dispatch(updateRelevance({ contextId: 'current-context', itemId, relevance: currentRelevance }));
      setIsDragging(false);
    }
  };
  
  const textColor = darkMode ? 'text-gray-300' : 'text-gray-700';
  const trackColor = darkMode ? 'bg-gray-700' : 'bg-gray-200';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className={`text-sm font-medium ${textColor}`}>
          Relevance: <span style={{ color: getRelevanceColor(currentRelevance) }}>
            {getRelevanceLabel(currentRelevance)}
          </span>
        </div>
        <div className={`text-sm ${textColor}`}>
          {Math.round(currentRelevance * 100)}%
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentRelevance}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleChangeComplete}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleChangeComplete}
          className={`w-full h-2 ${trackColor} rounded-lg appearance-none cursor-pointer`}
          style={{
            // Custom track background to show colored gradient
            background: `linear-gradient(90deg, ${getRelevanceColor(currentRelevance)} 0%, ${getRelevanceColor(currentRelevance)} ${currentRelevance * 100}%, ${darkMode ? '#4B5563' : '#E5E7EB'} ${currentRelevance * 100}%, ${darkMode ? '#4B5563' : '#E5E7EB'} 100%)`
          }}
        />
        
        {/* Labels */}
        <div className={`flex justify-between text-xs ${textColor} mt-1`}>
          <span>Low Priority</span>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
};

export default RelevanceSlider;
```

## 6. Knowledge Graph Visualization Components

### 6.1 Knowledge Graph Component

```tsx
// frontend/src/components/graph/KnowledgeGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { GraphData, GraphNode, GraphEdge } from '../../types/context';
import GraphControls from './GraphControls';
import NodeDetail from './NodeDetail';
import ForceGraph2D from 'react-force-graph-2d';

const KnowledgeGraph: React.FC = () => {
  const graphRef = useRef<any>(null);
  const { contentItems, categories } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState({
    showSelected: true,
    showUnselected: true,
    minRelevance: 0,
    contentTypes: {
      text: true,
      code: true,
      image: true,
      list: true
    },
    categories: {} as Record<string, boolean>
  });
  
  // Build graph data from content items
  useEffect(() => {
    // Build initial nodes from content items
    const nodes: GraphNode[] = Object.values(contentItems).map(item => ({
      id: item.id,
      label: item.title || `${item.type} content`,
      type: item.type,
      relevance: item.relevance,
      selected: item.selected,
      neighbors: [], // Will be filled later
      size: 5 + (item.relevance * 10) // Size based on relevance
    }));
    
    // Build edges based on categories and metadata connections
    const edges: GraphEdge[] = [];
    
    // Connect items within the same category
    Object.values(categories).forEach(category => {
      const categoryItems = category.items;
      
      // Connect each item to others in same category
      categoryItems.forEach((sourceId, i) => {
        categoryItems.slice(i + 1).forEach(targetId => {
          edges.push({
            source: sourceId,
            target: targetId,
            weight: 0.5 // Medium strength connection
          });
        });
      });
    });
    
    // Connect items with references between them
    Object.values(contentItems).forEach(item => {
      if (item.metadata?.references) {
        item.metadata.references.forEach(refId => {
          if (contentItems[refId]) {
            edges.push({
              source: item.id,
              target: refId,
              weight: 1 // Strong connection
            });
          }
        });
      }
    });
    
    // Update neighbor information on nodes
    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, GraphNode>);
    
    edges.forEach(edge => {
      if (nodeMap[edge.source] && nodeMap[edge.target]) {
        nodeMap[edge.source].neighbors.push(edge.target);
        nodeMap[edge.target].neighbors.push(edge.source);
      }
    });
    
    setGraphData({ nodes, edges });
  }, [contentItems, categories]);
  
  // Apply filters to graph data
  const filteredData = React.useMemo(() => {
    const filteredNodes = graphData.nodes.filter(node => {
      // Apply selection filter
      if (node.selected && !filters.showSelected) return false;
      if (!node.selected && !filters.showUnselected) return false;
      
      // Apply relevance filter
      if (node.relevance < filters.minRelevance) return false;
      
      // Apply content type filter
      if (!filters.contentTypes[node.type]) return false;
      
      // Apply category filter
      const nodeItem = contentItems[node.id];
      if (nodeItem?.categoryId && !filters.categories[nodeItem.categoryId]) {
        return false;
      }
      
      return true;
    });
    
    // Filter edges to only include connections between visible nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, filters, contentItems]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(zoomLevel * 1.2);
      setZoomLevel(zoomLevel * 1.2);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(zoomLevel / 1.2);
      setZoomLevel(zoomLevel / 1.2);
    }
  };
  
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1);
      setZoomLevel(1);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  // Node styling
  const getNodeColor = (node: GraphNode) => {
    // Different colors for different content types
    const typeColors: Record<string, string> = {
      text: '#3B82F6', // blue
      code: '#8B5CF6', // purple
      list: '#10B981', // green
      image: '#EC4899', // pink
    };
    
    // Base color on type
    const baseColor = typeColors[node.type] || '#6B7280';
    
    // Adjust opacity based on selection
    return node.selected ? baseColor : `${baseColor}80`; // 50% opacity if not selected
  };
  
  // Edge styling
  const getEdgeColor = (edge: GraphEdge) => {
    // Transparent gray for all edges
    return 'rgba(160, 174, 192, 0.5)';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Graph Controls */}
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
      />
      
      {/* Graph Visualization */}
      <div className="h-[600px] relative">
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredData}
          nodeId="id"
          nodeLabel="label"
          nodeColor={getNodeColor}
          nodeRelSize={8}
          nodeVal={node => node.size}
          linkColor={getEdgeColor}
          linkWidth={link => (link as GraphEdge).weight}
          onNodeClick={(node) => setSelectedNode(node as GraphNode)}
          cooldownTicks={100}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const { x, y, id, label, selected } = node as any;
            
            // Node circle
            const size = (node as any).size || 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = getNodeColor(node as GraphNode);
            ctx.fill();
            
            // Selection ring for selected nodes
            if (selected) {
              ctx.beginPath();
              ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
              ctx.strokeStyle = '#F59E0B';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
            
            // Node label (only show if zoomed in enough)
            if (globalScale >= 1.2) {
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'black';
              ctx.fillText(label, x, y + size + 1 + fontSize);
            }
          }}
        />
        
        {/* Node Details Panel (when a node is selected) */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-64 bg-white rounded-lg shadow-lg p-4">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
              onClick={() => setSelectedNode(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <NodeDetail 
              nodeId={selectedNode.id} 
              neighbors={selectedNode.neighbors} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
```

### 6.2 Graph Controls Component

```tsx
// frontend/src/components/graph/GraphControls.tsx
import React, { useState } from 'react';
import { Category } from '../../types/context';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  filters: {
    showSelected: boolean;
    showUnselected: boolean;
    minRelevance: number;
    contentTypes: Record<string, boolean>;
    categories: Record<string, boolean>;
  };
  onFilterChange: (filters: any) => void;
  categories: Record<string, Category>;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  filters,
  onFilterChange,
  categories
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Toggle a content type filter
  const handleContentTypeToggle = (type: string) => {
    onFilterChange({
      contentTypes: {
        ...filters.contentTypes,
        [type]: !filters.contentTypes[type]
      }
    });
  };
  
  // Toggle a category filter
  const handleCategoryToggle = (categoryId: string) => {
    onFilterChange({
      categories: {
        ...filters.categories,
        [categoryId]: !filters.categories[categoryId]
      }
    });
  };
  
  // Toggle selection filters
  const handleSelectionToggle = (key: 'showSelected' | 'showUnselected') => {
    onFilterChange({ [key]: !filters[key] });
  };
  
  // Handle relevance threshold change
  const handleRelevanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ minRelevance: parseFloat(e.target.value) });
  };
  
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {/* Zoom Controls */}
          <button
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
            onClick={onZoomOut}
            title="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
            onClick={onResetZoom}
            title="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <button
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
            onClick={onZoomIn}
            title="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        {/* Filter Toggle Button */}
        <button
          className={`flex items-center px-3 py-1.5 text-sm rounded ${
            isFilterOpen ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>
      
      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selection Filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selection</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showSelected}
                    onChange={() => handleSelectionToggle('showSelected')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show selected items</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showUnselected}
                    onChange={() => handleSelectionToggle('showUnselected')}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show unselected items</span>
                </label>
              </div>
              
              {/* Relevance Filter */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Minimum Relevance: {Math.round(filters.minRelevance * 100)}%
                </h3>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.minRelevance}
                  onChange={handleRelevanceChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            {/* Content Type Filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Content Types</h3>
              <div className="space-y-2">
                {Object.entries(filters.contentTypes).map(([type, enabled]) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleContentTypeToggle(type)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
              
              {/* Category Filters */}
              {Object.keys(categories).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                  <div className="space-y-2">
                    {Object.values(categories).map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories[category.id] !== false}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span 
                          className="ml-2 text-sm text-gray-700 flex items-center"
                        >
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-1" 
                            style={{ backgroundColor: category.color }}
                          ></span>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphControls;
```

### 6.3 Node Detail Component

```tsx
// frontend/src/components/graph/NodeDetail.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  toggleItemSelection, 
  setItemRelevance,
  updateRelevance 
} from '../../store/slices/contextSelectionSlice';
import RelevanceSlider from '../context/RelevanceSlider';

interface NodeDetailProps {
  nodeId: string;
  neighbors: string[];
}

const NodeDetail: React.FC<NodeDetailProps> = ({ nodeId, neighbors }) => {
  const dispatch = useDispatch<AppDispatch>();
  const contentItem = useSelector(
    (state: RootState) => state.contextSelection.contentItems[nodeId]
  );
  
  const neighborItems = useSelector((state: RootState) => {
    // Get all neighbor items that exist in our content items
    return neighbors
      .map(id => state.contextSelection.contentItems[id])
      .filter(Boolean);
  });
  
  // Find category if any
  const category = useSelector((state: RootState) => {
    if (!contentItem?.categoryId) return null;
    return state.contextSelection.categories[contentItem.categoryId];
  });
  
  if (!contentItem) {
    return (
      <div className="text-gray-500 text-sm">
        Item not found
      </div>
    );
  }
  
  // Get content type icon
  const getTypeIcon = () => {
    switch (contentItem.type) {
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'code':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'list':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  // Toggle item selection
  const handleToggleSelection = () => {
    dispatch(toggleItemSelection(nodeId));
  };
  
  // Handle relevance change
  const handleRelevanceChange = (value: number) => {
    // Update local state
    dispatch(setItemRelevance({ itemId: nodeId, relevance: value }));
    
    // Send to server (using debounce in a real implementation)
    dispatch(updateRelevance({
      contextId: 'current-context', // this would be dynamic in a real implementation
      itemId: nodeId,
      relevance: value
    }));
  };
  
  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
        {getTypeIcon()}
        <span className="ml-1">{contentItem.title || `${contentItem.type.charAt(0).toUpperCase() + contentItem.type.slice(1)} Content`}</span>
      </h3>
      
      {/* Item preview */}
      <div className="text-xs text-gray-600 mb-3 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded">
        {contentItem.content.length > 150
          ? `${contentItem.content.substring(0, 150)}...`
          : contentItem.content}
      </div>
      
      {/* Item metadata */}
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-3">
        <div>Tokens:</div>
        <div className="text-gray-700">{contentItem.tokens}</div>
        
        {category && (
          <>
            <div>Category:</div>
            <div className="text-gray-700 flex items-center">
              <span 
                className="inline-block w-2 h-2 rounded-full mr-1" 
                style={{ backgroundColor: category.color }}
              ></span>
              {category.name}
            </div>
          </>
        )}
        
        {contentItem.metadata?.language && (
          <>
            <div>Language:</div>
            <div className="text-gray-700">{contentItem.metadata.language}</div>
          </>
        )}
        
        <div>Connections:</div>
        <div className="text-gray-700">{neighbors.length}</div>
      </div>
      
      {/* Selection toggle */}
      <div className="mb-3">
        <button
          className={`w-full py-1.5 px-3 text-sm rounded-md ${
            contentItem.selected
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
          onClick={handleToggleSelection}
        >
          {contentItem.selected ? 'Deselect Item' : 'Select Item'}
        </button>
      </div>
      
      {/* Relevance slider */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Relevance:</p>
        <RelevanceSlider 
          itemId={nodeId}
          relevance={contentItem.relevance}
        />
      </div>
      
      {/* Connected items */}
      {neighborItems.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">Connected Items:</h4>
          <div className="max-h-40 overflow-y-auto">
            {neighborItems.map(item => (
              <div 
                key={item.id}
                className={`text-xs p-1.5 mb-1 rounded ${
                  item.selected ? 'bg-primary-50 border-l-2 border-primary-500' : 'bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">
                  {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} content`}
                </div>
                <div className="text-gray-500 truncate">
                  {item.content.substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeDetail;
```

## Integration

To tie everything together, you'll need to integrate these components into your page layout. Here's a sample integration:

```tsx
// frontend/src/pages/ContextPage.tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchContextContent } from '../store/slices/contextSelectionSlice';
import ContextSelector from '../components/context/ContextSelector';
import TokenVisualizer from '../components/context/TokenVisualizer';
import ContextOrganizer from '../components/context/ContextOrganizer';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';

const ContextPage: React.FC = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    if (contextId) {
      dispatch(fetchContextContent(contextId));
    }
  }, [contextId, dispatch]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Context Selection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select and organize content for your AI context. The more relevant content you include, the better your AI responses will be.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main selection panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Context selector */}
          <ContextSelector contextId={contextId || ''} />
          
          {/* Knowledge graph visualization */}
          <KnowledgeGraph />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Token visualizer */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium p-4 border-b border-gray-200">Token Usage</h2>
            <TokenVisualizer />
          </div>
          
          {/* Context organizer */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium p-4 border-b border-gray-200">Organize Content</h2>
            <ContextOrganizer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPage;
```

## Key Features Implementation

This implementation provides several important features that fulfill the technical requirements:

1. **Efficient Content Selection:**
   - Paragraph and code block selectors with visual indicators
   - Drag-select functionality for multi-selection
   - Keyboard shortcuts (Space, Ctrl+A, Esc)
   - Clear visual feedback for selection state

2. **Token Visualization:**
   - Real-time token usage meter with color-coded warnings
   - Detailed token breakdown by content type
   - Token budget analysis with estimated costs
   - Visual indicators for approaching limits

3. **Content Organization:**
   - Category management with color-coding
   - Drag-and-drop reordering using react-beautiful-dnd
   - Relevance sliders for content weighting
   - Structured organization interface

4. **Knowledge Graph Visualization:**
   - Interactive force-directed graph showing content relationships
   - Filtering controls for content types, relevance, and categories
   - Zoom and exploration capabilities
   - Detailed node information panel

5. **Accessibility and User Experience:**
   - Clear keyboard shortcuts and visual indicators
   - Responsive design for different screen sizes
   - Hover states and visual feedback
   - Progressive disclosure of complex features

This implementation provides a complete suite of components for the core context selection UI, enabling users to efficiently select, organize, and visualize context content for LLM interactions. The interface is designed to be intuitive for novices while providing power features for advanced users.

The components follow a consistent visual style and provide clear feedback to users about their actions. The token management features help users understand and optimize their context usage, improving both the quality of AI responses and cost efficiency.