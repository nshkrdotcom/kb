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