// frontend/src/store/middleware/api-sync-middleware.ts
import { Middleware } from 'redux';
import { 
  CONTEXT_SELECTED, 
  CONTEXT_CONTENT_UPDATED, 
  ITEM_RELEVANCE_UPDATED 
} from '../actions/types';
import { contextApi } from '../../services/api/context-api';

// Middleware to sync specific state changes with the API
export const apiSyncMiddleware: Middleware = store => next => action => {
  // First, update the local state
  const result = next(action);
  
  // Then, perform API calls based on action type
  switch (action.type) {
    case CONTEXT_SELECTED:
      // When a context is selected, load its content
      if (action.payload.contextId) {
        store.dispatch(loadContextContent(action.payload.contextId));
      }
      break;
      
    case CONTEXT_CONTENT_UPDATED:
      // When content selection changes, update on server
      const { contextId, itemIds, selected } = action.payload;
      contextApi.updateContentSelection(contextId, itemIds, selected)
        .catch(error => {
          console.error('Failed to update content selection:', error);
          // Dispatch a failure action to revert the selection in UI
          store.dispatch(updateSelectionFailed(contextId, itemIds, selected));
        });
      break;
      
    case ITEM_RELEVANCE_UPDATED:
      // When relevance is updated, sync with server
      const { contextId, contentId, relevance } = action.payload;
      
      // Debounce relevance updates (multiple sliders may be adjusted quickly)
      if (relevanceUpdateTimeouts[contentId]) {
        clearTimeout(relevanceUpdateTimeouts[contentId]);
      }
      
      relevanceUpdateTimeouts[contentId] = setTimeout(() => {
        contextApi.updateContentRelevance(contextId, contentId, relevance)
          .catch(error => {
            console.error('Failed to update relevance:', error);
            // Dispatch failure action to revert UI
            store.dispatch(updateRelevanceFailed(contextId, contentId, relevance));
          });
          
        delete relevanceUpdateTimeouts[contentId];
      }, 500); // 500ms debounce
      break;
  }
  
  return result;
};

// Track timeouts for debouncing
const relevanceUpdateTimeouts: Record<string, NodeJS.Timeout> = {};

// Action creators for API interactions
function loadContextContent(contextId: string) {
  return {
    type: 'LOAD_CONTEXT_CONTENT_REQUEST',
    payload: { contextId }
  };
}

function updateSelectionFailed(contextId: string, itemIds: string[], selected: boolean) {
  return {
    type: 'UPDATE_SELECTION_FAILED',
    payload: { contextId, itemIds, selected }
  };
}

function updateRelevanceFailed(contextId: string, contentId: string, relevance: number) {
  return {
    type: 'UPDATE_RELEVANCE_FAILED',
    payload: { contextId, contentId, relevance }
  };
}