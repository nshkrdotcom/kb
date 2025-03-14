// frontend/src/components/context/ParagraphSelector.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ContentItem } from '../../types/context';
import RelevanceSlider from './RelevanceSlider';

interface ParagraphSelectorProps {
  item: ContentItem;
  onSelect: () => void;
}

const ParagraphSelector: React.FC<ParagraphSelectorProps> = ({ item, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRelevance, setShowRelevance] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer to detect when the paragraph is visible
  useEffect(() => {
    if (!contentRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // You could add animations or optimizations here
      },
      { threshold: 0.1 }
    );
    
    observer.observe(contentRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space to toggle selection
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onSelect();
    }
    
    // 'r' to toggle relevance slider
    if (e.key === 'r') {
      setShowRelevance(!showRelevance);
    }
  };
  
  return (
    <div
      ref={contentRef}
      className={`relative my-4 p-4 rounded-md transition-all duration-150 ${
        item.selected 
          ? 'bg-primary-50 border-l-4 border-primary-500'
          : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-item-id={item.id}
      data-item-type={item.type}
    >
      {/* Title if available */}
      {item.title && (
        <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
      )}
      
      {/* Content */}
      <div className="text-gray-700">
        {item.content}
      </div>
      
      {/* Selection indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 transition-opacity duration-150"
        style={{ opacity: item.selected ? 1 : 0 }}
      />
      
      {/* Token count */}
      <div className="text-xs text-gray-500 mt-2">
        {item.tokens} tokens
      </div>
      
      {/* Action buttons (visible on hover) */}
      <div 
        className={`absolute right-2 top-2 transition-opacity duration-150 ${
          isHovered || item.selected ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          className={`p-2 rounded-full ${
            item.selected ? 'bg-primary-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={onSelect}
          aria-label={item.selected ? 'Deselect' : 'Select'}
          title={item.selected ? 'Deselect' : 'Select'}
        >
          {item.selected ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        <button
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 ml-1"
          onClick={() => setShowRelevance(!showRelevance)}
          aria-label="Adjust relevance"
          title="Adjust relevance"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
      
      {/* Relevance slider */}
      {showRelevance && (
        <div className="mt-4">
          <RelevanceSlider 
            itemId={item.id}
            relevance={item.relevance}
          />
        </div>
      )}
    </div>
  );
};

export default ParagraphSelector;