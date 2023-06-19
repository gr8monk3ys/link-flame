---
description: Chain multiple commands together for automated workflows
---

# Command Chaining

Automatically chain multiple commands together for streamlined workflows.

## Arguments
$ARGUMENTS

## What is Command Chaining?

Command chaining executes a sequence of commands automatically, passing context between them. Instead of manually running each command, define a chain once and execute it.

## Built-in Chains

### API Development Chain
```
/chain api <name>
```
Executes: `/api-new` → `/api-test` → `/api-protect`

Creates a new API endpoint, generates tests, and adds security middleware.

### Component Development Chain
```
/chain component <name>
```
Executes: `/component-new` → `/test-new` → code review

Creates a React component, generates tests, and reviews for best practices.

### Feature Development Chain
```
/chain feature <name>
```
Executes: `/feature-plan` → `/write-plan` → `/execute-plan` → `/review`

Full RIPER workflow for feature implementation.

### Database Migration Chain
```
/chain migration <name>
```
Executes: `/migration-new` → type generation → `/api-test`

Creates migration, regenerates types, tests affected endpoints.

## Custom Chains

Define custom chains in `.claude/chains.json`:

```json
{
  "chains": {
    "api": {
      "description": "Full API endpoint workflow",
      "steps": [
        {
          "command": "/api-new",
          "args": "$NAME",
          "description": "Create API endpoint"
        },
        {
          "command": "/api-test",
          "args": "$NAME",
          "description": "Generate API tests"
        },
        {
          "command": "/api-protect",
          "args": "$NAME",
          "description": "Add security middleware"
        }
      ],
      "onError": "stop"
    },
    "component": {
      "description": "Full component workflow",
      "steps": [
        {
          "command": "/component-new",
          "args": "$NAME",
          "description": "Create React component"
        },
        {
          "command": "/test-new",
          "args": "components/$NAME",
          "description": "Generate component tests"
        }
      ],
      "onError": "continue"
    },
    "deploy": {
      "description": "Build, test, and deploy",
      "steps": [
        {
          "command": "npm run build",
          "type": "bash",
          "description": "Build project"
        },
        {
          "command": "npm test",
          "type": "bash",
          "description": "Run tests"
        },
        {
          "command": "/deploy",
          "description": "Deploy to production"
        }
      ],
      "onError": "stop",
      "requireConfirmation": true
    }
  }
}
```

## Chain Configuration

### Step Types
```json
{
  "steps": [
    // Claude command
    { "command": "/api-new", "args": "$NAME" },

    // Bash command
    { "command": "npm test", "type": "bash" },

    // Conditional step
    {
      "command": "/api-protect",
      "condition": "fileExists('src/middleware/auth.ts')"
    },

    // Parallel steps
    {
      "parallel": [
        { "command": "/lint" },
        { "command": "npm run typecheck", "type": "bash" }
      ]
    }
  ]
}
```

### Variables
```json
{
  "steps": [
    {
      "command": "/api-new",
      "args": "$NAME",          // From chain invocation
      "env": {
        "API_VERSION": "v2"     // Custom env var
      }
    }
  ]
}
```

### Error Handling
```json
{
  "onError": "stop",      // Stop chain on error (default)
  "onError": "continue",  // Continue to next step
  "onError": "retry:3",   // Retry up to 3 times
  "onError": "rollback"   // Undo previous steps if possible
}
```

### Confirmations
```json
{
  "requireConfirmation": true,  // Confirm before starting
  "confirmBefore": ["deploy"],  // Confirm before specific steps
  "autoConfirm": false          // Never auto-confirm
}
```

## Execution Modes

### Interactive Mode (Default)
Shows progress and allows intervention:
```
/chain api users

Chain: api (3 steps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Creating API endpoint...
      ✓ Created app/api/users/route.ts

[2/3] Generating API tests...
      ✓ Created tests/api/users.test.ts

[3/3] Adding security middleware...
      ✓ Added auth middleware

Chain completed successfully!
```

### Quiet Mode
Minimal output:
```
/chain api users --quiet
```

### Dry Run
Show what would execute without running:
```
/chain api users --dry-run
```

## Built-in Chain Templates

### Full Stack Feature
```json
{
  "fullstack": {
    "steps": [
      { "command": "/migration-new", "args": "$NAME" },
      { "command": "/types-gen" },
      { "command": "/api-new", "args": "$NAME" },
      { "command": "/component-new", "args": "$NAME" },
      { "command": "/test-new", "args": "$NAME" }
    ]
  }
}
```

### PR Preparation
```json
{
  "pr-prep": {
    "steps": [
      { "command": "npm run lint:fix", "type": "bash" },
      { "command": "npm run typecheck", "type": "bash" },
      { "command": "npm test", "type": "bash" },
      { "command": "/commit" }
    ]
  }
}
```

### Code Review
```json
{
  "review": {
    "steps": [
      { "command": "/lint" },
      { "command": "/ci-review", "args": "security" },
      { "command": "/ci-review", "args": "performance" }
    ],
    "parallel": true
  }
}
```

## Integration with Other Features

### With Worktrees
```bash
# Create worktree and run chain
git worktree add ../project-feature -b feature/users
cd ../project-feature
/chain fullstack users
```

### With Ralph Wiggum
```bash
# Autonomous chain execution
/wiggum "/chain api users && /chain api products && /chain api orders"
```

### With Harness
```bash
# Chain with safety limits
/chain deploy --harness strict
```

## Best Practices

1. **Test Chains First**: Use `--dry-run` before first execution
2. **Keep Chains Focused**: 3-5 steps per chain is ideal
3. **Handle Errors**: Configure appropriate `onError` behavior
4. **Use Confirmations**: For destructive operations
5. **Document Chains**: Add descriptions for team understanding
