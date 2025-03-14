// frontend/src/store/middleware/collaboration-middleware.ts
import { Middleware } from 'redux';
import { wsService } from '../../services/websocket-service';

// Actions that should be synced with other users in real-time
const SYNC_ACTIONS = [
  'contexts/updateSelection',
  'contexts/updateRelevance',
  'contexts/addCategory',
  'contexts/removeCategory',
  'contexts/assignItemsToCategory'
];

// Middleware to sync state changes with other users via WebSocket
export const collaborationMiddleware: Middleware = store => next => action => {
  // Execute the action locally first
  const result = next(action);
  
  // If it's an action we want to sync, send it to the server
  if (SYNC_ACTIONS.includes(action.type) && wsService && store.getState().websocket.isConnected) {
    // Get the active context ID
    const activeContextId = store.getState().contexts.activeContextId;
    
    if (activeContextId) {
      // Send the action to other users in the same context
      wsService.send('SYNC_ACTION', {
        contextId: activeContextId,
        action: {
          type: action.type,
          payload: action.payload
        }
      });
    }
  }
  
  return result;
};