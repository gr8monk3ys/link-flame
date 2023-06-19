---
description: Generate structured CODEMAPS documentation for codebase architecture
model: claude-sonnet-4-5
---

# Generate CODEMAPS Documentation

Create structured code documentation mapping for: $ARGUMENTS

## What are CODEMAPS?

CODEMAPS are structured documentation files that provide a bird's-eye view of codebase architecture. They help developers (and AI assistants) quickly understand:

- Project structure and organization
- Key abstractions and their relationships
- Data flow between components
- Entry points and critical paths

## CODEMAPS Structure

Create the following documentation structure:

```
docs/CODEMAPS/
├── INDEX.md          # Architecture overview and navigation
├── frontend.md       # UI components and state management
├── backend.md        # API routes and server logic
├── database.md       # Schema and data access patterns
├── integrations.md   # External service connections
└── workers.md        # Background jobs and async processing
```

## INDEX.md Template

```markdown
# Codebase Architecture Overview

## Project Summary
[Brief description of the project purpose]

## Tech Stack
- **Frontend**: [framework, key libraries]
- **Backend**: [runtime, framework]
- **Database**: [database, ORM]
- **Infrastructure**: [hosting, key services]

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Client                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │  Pages  │  │Components│  │  Hooks  │                 │
│  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │            │            │                        │
│       └────────────┼────────────┘                        │
│                    ▼                                     │
│             ┌─────────────┐                              │
│             │   API Layer │                              │
│             └──────┬──────┘                              │
└────────────────────┼────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  Server                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │
│  │  │ Routes   │  │ Services │  │   Jobs   │      │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │    │
│  │       └─────────────┼─────────────┘            │    │
│  │                     ▼                           │    │
│  │              ┌──────────┐                       │    │
│  │              │ Database │                       │    │
│  │              └──────────┘                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Quick Navigation

| Domain | File | Description |
|--------|------|-------------|
| Frontend | [frontend.md](frontend.md) | UI components, pages, state |
| Backend | [backend.md](backend.md) | API routes, middleware, services |
| Database | [database.md](database.md) | Schema, migrations, queries |
| Integrations | [integrations.md](integrations.md) | External APIs, webhooks |
| Workers | [workers.md](workers.md) | Background jobs, queues |

## Entry Points

| Entry | Path | Purpose |
|-------|------|---------|
| Web App | `app/page.tsx` | Main application entry |
| API | `app/api/` | REST API endpoints |
| Auth | `app/api/auth/` | Authentication flow |

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| [Name] | `path/to/file` | [Description] |
```

## Domain-Specific Templates

### frontend.md
```markdown
# Frontend Architecture

## Component Hierarchy

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── (auth)/             # Auth route group
│   ├── login/
│   └── register/
└── (dashboard)/        # Protected routes
    ├── layout.tsx      # Dashboard layout
    └── [feature]/      # Feature pages
```

## State Management

| Store | Location | Scope |
|-------|----------|-------|
| Auth | `stores/auth.ts` | Global - user session |
| UI | `stores/ui.ts` | Global - theme, modals |
| Feature | `hooks/useFeature.ts` | Local - feature-specific |

## Key Components

| Component | Path | Props | Purpose |
|-----------|------|-------|---------|
| [Name] | `components/[path]` | [key props] | [description] |
```

### backend.md
```markdown
# Backend Architecture

## API Routes

| Method | Path | Handler | Auth | Purpose |
|--------|------|---------|------|---------|
| GET | `/api/users` | `getUsers` | Yes | List users |
| POST | `/api/users` | `createUser` | Yes | Create user |

## Middleware Stack

```
Request
  │
  ▼
┌─────────────────┐
│  Rate Limiter   │ → 429 Too Many Requests
└────────┬────────┘
         ▼
┌─────────────────┐
│  Auth Verify    │ → 401 Unauthorized
└────────┬────────┘
         ▼
┌─────────────────┐
│  Input Validate │ → 400 Bad Request
└────────┬────────┘
         ▼
┌─────────────────┐
│    Handler      │
└────────┬────────┘
         ▼
      Response
```

## Services

| Service | Location | Dependencies | Purpose |
|---------|----------|--------------|---------|
| UserService | `services/user.ts` | DB, Auth | User CRUD |
```

### database.md
```markdown
# Database Architecture

## Schema Overview

```
┌──────────────┐       ┌──────────────┐
│    users     │       │    posts     │
├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ user_id (FK) │
│ email        │       │ id (PK)      │
│ name         │       │ title        │
│ created_at   │       │ content      │
└──────────────┘       └──────────────┘
```

## Tables

| Table | Description | Key Indexes |
|-------|-------------|-------------|
| users | User accounts | email (unique) |
| posts | User content | user_id, created_at |

## Common Queries

| Query | Location | Performance |
|-------|----------|-------------|
| Get user by email | `queries/users.ts` | O(1) via index |
```

## Analysis Tools

Use these tools to extract codebase information:

```bash
# TypeScript AST analysis
npx ts-morph --project tsconfig.json

# Dependency graph visualization
npx madge --image deps.svg src/

# Find all exports
grep -r "^export" --include="*.ts" src/

# Find all API routes
find app/api -name "route.ts" -exec echo {} \;

# Find all React components
grep -r "^export.*function\|^export.*const.*=" --include="*.tsx" src/components/
```

## Output

After running this command, you should have:

1. **INDEX.md** - High-level architecture overview with diagram
2. **frontend.md** - Component hierarchy and state management
3. **backend.md** - API routes and service architecture
4. **database.md** - Schema documentation with relationships
5. **integrations.md** - External service connections
6. **workers.md** - Background processing documentation (if applicable)

Each file should include:
- ASCII architecture diagrams
- Tables summarizing key elements
- Links to source files
- Common patterns and conventions used

## Maintenance

Update CODEMAPS when:
- Adding new major features
- Changing architectural patterns
- Adding new external integrations
- Modifying database schema
- Before onboarding new developers
