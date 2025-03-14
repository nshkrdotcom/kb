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