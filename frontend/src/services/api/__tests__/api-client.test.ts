// frontend/src/services/api/__tests__/api-client.test.ts
import MockAdapter from 'axios-mock-adapter';
import apiClient from '../api-client';
import { getAccessToken, setTokens, clearTokens } from '../../auth/token-service';

// Mock the token service
jest.mock('../../auth/token-service');

describe('API Client', () => {
  let mockAxios: MockAdapter;
  
  beforeEach(() => {
    mockAxios = new MockAdapter(apiClient['client']);
    jest.resetAllMocks();
  });
  
  afterEach(() => {
    mockAxios.restore();
  });
  
  test('should add auth token to request headers when available', async () => {
    // Mock token retrieval
    (getAccessToken as jest.Mock).mockReturnValue('test-token');
    
    // Configure mock response
    mockAxios.onGet('/test').reply(config => {
      // Check if Authorization header was set correctly
      expect(config.headers?.Authorization).toBe('Bearer test-token');
      return [200, { data: 'success' }];
    });
    
    // Make the request
    await apiClient.get('/test');
  });
  
  test('should handle 401 errors and refresh token', async () => {
    // Mock initial token
    (getAccessToken as jest.Mock).mockReturnValue('expired-token');
    
    // Mock successful token refresh
    mockAxios.onPost('/users/refresh-token').reply(200, {
      token: 'new-token',
      refreshToken: 'new-refresh-token'
    });
    
    // Configure 401 for first request, success for retry
    mockAxios.onGet('/test').replyOnce(401);
    mockAxios.onGet('/test').reply(200, { data: 'success' });
    
    // Make the request
    const result = await apiClient.get('/test');
    
    // Verify tokens were updated
    expect(setTokens).toHaveBeenCalledWith('new-token', 'new-refresh-token');
    expect(result).toEqual({ data: 'success' });
  });
  
  test('should handle failed token refresh', async () => {
    // Mock initial token
    (getAccessToken as jest.Mock).mockReturnValue('expired-token');
    
    // Mock failed token refresh
    mockAxios.onPost('/users/refresh-token').reply(401, {
      error: 'Invalid refresh token'
    });
    
    // Configure 401 for the test endpoint
    mockAxios.onGet('/test').reply(401);
    
    // Make the request and expect it to fail
    await expect(apiClient.get('/test')).rejects.toThrow();
    
    // Verify tokens were cleared
    expect(clearTokens).toHaveBeenCalled();
  });
  
  // Add more tests for other API client functionality...
});