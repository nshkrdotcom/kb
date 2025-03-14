// frontend/src/components/auth/AuthGuard.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { checkAuthStatus } from '../../store/thunks/auth-thunks';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[]; // Optional role-based access control
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status if not already loading
    if (!isLoading) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch, isLoading]);

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the current location for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = user && roles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required roles, render children
  return <>{children}</>;
};