// frontend/src/routes/ProtectedRoute.tsx
import React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';

interface ProtectedRouteProps extends RouteProps {
  roles?: string[];
  element: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  element,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      element={
        <AuthGuard roles={roles}>
          {element}
        </AuthGuard>
      }
    />
  );
};