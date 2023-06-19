---
description: Initialize persistent memory/knowledge graph for cross-session context
---

# Initialize Project Memory

Set up persistent memory using the MCP Memory Server for cross-session context retention.

## Arguments
$ARGUMENTS

## What is Project Memory?

The Memory MCP Server creates a persistent knowledge graph that Claude can use across sessions. Instead of losing context when starting a new conversation, Claude can recall:

- Project architecture decisions
- Code patterns and conventions
- Previous debugging sessions
- Team preferences and standards
- Domain-specific knowledge

## Setup

### 1. Configure Memory Server

Add to your `.mcp.json` or project settings:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": ".claude/memory/knowledge.json"
      }
    }
  }
}
```

### 2. Create Memory Directory

```bash
mkdir -p .claude/memory
echo '{"entities": [], "relations": []}' > .claude/memory/knowledge.json
```

### 3. Add to .gitignore (Optional)

For private memory (not shared with team):
```
.claude/memory/
```

Or commit for shared team knowledge:
```
# .claude/memory/ is tracked
```

## Memory Structure

The knowledge graph stores:

### Entities
```json
{
  "entities": [
    {
      "name": "UserService",
      "type": "class",
      "observations": [
        "Handles user authentication",
        "Uses bcrypt for password hashing",
        "Located in src/services/user.ts"
      ]
    }
  ]
}
```

### Relations
```json
{
  "relations": [
    {
      "from": "UserService",
      "to": "Database",
      "type": "depends_on"
    },
    {
      "from": "AuthMiddleware",
      "to": "UserService",
      "type": "uses"
    }
  ]
}
```

## Seeding Initial Knowledge

Provide initial context about your project:

### Architecture
- What framework/stack is used?
- What are the main architectural patterns?
- Where are key files located?

### Conventions
- Code style preferences
- Naming conventions
- File organization patterns

### Domain Knowledge
- Business logic rules
- Important constraints
- Common edge cases

### Team Preferences
- Preferred libraries
- Testing strategies
- Documentation standards

## Example Initial Memory

```json
{
  "entities": [
    {
      "name": "Project",
      "type": "metadata",
      "observations": [
        "Next.js 15 App Router application",
        "TypeScript strict mode enabled",
        "Supabase for database and auth",
        "Tailwind CSS for styling",
        "Vitest for unit tests, Playwright for E2E"
      ]
    },
    {
      "name": "API Pattern",
      "type": "convention",
      "observations": [
        "All API routes use Zod validation",
        "Response format: { data, success } or { error, success }",
        "Rate limiting on public endpoints",
        "Auth required for /api/protected/* routes"
      ]
    },
    {
      "name": "Component Pattern",
      "type": "convention",
      "observations": [
        "Server Components by default",
        "Client Components only when needed (use client)",
        "Feature-based organization in src/components/",
        "Shared UI in src/components/ui/"
      ]
    }
  ],
  "relations": []
}
```

## Using Memory in Sessions

Once initialized, Claude will automatically:

1. **Recall Context**: Remember decisions from previous sessions
2. **Apply Patterns**: Follow established conventions
3. **Build Knowledge**: Add new learnings to the graph
4. **Connect Concepts**: Understand relationships between components

## Memory Commands

During a session, you can:

```
# View current memory
/memory view

# Add new knowledge
/memory add "The payment service uses Stripe webhooks"

# Search memory
/memory search "authentication"

# Clear memory (start fresh)
/memory clear
```

## Best Practices

1. **Start Small**: Begin with core architecture, add detail over time
2. **Be Specific**: "Uses bcrypt" is better than "has security"
3. **Update Regularly**: Add learnings from each significant session
4. **Review Periodically**: Prune outdated or incorrect information
5. **Share Selectively**: Commit team knowledge, keep personal notes local

## Integration with Handoffs

Combine with `/handoff` for session continuity:

```bash
# End of session
/handoff  # Creates transfer document
# Memory automatically persists

# New session
/resume   # Loads handoff document
# Memory is already available via MCP
```
