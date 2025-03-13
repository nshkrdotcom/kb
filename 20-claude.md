# ContextNexus: Advanced Context Management System for LLMs

I've analyzed your code and project structure, and I'll create a robust reorganization focusing on flexibility, maintainability, and clean architecture principles. Here's a complete approach to rebuilding ContextNexus with improved schemas and code organization.

## Database Schema Improvements

### PostgreSQL Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  role VARCHAR(50) DEFAULT 'user'
);

CREATE INDEX idx_users_email ON users(email);

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_archived ON projects(is_archived);

-- Project_Users (for collaboration)
CREATE TABLE project_users (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'owner', 'editor', 'viewer', etc.
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  PRIMARY KEY (project_id, user_id)
);

-- Contexts Table
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_context_id UUID REFERENCES contexts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0
);

CREATE INDEX idx_contexts_project ON contexts(project_id);
CREATE INDEX idx_contexts_parent ON contexts(parent_context_id);

-- Content_Items Table
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'text', 'code', 'image', etc.
  storage_type VARCHAR(50) NOT NULL, -- 'postgres', 'neo4j', 'minio', 'pinecone'
  storage_key VARCHAR(255) NOT NULL, -- ID or path in the respective storage
  title VARCHAR(255),
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  embedding_id VARCHAR(255), -- Reference to vector embedding if applicable
  tokens INTEGER DEFAULT 0,   -- Token count for text content
  version INTEGER DEFAULT 1,  -- For content versioning
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_content_project ON content_items(project_id);
CREATE INDEX idx_content_type ON content_items(content_type);
CREATE INDEX idx_content_creator ON content_items(creator_id);
CREATE INDEX idx_content_embedding ON content_items(embedding_id) WHERE embedding_id IS NOT NULL;

-- Text_Content Table (for storing actual text content)
CREATE TABLE text_content (
  content_id UUID PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL
);

-- Code_Content Table (for storing code with specific attributes)
CREATE TABLE code_content (
  content_id UUID PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language VARCHAR(50),
  highlighted_html TEXT -- Optional pre-highlighted HTML version
);

-- Context_Items Table (for linking contexts to content)
CREATE TABLE context_items (
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 1.0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES users(id),
  order_position INTEGER,
  PRIMARY KEY (context_id, content_id)
);

CREATE INDEX idx_context_items_content ON context_items(content_id);

-- Tags Table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  color VARCHAR(50),
  UNIQUE (name, project_id)
);

-- Content_Tags Table
CREATE TABLE content_tags (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);
```

### Neo4j Schema (Cypher)

```cypher
// Node constraints
CREATE CONSTRAINT ON (p:Project) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT ON (c:Content) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT ON (cx:Context) ASSERT cx.id IS UNIQUE;
CREATE CONSTRAINT ON (t:Tag) ASSERT t.name IS UNIQUE;
CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE;

// Content type constraints
CREATE CONSTRAINT ON (t:Text) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT ON (c:Code) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT ON (i:Image) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT ON (d:Document) ASSERT d.id IS UNIQUE;

// Indexes for performance
CREATE INDEX ON :Content(projectId);
CREATE INDEX ON :Content(contentType);
CREATE INDEX ON :Context(projectId);
CREATE INDEX ON :Tag(projectId);

// Relationship indices (Neo4j 4.4+)
CREATE INDEX FOR ()-[r:INCLUDES]-() ON (r.relevanceScore);
```

## Project Structure

Here's a comprehensive file tree structure for the ContextNexus project:

```
contextnexus/
│
├── src/
│   ├── api/                       # API endpoints
│   │   ├── middlewares/           # Express middlewares
│   │   │   ├── auth.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── routes/                # API route definitions
│   │   │   ├── project-routes.ts
│   │   │   ├── context-routes.ts
│   │   │   ├── content-routes.ts
│   │   │   ├── user-routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── controllers/           # Route handlers
│   │   │   ├── project-controller.ts
│   │   │   ├── context-controller.ts
│   │   │   ├── content-controller.ts
│   │   │   ├── user-controller.ts
│   │   │   └── index.ts
│   │   │
│   │   └── validators/            # Request validation
│   │       ├── project-validator.ts
│   │       ├── context-validator.ts
│   │       ├── content-validator.ts
│   │       └── index.ts
│   │
│   ├── config/                    # Configuration
│   │   ├── app-config.ts          # Main configuration
│   │   ├── db-config.ts           # Database configurations
│   │   └── logger-config.ts       # Logging configuration
│   │
│   ├── db/                        # Database connections
│   │   ├── postgres/
│   │   │   ├── connection.ts      # PostgreSQL connection
│   │   │   ├── migrations/        # Database migrations
│   │   │   └── seeds/             # Seed data
│   │   │
│   │   ├── neo4j/
│   │   │   ├── connection.ts      # Neo4j connection
│   │   │   └── schema.ts          # Neo4j schema setup
│   │   │
│   │   ├── minio/
│   │   │   └── connection.ts      # MinIO connection
│   │   │
│   │   └── pinecone/
│   │       └── connection.ts      # Pinecone connection
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── core.ts                # Core domain types
│   │   ├── api.ts                 # API-specific types
│   │   └── db.ts                  # Database-specific types
│   │
│   ├── repositories/              # Repository pattern implementations
│   │   ├── interfaces.ts          # Repository interfaces
│   │   │
│   │   ├── postgres/              # PostgreSQL repositories
│   │   │   ├── base-repository.ts
│   │   │   ├── user-repository.ts
│   │   │   ├── project-repository.ts
│   │   │   ├── context-repository.ts
│   │   │   ├── content-repository.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── neo4j/                 # Neo4j repositories
│   │   │   ├── graph-repository.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── minio/                 # MinIO repositories
│   │   │   ├── object-repository.ts
│   │   │   └── index.ts
│   │   │
│   │   └── pinecone/              # Pinecone repositories
│   │       ├── vector-repository.ts
│   │       └── index.ts
│   │
│   ├── services/                  # Business logic
│   │   ├── user-service.ts
│   │   ├── auth-service.ts
│   │   ├── project-service.ts
│   │   ├── context-service.ts
│   │   ├── content-service.ts
│   │   ├── graph-service.ts
│   │   ├── storage-service.ts
│   │   ├── embedding-service.ts
│   │   ├── token-service.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── errors.ts              # Custom error classes
│   │   ├── token-counter.ts       # Token counting utilities
│   │   ├── validators.ts          # Validation helpers
│   │   ├── security.ts            # Security helpers
│   │   └── logger.ts              # Logging utilities
│   │
│   ├── app.ts                     # Express application setup
│   └── server.ts                  # Server entry point
│
├── tests/                         # Automated tests
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── fixtures/                  # Test fixtures
│
├── scripts/                       # Utility scripts
│   ├── setup-db.ts                # Database setup script
│   └── generate-types.ts          # Type generation
│
├── docs/                          # Documentation
│   ├── api.md                     # API documentation
│   └── schema.md                  # Database schema docs
│
├── .env.example                   # Example environment variables
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── jest.config.js                 # Jest test configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Project dependencies and scripts
└── README.md                      # Project overview
```

## Key Code Stubs

Now I'll provide improved code stubs for the core components of the system. These are designed to be clean, maintainable, and to work well together.