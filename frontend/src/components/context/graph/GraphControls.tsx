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