// frontend/src/components/context/TokenVisualizer.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ContentType } from '../../types/context';
import TokenBreakdown from './TokenBreakdown';
import TokenBudget from './TokenBudget';

const TokenVisualizer: React.FC = () => {
  const { tokenUsage } = useSelector((state: RootState) => state.contextSelection);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate warning level
  const getTokenWarningLevel = () => {
    const percentage = tokenUsage.percentage;
    if (percentage > 90) return 'error';
    if (percentage > 75) return 'warning';
    return 'normal';
  };
  
  const warningLevel = getTokenWarningLevel();
  
  return (
    <div className="border-b border-gray-200">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium text-gray-700">Token Usage:</span>
          <span className={`ml-2 ${
            warningLevel === 'error' 
              ? 'text-red-600 font-medium' 
              : warningLevel === 'warning'
                ? 'text-amber-600'
                : 'text-gray-700'
          }`}>
            {Math.round(tokenUsage.percentage)}% ({tokenUsage.used.toLocaleString()} / {tokenUsage.total.toLocaleString()})
          </span>
          
          {warningLevel === 'error' && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Token limit near capacity
            </span>
          )}
          
          {warningLevel === 'warning' && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Approaching token limit
            </span>
          )}
        </div>
        
        <button
          className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          <svg className={`w-4 h-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Token Usage Bar */}
      <div className="px-4 pb-2">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-300 ease-out ${
              warningLevel === 'error' 
                ? 'bg-red-500' 
                : warningLevel === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(100, tokenUsage.percentage)}%` }}
          ></div>
        </div>
        
        {/* Type-specific indicator marks on the bar */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Detailed Token Information */}
      {showDetails && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokenBreakdown breakdown={tokenUsage.breakdown} />
            <TokenBudget used={tokenUsage.used} total={tokenUsage.total} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenVisualizer;