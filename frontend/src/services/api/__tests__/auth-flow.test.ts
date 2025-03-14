// frontend/src/features/auth/__tests__/auth-flow.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../../store/store';
import LoginForm from '../../../components/auth/LoginForm';
import { authApi } from '../../../services/api/auth-api';
import { setTokens } from '../../../services/auth/token-service';

// Mock API client and token service
jest.mock('../../../services/api/auth-api');
jest.mock('../../../services/auth/token-service');

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  test('successful login flow', async () => {
    // Mock successful login API call
    (authApi.login as jest.Mock).mockResolvedValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com', role: 'user' },
      token: 'test-token',
      refreshToken: 'test-refresh-token'
    });
    
    // Render login form
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify API was called with correct data
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Verify tokens were saved
    await waitFor(() => {
      expect(setTokens).toHaveBeenCalledWith('test-token', 'test-refresh-token');
    });
    
    // Verify redirect (would need to mock useNavigate)
  });
  
  test('login with invalid credentials shows error', async () => {
    // Mock failed login
    (authApi.login as jest.Mock).mockRejectedValue({
      response: {
        data: { error: 'Invalid email or password', statusCode: 401 },
        status: 401
      }
    });
    
    // Render login form
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      </Provider>
    );
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
  
  // Add more tests for registration, token refresh, etc.
});