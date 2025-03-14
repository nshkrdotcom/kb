// src/pages/ConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/conversation/ChatInterface';

interface Context {
  id: string;
  title: string;
  description: string;
}

const ConversationPage: React.FC = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const [context, setContext] = useState<Context | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!contextId) return;
    
    // Simulate fetching context details from API
    const fetchContext = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      setTimeout(() => {
        // Mock context data based on ID
        const mockContext: Context = {
          id: contextId,
          title: contextId === 'context-1' 
            ? 'Project Documentation' 
            : contextId === 'context-2'
              ? 'Research Notes'
              : 'Meeting Minutes',
          description: 'Conversation with ContextNexus AI about this content.',
        };
        
        setContext(mockContext);
        setIsLoading(false);
      }, 500);
    };
    
    fetchContext();
  }, [contextId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (!context) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900">Context not found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The context you're looking for doesn't exist.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{context.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{context.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar for context navigation (optional) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Context</h3>
            
            {/* Context content list would go here */}
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-primary-50 text-primary-700 rounded-md">
                Introduction
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Technical Specifications
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Implementation Details
              </button>
            </div>
          </div>
        </div>
        
        {/* Main conversation area */}
        <div className="lg:col-span-9 h-[calc(100vh-220px)]">
          <ChatInterface contextId={contextId || ''} />
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;