// frontend/src/components/context/CodeBlockSelector.tsx
import React, { useState } from 'react';
import { ContentItem } from '../../types/context';
import RelevanceSlider from './RelevanceSlider';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockSelectorProps {
  item: ContentItem;
  onSelect: () => void;
}

const CodeBlockSelector: React.FC<CodeBlockSelectorProps> = ({ item, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRelevance, setShowRelevance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
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
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(item.content).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      () => {
        // Handle copy failure
        console.error('Failed to copy code to clipboard');
      }
    );
  };
  
  return (
    <div
      className={`relative my-4 rounded-md transition-all duration-150 ${
        item.selected 
          ? 'bg-gray-800 border-l-4 border-primary-500'
          : 'bg-gray-900 hover:bg-gray-800 border-l-4 border-transparent'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-item-id={item.id}
      data-item-type={item.type}
    >
      {/* Header with language and controls */}
      <div className="flex justify-between items-center px-4 py-2 text-gray-300 bg-gray-800 border-b border-gray-700 rounded-t-md">
        <div className="flex items-center">
          <span className="text-xs font-mono">
            {item.metadata?.language || 'code'}
          </span>
          {item.title && (
            <span className="ml-2 text-sm">{item.title}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="text-gray-300 hover:text-white p-1"
            onClick={copyToClipboard}
            aria-label="Copy code"
            title="Copy code"
          >
            {isCopied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          </button>
          
          <button
            className={`p-1 rounded ${
              item.selected ? 'text-primary-300' : 'text-gray-300 hover:text-white'
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
            className="text-gray-300 hover:text-white p-1"
            onClick={() => setShowRelevance(!showRelevance)}
            aria-label="Adjust relevance"
            title="Adjust relevance"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Code content with syntax highlighting */}
      <div className="overflow-auto max-h-96">
        <SyntaxHighlighter
          language={item.metadata?.language || 'javascript'}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.375rem 0.375rem',
            background: item.selected ? '#1e293b' : '#111827',
          }}
        >
          {item.content}
        </SyntaxHighlighter>
      </div>
      
      {/* Token count */}
      <div className="text-xs text-gray-400 p-2 border-t border-gray-700">
        {item.tokens} tokens
      </div>
      
      {/* Relevance slider */}
      {showRelevance && (
        <div className="p-4 bg-gray-800 border-t border-gray-700 rounded-b-md">
          <RelevanceSlider 
            itemId={item.id}
            relevance={item.relevance}
            darkMode
          />
        </div>
      )}
    </div>
  );
};

export default CodeBlockSelector;