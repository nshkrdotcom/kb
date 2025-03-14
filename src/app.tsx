// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { restoreSession } from './store/slices/authSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Authentication pages
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PasswordReset from './components/auth/PasswordReset';
import UserProfile from './components/auth/UserProfile';

// Layout components
import MainLayout from './components/layout/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import ConversationPage from './pages/ConversationPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Try to restore user session from token on app load
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);
  
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="conversation/:contextId" element={<ConversationPage />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;