---
description: Load previous session context from a handoff document
model: claude-sonnet-4-5
---

# Resume Session

Load context from a previous session handoff document to continue work seamlessly.

## Command: $ARGUMENTS

## What This Command Does

1. Reads the specified handoff document (or finds the latest)
2. Reconstructs session context from the YAML
3. Loads relevant files mentioned in the handoff
4. Summarizes the state for quick orientation
5. Provides a continuation prompt to pick up where you left off

## Usage Patterns

### Resume Latest Session
```
/resume
```
Automatically finds and loads the most recent handoff.

### Resume Specific Handoff
```
/resume .claude/handoffs/HANDOFF-2024-01-15T10-30-00.yaml
```
Load a specific handoff by path.

### Resume with Focus
```
/resume focus: tests
```
Resume but focus only on testing-related context.

## Resume Process

### Step 1: Locate Handoff
```
Search order:
1. Explicit path if provided
2. .claude/handoffs/HANDOFF-*.yaml (most recent)
3. .claude/handoffs/team/*.yaml (team handoffs)
```

### Step 2: Parse Context
Extract from handoff:
- Summary of work completed
- Current task state
- Pending tasks
- Key decisions
- Blockers

### Step 3: Load Files
Read files listed in `context_files`:
- Only load if they exist
- Summarize large files
- Note any files that have changed since handoff

### Step 4: Detect Changes
Check if context files changed since handoff:
```
Files changed since handoff:
- src/components/Button.tsx (modified 2 hours ago)
- app/api/users/route.ts (unchanged)
```

### Step 5: Present Context
Output a structured summary:
```markdown
## Session Resumed

**Last Session**: 2024-01-15 at 10:30 AM
**Task**: Button component accessibility improvements
**Progress**: 75% complete

### What Was Done
- Added loading state to Button
- Added disabled prop
- Updated prop types

### What Remains
1. Add unit tests (HIGH priority)
2. Update Storybook stories
3. Document new props

### Key Decisions
- Using CSS modules for loading animation
- aria-busy attribute for accessibility

### Blockers
- None currently

### Relevant Files Loaded
- src/components/Button.tsx
- src/components/Button.test.tsx

### Continue With
> Add unit tests for the Button component covering loading,
> disabled, and click states.
```

## Context Reconstruction

### Memory Integration
```
/resume
# Automatically syncs with /memory:
# - Restores procedural memory (rules followed)
# - Restores semantic memory (facts learned)
# - Restores episodic memory (actions taken)
```

### Ledger Integration
```
/resume
# Updates ledger with resumed session:
# - Links to previous session
# - Tracks continuation chain
# - Measures time between sessions
```

## Advanced Options

### Resume with Validation
```
/resume --validate
```
Verify all referenced files exist and haven't diverged significantly.

### Resume Dry Run
```
/resume --dry-run
```
Show what would be loaded without actually loading.

### Resume Selective
```
/resume --only decisions,pending
```
Only load specific sections from handoff.

## Handling Edge Cases

### Handoff Not Found
```
No handoff documents found.

Options:
1. Start fresh with /context-prime
2. Check .claude/handoffs/ directory
3. Create a new baseline with /handoff
```

### Significant File Changes
```
Warning: Files have changed significantly since handoff.

Changed files:
- src/components/Button.tsx (50+ lines changed)

Options:
1. Load anyway (may have stale context)
2. Review changes first
3. Create new handoff from current state
```

### Stale Handoff
```
Warning: Handoff is more than 7 days old.

Consider:
1. Creating fresh context with /context-prime
2. Reviewing what's changed since then
3. Using handoff as reference only
```

## Session Chain

Track your work across sessions:
```
Session Chain:
├── 2024-01-13 09:00 - Initial Button work
├── 2024-01-14 14:00 - Added loading state
├── 2024-01-15 10:30 - Accessibility improvements
└── [Current] Continuing accessibility work
```
