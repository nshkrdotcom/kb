// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { healthCheckService } from './services/health-check-service';
import { checkAuthStatus } from './store/thunks/auth-thunks';
import { wsService } from './services/websocket-service';
import ErrorBoundary from './components/errorHandling/ErrorBoundary';
import NotificationSystem from './components/notifications/NotificationSystem';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthGuard } from './components/auth/AuthGuard';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordReset from './pages/auth/PasswordReset';
import Dashboard from './pages/Dashboard';
import ContextPage from './pages/ContextPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Initial health check
    healthCheckService.checkHealth();
    
    // Start periodic health checks in production
    if (process.env.NODE_ENV === 'production') {
      healthCheckService.startPeriodicHealthChecks();
    }
    
    // Check auth status on app load
    dispatch(checkAuthStatus());
    
    // Clean up on unmount
    return () => {
      healthCheckService.stopPeriodicHealthChecks();
      wsService.disconnect();
    };
  }, [dispatch]);
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationSystem />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          
          <Route path="/context/:contextId" element={
            <AuthGuard>
              <ContextPage />
            </AuthGuard>
          } />
          
          <Route path="/profile" element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          } />
          
          {/* Admin routes with role check */}
          <Route path="/admin" element={
            <AuthGuard roles={['admin']}>
              <AdminPage />
            </AuthGuard>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;