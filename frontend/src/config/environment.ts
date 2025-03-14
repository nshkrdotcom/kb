// frontend/src/config/environment.ts
export interface EnvironmentConfig {
    apiUrl: string;
    wsUrl: string;
    enableDevTools: boolean;
    tokenRefreshInterval: number;
    sentryDsn?: string;
    featureFlags: {
      enableCollaboration: boolean;
      enableGraphView: boolean;
    };
  }
  
  // Load environment variables from process.env
  const getEnvironmentConfig = (): EnvironmentConfig => {
    return {
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
      wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws',
      enableDevTools: process.env.NODE_ENV !== 'production',
      tokenRefreshInterval: parseInt(process.env.REACT_APP_TOKEN_REFRESH_INTERVAL || '300000', 10), // 5 minutes
      sentryDsn: process.env.REACT_APP_SENTRY_DSN,
      featureFlags: {
        enableCollaboration: process.env.REACT_APP_ENABLE_COLLABORATION === 'true',
        enableGraphView: process.env.REACT_APP_ENABLE_GRAPH_VIEW !== 'false', // Enabled by default
      },
    };
  };
  
  export const config = getEnvironmentConfig();