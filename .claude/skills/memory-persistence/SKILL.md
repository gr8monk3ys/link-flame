---
name: memory-persistence
description: |
  WHEN to auto-invoke: Session start, session end, referencing previous work, asking "what did we do before", resuming work, continuing from previous sessions.
  WHEN NOT to invoke: Fresh starts with no prior context, completely new projects, when user explicitly wants a clean slate.
---

# Memory Persistence Skill

Maintain continuity across Claude Code sessions through automatic context preservation and restoration.

## Core Concept

Sessions are ephemeral, but your work shouldn't be. This skill enables cross-session memory through:

1. **Session Start Hook** - Restores previous context when sessions begin
2. **Session End Hook** - Persists state when sessions complete
3. **Learned Skills** - Accumulates project-specific knowledge over time

## How It Works

### Session Lifecycle

```
Session Start
    ↓
[session-start.sh] → Load previous context
    ↓
Work session
    ↓
[session-end.sh] → Save current context
    ↓
Session End
```

### What Gets Persisted

| Data | Location | Retention |
|------|----------|-----------|
| Session metadata | `~/.claude/sessions/*.json` | 7 days |
| Learned skills | `~/.claude/skills/learned/*.md` | Permanent |
| Project memory | `.claude/memory.json` | Per-project |

### Session Metadata Structure

```json
{
  "timestamp": "2026-01-22T10:30:00Z",
  "project_name": "my-app",
  "project_path": "/home/user/projects/my-app",
  "project_type": "nextjs",
  "git_branch": "feature/auth",
  "recent_files": "src/auth.ts,src/login.tsx",
  "session_id": "20260122_103000"
}
```

## Using Memory

### Check Available Context

At session start, you'll see messages like:

```
[Memory] Found 3 recent session(s) from the past 7 days
[Memory] Latest session: session_20260121_153000.json
[Memory] 2 learned skill(s) available from previous sessions
[Memory] - error-handling-patterns
[Memory] - api-conventions
```

### Reference Previous Work

When you need to reference previous sessions:

1. Check `~/.claude/sessions/` for recent session files
2. Read the session JSON for context about what was worked on
3. Check `~/.claude/skills/learned/` for accumulated knowledge

### Project-Specific Memory

Create `.claude/memory.json` in your project root:

```json
{
  "conventions": {
    "api_style": "REST with Zod validation",
    "state_management": "Zustand for global, Context for features",
    "testing": "Vitest + Testing Library"
  },
  "known_issues": [
    "Auth redirect sometimes fails on Safari",
    "Build is slow due to large SVG imports"
  ],
  "recent_decisions": [
    "Switched from Prisma to Drizzle for better edge support"
  ]
}
```

## Configuration

### Enable Memory Persistence

Add to your Claude settings or `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "./.claude/hooks/session-start.sh"
      }
    ],
    "Stop": [
      {
        "command": "./.claude/hooks/session-end.sh"
      }
    ]
  }
}
```

### Adjust Retention

In `session-start.sh`, modify:
```bash
MAX_AGE_DAYS=7  # Change retention period
```

In `session-end.sh`, modify:
```bash
MAX_SESSIONS=50  # Max sessions to keep
```

## Best Practices

1. **Use project memory for conventions** - Add `.claude/memory.json` to store project-specific patterns
2. **Let learned skills accumulate** - Don't delete `~/.claude/skills/learned/` unless necessary
3. **Reference explicitly** - When resuming work, explicitly mention "continuing from previous session"
4. **Clean up periodically** - Old sessions auto-cleanup, but you can manually prune if needed

## Integration with Continuous Learning

The memory persistence system works with the continuous learning skill:

1. Sessions capture what you worked on
2. Continuous learning extracts patterns from sessions
3. Patterns become learned skills
4. Learned skills load in future sessions

This creates a **productivity flywheel** that improves over time.
