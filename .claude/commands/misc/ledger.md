---
description: View, update, or manage session progress ledger
model: claude-sonnet-4-5
---

# Session Ledger

Track and manage progress across coding sessions with a persistent ledger.

## Command: $ARGUMENTS

## What This Command Does

The ledger is a persistent record of:
- Tasks started, in progress, and completed
- Time invested in different areas
- Decisions made and their outcomes
- Session continuity and handoffs
- Velocity and productivity metrics

## Ledger Location

```
.claude/ledger/LEDGER.yaml
```

## Ledger Structure

```yaml
# Session Ledger
# Project: my-project
# Created: 2024-01-01

## Current Sprint/Focus
current_focus:
  name: "Authentication System"
  started: 2024-01-10
  target: 2024-01-20
  progress: 65%

## Active Tasks
active_tasks:
  - id: TASK-001
    title: Implement OAuth2 login
    status: in_progress
    started: 2024-01-12
    sessions: 3
    estimated_sessions: 5
    notes: |
      Working on Google OAuth integration.
      Blocked on refresh token handling.

  - id: TASK-002
    title: Add password reset flow
    status: pending
    dependencies: [TASK-001]

## Completed Tasks
completed_tasks:
  - id: TASK-000
    title: Set up auth database schema
    completed: 2024-01-11
    sessions: 2
    outcome: success
    learnings:
      - Used Supabase RLS for row-level security
      - Chose bcrypt over argon2 for password hashing

## Session History
sessions:
  - id: SESSION-005
    date: 2024-01-15
    duration: 2h
    focus: TASK-001
    accomplishments:
      - Implemented Google OAuth callback
      - Added session management
    blockers:
      - Refresh token rotation unclear
    handoff: .claude/handoffs/HANDOFF-2024-01-15.yaml

  - id: SESSION-004
    date: 2024-01-14
    duration: 1.5h
    focus: TASK-001
    accomplishments:
      - Set up OAuth2 client configuration
      - Created login button component

## Metrics
metrics:
  total_sessions: 5
  total_time: 8.5h
  tasks_completed: 1
  tasks_in_progress: 1
  average_session_length: 1.7h
  completion_rate: 50%

## Decision Log
decisions:
  - id: DEC-001
    date: 2024-01-10
    decision: Use Supabase Auth instead of custom
    rationale: Faster to implement, built-in security
    outcome: positive
    revisit: false

  - id: DEC-002
    date: 2024-01-12
    decision: Support Google OAuth only initially
    rationale: Most common provider, add others later
    outcome: pending
```

## Ledger Operations

### View Ledger Status
```
/ledger
```
Shows current focus, active tasks, and recent activity.

### Add New Task
```
/ledger add: "Implement email verification"
```
Adds a new task to the active tasks list.

### Update Task Status
```
/ledger update TASK-001 status: completed
```
Updates task status and moves to completed.

### Log Session
```
/ledger session
```
Records the current session's accomplishments.

### View Metrics
```
/ledger metrics
```
Shows productivity metrics and trends.

### Record Decision
```
/ledger decision: "Using JWT for API auth"
```
Logs a technical decision with rationale.

## Ledger Views

### Daily Summary
```
/ledger daily
```
```
## Today's Session Summary (2024-01-15)

Duration: 2h 15m
Focus: TASK-001 (OAuth Implementation)

### Accomplished
- [x] Google OAuth callback handler
- [x] Session cookie management
- [ ] Refresh token rotation (blocked)

### Time Breakdown
- Coding: 1h 30m
- Debugging: 30m
- Research: 15m

### Tomorrow's Focus
- Resolve refresh token handling
- Add logout functionality
```

### Weekly Review
```
/ledger weekly
```
```
## Week of Jan 13-19, 2024

### Progress
- Sessions: 5
- Time: 8.5 hours
- Tasks Completed: 1
- Tasks Started: 1

### Velocity
- Estimated: 2 tasks/week
- Actual: 1 task (on track)

### Blockers Encountered
- Refresh token rotation: Unresolved
- Database connection timeout: Resolved

### Key Decisions
- DEC-002: Google OAuth only initially
```

### Sprint/Focus Progress
```
/ledger sprint
```
```
## Current Focus: Authentication System

Progress: ████████░░░░░░ 65%

### Tasks
- [x] TASK-000: Database schema
- [~] TASK-001: OAuth2 login (in progress)
- [ ] TASK-002: Password reset
- [ ] TASK-003: Email verification

### Burndown
Day 1: ████░░░░░░ 40%
Day 3: ██████░░░░ 55%
Day 5: ████████░░ 65% <- Today
Target: ██████████ 100% (5 days remaining)
```

## Integration with Other Commands

### With /handoff
```
/ledger
# Shows: "Last handoff: 2 hours ago"
# Links: "View: /resume"
```

### With /memory
```
/ledger decision: "Using React Query for data fetching"
# Automatically added to /memory decisions section
```

### With /tdd
```
/ledger
# Shows test coverage progress per task
# Tracks red-green-refactor cycles
```

## Ledger Best Practices

### Starting Each Session
1. Run `/ledger` to see current state
2. Pick up from active task or handoff
3. Update focus if changing direction

### During Session
1. Let Claude track accomplishments
2. Note blockers as they arise
3. Record decisions with rationale

### Ending Each Session
1. Run `/ledger session` to log progress
2. Create `/handoff` if stopping mid-task
3. Update task estimates if needed

## Archiving

### Archive Old Entries
```
/ledger archive before: 2024-01-01
```
Moves old sessions and completed tasks to archive.

### Archive Location
```
.claude/ledger/archive/LEDGER-2023.yaml
.claude/ledger/archive/LEDGER-2024-Q1.yaml
```
