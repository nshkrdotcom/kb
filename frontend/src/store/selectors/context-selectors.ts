// frontend/src/store/selectors/context-selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Select all contexts
export const selectAllContexts = (state: RootState) => state.contexts.items;

// Select active context ID
export const selectActiveContextId = (state: RootState) => state.contexts.activeContextId;

// Select active context (derived)
export const selectActiveContext = createSelector(
  [selectAllContexts, selectActiveContextId],
  (contexts, activeId) => activeId ? contexts[activeId] : null
);

// Select all content items
export const selectAllContentItems = (state: RootState) => state.contentItems.items;

// Select content items by context ID (derived)
export const selectContentItemsByContextId = createSelector(
  [selectAllContentItems, (_, contextId) => contextId],
  (items, contextId) => Object.values(items).filter(item => item.contextId === contextId)
);

// Select selected content items for active context (derived)
export const selectSelectedContentForActiveContext = createSelector(
  [selectAllContentItems, selectActiveContextId],
  (items, contextId) => {
    if (!contextId) return [];
    return Object.values(items)
      .filter(item => item.contextId === contextId && item.selected);
  }
);

// Select token usage for active context (derived)
export const selectTokenUsageForActiveContext = createSelector(
  [selectSelectedContentForActiveContext],
  (selectedItems) => {
    const usage = {
      total: 10000, // Max tokens (could be configurable)
      used: 0,
      breakdown: {
        text: 0,
        code: 0,
        image: 0,
        list: 0
      }
    };
    
    selectedItems.forEach(item => {
      usage.used += item.tokens;
      if (usage.breakdown[item.type] !== undefined) {
        usage.breakdown[item.type] += item.tokens;
      }
    });
    
    return {
      ...usage,
      percentage: (usage.used / usage.total) * 100,
    };
  }
);

// Additional selectors for context visualization, filtering, etc.
// ...