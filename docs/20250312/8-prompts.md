# Comprehensive Implementation Prompts for ContextNexus Development

## Prompt 1: Authentication System Implementation

### Task Overview
Implement a complete JWT-based authentication system for ContextNexus that integrates with the existing UserRepository. This system should handle user registration, login, token validation, and permission checks.

### Technical Requirements
1. Create an `AuthService` class that:
   - Handles user registration with email verification
   - Manages login with secure password validation
   - Issues JWT tokens with appropriate expiration
   - Provides token refresh functionality
   - Implements password reset flow

2. Develop authentication middleware that:
   - Validates JWT tokens in request headers
   - Attaches user information to request object
   - Handles different authentication errors gracefully
   - Supports role-based access control

3. Build user controller with routes for:
   - User registration (`POST /api/users/register`)
   - User login (`POST /api/users/login`) 
   - Password reset (`POST /api/users/password-reset`)
   - Token refresh (`POST /api/users/refresh-token`)
   - User profile (`GET /api/users/profile`)

4. Integrate with existing `UserRepository`:
   - Utilize the existing methods for user operations
   - Add any missing methods required for auth flows

### Expected Interfaces
```typescript
// src/services/auth-service.ts
export interface AuthServiceInterface {
  register(email: string, password: string, name: string): Promise<User>;
  login(email: string, password: string): Promise<{user: User, token: string, refreshToken: string}>;
  validateToken(token: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<{token: string, refreshToken: string} | null>;
  resetPassword(email: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
}

// src/api/middlewares/auth.ts
export function authMiddleware(requiredRole?: string): RequestHandler;
```

### Integration Points
- Connect with existing UserRepository (`src/repositories/postgres/user-repository.ts`)
- Add user routes to API routes index (`src/api/routes/index.ts`)
- Update app configuration for JWT secrets (`src/config/app-config.ts`)

## Prompt 2: LLM Connector Implementation

### Task Overview
Develop a flexible LLM integration layer that enables ContextNexus to interact with various language model providers. This layer should abstract away provider-specific details while allowing for streaming responses and provider-specific options.

### Technical Requirements
1. Create a base `LLMConnector` interface that:
   - Defines common methods for all LLM providers
   - Supports both synchronous and streaming responses
   - Handles error cases consistently
   - Allows for provider-specific options

2. Implement an `OpenAIConnector` that:
   - Connects to OpenAI API using configuration settings
   - Transforms standard requests into OpenAI-specific format
   - Handles both completion and chat completion endpoints
   - Processes streaming responses with proper error handling

3. Develop a `ModelRegistry` service that:
   - Manages multiple LLM provider connections
   - Selects appropriate models based on requirements
   - Provides fallback mechanisms
   - Tracks usage and performance metrics

4. Build a `QueryService` that:
   - Uses the LLM connectors to process user queries
   - Constructs appropriate prompts from context
   - Handles response formatting
   - Manages conversation history

### Expected Interfaces
```typescript
// src/llm/connectors/llm-connector.ts
export interface LLMConnector {
  sendPrompt(prompt: string, options?: LLMOptions): Promise<string>;
  streamResponse(prompt: string, onChunk: (chunk: string) => void, options?: LLMOptions): Promise<void>;
  getModelInfo(): LLMModelInfo;
}

// src/llm/model-registry.ts
export interface ModelRegistry {
  registerModel(name: string, connector: LLMConnector): void;
  getModel(name: string): LLMConnector;
  getDefaultModel(): LLMConnector;
  listAvailableModels(): LLMModelInfo[];
}

// src/services/query-service.ts
export interface QueryService {
  processQuery(
    query: string, 
    contextId: string, 
    options?: QueryOptions
  ): Promise<QueryResponse>;
  
  streamQueryResponse(
    query: string, 
    contextId: string, 
    onChunk: (chunk: string) => void, 
    options?: QueryOptions
  ): Promise<void>;
}
```

