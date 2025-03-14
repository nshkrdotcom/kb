// frontend/src/store/thunks/context-thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { contextApi } from '../../services/api/context-api';
import { ApiError } from '../../services/api/api-error';
import { showNotification } from '../slices/notification-slice';

// Get contexts for a project
export const fetchContextsForProject = createAsyncThunk(
  'contexts/fetchForProject',
  async (projectId: string, { rejectWithValue, dispatch }) => {
    try {
      return await contextApi.getContextsForProject(projectId);
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: apiError.toUserFriendlyMessage()
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Create a new context
export const createContext = createAsyncThunk(
  'contexts/create',
  async (data: CreateContextRequest, { rejectWithValue, dispatch }) => {
    try {
      const result = await contextApi.createContext(data);
      dispatch(showNotification({
        type: 'success',
        message: `Context "${result.title}" created successfully`
      }));
      return result;
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: apiError.toUserFriendlyMessage()
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Get context content with optimistic updates
export const fetchContextContent = createAsyncThunk(
  'contexts/fetchContent',
  async (contextId: string, { rejectWithValue, dispatch }) => {
    try {
      return await contextApi.getContextContent(contextId);
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to load context content: ${apiError.toUserFriendlyMessage()}`
      }));
      return rejectWithValue(apiError);
    }
  }
);

// Update content selection with optimistic updates
export const updateContentSelection = createAsyncThunk(
  'contexts/updateSelection',
  async ({ 
    contextId, 
    itemIds, 
    selected 
  }: { 
    contextId: string; 
    itemIds: string[]; 
    selected: boolean;
  }, { dispatch }) => {
    // Optimistically update the UI
    dispatch({
      type: 'CONTEXT_CONTENT_UPDATED',
      payload: { contextId, itemIds, selected }
    });
    
    try {
      await contextApi.updateContentSelection(contextId, itemIds, selected);
      return { contextId, itemIds, selected, success: true };
    } catch (error) {
      const apiError = ApiError.from(error);
      dispatch(showNotification({
        type: 'error',
        message: `Failed to update selection: ${apiError.toUserFriendlyMessage()}`
      }));
      
      // Revert the optimistic update
      dispatch({
        type: 'UPDATE_SELECTION_FAILED',
        payload: { contextId, itemIds, selected }
      });
      
      throw error; // Let the thunk middleware handle it
    }
  }
);

// Implement similar thunks for all context operations
// ...