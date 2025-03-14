// frontend/src/components/errorHandling/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring/analytics service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // e.g., Sentry.captureException(error)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise default error view
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">Error details:</p>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;