### Integration Points
- Connect with app configuration for API keys (`src/config/app-config.ts`)
- Integrate with Context Service (`src/services/context-service.ts`)
- Add query routes and controller (`src/api/routes/query-routes.ts`, `src/api/controllers/query-controller.ts`)

## Prompt 3: Context Optimization Implementation

### Task Overview
Implement the core context optimization engine that efficiently selects, organizes, and formats context content for LLM queries. This system should manage token budgets, score content relevance, and construct optimized prompts.

### Technical Requirements
1. Create a `ContextOptimizer` class that:
   - Manages token budgets for different LLM models
   - Selects most relevant content within token limits
   - Applies different chunking strategies depending on content type
   - Compresses or summarizes content when needed

2. Develop a `RelevanceScorer` service that:
   - Scores content relevance to a query using multiple signals
   - Considers semantic similarity via vector embeddings
   - Factors in content recency and user interaction history
   - Weights different content types appropriately

3. Implement a `PromptBuilder` service that:
   - Constructs prompts from optimized context content
   - Formats prompts according to model-specific requirements
   - Handles multi-turn conversation context
   - Applies different prompt strategies for different tasks

4. Create a `SelectionService` that:
   - Manages user-driven content selection
   - Suggests related content based on current selection
   - Provides token usage visualization data
   - Handles content organization for contexts

### Expected Interfaces
```typescript
// src/llm/context-optimizer.ts
export interface ContextOptimizer {
  optimizeContext(
    contextId: string, 
    query: string, 
    tokenBudget: number
  ): Promise<OptimizedContext>;
  
  chunkContent(
    content: string, 
    contentType: string, 
    chunkStrategy: ChunkStrategy
  ): ContentChunk[];
}

// src/selection/relevance-scorer.ts
export interface RelevanceScorer {
  scoreContentRelevance(
    contentId: string, 
    query: string, 
    additionalFactors?: ScoringFactors
  ): Promise<number>;
  
  batchScoreContent(
    contentIds: string[], 
    query: string, 
    additionalFactors?: ScoringFactors
  ): Promise<Map<string, number>>;
}

// src/llm/prompt-builder.ts
export interface PromptBuilder {
  buildPrompt(
    query: string, 
    optimizedContext: OptimizedContext, 
    modelType: string
  ): Prompt;
  
  buildConversationPrompt(
    query: string, 
    conversationHistory: ConversationMessage[], 
    optimizedContext: OptimizedContext, 
    modelType: string
  ): Prompt;
}
```

### Integration Points
- Connect with Content Service (`src/services/content-service.ts`)
- Integrate with Context Service (`src/services/context-service.ts`)
- Utilize embedding service for vector similarity

## Prompt 4: Frontend Development - Authentication & Conversation UI

### Task Overview
Start frontend development by implementing the authentication flow, basic conversation interface, and API client services. This will provide the foundation for the complete ContextNexus UI.

### Technical Requirements
1. Set up a React application with:
   - TypeScript configuration
   - Component structure following the provided plan
   - State management (Redux, Context, or similar)
   - Routing with protected routes
   - Responsive design support

2. Implement authentication components:
   - Login form with validation
   - Registration form with email verification
   - Password reset flow
   - User profile management
   - Persistent login state

3. Create a conversation interface that:
   - Displays message history with proper formatting
   - Supports markdown and code highlighting
   - Shows typing indicators and loading states
   - Handles streaming responses
   - Provides context visibility and control

4. Develop API client services that:
   - Handle authentication and token management
   - Provide typed interfaces for all backend APIs
   - Support both REST and streaming endpoints
   - Include error handling and retry logic

### Expected Components
```typescript
// frontend/src/components/auth/LoginForm.tsx
// frontend/src/components/auth/RegisterForm.tsx
// frontend/src/components/auth/PasswordReset.tsx
// frontend/src/components/auth/UserProfile.tsx

// frontend/src/components/conversation/ChatInterface.tsx
// frontend/src/components/conversation/MessageList.tsx
// frontend/src/components/conversation/MessageInput.tsx
// frontend/src/components/conversation/StreamingMessage.tsx

// frontend/src/services/api-client.ts
// frontend/src/services/auth-service.ts
```

