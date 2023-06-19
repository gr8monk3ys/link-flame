---
description: Configure safety guardrails for autonomous development (Principal Skinner Harness)
---

# Safety Harness Configuration

Configure safety guardrails for autonomous development loops like Ralph Wiggum pattern.

## Arguments
$ARGUMENTS

## What is the Principal Skinner Harness?

The harness acts as a safety governor for autonomous Claude Code operations:
- **Limits iterations** to prevent infinite loops
- **Restricts file changes** to prevent runaway modifications
- **Protects paths** from accidental modification
- **Sets time limits** for autonomous sessions
- **Monitors token usage** to prevent context explosion

## Configuration File

Create `.claude/harness.json` in your project:

```json
{
  "limits": {
    "maxIterations": 10,
    "maxTimeMinutes": 30,
    "maxFileChanges": 50,
    "maxNewFiles": 20,
    "maxDeletedFiles": 5
  },
  "protectedPaths": [
    ".env*",
    "*.key",
    "*.pem",
    "credentials*",
    "secrets*",
    ".git/",
    "node_modules/",
    "package-lock.json",
    "yarn.lock"
  ],
  "allowedPaths": [
    "src/",
    "app/",
    "components/",
    "lib/",
    "tests/",
    "*.md"
  ],
  "requiredChecks": {
    "testsPass": true,
    "typeCheck": true,
    "lintPass": false,
    "buildPass": false
  },
  "notifications": {
    "onIterationComplete": true,
    "onLimitReached": true,
    "onError": true
  },
  "autoCommit": {
    "enabled": false,
    "messagePrefix": "[auto]",
    "requirePassingTests": true
  }
}
```

## Guardrail Levels

### Level 1: Strict (Recommended for Production)
```json
{
  "limits": {
    "maxIterations": 5,
    "maxTimeMinutes": 15,
    "maxFileChanges": 20
  },
  "requiredChecks": {
    "testsPass": true,
    "typeCheck": true,
    "lintPass": true,
    "buildPass": true
  }
}
```

### Level 2: Moderate (Development)
```json
{
  "limits": {
    "maxIterations": 10,
    "maxTimeMinutes": 30,
    "maxFileChanges": 50
  },
  "requiredChecks": {
    "testsPass": true,
    "typeCheck": true
  }
}
```

### Level 3: Permissive (Prototyping)
```json
{
  "limits": {
    "maxIterations": 25,
    "maxTimeMinutes": 60,
    "maxFileChanges": 100
  },
  "requiredChecks": {
    "testsPass": false
  }
}
```

### Level 4: YOLO Mode (Use with Caution!)
```json
{
  "limits": {
    "maxIterations": 100,
    "maxTimeMinutes": 120,
    "maxFileChanges": 500
  },
  "requiredChecks": {},
  "protectedPaths": [".env*", "*.key"]
}
```

⚠️ **WARNING**: YOLO mode removes most safety checks. Only use for:
- Isolated test environments
- Disposable branches
- When you have full backups

## Protected Paths

Always protect sensitive files:

```json
{
  "protectedPaths": [
    // Secrets & credentials
    ".env*",
    "*.key",
    "*.pem",
    "*.cert",
    "credentials*",
    "secrets*",

    // Lock files (can break dependencies)
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",

    // Git internals
    ".git/",

    // Dependencies (should use package manager)
    "node_modules/",

    // Build outputs (should rebuild)
    "dist/",
    ".next/",
    "build/"
  ]
}
```

## Monitoring & Alerts

The harness monitors and alerts on:

### Iteration Tracking
```
Iteration 3/10
├── Files changed: 12/50
├── Time elapsed: 8:32/30:00
├── Tests: ✓ Passing
└── Types: ✓ Clean
```

### Limit Warnings
```
⚠️ WARNING: Approaching limits
├── Iterations: 8/10 (80%)
├── File changes: 45/50 (90%)
└── Recommendation: Consider committing progress
```

### Stop Conditions
```
🛑 STOPPED: Limit reached
├── Reason: maxFileChanges exceeded (51/50)
├── Progress saved to: .claude/wiggum/PROGRESS.md
└── Resume with: /wiggum resume
```

## Integration with Ralph Wiggum

The harness automatically applies to `/wiggum` sessions:

```bash
# Start with default harness
/wiggum "Implement user authentication"

# Start with custom harness level
/wiggum --harness strict "Refactor payment service"

# Start with custom config
/wiggum --harness-config ./my-harness.json "Add new feature"
```

## Runtime Commands

During autonomous sessions:

```
/harness status    # View current limits and usage
/harness pause     # Pause execution, save state
/harness resume    # Resume from saved state
/harness stop      # Stop immediately, save progress
/harness extend    # Request more iterations (requires confirmation)
```

## Best Practices

1. **Start Strict**: Begin with strict limits, loosen as needed
2. **Protect Secrets**: Always protect credential files
3. **Test First**: Require passing tests before commits
4. **Monitor Progress**: Enable iteration notifications
5. **Backup First**: Create a branch before YOLO mode
6. **Review Changes**: Always review autonomous changes before merging

## Troubleshooting

### "Stopped due to failing tests"
- Tests must pass between iterations
- Fix tests manually or disable `testsPass` check

### "Protected path modification attempted"
- File is in `protectedPaths` list
- Remove from list if modification is intentional

### "Max iterations reached"
- Increase `maxIterations` or break task into smaller pieces
- Use `/harness extend` to continue if close to completion
