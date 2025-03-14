// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// In a real app, this would be fetched from an API
interface Context {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate fetching contexts from API
    const fetchContexts = async () => {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      setTimeout(() => {
        const mockContexts: Context[] = [
          {
            id: 'context-1',
            title: 'Project Documentation',
            description: 'Technical documentation for the ContextNexus project.',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'context-2',
            title: 'Research Notes',
            description: 'Research findings and literature review notes.',
            updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: 'context-3',
            title: 'Meeting Minutes',
            description: 'Notes from team meetings and discussions.',
            updatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
        ];
        
        setContexts(mockContexts);
        setIsLoading(false);
      }, 1000);
    };
    
    fetchContexts();
  }, []);
  
  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Context
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Welcome, {user?.name}!</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a context to start a conversation or create a new one.
        </p>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Your Contexts</h3>
        
        {isLoading ? (
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : contexts.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contexts.map((context) => (
              <Link
                key={context.id}
                to={`/conversation/${context.id}`}
                className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <h4 className="text-lg font-medium text-gray-900">{context.title}</h4>
                  <p className="mt-1 text-sm text-gray-500">{context.description}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Last updated: {new Date(context.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 bg-white shadow rounded-lg p-6 text-center">
            <h4 className="text-lg font-medium text-gray-900">No contexts found</h4>
            <p className="mt-1 text-sm text-gray-500">
              Create your first context to get started.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Context
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;