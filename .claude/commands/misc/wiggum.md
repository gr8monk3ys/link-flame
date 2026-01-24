---
description: Ralph Wiggum Pattern - Autonomous iterative development loops with safety guardrails
model: claude-opus-4-5
---

# Ralph Wiggum Pattern

Autonomous iterative development that persists until completion, with safety guardrails.

## Command: $ARGUMENTS

## What is the Ralph Wiggum Pattern?

Named after the persistently optimistic Simpsons character, this pattern enables autonomous coding loops that:

1. **Keep going** until the task is complete
2. **Learn from failures** by logging to a progress file
3. **Reset context** each iteration (stateless resampling)
4. **Maintain state** through the filesystem and git

```
┌─────────────────────────────────────────────────────────────┐
│                   RALPH WIGGUM LOOP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │  READ    │ →  │  WORK    │ →  │  CHECK   │             │
│   │  STATE   │    │  ON IT   │    │  DONE?   │             │
│   └──────────┘    └──────────┘    └────┬─────┘             │
│        ↑                               │                    │
│        │              ┌────────────────┴────────────────┐   │
│        │              │                                 │   │
│        │         No   ▼                           Yes   ▼   │
│        │    ┌──────────────┐                  ┌──────────┐  │
│        └────│ LOG PROGRESS │                  │   DONE   │  │
│             │ RESET CONTEXT│                  │  EXIT    │  │
│             └──────────────┘                  └──────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### Stateless Resampling
Each iteration:
1. Reads current state from filesystem
2. Works on the task
3. Writes progress to filesystem
4. Context resets (no conversation history accumulation)

### State Files
```
.claude/wiggum/
├── TASK.md          # Current task description
├── PROGRESS.md      # Learning log (appended each iteration)
├── DONE.md          # Completion criteria
└── STATUS           # "running" or "complete"
```

## Setup

### Task File (.claude/wiggum/TASK.md)
```markdown
# Task: [Title]

## Objective
[Clear description of what needs to be done]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Context
- Relevant files: [list]
- Constraints: [list]
- Notes: [any important info]
```

### Done File (.claude/wiggum/DONE.md)
```markdown
# Completion Conditions

The task is DONE when ALL of these are true:
1. All tests pass (`npm test` returns 0)
2. Build succeeds (`npm run build` returns 0)
3. All success criteria in TASK.md are checked
4. No TODO comments remain in changed files

The task is BLOCKED when:
1. Requires human decision
2. Missing credentials/access
3. Unclear requirements
```

## Usage

### Start Autonomous Loop
```
/wiggum start "Implement user authentication"
```

This:
1. Creates .claude/wiggum/ structure
2. Initializes TASK.md with your description
3. Sets STATUS to "running"
4. Begins first iteration

### Check Status
```
/wiggum status
```

Shows current progress, iterations completed, blockers.

### Stop Loop
```
/wiggum stop
```

Gracefully stops after current iteration.

### Resume Loop
```
/wiggum resume
```

Continues a stopped loop.

## Safety: The Principal Skinner Harness

**Warning**: Autonomous loops can cause damage without guardrails.

### Built-in Safety Rails

1. **Iteration Limit**
   ```yaml
   max_iterations: 50  # Stop after this many attempts
   ```

2. **Time Limit**
   ```yaml
   max_duration: 2h  # Stop after this time
   ```

3. **Change Limits**
   ```yaml
   max_files_per_iteration: 5   # Prevent mass changes
   max_lines_per_file: 100      # Prevent file rewrites
   ```

4. **Protected Paths**
   ```yaml
   protected:
     - .env*
     - **/secrets/**
     - package-lock.json
     - yarn.lock
   ```

5. **Rollback Points**
   ```yaml
   git_checkpoint: true  # Commit before each iteration
   ```

### Harness Configuration (.claude/wiggum/HARNESS.yaml)
```yaml
safety:
  max_iterations: 50
  max_duration: 2h
  max_files_per_iteration: 5
  max_lines_per_file: 100

protected_paths:
  - .env*
  - **/credentials*
  - package-lock.json

allowed_commands:
  - npm test
  - npm run build
  - npm run lint

forbidden_commands:
  - rm -rf
  - git push --force
  - npm publish

checkpoints:
  git_commit: true  # Commit before each iteration

alerts:
  on_iteration: 10  # Notify every N iterations
  on_stuck: 3       # Notify if same error 3 times
```

## Progress Logging

### Progress File (.claude/wiggum/PROGRESS.md)
```markdown
# Progress Log

## Iteration 1 - 2024-01-15 10:00
**Attempted**: Set up basic auth structure
**Result**: Partial success
**Learnings**:
- Need to install bcrypt first
- Auth middleware should go in lib/auth.ts
**Next**: Install dependencies, create middleware

---

## Iteration 2 - 2024-01-15 10:05
**Attempted**: Install deps and create middleware
**Result**: Success
**Learnings**:
- bcrypt installed successfully
- Middleware created and exports correctly
**Next**: Implement login endpoint

---

## Iteration 3 - 2024-01-15 10:12
**Attempted**: Create login endpoint
**Result**: Failed - TypeScript errors
**Learnings**:
- Need to define User type
- Session type not exported from next-auth
**Next**: Add type definitions
```

## Iteration Protocol

Each iteration follows this exact sequence:

```markdown
1. READ STATE
   - Read TASK.md for objective
   - Read PROGRESS.md for learnings
   - Read DONE.md for completion criteria

2. ASSESS SITUATION
   - What's been tried?
   - What's been learned?
   - What should be tried next?

3. TAKE ACTION
   - Make ONE focused attempt
   - Small, verifiable change
   - Follow learnings from previous iterations

4. VERIFY
   - Run tests
   - Check build
   - Verify against DONE.md criteria

5. LOG OUTCOME
   - What was attempted?
   - What was the result?
   - What was learned?
   - What should be tried next?

6. UPDATE STATUS
   - If DONE.md criteria met → STATUS = "complete"
   - If blocked → STATUS = "blocked"
   - Otherwise → Continue to next iteration
```

## Best Practices

### Good Tasks for Wiggum
- ✅ Well-defined bug fixes
- ✅ Clear feature implementations
- ✅ Refactoring with tests
- ✅ Test coverage improvement

### Poor Tasks for Wiggum
- ❌ Vague requirements ("make it better")
- ❌ Design decisions needed
- ❌ Production deployments
- ❌ Security-sensitive changes

### Writing Good Completion Criteria
```markdown
# Good Criteria
- [ ] `npm test` passes with 0 failures
- [ ] Login form accepts email and password
- [ ] Invalid login shows error message
- [ ] Successful login redirects to /dashboard

# Bad Criteria
- [ ] It works (too vague)
- [ ] Users are happy (not measurable)
- [ ] Code is clean (subjective)
```

## Integration

Works with:
- `/ledger` - Track Wiggum session progress
- `/handoff` - Hand off blocked Wiggum tasks
- `verification-first` skill - Verify before marking done
- `micro-tasking` skill - Break down stuck tasks
