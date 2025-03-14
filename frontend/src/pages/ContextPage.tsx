// frontend/src/pages/ContextPage.tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchContextContent } from '../store/slices/contextSelectionSlice';
import ContextSelector from '../components/context/ContextSelector';
import TokenVisualizer from '../components/context/TokenVisualizer';
import ContextOrganizer from '../components/context/ContextOrganizer';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';

const ContextPage: React.FC = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    if (contextId) {
      dispatch(fetchContextContent(contextId));
    }
  }, [contextId, dispatch]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Context Selection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select and organize content for your AI context. The more relevant content you include, the better your AI responses will be.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main selection panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Context selector */}
          <ContextSelector contextId={contextId || ''} />
          
          {/* Knowledge graph visualization */}
          <KnowledgeGraph />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Token visualizer */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium p-4 border-b border-gray-200">Token Usage</h2>
            <TokenVisualizer />
          </div>
          
          {/* Context organizer */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium p-4 border-b border-gray-200">Organize Content</h2>
            <ContextOrganizer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPage;