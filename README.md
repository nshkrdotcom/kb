
# kb
AI Jam private
# Setting Up an Ad Hoc Python Server

To serve the files from the `./pub` directory using Python's built-in HTTP server, follow these steps:

## Instructions

1. Open a terminal or command prompt
2. Navigate to the root directory (where the `pub` folder is located)
3. Run one of the following commands based on your Python version:

### Python 3 (Recommended)
```bash
python3 -m http.server --directory pub 8000
```

This will start a server on port 8000 serving files from the `./pub` directory.

### Alternative Method
If your Python version doesn't support the `--directory` option (Python < 3.7):
```bash
cd pub
python3 -m http.server 8000
```

### Accessing the Site
Open your web browser and navigate to:
```
http://localhost:8000
```

### Stopping the Server
To stop the server, press `Ctrl+C` in the terminal where the server is running.












## 6. Required Packages

You'll need to install these additional packages:

```bash
npm install jsonwebtoken cookie-parser
npm install --save-dev @types/jsonwebtoken @types/cookie-parser


## 8. Required Packages

You'll need to install these additional packages:

```bash
npm install axios eventsource gpt-tokenizer
npm install --save-dev @types/eventsource
```















# Frontend Development Implementation: Authentication & Conversation UI

I'll create a comprehensive implementation for the ContextNexus frontend, focusing on authentication flow and conversation interface. This implementation uses React with TypeScript, Redux for state management, and a responsive design system.

## 1. Project Setup and Dependencies

First, let's set up the React application with TypeScript and install necessary dependencies:

```bash
# Create React application with TypeScript template
npx create-react-app frontend --template typescript
cd frontend

# Install core dependencies
npm install react-router-dom axios formik yup @reduxjs/toolkit react-redux
npm install react-markdown react-syntax-highlighter jwt-decode
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npm install react-toastify

# Install dev dependencies
npm install --save-dev @types/react-router-dom @types/react-syntax-highlighter

# Initialize Tailwind CSS
npx tailwindcss init -p
```

Configure Tailwind CSS in `tailwind.config.js`:

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1fe',
          100: '#cce3fd',
          200: '#99c7fb',
          300: '#66aaf9',
          400: '#338ef7',
          500: '#0072f5',
          600: '#005bc4',
          700: '#004493',
          800: '#002e62',
          900: '#001731',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

















## 3. Security Enhancements

Add CSRF protection to the API client:

```typescript
// Add to api-client.ts in the setupInterceptors method

// Request interceptor for CSRF protection
this.client.interceptors.request.use(
  config => {
    // Get CSRF token from cookie or meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (csrfToken && config.method !== 'get' && config.method !== 'GET') {
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
    
    return config;
  },
  error => Promise.reject(error)
);
```

Add security headers to the backend (in app.ts):

```typescript
// Add these security middleware to app.ts
import helmet from 'helmet';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Apply security headers
app.use(helmet());

// Parse cookies for CSRF protection
app.use(cookieParser());

// Apply CSRF protection (except for auth endpoints)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/users/login') || 
      req.path.startsWith('/api/users/register') ||
      req.path.startsWith('/api/users/refresh-token')) {
    return next();
  }
  
  csrf({ cookie: true })(req, res, next);
});
```

## 4. Performance Optimization

Add React.memo and useMemo for expensive components and computations:

```typescript
// Example for optimizing a component that renders many times
// frontend/src/components/context/ContentItem.tsx
import React, { useMemo } from 'react';

interface ContentItemProps {
  item: {
    id: string;
    title: string;
    content: string;
    type: string;
    selected: boolean;
    tokens: number;
  };
  onSelect: (id: string) => void;
}

const ContentItem: React.FC<ContentItemProps> = React.memo(({ item, onSelect }) => {
  // Memoize expensive computations
  const contentPreview = useMemo(() => {
    if (item.content.length > 100) {
      return `${item.content.substring(0, 100)}...`;
    }
    return item.content;
  }, [item.content]);

  return (
    <div 
      className={`p-4 border rounded-md mb-2 ${item.selected ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
      onClick={() => onSelect(item.id)}
    >
      <h3 className="font-medium">{item.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{contentPreview}</p>
      <div className="text-xs text-gray-500 mt-2">{item.tokens} tokens</div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.selected === nextProps.item.selected &&
    prevProps.item.tokens === nextProps.item.tokens
  );
});

export default ContentItem;
```

## 5. Accessibility Improvements

Add basic accessibility enhancements:

```typescript
// frontend/src/components/common/A11yProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface A11yContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export const useA11y = () => {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
};

interface A11yProviderProps {
  children: ReactNode;
}

export const A11yProvider: React.FC<A11yProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16); // Default font size

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    document.documentElement.classList.toggle('high-contrast', newValue);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24); // Max 24px
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12); // Min 12px
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const resetFontSize = () => {
    setFontSize(16);
    document.documentElement.style.fontSize = '16px';
  };

  return (
    <A11yContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
};
```

Add to your App.tsx:

```tsx
// In App.tsx
import { A11yProvider } from './components/common/A11yProvider';

// Wrap your app
return (
  <ErrorBoundary>
    <A11yProvider>
      <BrowserRouter>
        {/* Rest of your app */}
      </BrowserRouter>
    </A11yProvider>
  </ErrorBoundary>
);
```

## 6. Analytics Setup

Add basic analytics tracking:

```typescript
// frontend/src/services/analytics-service.ts
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private isInitialized = false;

  // Initialize analytics (call in app startup)
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Initialize your analytics platform
    // Example for Google Analytics
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_GA_ID) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_ID}`;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', process.env.REACT_APP_GA_ID);
      
      this.isInitialized = true;
    }
  }

  // Track page view
  public trackPageView(path: string, title?: string): void {
    if (!this.isInitialized) return;
    
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  }

  // Track event
  public trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized) return;
    
    if (window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }
  }
}

// Create global analytics instance
export const analytics = new AnalyticsService();
```

## 7. Project Directory Structure

Consider defining a clear project structure before starting implementation:

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Common UI elements
│   │   ├── context/        # Context selection components
│   │   ├── errorHandling/  # Error handling components
│   │   ├── graph/          # Graph visualization components
│   │   ├── layout/         # Layout components
│   │   └── notifications/  # Notification components
│   ├── config/             # Configuration files
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # Dashboard pages
│   ├── services/           # Service layer
│   │   ├── api/            # API client services
│   │   └── auth/           # Authentication services
│   ├── store/              # Redux store
│   │   ├── middleware/     # Redux middleware
│   │   ├── slices/         # Redux slices
│   │   ├── selectors/      # Redux selectors
│   │   └── thunks/         # Redux thunks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Root component
├── .env.development        # Development environment variables
├── .env.production         # Production environment variables
├── .eslintrc.json          # ESLint config
├── .prettierrc             # Prettier config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies and scripts
```

## 8. Version Control Setup

Create a `.gitignore` file to avoid committing sensitive information:

```
# .gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE files
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# Mac files
.DS_Store

# Windows files
Thumbs.db
```

