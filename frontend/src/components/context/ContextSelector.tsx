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