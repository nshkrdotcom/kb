// frontend/src/components/context/TokenBreakdown.tsx
import React from 'react';
import { ContentType } from '../../types/context';

interface TokenBreakdownProps {
  breakdown: Record<ContentType, number>;
}

const TokenBreakdown: React.FC<TokenBreakdownProps> = ({ breakdown }) => {
  // Calculate total tokens from breakdown
  const totalTokens = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  
  // Content type colors
  const typeColors: Record<string, string> = {
    text: 'bg-blue-500',
    code: 'bg-indigo-500',
    list: 'bg-green-500',
    image: 'bg-purple-500'
  };
  
  // Content type icons (using SVG strings for simplicity)
  const typeIcons: Record<string, React.ReactNode> = {
    text: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    code: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    list: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Token Breakdown by Type</h3>
      
      {/* Stack Bar Chart */}
      <div className="flex h-6 rounded-full overflow-hidden mb-4">
        {Object.entries(breakdown).map(([type, count]) => {
          // Skip types with no tokens
          if (count === 0) return null;
          
          const percentage = totalTokens > 0 ? (count / totalTokens * 100) : 0;
          return (
            <div
              key={type}
              className={`${typeColors[type]} transition-all duration-300 ease-out`}
              style={{ width: `${percentage}%` }}
              title={`${type}: ${count} tokens (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      
      {/* Legend and Details */}
      <div className="space-y-2">
        {Object.entries(breakdown).map(([type, count]) => {
          const percentage = totalTokens > 0 ? (count / totalTokens * 100) : 0;
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-sm mr-2 ${typeColors[type]}`}></span>
                <div className="flex items-center">
                  {typeIcons[type]}
                  <span className="ml-1 text-sm capitalize">{type}</span>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                {count.toLocaleString()} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TokenBreakdown;