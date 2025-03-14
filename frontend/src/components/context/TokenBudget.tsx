// frontend/src/components/context/TokenBudget.tsx
import React from 'react';

interface TokenBudgetProps {
  used: number;
  total: number;
}

const TokenBudget: React.FC<TokenBudgetProps> = ({ used, total }) => {
  const percentage = (used / total) * 100;
  
  // Calculate remaining tokens and average cost
  const remaining = total - used;
  
  // Estimate token cost (assuming $0.002 per 1K tokens)
  const costPerThousand = 0.002;
  const estimatedCost = (used / 1000) * costPerThousand;
  
  // Get status color based on usage
  const getStatusColor = () => {
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-amber-600';
    return 'text-green-600';
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Token Budget</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Used</div>
          <div className="text-lg font-medium">{used.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Remaining</div>
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {remaining.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total Limit</div>
          <div className="text-lg font-medium">{total.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Est. Cost</div>
          <div className="text-lg font-medium">
            ${estimatedCost.toFixed(4)}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Usage Status</span>
          <span className={getStatusColor()}>
            {percentage < 50 ? 'Good' : percentage < 75 ? 'Moderate' : percentage < 90 ? 'High' : 'Critical'}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${
              percentage > 90 
                ? 'bg-red-500' 
                : percentage > 75
                  ? 'bg-amber-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Token usage directly affects context quality and cost. Optimize your selection for the most relevant content.</p>
      </div>
    </div>
  );
};

export default TokenBudget;