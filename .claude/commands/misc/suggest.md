---
description: Get AI-powered command suggestions based on current context
---

# Command Suggestions

Get intelligent command recommendations based on your current context and task.

## Arguments
$ARGUMENTS

## How It Works

Claude analyzes your current context to suggest relevant commands:
- **File types** you're working with
- **Recent changes** in git
- **Error messages** in console
- **Project structure** and stack
- **Conversation history**

## Usage

### Basic Suggestion
```
/suggest
```
Returns top 3-5 most relevant commands for your current situation.

### Category-Specific
```
/suggest api        # API-related commands
/suggest testing    # Testing commands
/suggest deploy     # Deployment commands
/suggest debug      # Debugging commands
```

### Task-Based
```
/suggest "I need to add authentication"
/suggest "How do I optimize this component?"
/suggest "Database is slow"
```

## Context Analysis

### File Context
When working on specific file types:

| Files Open | Suggested Commands |
|------------|-------------------|
| `*.tsx` components | `/component-new`, `/test-new`, code review |
| `route.ts` API files | `/api-test`, `/api-protect` |
| `*.test.ts` test files | `/tdd`, test coverage |
| `migration.ts` | `/types-gen`, `/migration-new` |
| `package.json` | dependency audit, `/deploy` |

### Git Context
Based on recent changes:

| Git Status | Suggested Commands |
|------------|-------------------|
| Many unstaged changes | `/commit`, `/review` |
| On feature branch | `/chain pr-prep` |
| Merge conflicts | conflict resolution help |
| Behind remote | `git pull` recommendation |

### Error Context
When errors are detected:

| Error Type | Suggested Commands |
|------------|-------------------|
| TypeScript errors | type fixing, `/lint` |
| Test failures | `/tdd`, debugging |
| Build errors | build troubleshooting |
| Runtime errors | `/debug`, root cause analysis |

## Suggestion Categories

### Development Flow
```
/suggest flow
```
Suggests next logical step in development:
- Just created component? → Add tests
- Tests passing? → Consider PR
- PR approved? → Deploy

### Code Quality
```
/suggest quality
```
Suggests improvements:
- `/lint` for style issues
- `/code-optimize` for performance
- `/code-cleanup` for refactoring opportunities

### Architecture
```
/suggest architecture
```
Suggests structural improvements:
- Component extraction opportunities
- API consolidation
- Database optimization

### Security
```
/suggest security
```
Suggests security enhancements:
- `/api-protect` for unprotected endpoints
- Credential scanning
- Dependency vulnerability checks

## Smart Suggestions

### Learning from Usage
The suggestion engine learns from:
- Commands you use frequently
- Patterns in your workflow
- Time of day preferences
- Project-specific patterns

### Team Patterns
If `.claude/team-patterns.json` exists:
```json
{
  "afterApiCreate": ["/api-test", "/api-protect"],
  "beforeCommit": ["/lint", "/test"],
  "onMonday": ["/review", "dependency updates"]
}
```

## Example Output

```
Based on your current context, I suggest:

1. /api-test users
   ↳ You created app/api/users/route.ts but have no tests

2. /lint
   ↳ 3 files have uncommitted changes with potential issues

3. /types-gen
   ↳ Database schema changed, types may be outdated

4. /commit
   ↳ 5 files ready to commit, tests passing

Quick actions:
  [1] Run first suggestion
  [2] Run all suggestions as chain
  [3] Show more suggestions
  [?] Explain suggestions
```

## Configuration

Create `.claude/suggestions.json` to customize:

```json
{
  "priorities": {
    "testing": "high",
    "documentation": "low",
    "security": "high"
  },
  "ignore": [
    "/deploy"  // Never suggest deploy
  ],
  "always": [
    "/lint"    // Always include lint check
  ],
  "contextRules": [
    {
      "when": "fileType:route.ts",
      "suggest": ["/api-test", "/api-protect"]
    },
    {
      "when": "branch:main",
      "suggest": ["/review"],
      "avoid": ["/deploy"]
    }
  ]
}
```

## Integration

### With Other Commands
```bash
# Get suggestions and run them
/suggest --run

# Get suggestions for specific task
/suggest "add user profile feature" --chain
```

### With CI/CD
```yaml
# In GitHub Actions
- name: Get Claude Suggestions
  run: claude -p "/suggest quality" --output-format json
```

### With Hooks
```json
{
  "hooks": {
    "PostToolUse": {
      "onFileCreate": "/suggest --quiet"
    }
  }
}
```

## Best Practices

1. **Check Suggestions Regularly**: Run `/suggest` at natural breakpoints
2. **Customize for Team**: Add team patterns for consistent workflows
3. **Trust but Verify**: Suggestions are recommendations, not requirements
4. **Provide Context**: More specific queries yield better suggestions
5. **Learn Patterns**: Notice which suggestions you accept to improve future recommendations