With these additions, you should have a much more robust foundation before starting your implementation. These cover important areas like configuration, code quality, security, performance, and accessibility that weren't explicitly addressed in the original responses.













# Addl components 1/2

# Additional Critical Elements Before Implementation

Before converting these files, here are some additional critical elements to consider that haven't been fully addressed yet:

## 1. Documentation Strategy

Consider setting up JSDoc comments for key components and functions:

```typescript
/**
 * Optimizes context selection based on relevance and token limits
 * 
 * @param contextId - The ID of the context to optimize
 * @param query - The current query for relevance calculation
 * @param tokenBudget - Maximum tokens to use
 * @param options - Additional optimization options
 * @returns Optimized context with selected content items
 * 
 * @example
 * ```typescript
 * const optimizedContext = await contextOptimizer.optimizeContext(
 *   'context-123',
 *   'How does authentication work?',
 *   4000
 * );
 * ```
 */
```

Also consider adding a README.md for each major directory explaining its purpose and organization.

## 2. API Versioning & Change Management

Add API version handling to your API client:

```typescript
// frontend/src/services/api/api-client.ts

// Constructor with version support
constructor(
  baseURL = process.env.REACT_APP_API_URL,
  private apiVersion = 'v1'
) {
  this.client = axios.create({
    baseURL: `${baseURL}/${this.apiVersion}`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  this.setupInterceptors();
}
```

## 3. Internationalization (i18n)

Add basic i18n support for future internationalization:

```typescript
// frontend/src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslation from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

Create a basic English translation file:

```json
// frontend/src/i18n/locales/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create"
  },
  "auth": {
    "login": "Log In",
    "register": "Register",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password"
  },
  "context": {
    "selection": "Context Selection",
    "tokenUsage": "Token Usage",
    "relevance": "Relevance",
    "organization": "Organization"
  },
  "errors": {
    "generic": "Something went wrong",
    "network": "Network error. Please check your connection",
    "unauthorized": "Please log in to continue",
    "forbidden": "You don't have permission to perform this action"
  }
}
```

## 4. Advanced Data Fetching with React Query

Consider adding React Query for more sophisticated data fetching:

```typescript
// frontend/src/hooks/useContexts.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { contextApi } from '../services/api/context-api';
import { ApiError } from '../services/api/api-error';

export function useContexts(projectId: string) {
  return useQuery(
    ['contexts', projectId], 
    () => contextApi.getContextsForProject(projectId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        // Handle errors
        const apiError = ApiError.from(error);
        console.error('Failed to fetch contexts:', apiError.toUserFriendlyMessage());
      }
    }
  );
}

export function useCreateContext() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (newContext) => contextApi.createContext(newContext),
    {
      onSuccess: (data, variables) => {
        // Update cache
        queryClient.invalidateQueries(['contexts', variables.projectId]);
      }
    }
  );
}
```

## 5. Component Library Integration

Add a UI component library integration to save development time:

```typescript
// frontend/src/components/ui/index.ts
// Re-export UI components from your chosen library (or custom components)

// Example using a mix of custom components and imported ones
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Card } from './Card';
export { default as Modal } from './Modal';
export { default as Spinner } from './Spinner';
export { default as Tooltip } from './Tooltip';
```

## 6. Browser Compatibility Configuration

Add browser compatibility configuration:

```json
// package.json - Add browserslist section
"browserslist": {
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all",
    "last 2 versions"
  ],
  "development": [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version"
  ]
}
```

## 7. Mock Service Worker for Development

Set up MSW for development and testing:

```typescript
// frontend/src/mocks/handlers.ts
import { rest } from 'msw';
import { mockContexts, mockContentItems } from './data';

export const handlers = [
  // Auth endpoints
  rest.post('/api/v1/users/login', (req, res, ctx) => {
    const { email, password } = req.body as any;
    
    if (email === 'user@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user'
          },
          token: 'fake-jwt-token',
          refreshToken: 'fake-refresh-token'
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        error: 'Invalid email or password',
        statusCode: 401
      })
    );
  }),
  
  // Contexts endpoints
  rest.get('/api/v1/contexts/project/:projectId', (req, res, ctx) => {
    const { projectId } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json(mockContexts.filter(c => c.projectId === projectId))
    );
  }),
  
  // Add more mock handlers as needed
];
```

## 8. Feature Flags Implementation

Add a feature flag system to manage feature rollout:

```typescript
// frontend/src/utils/feature-flags.ts
import { config } from '../config/environment';

export type FeatureFlag = 
  | 'enableCollaboration'
  | 'enableGraphView'
  | 'enableAdvancedTokenization'
  | 'enableCategorySuggestions';

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Check environment config first
  if (feature in config.featureFlags) {
    return config.featureFlags[feature as keyof typeof config.featureFlags];
  }
  
  // Check local storage for QA/debugging overrides
  if (process.env.NODE_ENV !== 'production') {
    const override = localStorage.getItem(`feature_${feature}`);
    if (override === 'true') return true;
    if (override === 'false') return false;
  }
  
  // Default values for features not configured
  const defaults: Record<FeatureFlag, boolean> = {
    enableCollaboration: false,
    enableGraphView: true,
    enableAdvancedTokenization: false,
    enableCategorySuggestions: false
  };
  
  return defaults[feature];
}

// Usage in components
// if (isFeatureEnabled('enableGraphView')) {
//   // Render graph view components
// }
```

## 9. Mobile Support Strategy

Create responsive utility hooks:

```typescript
// frontend/src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

export function useResponsive() {
  // Screen size breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Return derived responsive state
  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < breakpoints.md,
    isTablet: windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg,
    isDesktop: windowSize.width >= breakpoints.lg,
    breakpoints
  };
}
```

## 10. CI/CD Configuration

Create GitHub Actions workflow for CI/CD:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run type-check
    
    - name: Test
      run: npm test
    
    - name: Build
      run: npm run build
```

## 11. Performance Monitoring

Add frontend performance monitoring:

```typescript
// frontend/src/utils/performance-monitoring.ts
class PerformanceMonitor {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Track a specific performance mark
   */
  public mark(name: string): void {
    if (!this.isEnabled) return;
    
    try {
      performance.mark(name);
    } catch (e) {
      console.error('Failed to create performance mark:', e);
    }
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark: string): number {
    if (!this.isEnabled) return 0;
    
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      return entries.length > 0 ? entries[0].duration : 0;
    } catch (e) {
      console.error('Failed to create performance measure:', e);
      return 0;
    }
  }

  /**
   * Track component render time
   * Use as: componentDidMount() { perfMonitor.trackRender('MyComponent'); }
   */
  public trackRender(componentName: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const startMark = `${componentName}_render_start`;
    const endMark = `${componentName}_render_end`;
    const measureName = `${componentName}_render_time`;
    
    this.mark(startMark);
    
    return () => {
      this.mark(endMark);
      const duration = this.measure(measureName, startMark, endMark);
      
      // Report to analytics if the render was slow (>100ms)
      if (duration > 100) {
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
        // Report to monitoring service
      }
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
```

## 12. Git Hooks for Quality Control

Add Git hooks with Husky to enforce code quality:

