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