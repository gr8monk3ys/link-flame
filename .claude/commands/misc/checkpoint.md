---
description: Create, list, or restore named checkpoints for your work
model: claude-sonnet-4-5
---

# Checkpoint Management

Manage named checkpoints for saving and restoring your work progress.

## User Request
$ARGUMENTS

## About Checkpoints

Claude Code v2.0+ has built-in checkpoints that automatically capture state before each edit. Access with:
- Press `Esc` twice (`Esc + Esc`)
- Use `/rewind` command

This command provides **named checkpoints** for explicit save points.

## Available Actions

### Create Checkpoint
```
/checkpoint save <name> [description]
```

Creates a named checkpoint with:
1. Current git state (stash if needed)
2. List of modified files
3. Conversation context marker
4. Optional description

### List Checkpoints
```
/checkpoint list
```

Shows all named checkpoints with timestamps and descriptions.

### Restore Checkpoint
```
/checkpoint restore <name> [--code-only|--conversation-only|--both]
```

Restore options:
- `--code-only`: Revert files only, keep conversation
- `--conversation-only`: Rewind conversation, keep file changes
- `--both`: Full restore (default)

### Delete Checkpoint
```
/checkpoint delete <name>
```

Remove a named checkpoint.

## Implementation

### Checkpoint Storage Location
```
~/.claude/checkpoints/
├── [project-hash]/
│   ├── checkpoint-name-1.json
│   ├── checkpoint-name-2.json
│   └── ...
```

### Checkpoint Format
```json
{
  "name": "before-refactor",
  "description": "State before major auth refactor",
  "timestamp": "2026-01-23T10:30:00Z",
  "git": {
    "branch": "feature/auth",
    "commit": "abc123",
    "stash_id": "stash@{0}",
    "dirty_files": ["src/auth.ts", "src/utils.ts"]
  },
  "conversation_marker": "msg_12345",
  "files_snapshot": {
    "src/auth.ts": "sha256:...",
    "src/utils.ts": "sha256:..."
  }
}
```

## Example Workflow

```bash
# Before risky change
/checkpoint save pre-refactor "Before auth system rewrite"

# Make changes...
# Something goes wrong!

# Restore to safe state
/checkpoint restore pre-refactor

# Or just restore files, keep learnings
/checkpoint restore pre-refactor --code-only
```

## Integration with Git

Checkpoints complement git, not replace it:

| Checkpoint | Git |
|------------|-----|
| Quick save points | Permanent history |
| Includes uncommitted work | Requires commits |
| Session-scoped | Cross-session |
| Automatic file tracking | Manual staging |

## Best Practices

1. **Create before risky changes** - Refactors, dependency updates, config changes
2. **Name descriptively** - `pre-auth-refactor` not `checkpoint1`
3. **Include descriptions** - Future you will thank you
4. **Clean up old checkpoints** - Don't let them pile up
5. **Use with git** - Checkpoint for experiments, git for milestones

## Limitations

- Only tracks files edited via Claude's tools
- Does NOT track: `rm`, `mv`, `cp`, manual edits
- Session-bound (cleared on session end unless persisted)
- Not a replacement for proper version control

## Quick Reference

| Command | Action |
|---------|--------|
| `/checkpoint save <name>` | Create checkpoint |
| `/checkpoint list` | Show all checkpoints |
| `/checkpoint restore <name>` | Restore checkpoint |
| `/checkpoint delete <name>` | Remove checkpoint |
| `Esc + Esc` | Access built-in rewind |
| `/rewind` | Built-in checkpoint restore |
