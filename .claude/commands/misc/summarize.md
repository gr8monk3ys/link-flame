---
description: Intelligently summarize files or directories to reduce context usage
---

# Intelligent Summarization

Generate concise summaries of files or directories to reduce token usage while preserving key information.

## Arguments
$ARGUMENTS

## Why Summarize?

Claude Code sessions have context limits. Summarization helps you:
- **Reduce token usage** by 70-90%
- **Preserve key information** for decision-making
- **Load more files** into context
- **Work with large codebases** efficiently

## Usage

### Summarize Single File
```
/summarize src/services/auth.ts
```

### Summarize Directory
```
/summarize src/components/
```

### Summarize with Focus
```
/summarize src/api/ --focus "authentication flow"
/summarize lib/ --focus "database queries"
```

### Summarize for Specific Purpose
```
/summarize src/ --for "code review"
/summarize src/ --for "architecture understanding"
/summarize src/ --for "bug investigation"
```

## Summary Levels

### Level 1: Overview (Default)
```
/summarize src/services/auth.ts
```
Output:
```
# auth.ts Summary

**Purpose**: User authentication and session management
**Exports**: login(), logout(), refreshToken(), validateSession()
**Dependencies**: bcrypt, jwt, database
**Lines**: 245 | **Complexity**: Medium

Key Functions:
- login(email, password) → Creates session, returns JWT
- validateSession(token) → Checks token validity, refreshes if needed
- logout(userId) → Invalidates all user sessions
```

### Level 2: Detailed
```
/summarize src/services/auth.ts --level detailed
```
Includes:
- Function signatures with types
- Error handling patterns
- External API calls
- Database queries
- Security considerations

### Level 3: Architecture
```
/summarize src/services/ --level architecture
```
Output:
```
# Services Architecture

## Dependencies Graph
auth.ts → database.ts, email.ts
user.ts → database.ts, auth.ts
payment.ts → stripe.ts, user.ts

## Data Flow
1. Request → Middleware → Service → Repository → Database
2. Response ← Service ← Repository ← Database

## Key Patterns
- Repository pattern for data access
- Service layer for business logic
- Dependency injection via constructors
```

## Output Formats

### Markdown (Default)
```
/summarize src/api/ --format md
```

### JSON (For Programmatic Use)
```
/summarize src/api/ --format json
```
```json
{
  "path": "src/api/",
  "files": 12,
  "totalLines": 1847,
  "exports": ["users", "auth", "products"],
  "dependencies": ["zod", "next", "supabase"],
  "patterns": ["REST", "validation", "auth-middleware"]
}
```

### Compact (Minimal Tokens)
```
/summarize src/ --format compact
```
Output:
```
src/: 45 files, 8.2k lines
├─ api/: REST endpoints (users, auth, products), Zod validation
├─ components/: React (Button, Form, Modal), Tailwind styling
├─ hooks/: useAuth, useQuery, useForm
├─ lib/: db client, utils, constants
└─ types/: User, Product, Order interfaces
```

## Smart Summarization

### For Large Codebases
```
/summarize . --smart
```
- Prioritizes frequently changed files
- Highlights entry points
- Shows dependency graph
- Identifies key abstractions

### For Debugging
```
/summarize src/api/users/ --for debugging
```
- Shows error handling paths
- Lists external dependencies
- Highlights state mutations
- Shows async patterns

### For Code Review
```
/summarize --changed --for review
```
- Summarizes only changed files
- Shows before/after comparison
- Highlights risk areas
- Suggests review focus

## Caching

Summaries are cached to avoid recomputation:

```
/summarize src/        # Generates and caches
/summarize src/        # Uses cache
/summarize src/ --refresh  # Forces regeneration
```

Cache location: `.claude/cache/summaries/`

## Integration

### With Memory
```
/summarize src/ --save-to-memory
```
Saves summary to knowledge graph for cross-session access.

### With Context Budget
```
/context-budget
# Shows: "Context 45% full"

/summarize src/services/ --load
# Loads summary instead of full files
# Shows: "Context 12% full (saved 33%)"
```

### With Handoff
```
/handoff --include-summaries
```
Includes file summaries in handoff document.

## Configuration

Create `.claude/summarize.json`:

```json
{
  "defaultLevel": "overview",
  "defaultFormat": "markdown",
  "autoSummarize": {
    "threshold": 500,  // Lines
    "exclude": ["*.test.ts", "*.spec.ts"]
  },
  "focus": {
    "api/": "endpoints and validation",
    "components/": "props and state",
    "lib/": "exports and dependencies"
  },
  "cache": {
    "enabled": true,
    "ttl": "1h"
  }
}
```

## Best Practices

1. **Start with Overview**: Use default level first
2. **Focus When Needed**: Add `--focus` for specific investigations
3. **Use Compact for Large Dirs**: `--format compact` for 20+ files
4. **Cache Strategically**: Enable caching for stable code
5. **Combine with Memory**: Save important summaries for future sessions

## Token Savings Examples

| Content | Full Read | Summary | Savings |
|---------|-----------|---------|---------|
| 500-line file | ~5,000 tokens | ~500 tokens | 90% |
| 20-file directory | ~50,000 tokens | ~2,000 tokens | 96% |
| Full src/ | ~200,000 tokens | ~5,000 tokens | 97.5% |