### Design Considerations
- Follow the visual style from the design mockups
- Implement responsive layout for all screen sizes
- Ensure accessibility compliance
- Focus on smooth transitions and feedback
- Optimize for performance with large conversations

## Prompt 5: Context Selection UI Implementation

### Task Overview
Implement the core differentiating UI for ContextNexus: the context selection and visualization interface. This should enable users to efficiently select, organize, and visualize context content for LLM interactions.

### Technical Requirements
1. Create a context selection interface that:
   - Allows quick selection of paragraphs, code blocks, and other content
   - Provides visual indicators of selection state
   - Offers keyboard shortcuts for power users
   - Supports drag-select and multi-select operations

2. Implement token visualization components that:
   - Display token usage with clear metrics
   - Show token breakdown by content type
   - Provide visual warnings for token limits
   - Update in real-time as selection changes

3. Develop context organization tools that:
   - Allow drag-and-drop reordering of content
   - Support grouping and categorizing content
   - Provide relevance sliders for weighting
   - Enable saving and sharing context configurations

4. Build graph visualization components that:
   - Display relationships between content items
   - Allow interactive exploration of the knowledge graph
   - Support zooming and filtering
   - Provide focused context views

### Expected Components
```typescript
// frontend/src/components/context/ContextSelector.tsx
// frontend/src/components/context/ParagraphSelector.tsx
// frontend/src/components/context/CodeBlockSelector.tsx
// frontend/src/components/context/SelectionControls.tsx

// frontend/src/components/context/TokenVisualizer.tsx
// frontend/src/components/context/TokenBreakdown.tsx
// frontend/src/components/context/TokenBudget.tsx

// frontend/src/components/context/ContextOrganizer.tsx
// frontend/src/components/context/CategoryManager.tsx
// frontend/src/components/context/RelevanceSlider.tsx

// frontend/src/components/graph/KnowledgeGraph.tsx
// frontend/src/components/graph/GraphControls.tsx
// frontend/src/components/graph/NodeDetail.tsx
```

### Design Considerations
- Follow the mockups closely for visual consistency
- Ensure smooth interactions and performance
- Provide clear visual feedback for all actions
- Implement keyboard navigation and shortcuts
- Optimize for both novice and power users

## Prompt 6: Dependency Injection and Error Handling

### Task Overview
Implement a dependency injection system and comprehensive error handling to improve code maintainability, testability, and user experience.

### Technical Requirements
1. Create a dependency injection container that:
   - Manages service instantiation and lifecycle
   - Supports registration of singletons and factories
   - Handles circular dependencies
   - Allows mock injection for testing

2. Develop an error handling middleware that:
   - Catches and processes all application errors
   - Transforms errors into consistent API responses
   - Provides appropriate HTTP status codes
   - Includes helpful error messages for debugging

3. Implement a logging service that:
   - Captures errors and important events
   - Supports different log levels
   - Formats logs consistently
   - Can be configured for different environments

4. Create validation middleware that:
   - Validates request bodies against schemas
   - Provides clear validation error messages
   - Supports custom validation rules
   - Prevents malformed data from reaching services

### Expected Interfaces
```typescript
// src/di/container.ts
export interface DIContainer {
  register<T>(token: string, factory: () => T, singleton?: boolean): void;
  registerInstance<T>(token: string, instance: T): void;
  resolve<T>(token: string): T;
  createScope(): DIContainer;
}

// src/api/middlewares/error-handler.ts
export function errorHandlerMiddleware(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void;

// src/utils/logger.ts
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

// src/api/middlewares/validation.ts
export function validateRequest(schema: any): RequestHandler;
```

### Integration Points
- Update app.ts to use the dependency injection container
- Refactor existing services to use dependency injection
- Add error handling middleware to Express app
- Implement validators for all API endpoints

These prompts should provide detailed guidance for implementing each major component of the ContextNexus system, focusing on the most critical elements for the MVP while maintaining a path to the full feature set.