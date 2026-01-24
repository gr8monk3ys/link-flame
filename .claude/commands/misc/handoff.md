---
description: Create a session transfer document for seamless context handoff
model: claude-sonnet-4-5
---

# Session Handoff

Create a structured handoff document to transfer session context to a future session or another developer.

## Command: $ARGUMENTS

## What This Command Does

Generates a comprehensive YAML handoff document that captures:
- Current task state and progress
- Key decisions made during the session
- Files modified and their purposes
- Pending tasks and blockers
- Important learnings and gotchas

## Handoff Document Structure

Generate a file at `.claude/handoffs/HANDOFF-{timestamp}.yaml`:

```yaml
# Session Handoff Document
# Generated: {ISO timestamp}
# Session ID: {unique-id}

## Summary
summary: |
  Brief description of what was accomplished and what remains

## Task State
current_task:
  description: What we were working on
  status: in_progress | completed | blocked
  progress_percent: 75

## Key Decisions
decisions:
  - decision: Description of decision made
    rationale: Why this approach was chosen
    alternatives_considered:
      - Alternative 1
      - Alternative 2

## Files Modified
files:
  - path: src/components/Button.tsx
    changes: Added loading state and disabled prop
    reason: User requested accessibility improvements

  - path: app/api/users/route.ts
    changes: Added pagination support
    reason: Performance optimization for large datasets

## Pending Tasks
pending:
  - task: Add unit tests for Button component
    priority: high
    context: Tests should cover loading, disabled, and click states

  - task: Update API documentation
    priority: medium
    context: Document new pagination parameters

## Blockers
blockers:
  - blocker: Need database credentials for staging
    waiting_on: DevOps team

## Learnings & Gotchas
learnings:
  - The codebase uses a custom fetch wrapper in lib/api.ts
  - Test files must be co-located with components
  - Environment variables need NEXT_PUBLIC_ prefix for client access

## Context Files
# Files that should be loaded in next session
context_files:
  - src/components/Button.tsx
  - src/components/Button.test.tsx
  - app/api/users/route.ts

## Continuation Prompt
continuation: |
  Continue working on the Button component accessibility improvements.
  The loading state is complete, but we still need to:
  1. Add unit tests
  2. Update Storybook stories
  3. Document the new props in the component README
```

## Usage Patterns

### End of Work Session
```
/handoff
```
Creates a handoff for tomorrow's session.

### Handing Off to Another Developer
```
/handoff for: @teammate
```
Creates a handoff with additional context for knowledge transfer.

### Handoff with Specific Focus
```
/handoff focus: API changes
```
Creates a handoff focused on specific area of work.

## Handoff Best Practices

### What to Include
- Specific file paths and line numbers when relevant
- Exact error messages if debugging
- Links to related issues/PRs
- Environment-specific notes

### What to Avoid
- Sensitive data (API keys, passwords)
- Obvious context that's in the code
- Speculation about future work
- Personal opinions without rationale

## Integration with Memory

After creating a handoff:
1. Key decisions are automatically added to `/memory`
2. Learnings are stored for future reference
3. Handoff file is git-ignored by default

## Loading a Handoff

To continue from a handoff, use:
```
/resume .claude/handoffs/HANDOFF-{timestamp}.yaml
```

## Teleport Integration (v2.1.0+)

Use `/teleport` to move your session to claude.ai/code while preserving context:

### When to Teleport vs Handoff

| Scenario | Use |
|----------|-----|
| Continuing on same machine | `/resume` |
| Moving to web interface | `/teleport` |
| Handing off to teammate | `/handoff` |
| Switching devices | `/teleport` then `/resume` |

### Teleport Workflow

```bash
# 1. Create handoff first (recommended)
/handoff

# 2. Teleport session to web
/teleport

# 3. On web, load handoff context
/resume .claude/handoffs/HANDOFF-{timestamp}.yaml
```

### Teleport Limitations

- Session state moves, but local files don't
- MCP servers won't be available on web
- Custom hooks don't apply on web
- Best for continuation, not file-heavy work

## Handoff Locations

| Type | Location |
|------|----------|
| Session handoffs | `.claude/handoffs/` |
| Team handoffs | `.claude/handoffs/team/` |
| Archived | `.claude/handoffs/archive/` |
