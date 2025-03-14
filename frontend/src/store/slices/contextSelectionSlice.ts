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