```json
// package.json - Add husky configuration
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

## 13. Dependency Management Strategy

Add a dependency maintenance policy in the README:

```markdown
# Dependency Management

## Version Pinning
- All dependencies should be pinned to specific versions to ensure reproducible builds
- Use exact versions (not ^ or ~) for critical dependencies

## Security Scanning
- Dependencies are automatically scanned for vulnerabilities with npm audit
- Security PRs should be prioritized

## Updating Dependencies
- Dependencies should be updated in separate PRs from feature work
- Test thoroughly after dependency updates
- Document any breaking changes and migration steps
```

## 14. Error Tracking Setup for Production

```typescript
// frontend/src/utils/error-tracking.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { config } from '../config/environment';

export function initializeErrorTracking() {
  if (process.env.NODE_ENV === 'production' && config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Don't send certain types of errors
        if (event.exception && 
            event.exception.values && 
            event.exception.values[0].type === 'ChunkLoadError') {
          return null;
        }
        return event;
      }
    });
  }
}

export const trackError = (error: unknown, context?: Record<string, any>) => {
  console.error('Error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  }
};
```

These additional components address critical areas that weren't fully covered in the original implementation. They provide a more complete foundation before you start converting the responses into actual files, helping ensure a smoother development process and more maintainable codebase.

# Addl components 2/2


# Additional Critical Elements - Server, Database, and LLM Components

## 15. Database Migration Strategy

```typescript
// src/db/migrations/migration-utils.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { config } from '../../config/app-config';

const pool = new Pool(config.database.postgres);

interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
}

// Set up migrations table if it doesn't exist
async function initializeMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get applied migrations
async function getAppliedMigrations(): Promise<Migration[]> {
  const result = await pool.query('SELECT id, name, applied_at FROM migrations ORDER BY id');
  return result.rows;
}

