---
name: strategic-compact
description: |
  WHEN to auto-invoke: After 50+ edit operations, long sessions, before context overflow, when suggested by hooks, transitioning between major task phases.
  WHEN NOT to invoke: Mid-implementation, during active debugging, when context is critical to current work.
---

# Strategic Compaction Skill

Compact context at meaningful workflow junctures rather than accepting arbitrary auto-compaction.

## The Problem

Auto-compaction triggers at arbitrary points:
- Often mid-task, losing important context
- No awareness of workflow phases
- Can disrupt complex implementations
- Loses debugging context at critical moments

## The Solution

**Strategic compaction** = User-controlled timing at natural breakpoints.

## When to Compact

### Good Times (Natural Breakpoints)

| Phase Transition | Why It's Good |
|-----------------|---------------|
| Research → Implementation | Fresh start with findings summarized |
| Feature complete → New feature | Clean context for new work |
| Debugging done → Continuing | Problem solved, context can reset |
| PR submitted → New task | Natural task boundary |
| End of day → Next day | Session boundary |

### Bad Times (Avoid)

| Situation | Why It's Bad |
|-----------|--------------|
| Mid-implementation | Loses code context |
| Active debugging | Loses error trail |
| Multi-file refactor | Loses file relationships |
| Complex merge | Loses conflict context |

## How the Hook Works

The `strategic-compact.sh` hook:

1. **Counts** Edit/Write operations
2. **Notifies** at 50 operations (configurable)
3. **Reminds** every 25 operations after threshold
4. **You decide** when to actually compact

```bash
# What you'll see:
[Strategic Compact] 50 edit operations reached
Consider using /compact at a natural breakpoint:
  - After completing a feature or fix
  - After finishing research, before implementation
  - When switching between different task types
```

## Using Strategic Compaction

### Check Current Count

```bash
cat ~/.claude/.compact_counter
```

### Reset Counter

After compacting or starting fresh:
```bash
rm ~/.claude/.compact_counter
```

### Manual Trigger

When you're at a good breakpoint:
```
/compact
```

## Compaction Checklist

Before compacting, ensure:

```markdown
- [ ] Current task is at a natural stopping point
- [ ] No uncommitted critical context
- [ ] Key decisions are documented (in code comments or memory)
- [ ] Next steps are clear
```

## Configuration

### Adjust Thresholds

In `strategic-compact.sh`:

```bash
THRESHOLD=50        # Initial notification
REMINDER_INTERVAL=25  # Reminder frequency after threshold
```

### Disable Temporarily

```bash
# Skip the hook for this session
export SKIP_COMPACT_HOOK=1
```

## Best Practices

### 1. Compact at Phase Transitions

```
Research phase
    ↓
[Good time to compact - summarize findings]
    ↓
Implementation phase
    ↓
[Good time to compact - feature complete]
    ↓
Testing phase
```

### 2. Document Before Compacting

Before `/compact`, ensure key context is preserved:

```markdown
## Session Summary (for next context)

### Completed
- Implemented user authentication
- Added JWT token refresh

### In Progress
- Working on password reset flow
- File: src/auth/reset.ts

### Next Steps
1. Complete email verification
2. Add rate limiting
```

### 3. Use Project Memory

Store persistent context in `.claude/memory.json`:

```json
{
  "current_focus": "Authentication system",
  "architecture_decisions": [
    "Using httpOnly cookies for JWT",
    "Refresh tokens stored in Redis"
  ],
  "blocked_on": "Waiting for email service API key"
}
```

## Integration with Memory Persistence

Strategic compaction works with memory persistence:

1. **Before compact**: Session state auto-saved
2. **After compact**: Key context preserved in memory
3. **Next session**: Context restored from memory

This prevents the "what was I doing?" problem after compaction.

## Anti-Patterns

### Don't

- Compact mid-debugging (you'll lose the error trail)
- Compact during multi-file refactors (you'll lose file relationships)
- Ignore the warnings until auto-compact hits (usually at the worst time)
- Compact without summarizing current state

### Do

- Compact at natural task boundaries
- Document key context before compacting
- Use project memory for persistent context
- Reset the counter after compacting