// Apply pending migrations
export async function runMigrations(): Promise<void> {
  logger.info('Running database migrations');
  
  await initializeMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();
  const appliedMigrationNames = new Set(appliedMigrations.map(m => m.name));
  
  // Get migration files
  const migrationsDir = path.join(__dirname, 'scripts');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure order by filename (use timestamps in filenames)
  
  // Apply migrations that haven't been applied yet
  for (const file of migrationFiles) {
    if (!appliedMigrationNames.has(file)) {
      logger.info(`Applying migration: ${file}`);
      
      try {
        // Begin transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Read and execute migration
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await client.query(sql);
          
          // Record migration
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          
          await client.query('COMMIT');
          logger.info(`Successfully applied migration: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error(`Migration failed: ${file}`, { error });
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        logger.error(`Failed to apply migration: ${file}`, { error });
        throw error;
      }
    }
  }
  
  logger.info('Database migrations complete');
}

// Example migration file: src/db/migrations/scripts/20230101120000_create_contexts_table.sql
/*
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_contexts_project_id ON contexts(project_id);
CREATE INDEX idx_contexts_created_by ON contexts(created_by);
*/
```

## 16. Database Connection Pooling and Resilience

```typescript
// src/db/postgres-pool.ts
import { Pool, PoolClient } from 'pg';
import { config } from '../config/app-config';
import logger from '../utils/logger';

// Create connection pool with optimized settings
const pool = new Pool({
  user: config.database.postgres.user,
  host: config.database.postgres.host,
  database: config.database.postgres.database,
  password: config.database.postgres.password,
  port: config.database.postgres.port,
  // Connection pool settings
  max: config.database.postgres.poolMax || 20, // Max pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
  maxUses: 7500, // Close and replace a connection after it has been used 7500 times (prevents memory leaks)
});

// Listen for connection issues
pool.on('error', (err: Error, client: PoolClient) => {
  logger.error('Unexpected error on idle database client', { error: err.message });
});

// Function to automatically retry database operations
export async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Only retry on connection errors, not on query syntax errors
    if (
      retries > 0 && 
      (error.code === 'ECONNREFUSED' || 
       error.code === 'ETIMEDOUT' || 
       error.code === '08006' || // Connection failure
       error.code === '08001' // Unable to establish connection
      )
    ) {
      logger.warn(`Database operation failed, retrying (${retries} attempts left)`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

// Execute a function with a database client from the pool
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
```

## 17. API Rate Limiting

```typescript
// src/api/middlewares/rate-limiter.ts
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../../config/app-config';
import { RateLimitError } from '../../utils/errors';

// Create Redis client for distributed rate limiting
const redisClient = createClient({
  url: config.redis.url,
  password: config.redis.password,
});

redisClient.on('error', (err) => console.error('Redis error:', err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use Redis store for distributed environments
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many requests, please try again later');
  },
});

// More restrictive limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 login attempts per hour
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many login attempts, please try again later');
  },
});

// LLM API rate limiter (token-based)
export const llmLimiter = (async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }
  
  const userId = req.user.id;
  const key = `llm:tokens:${userId}`;
  
  try {
    // Get remaining tokens for the user
    const tokensUsedStr = await redisClient.get(key);
    const tokensUsed = tokensUsedStr ? parseInt(tokensUsedStr) : 0;
    
    // Get user's token quota from the database or configuration
    // This could be based on subscription plan
    const userTokenQuota = await getUserTokenQuota(userId);
    
    if (tokensUsed >= userTokenQuota) {
      throw new RateLimitError('Token quota exceeded for today');
    }
    
    // Continue to the next middleware
    next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    next(error);
  }
}) as unknown as (req: Request, res: Response, next: NextFunction) => void;

// Track token usage after successful LLM request
export async function trackTokenUsage(userId: string, tokens: number): Promise<void> {
  const key = `llm:tokens:${userId}`;
  
  // Get current usage
  const tokensUsedStr = await redisClient.get(key);
  const tokensUsed = tokensUsedStr ? parseInt(tokensUsedStr) : 0;
  
  // Update usage
  await redisClient.set(key, tokensUsed + tokens);
  
  // Set expiry to reset daily (if not already set)
  const ttl = await redisClient.ttl(key);
  if (ttl < 0) {
    // Calculate seconds until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
    
    await redisClient.expire(key, secondsUntilMidnight);
  }
}

async function getUserTokenQuota(userId: string): Promise<number> {
  // In a real implementation, this would query the user's subscription plan
  // and return the appropriate token quota
  return 100000; // Default quota: 100k tokens per day
}
```

## 18. Server-side Caching Strategy

```typescript
// src/services/cache-service.ts
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/app-config';
import logger from '../utils/logger';

class CacheService {
  private client: RedisClientType;
  private isReady: boolean = false;
  
  constructor() {
    this.client = createClient({
      url: config.redis.url,
      password: config.redis.password,
    });
    
    this.client.on('error', (err) => {
      logger.error('Redis cache error', { error: err.message });
      this.isReady = false;
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to Redis cache');
      this.isReady = true;
    });
    
    // Connect to Redis
    (async () => {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis cache', { error });
      }
    })();
  }
  
  /**
   * Get an item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Error getting data from cache', { key, error });
      return null;
    }
  }
  
  /**
   * Set an item in cache
   */
  async set<T>(key: string, data: T, expireSeconds?: number): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      const jsonData = JSON.stringify(data);
      
      if (expireSeconds) {
        await this.client.set(key, jsonData, { EX: expireSeconds });
      } else {
        await this.client.set(key, jsonData);
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting data in cache', { key, error });
      return false;
    }
  }
  
  /**
   * Delete an item from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting data from cache', { key, error });
      return false;
    }
  }
  
  /**
   * Clear all cache for a prefix
   */
  async clearPrefix(prefix: string): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      const keys = await this.client.keys(`${prefix}*`);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      
      return true;
    } catch (error) {
      logger.error('Error clearing cache prefix', { prefix, error });
      return false;
    }
  }
  
  /**
   * Wrap a function call with caching
   */
  async wrapper<T>(
    key: string,
    fn: () => Promise<T>,
    expireSeconds: number = 3600 // Default: 1 hour
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute the function
    const result = await fn();
    
    // Cache the result
    await this.set(key, result, expireSeconds);
    
    return result;
  }
}

// Create singleton instance
export const cacheService = new CacheService();
```

## 19. Neo4j Connection Setup and Resilience

```typescript
// src/db/neo4j-driver.ts
import neo4j, { Driver, Session, Transaction } from 'neo4j-driver';
import { config } from '../config/app-config';
import logger from '../utils/logger';

class Neo4jConnection {
  private driver: Driver | null = null;
  private static instance: Neo4jConnection;
  
  private constructor() {
    this.initializeDriver();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): Neo4jConnection {
    if (!Neo4jConnection.instance) {
      Neo4jConnection.instance = new Neo4jConnection();
    }
    return Neo4jConnection.instance;
  }
  
  /**
   * Initialize Neo4j driver
   */
  private initializeDriver(): void {
    try {
      const { url, username, password, database } = config.database.neo4j;
      
      this.driver = neo4j.driver(
        url,
        neo4j.auth.basic(username, password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2000, // 2 seconds
          disableLosslessIntegers: true,
        }
      );
      
      // Register driver shutdown on process exit
      process.on('exit', () => this.close());
      
      logger.info('Neo4j driver initialized');
    } catch (error) {
      logger.error('Failed to initialize Neo4j driver', { error });
      throw error;
    }
  }
  
  /**
   * Get a Neo4j session
   */
  public getSession(): Session {
    if (!this.driver) {
      this.initializeDriver();
    }
    
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }
    
    return this.driver.session({
      database: config.database.neo4j.database,
      defaultAccessMode: neo4j.session.WRITE
    });
  }
  
  /**
   * Execute a query with a session
   */
  public async executeQuery<T>(
    cypher: string,
    params: Record<string, any> = {},
    database?: string
  ): Promise<T[]> {
    const session = this.getSession();
    
    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj as T;
      });
    } finally {
      session.close();
    }
  }
  
  /**
   * Execute a query within a transaction
   */
  public async executeWithTransaction<T>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const session = this.getSession();
    
    try {
      return await session.executeWrite(callback);
    } finally {
      session.close();
    }
  }
  
  /**
   * Close the driver
   */
  public close(): void {
    if (this.driver) {
      this.driver.close();
      this.driver = null;
    }
  }
  
  /**
   * Check if connection is available
   */
  public async verifyConnectivity(): Promise<boolean> {
    if (!this.driver) {
      return false;
    }
    
    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch (error) {
      logger.error('Neo4j connectivity check failed', { error });
      return false;
    }
  }
}

export const neo4jConnection = Neo4jConnection.getInstance();
```

## 20. Vector Database (Pinecone) Optimization

```typescript
// src/repositories/pinecone/pinecone-client.ts
import { PineconeClient, Vector, QueryRequest } from '@pinecone-database/pinecone';
import { config } from '../../config/app-config';
import logger from '../../utils/logger';

class PineconeService {
  private client: PineconeClient;
  private indexName: string;
  private namespace: string;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  constructor() {
    this.client = new PineconeClient();
    this.indexName = config.vectors.pinecone.indexName;
    this.namespace = config.vectors.pinecone.namespace;
  }
  
  /**
   * Initialize Pinecone client
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = (async () => {
      try {
        await this.client.init({
          apiKey: config.vectors.pinecone.apiKey,
          environment: config.vectors.pinecone.environment,
        });
        
        // Check if index exists
        const indexes = await this.client.listIndexes();
        
        if (!indexes.includes(this.indexName)) {
          logger.error(`Pinecone index ${this.indexName} does not exist`);
          throw new Error(`Pinecone index ${this.indexName} does not exist`);
        }
        
        this.initialized = true;
        logger.info('Pinecone client initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Pinecone client', { error });
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();
    
    return this.initializationPromise;
  }
  
  /**
   * Get Pinecone index
   */
  private async getIndex() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.client.Index(this.indexName);
  }
  
  /**
   * Upsert vectors in batches (more efficient)
   */
  async upsertVectors(vectors: Vector[]): Promise<void> {
    const index = await this.getIndex();
    
    // Split into batches of 100 vectors for efficiency
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      batches.push(vectors.slice(i, i + BATCH_SIZE));
    }
    
    try {
      // Process batches concurrently but with limits
      await Promise.all(
        batches.map(async (batch, idx) => {
          // Small delay between batches to prevent rate limiting
          if (idx > 0) {
            await new Promise(resolve => setTimeout(resolve, 100 * idx));
          }
          
          await index.upsert({
            upsertRequest: {
              vectors: batch,
              namespace: this.namespace
            }
          });
        })
      );
      
      logger.info(`Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      logger.error('Error upserting vectors to Pinecone', { error });
      throw error;
    }
  }
  
  /**
   * Query nearest vectors with filtering support
   */
  async queryVectors(
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<{ id: string; score: number }[]> {
    const index = await this.getIndex();
    
    try {
      const queryRequest: QueryRequest = {
        vector: queryVector,
        topK,
        includeMetadata: true,
        namespace: this.namespace
      };
      
      if (filter) {
        queryRequest.filter = filter;
      }
      
      const response = await index.query({ queryRequest });
      
      return (response.matches || []).map(match => ({
        id: match.id,
        score: match.score || 0
      }));
    } catch (error) {
      logger.error('Error querying vectors from Pinecone', { error });
      throw error;
    }
  }
  
  /**
   * Delete vectors by ID
   */
  async deleteVectors(ids: string[]): Promise<void> {
    const index = await this.getIndex();
    
    try {
      await index.delete({
        ids,
        namespace: this.namespace
      });
      
      logger.info(`Deleted ${ids.length} vectors from Pinecone`);
    } catch (error) {
      logger.error('Error deleting vectors from Pinecone', { error });
      throw error;
    }
  }
  
  /**
   * Fetch vectors by ID
   */
  async fetchVectors(ids: string[]): Promise<Record<string, Vector>> {
    const index = await this.getIndex();
    
    try {
      const response = await index.fetch({ 
        ids,
        namespace: this.namespace
      });
      
      return response.vectors || {};
    } catch (error) {
      logger.error('Error fetching vectors from Pinecone', { error });
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();
```

## 21. LLM Provider Failover and Load Balancing

```typescript
// src/llm/llm-load-balancer.ts
import { LLMConnector, LLMModelInfo, LLMOptions } from './connectors/llm-connector';
import { ModelRegistry } from './model-registry';
import { config } from '../config/app-config';
import logger from '../utils/logger';

interface ModelConfig {
  modelId: string;
  weight: number;
  maxConcurrent: number;
  failoverModels: string[];
  costPerToken: number;
}

interface ModelStats {
  activeCalls: number;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalLatencyMs: number;
  totalTokens: number;
  lastErrorTimestamp?: Date;
  isCircuitBroken: boolean;
  circuitResetTime?: Date;
}

class LLMLoadBalancer {
  private registry: ModelRegistry;
  private modelConfigs: Record<string, ModelConfig> = {};
  private modelStats: Record<string, ModelStats> = {};
  private circuitBreakerThreshold = 5; // Failures before circuit breaks
  private circuitBreakDurationMs = 30000; // 30 seconds
  
  constructor(registry: ModelRegistry) {
    this.registry = registry;
    this.loadModelConfigs();
  }
  
  /**
   * Load model configurations for load balancing
   */
  private loadModelConfigs(): void {
    // Load from configuration
    const modelConfigs = config.ai.modelConfigs || [];
    
    for (const modelConfig of modelConfigs) {
      this.modelConfigs[modelConfig.modelId] = modelConfig;
      this.modelStats[modelConfig.modelId] = {
        activeCalls: 0,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        totalLatencyMs: 0,
        totalTokens: 0,
        isCircuitBroken: false
      };
    }
    
    logger.info('LLM load balancer configured', { 
      models: Object.keys(this.modelConfigs) 
    });
  }
  
  /**
   * Select the best model based on load balancing configuration
   */
  private selectModel(
    preferredModelId?: string,
    requiredCapabilities?: string[]
  ): string {
    // If preferred model is specified and available, try to use it
    if (preferredModelId && this.modelConfigs[preferredModelId]) {
      const modelConfig = this.modelConfigs[preferredModelId];
      const modelStats = this.modelStats[preferredModelId];
      
      // Check if the model is available (not circuit broken and under capacity)
      if (!modelStats.isCircuitBroken && 
          modelStats.activeCalls < modelConfig.maxConcurrent) {
        return preferredModelId;
      }
    }
    
    // Find available models that match required capabilities
    const availableModels = Object.entries(this.modelConfigs)
      .filter(([modelId, _]) => {
        const stats = this.modelStats[modelId];
        const config = this.modelConfigs[modelId];
        
        // Check circuit breaker
        if (stats.isCircuitBroken) {
          // Check if circuit breaker should be reset
          if (stats.circuitResetTime && stats.circuitResetTime < new Date()) {
            stats.isCircuitBroken = false;
            stats.circuitResetTime = undefined;
            logger.info(`Circuit breaker reset for model ${modelId}`);
          } else {
            return false;
          }
        }
        
        // Check capacity
        if (stats.activeCalls >= config.maxConcurrent) {
          return false;
        }
        
        // Check capabilities
        if (requiredCapabilities && requiredCapabilities.length > 0) {
          const modelInfo = this.registry.getModel(modelId).getModelInfo();
          return requiredCapabilities.every(cap => 
            modelInfo.capabilities.includes(cap)
          );
        }
        
        return true;
      })
      .map(([modelId, config]) => ({
        modelId,
        weight: config.weight,
        score: config.weight / (this.modelStats[modelId].activeCalls + 1)
      }))
      .sort((a, b) => b.score - a.score);
    
    if (availableModels.length === 0) {
      logger.warn('No available LLM models found, using default');
      return this.registry.getDefaultModel().getModelInfo().id;
    }
    
    // Return the model with the highest score
    return availableModels[0].modelId;
  }
  
  /**
   * Send prompt with automatic model selection and failover
   */
  async sendPrompt(
    prompt: string, 
    options: LLMOptions & { 
      preferredModelId?: string;
      requiredCapabilities?: string[];
    } = {}
  ): Promise<string> {
    const { preferredModelId, requiredCapabilities, ...llmOptions } = options;
    
    // Select the appropriate model
    const modelId = this.selectModel(preferredModelId, requiredCapabilities);
    const modelStats = this.modelStats[modelId];
    
    // Update stats
    modelStats.activeCalls++;
    modelStats.totalCalls++;
    
    const startTime = Date.now();
    
    try {
      // Get the model connector
      const model = this.registry.getModel(modelId);
      
      // Send the prompt
      const response = await model.sendPrompt(prompt, llmOptions);
      
      // Update stats on success
      modelStats.successCalls++;
      modelStats.totalLatencyMs += (Date.now() - startTime);
      
      // Estimate token usage (very rough approximation)
      const promptTokens = prompt.length / 4;
      const responseTokens = response.length / 4;
      modelStats.totalTokens += (promptTokens + responseTokens);
      
      return response;
    } catch (error) {
      // Handle failures and circuit breaking
      modelStats.failedCalls++;
      modelStats.lastErrorTimestamp = new Date();
      
      // Check if circuit breaker should trip
      if (shouldTripCircuitBreaker(modelId)) {
        modelStats.isCircuitBroken = true;
        modelStats.circuitResetTime = new Date(Date.now() + this.circuitBreakDurationMs);
        logger.warn(`Circuit breaker tripped for model ${modelId}`, { error });
      }
      
      // Try failover if available
      const modelConfig = this.modelConfigs[modelId];
      if (modelConfig.failoverModels && modelConfig.failoverModels.length > 0) {
        for (const failoverModelId of modelConfig.failoverModels) {
          try {
            logger.info(`Attempting failover to model ${failoverModelId}`);
            const failoverModel = this.registry.getModel(failoverModelId);
            return await failoverModel.sendPrompt(prompt, llmOptions);
          } catch (failoverError) {
            logger.error(`Failover to model ${failoverModelId} failed`, { error: failoverError });
            // Continue to next failover model
          }
        }
      }
      
      // All failovers failed, rethrow the original error
      throw error;
    } finally {
      // Always decrement active calls
      modelStats.activeCalls--;
    }
  }
  
  /**
   * Determine if circuit breaker should trip
   */
  private shouldTripCircuitBreaker(modelId: string): boolean {
    const stats = this.modelStats[modelId];
    
    // Check recent failure rate
    const recentFailThreshold = Date.now() - 60000; // Last minute
    const recentFailures = stats.lastErrorTimestamp && 
      stats.lastErrorTimestamp.getTime() > recentFailThreshold &&
      stats.failedCalls > this.circuitBreakerThreshold;
    
    return recentFailures;
  }
  
  /**
   * Get current status of all models
   */
  getModelStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [modelId, stats] of Object.entries(this.modelStats)) {
      const config = this.modelConfigs[modelId];
      
      status[modelId] = {
        activeCalls: stats.activeCalls,
        utilization: stats.activeCalls / config.maxConcurrent,
        successRate: stats.totalCalls > 0 
          ? (stats.successCalls / stats.totalCalls) * 100 
          : 100,
        averageLatencyMs: stats.successCalls > 0 
          ? stats.totalLatencyMs / stats.successCalls 
          : 0,
        totalTokens: stats.totalTokens,
        isCircuitBroken: stats.isCircuitBroken,
        circuitResetTime: stats.circuitResetTime
      };
    }
    
    return status;
  }
  
  /**
   * Reset model stats
   */
  resetStats(): void {
    for (const modelId of Object.keys(this.modelStats)) {
      this.modelStats[modelId] = {
        activeCalls: 0,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        totalLatencyMs: 0,
        totalTokens: 0,
        isCircuitBroken: false
      };
    }
  }
}

export const llmLoadBalancer = new LLMLoadBalancer(
  container.resolve('modelRegistry')
);
```

## 22. Background Job Processing and Task Queue

```typescript
// src/jobs/job-queue.ts
import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { createClient } from 'redis';
import { config } from '../config/app-config';
import logger from '../utils/logger';
import { container } from '../di/container';

// Job types
export enum JobType {
  VECTOR_EMBEDDING = 'vector-embedding',
  CONTENT_PROCESSING = 'content-processing',
  CONTEXT_OPTIMIZATION = 'context-optimization',
  NOTIFICATION = 'notification',
  EXPORT = 'export',
  CLEANUP = 'cleanup'
}

// Job data interface
export interface JobData {
  type: JobType;
  payload: any;
  userId?: string;
  organizationId?: string;
}

// Job result interface
export interface JobResult {
  success: boolean;
  result?: any;
  error?: string;
}

class JobQueue {
  private queue: Queue;
  private workers: Record<JobType, Worker>;
  private scheduler: QueueScheduler;
  
  constructor() {
    // Create Redis connection
    const connection = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    };
    
    // Initialize queue
    this.queue = new Queue('contextnexus-jobs', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200, // Keep last 200 failed jobs
      }
    });
    
    // Initialize scheduler for delayed jobs
    this.scheduler = new QueueScheduler('contextnexus-jobs', { connection });
    
    // Initialize workers
    this.workers = this.initializeWorkers(connection);
    
    // Log queue events
    this.setupLogging();
  }
  
  /**
   * Initialize job workers for each job type
   */
  private initializeWorkers(connection: any): Record<JobType, Worker> {
    const workers: Record<string, Worker> = {} as Record<JobType, Worker>;
    
    // Create worker for each job type
    Object.values(JobType).forEach(jobType => {
      workers[jobType] = new Worker(
        'contextnexus-jobs',
        async (job) => this.processJob(job),
        { 
          connection,
          concurrency: this.getJobConcurrency(jobType),
          // Process only jobs of this type
          lockDuration: 30000, // 30 seconds
        }
      );
      
      // Set up worker event handlers
      workers[jobType].on('failed', (job, err) => {
        logger.error(`Job ${job?.id} of type ${jobType} failed`, { 
          error: err.message,
          jobId: job?.id,
          jobType,
          attempt: job?.attemptsMade
        });
      });
      
      workers[jobType].on('completed', (job) => {
        logger.info(`Job ${job.id} of type ${jobType} completed`, {
          jobId: job.id,
          jobType,
          processingTime: job.processedOn ? Date.now() - job.processedOn : undefined
        });
      });
    });
    
    return workers;
  }
  
  /**
   * Get concurrency limit based on job type
   */
  private getJobConcurrency(jobType: JobType): number {
    const concurrencyMap: Record<JobType, number> = {
      [JobType.VECTOR_EMBEDDING]: 5, // Resource intensive
      [JobType.CONTENT_PROCESSING]: 10,
      [JobType.CONTEXT_OPTIMIZATION]: 3, // CPU intensive
      [JobType.NOTIFICATION]: 20, // Light, can process many at once
      [JobType.EXPORT]: 2, // I/O intensive
      [JobType.CLEANUP]: 1 // Run one at a time
    };
    
    return concurrencyMap[jobType] || 5; // Default
  }
  
  /**
   * Set up logging for the queue
   */
  private setupLogging(): void {
    this.queue.on('error', (error) => {
      logger.error('Job queue error', { error: error.message });
    });
    
    // Log stats every 5 minutes in non-development environments
    if (process.env.NODE_ENV !== 'development') {
      setInterval(async () => {
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount()
          ]);
          
          logger.info('Job queue stats', { waiting, active, completed, failed });
        } catch (error) {
          logger.error('Error getting job queue stats', { error });
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }
  }
  
  /**
   * Process a job
   */
  private async processJob(job: Job<JobData, JobResult>): Promise<JobResult> {
    const { type, payload, userId, organizationId } = job.data;
    
    logger.debug(`Processing job ${job.id} of type ${type}`, {
      jobId: job.id,
      jobType: type,
      userId,
      organizationId
    });
    
    try {
      switch (type) {
        case JobType.VECTOR_EMBEDDING:
          return await this.processVectorEmbeddingJob(payload);
        
        case JobType.CONTENT_PROCESSING:
          return await this.processContentJob(payload);
        
        case JobType.CONTEXT_OPTIMIZATION:
          return await this.processContextOptimizationJob(payload);
        
        case JobType.NOTIFICATION:
          return await this.processNotificationJob(payload);
        
        case JobType.EXPORT:
          return await this.processExportJob(payload);
        
        case JobType.CLEANUP:
          return await this.processCleanupJob(payload);
        
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    } catch (error: any) {
      logger.error(`Error processing job ${job.id} of type ${type}`, { 
        error: error.message,
        jobId: job.id,
        jobType: type
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process vector embedding job
   */
  private async processVectorEmbeddingJob(payload: any): Promise<JobResult> {
    // Get required services
    const contentService = container.resolve('contentService');
    const vectorRepository = container.resolve('vectorRepository');
    
    // Generate vector embedding
    const { contentId, text } = payload;
    const embedding = await contentService.generateEmbedding(text);
    
    // Store embedding
    await vectorRepository.storeEmbedding(contentId, embedding);
    
    return {
      success: true,
      result: { contentId, embeddingGenerated: true }
    };
  }
  
  /**
   * Process content job
   */
  private async processContentJob(payload: any): Promise<JobResult> {
    // Implement content processing logic
    // ...
    
    return { success: true };
  }
  
  /**
   * Process context optimization job
   */
  private async processContextOptimizationJob(payload: any): Promise<JobResult> {
    // Implement context optimization logic
    // ...
    
    return { success: true };
  }
  
  /**
   * Process notification job
   */
  private async processNotificationJob(payload: any): Promise<JobResult> {
    // Implement notification logic
    // ...
    
    return { success: true };
  }
  
  /**
   * Process export job
   */
  private async processExportJob(payload: any): Promise<JobResult> {
    // Implement export logic
    // ...
    
    return { success: true };
  }
  
  /**
   * Process cleanup job
   */
  private async processCleanupJob(payload: any): Promise<JobResult> {
    // Implement cleanup logic
    // ...
    
    return { success: true };
  }
  
  /**
   * Add a job to the queue
   */
  public async addJob(
    type: JobType,
    payload: any,
    options: {
      userId?: string;
      organizationId?: string;
      delay?: number;
      priority?: number;
    } = {}
  ): Promise<string> {
    const { userId, organizationId, delay, priority } = options;
    
    const job = await this.queue.add(
      type,
      { type, payload, userId, organizationId },
      { 
        delay,
        priority,
        // Add job ID to make it easier to track
        jobId: `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      }
    );
    
    logger.debug(`Added job ${job.id} of type ${type} to queue`, {
      jobId: job.id,
      jobType: type,
      userId,
      organizationId
    });
    
    return job.id as string;
  }
  
  /**
   * Get job status
   */
  public async getJobStatus(jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed';
    result?: JobResult;
    error?: string;
  }> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return { status: 'failed', error: 'Job not found' };
    }
    
    const state = await job.getState();
    
    switch (state) {
      case 'completed':
        return { status: 'completed', result: job.returnvalue as JobResult };
      
      case 'failed':
        return { status: 'failed', error: job.failedReason };
      
      case 'active':
        return { status: 'active' };
      
      default:
        return { status: 'waiting' };
    }
  }
  
  /**
   * Gracefully shut down the queue and workers
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down job queue');
    
    // Close all workers
    await Promise.all(
      Object.values(this.workers).map(worker => worker.close())
    );
    
    // Close scheduler
    await this.scheduler.close();
    
    // Close queue
    await this.queue.close();
    
    logger.info('Job queue shut down successfully');
  }
}

// Create singleton instance
export const jobQueue = new JobQueue();
```

## 23. API Documentation with OpenAPI/Swagger

```typescript
// src/api/swagger.ts
import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from '../config/app-config';

/**
 * Generate Swagger documentation
 */
function generateSwaggerDocs() {
  // Swagger definition
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'ContextNexus API',
      version: '1.0.0',
      description: 'API documentation for ContextNexus',
      license: {
        name: 'Private',
        url: 'https://contextnexus.io/terms'
      },
      contact: {
        name: 'API Support',
        url: 'https://contextnexus.io/support',
        email: 'support@contextnexus.io'
      }
    },
    servers: [
      {
        url: `${config.server.url}${config.server.apiPrefix}`,
        description: 'Production server'
      },
      {
        url: `http://localhost:${config.server.port}${config.server.apiPrefix}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };

  // Options for the swagger docs
  const options = {
    swaggerDefinition,
    // Path to the API docs - use all route files
    apis: ['./src/api/routes/*.ts', './src/api/schemas/*.ts']
  };

  // Initialize swagger-jsdoc
  return swaggerJsdoc(options);
}

/**
 * Configure Swagger UI endpoint
 */
export function configureSwagger(router: Router): void {
  const swaggerSpec = generateSwaggerDocs();
  
  // Serve Swagger docs at /api-docs
  router.use('/api-docs', swaggerUi.serve);
  router.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  }));
  
  // Serve raw Swagger spec
  router.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
}
```

Example of JSDoc annotations for route documentation:

```typescript
// src/api/routes/context-routes.ts

/**
 * @swagger
 * tags:
 *   name: Contexts
 *   description: Context management
 */

/**
 * @swagger
 * /contexts:
 *   get:
 *     summary: Get all contexts
 *     description: Retrieve all contexts accessible by the authenticated user
 *     tags: [Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter contexts by project ID
 *     responses:
 *       200:
 *         description: A list of contexts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Context'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', authMiddleware(), validateRequest(contextQueries.getContexts), contextController.getContexts);

/**
 * @swagger
 * /contexts/{id}:
 *   get:
 *     summary: Get a context by ID
 *     description: Retrieve a context by its ID
 *     tags: [Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Context ID
 *     responses:
 *       200:
 *         description: Context details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Context'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', authMiddleware(), validateRequest(commonValidators.uuidParam), contextController.getContextById);
```

## 24. Docker Configuration for Development and Production

```dockerfile
# Dockerfile
FROM node:16-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production image
FROM node:16-alpine AS production

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/src/app.js"]

# Development image
FROM node:16-alpine AS development

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run the application in development mode
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/contextnexus
      - NEO4J_URL=neo4j://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - neo4j
      - redis
      - minio

  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=contextnexus
    volumes:
      - postgres-data:/var/lib/postgresql/data

  neo4j:
    image: neo4j:4.4
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
      - NEO4J_dbms_memory_pagecache_size=1G
      - NEO4J_dbms_memory_heap_initial__size=1G
      - NEO4J_dbms_memory_heap_max__size=2G
    volumes:
      - neo4j-data:/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres-data:
  neo4j-data:
  redis-data:
  minio-data:
```

## 25. Frontend Progressive Web App (PWA) Setup

```json
// frontend/public/manifest.json
{
  "short_name": "ContextNexus",
  "name": "ContextNexus: Next-Generation Context Management",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0072f5",
  "background_color": "#ffffff"
}
```

```typescript
// frontend/src/service-worker.ts
/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Precache all assets generated by the build process
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html
  ({ request, url }: { request: Request; url: URL }) => {
    // If this is a request for an image, use a cache-first strategy
    if (request.destination === 'image') {
      return false;
    }
    
    // If this is a request for a font, use a cache-first strategy
    if (request.destination === 'font') {
      return false;
    }
    
    // If this isn't a navigation, it's not an App Shell request
    if (request.mode !== 'navigate') {
      return false;
    }
    
    // If this looks like a URL for a resource, disregard it
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    
    // Return true for all navigation requests
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache the API responses in the runtime cache
registerRoute(
  ({ url }) => url.origin === new URL(process.env.REACT_APP_API_URL || '', self.location.href).origin,
  new StaleWhileRevalidate({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache images with a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Listen for push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const title = data.title || 'ContextNexus';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/badge-icon.png',
    data: {
      url: data.url || '/',
    },
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window
      return self.clients.openWindow(url);
    })
  );
});

// Skip waiting, ensuring the service worker is activated immediately
self.skipWaiting();
```

## 26. Client-side Storage Strategy

```typescript
// frontend/src/utils/storage-service.ts
type StorageType = 'local' | 'session';

interface StorageOptions {
  type?: StorageType;
  expiry?: number; // Expiration time in milliseconds
}

interface StoredItem<T> {
  value: T;
  expiry?: number; // Timestamp when the item expires
}

class StorageService {
  /**
   * Store an item in storage
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    const { type = 'local', expiry } = options;
    
    const storage = this.getStorage(type);
    
    const item: StoredItem<T> = {
      value
    };
    
    // Add expiry if provided
    if (expiry) {
      item.expiry = Date.now() + expiry;
    }
    
    try {
      const serialized = JSON.stringify(item);
      storage.setItem(key, serialized);
    } catch (error) {
      console.error('Error storing item in storage:', error);
      // Fall back to in-memory storage if localStorage is full
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleStorageOverflow(type);
      }
    }
  }
  
  /**
   * Get an item from storage
   */
  get<T>(key: string, options: StorageOptions = {}): T | null {
    const { type = 'local' } = options;
    
    const storage = this.getStorage(type);
    
    try {
      const serialized = storage.getItem(key);
      
      if (!serialized) {
        return null;
      }
      
      const item: StoredItem<T> = JSON.parse(serialized);
      
      // Check if item has expired
      if (item.expiry && item.expiry < Date.now()) {
        storage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error('Error retrieving item from storage:', error);
      return null;
    }
  }
  
  /**
   * Remove an item from storage
   */
  remove(key: string, options: StorageOptions = {}): void {
    const { type = 'local' } = options;
    
    const storage = this.getStorage(type);
    
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
  
  /**
   * Clear all items from storage
   */
  clear(options: StorageOptions = {}): void {
    const { type = 'local' } = options;
    
    const storage = this.getStorage(type);
    
    try {
      storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
  
  /**
   * Get all keys in storage
   */
  keys(options: StorageOptions = {}): string[] {
    const { type = 'local' } = options;
    
    const storage = this.getStorage(type);
    
    try {
      return Object.keys(storage);
    } catch (error) {
      console.error('Error getting storage keys:', error);
      return [];
    }
  }
  
  /**
   * Check if storage is available
   */
  isAvailable(type: StorageType = 'local'): boolean {
    try {
      const storage = this.getStorage(type);
      const testKey = '__storage_test__';
      
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get storage based on type
   */
  private getStorage(type: StorageType): Storage {
    return type === 'local' ? localStorage : sessionStorage;
  }
  
  /**
   * Handle storage overflow by clearing old or less important items
   */
  private handleStorageOverflow(type: StorageType): void {
    const storage = this.getStorage(type);
    
    try {
      // Clear expired items first
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        
        if (key) {
          const serialized = storage.getItem(key);
          
          if (serialized) {
            try {
              const item = JSON.parse(serialized);
              
              if (item.expiry && item.expiry < Date.now()) {
                storage.removeItem(key);
              }
            } catch {
              // Skip if can't parse
            }
          }
        }
      }
      
      // If still not enough space, remove least recently used items
      // This would require tracking last access time for each item
      // For simplicity, we're just removing the first 10 items
      if (storage.length > 10) {
        for (let i = 0; i < 10; i++) {
          const key = storage.key(0);
          if (key) storage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error handling storage overflow:', error);
    }
  }
}

export const storageService = new StorageService();
```

## 27. Server Health Monitoring

```typescript
// src/monitoring/health-check.ts
import { Request, Response, Router } from 'express';
import { pool } from '../db/postgres-pool';
import { neo4jConnection } from '../db/neo4j-driver';
import { redisClient } from '../services/cache-service';
import { config } from '../config/app-config';
import logger from '../utils/logger';

export const healthRouter = Router();

/**
 * Health check endpoint
 */
healthRouter.get('/', async (req: Request, res: Response) => {
  // Simple health check without detailed checks
  res.status(200).json({ status: 'ok' });
});

/**
 * Detailed health check endpoint
 */
healthRouter.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Run checks in parallel
  const [dbStatus, neo4jStatus, redisStatus, minioStatus, pineconeStatus] = await Promise.all([
    checkPostgres(),
    checkNeo4j(),
    checkRedis(),
    checkMinio(),
    checkPinecone()
  ]);
  
  const servicesStatus: Record<string, string> = {
    database: dbStatus ? 'ok' : 'error',
    neo4j: neo4jStatus ? 'ok' : 'error',
    redis: redisStatus ? 'ok' : 'error',
    minio: minioStatus ? 'ok' : 'error',
    pinecone: pineconeStatus ? 'ok' : 'error'
  };
  
  // Overall status is ok if all services are ok
  const overallStatus = Object.values(servicesStatus).every(s => s === 'ok') ? 'ok' : 'degraded';
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Response payload
  const health = {
    status: overallStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: config.version,
    environment: config.environment,
    services: servicesStatus,
    metrics: {
      responseTime: Date.now() - startTime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      }
    }
  };
  
  // Log health check result
  logger.info('Health check', { status: overallStatus, services: servicesStatus });
  
  // Set appropriate status code
  const statusCode = overallStatus === 'ok' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 500;
  
  res.status(statusCode).json(health);
});

/**
 * Check PostgreSQL connection
 */
async function checkPostgres(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('PostgreSQL health check failed', { error });
    return false;
  }
}

/**
 * Check Neo4j connection
 */
async function checkNeo4j(): Promise<boolean> {
  try {
    return await neo4jConnection.verifyConnectivity();
  } catch (error) {
    logger.error('Neo4j health check failed', { error });
    return false;
  }
}

/**
 * Check Redis connection
 */
async function checkRedis(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
}

/**
 * Check MinIO connection
 */
async function checkMinio(): Promise<boolean> {
  try {
    // MinIO health check implementation
    return true;
  } catch (error) {
    logger.error('MinIO health check failed', { error });
    return false;
  }
}

/**
 * Check Pinecone connection
 */
async function checkPinecone(): Promise<boolean> {
  try {
    // Pinecone health check implementation
    return true;
  } catch (error) {
    logger.error('Pinecone health check failed', { error });
    return false;
  }
}
```

These additional components should provide a comprehensive foundation for both the frontend and backend aspects of your ContextNexus application, including important infrastructure for databases, LLM processing, job queues, and client-side optimizations. 

All these components work together to create a robust, scalable, and high-performance system that can handle complex context management and LLM interactions efficiently.



 

## 8. Final Integration Checklist

1. **Authentication Flow**
   - [ ] Login works with proper token storage
   - [ ] Token refresh works automatically
   - [ ] Protected routes redirect to login when not authenticated
   - [ ] Role-based access control works correctly
   - [ ] User session persists across page refreshes
   - [ ] Logout clears all tokens and state

2. **API Integration**
   - [ ] All API endpoints are properly wrapped in service methods
   - [ ] Error handling is consistent across all API calls
   - [ ] Response transformations are correct
   - [ ] Authentication headers are correctly attached
   - [ ] File uploads/downloads work correctly
   - [ ] Streaming responses are handled properly

3. **State Management**
   - [ ] Redux state properly syncs with backend state
   - [ ] Optimistic updates work correctly
   - [ ] Complex state derivations use memoized selectors
   - [ ] State changes trigger appropriate UI updates
   - [ ] Error states handled gracefully

4. **WebSocket Integration**
   - [ ] Connection established on authenticated routes
   - [ ] Authentication token properly passed
   - [ ] Reconnection logic works
   - [ ] Messages correctly dispatched to Redux
   - [ ] Collaborative features update in real-time

5. **Error Handling**
   - [ ] API errors show user-friendly messages
   - [ ] Component errors caught by ErrorBoundary
   - [ ] Network errors handled gracefully
   - [ ] Authentication errors trigger proper flows
   - [ ] Error reporting set up for production

6. **Performance**
   - [ ] Large lists are virtualized
   - [ ] API calls are debounced where appropriate
   - [ ] Heavy computations are memoized
   - [ ] Assets are properly optimized
   - [ ] Code splitting implemented for routes

This comprehensive backend-frontend integration plan covers all the essential aspects needed for a robust, production-ready application. The implementation includes detailed error handling, authentication flows, real-time capabilities, and the performance optimizations necessary for a complex application like ContextNexus.
