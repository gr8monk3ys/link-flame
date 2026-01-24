---
name: parallel-build-workflow
type: orchestrator
description: Spawn multiple Claude agents in parallel using git worktrees for 10x development velocity
triggers:
  - "parallel build"
  - "10x development"
  - "spawn agents"
  - "worktree agents"
  - "build in parallel"
---

# Parallel Build Orchestrator

Coordinates multiple Claude Code instances working simultaneously on independent tasks using git worktrees for isolation.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR (Main Branch)                    │
│  Analyzes task → Creates worktrees → Spawns agents → Merges      │
└─────────────────────────────┬────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   WORKTREE 1  │     │   WORKTREE 2  │     │   WORKTREE 3  │
│   feature/api │     │  feature/auth │     │  feature/ui   │
│               │     │               │     │               │
│  Agent: API   │     │ Agent: Auth   │     │ Agent: Front  │
│  Task: Build  │     │ Task: Build   │     │ Task: Build   │
│  endpoints    │     │ system        │     │ components    │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │    MERGE      │
                    │  Integrate &  │
                    │    Verify     │
                    └───────────────┘
```

## When to Use Parallel Build

**Ideal for:**
- Features with independent components (API + Frontend + Tests)
- Multiple unrelated bug fixes
- Large refactoring across separate modules
- Multi-service changes in monorepos
- Migration tasks across independent files

**Not ideal for:**
- Highly coupled code changes
- Small single-file edits
- Tasks requiring sequential dependencies

## Phase 1: Task Decomposition

### Analyze and Partition

```markdown
User Request: "Build a complete user management system"

Decomposition:
┌─────────────────────────────────────────────────────────────┐
│ Task                    │ Dependencies │ Agent   │ Est.    │
├─────────────────────────┼──────────────┼─────────┼─────────┤
│ User API endpoints      │ None         │ API     │ 15 min  │
│ Auth/JWT system         │ None         │ Auth    │ 20 min  │
│ User UI components      │ API contract │ Front   │ 25 min  │
│ Database migrations     │ None         │ DB      │ 10 min  │
│ E2E tests              │ API + UI     │ Test    │ 15 min  │
└─────────────────────────┴──────────────┴─────────┴─────────┘

Parallel Groups:
- Group 1 (parallel): API, Auth, DB
- Group 2 (after G1): Frontend (needs API contract)
- Group 3 (after G2): E2E Tests (needs both)
```

### Independence Check

Before parallelizing, verify:
- [ ] Tasks don't modify same files
- [ ] No runtime dependencies between tasks
- [ ] Each task has clear boundaries
- [ ] Merge conflicts are unlikely

## Phase 2: Worktree Setup

### Create Isolated Environments

```bash
# Main branch: feature/user-management
git checkout -b feature/user-management

# Create worktrees for parallel work
git worktree add ../project-api feature/user-management-api
git worktree add ../project-auth feature/user-management-auth
git worktree add ../project-ui feature/user-management-ui
git worktree add ../project-tests feature/user-management-tests
```

### Directory Structure

```
parent-directory/
├── project/                    # Main orchestrator
│   └── (main codebase)
├── project-api/                # Worktree 1: API agent
│   └── (same codebase, different branch)
├── project-auth/               # Worktree 2: Auth agent
│   └── (same codebase, different branch)
├── project-ui/                 # Worktree 3: Frontend agent
│   └── (same codebase, different branch)
└── project-tests/              # Worktree 4: Test agent
    └── (same codebase, different branch)
```

## Phase 3: Agent Spawning

### Spawn Protocol

For each worktree, spawn a Claude Code instance:

```bash
# Terminal 1 - API Agent
cd ../project-api
claude --resume "Build user CRUD API endpoints.
  Create: GET/POST/PUT/DELETE /api/users
  Include: Zod validation, error handling, auth middleware
  Output: Commit when complete with summary"

# Terminal 2 - Auth Agent
cd ../project-auth
claude --resume "Build JWT authentication system.
  Create: login, logout, refresh, middleware
  Include: Secure cookie handling, CSRF protection
  Output: Commit when complete with summary"

# Terminal 3 - Frontend Agent
cd ../project-ui
claude --resume "Build user management UI components.
  Create: UserList, UserForm, UserProfile components
  Include: Form validation, loading states, error handling
  Output: Commit when complete with summary"
```

### Agent Instructions Template

Each spawned agent receives:

```markdown
## Task Assignment

**Branch**: feature/[task-name]
**Worktree**: ../project-[task]
**Scope**: [specific files/directories]

### Objective
[Clear description of what to build]

### Constraints
- Only modify files in: [list]
- Do NOT touch: [shared files]
- Follow patterns in: [reference files]

### Definition of Done
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Code committed with descriptive message
- [ ] Summary written to /tmp/agent-[task]-summary.md

### Handoff
When complete, create summary:
- Files created/modified
- Key decisions made
- Any issues encountered
- Dependencies on other tasks
```

## Phase 4: Progress Monitoring

### Status Dashboard

```markdown
## Parallel Build Status

| Agent    | Branch                  | Status      | Progress |
|----------|-------------------------|-------------|----------|
| API      | feature/user-mgmt-api   | ✅ Complete | 100%     |
| Auth     | feature/user-mgmt-auth  | 🔄 Running  | 75%      |
| Frontend | feature/user-mgmt-ui    | 🔄 Running  | 60%      |
| Tests    | feature/user-mgmt-tests | ⏳ Waiting  | 0%       |

### Logs
- [timestamp] API: Created /api/users/route.ts
- [timestamp] Auth: Implementing refresh token logic
- [timestamp] Frontend: Building UserForm component
```

### Health Checks

Periodically verify:
```bash
# Check each worktree status
for wt in project-api project-auth project-ui; do
  echo "=== $wt ==="
  cd ../$wt && git status --short
done
```

## Phase 5: Integration

### Merge Strategy

```bash
# Return to main branch
cd ../project
git checkout feature/user-management

# Merge completed work (order matters for conflicts)
git merge feature/user-management-api --no-edit
git merge feature/user-management-auth --no-edit
git merge feature/user-management-ui --no-edit
git merge feature/user-management-tests --no-edit

# Run full test suite
npm test

# If all pass, cleanup worktrees
git worktree remove ../project-api
git worktree remove ../project-auth
git worktree remove ../project-ui
git worktree remove ../project-tests
```

### Conflict Resolution

If merge conflicts occur:
1. Identify conflicting files
2. Determine which agent's changes take priority
3. Manually resolve or spawn conflict-resolution agent
4. Re-run tests after resolution

## Phase 6: Verification

### Integration Testing

After merge:
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Manual smoke test

### Final Review

Spawn code-reviewer agent on merged result:
```bash
claude "Review the merged feature/user-management branch.
  Check for:
  - Integration issues between components
  - Inconsistent patterns
  - Missing error handling
  - Security vulnerabilities"
```

## Usage Examples

### Example 1: Build Feature in Parallel

```
User: "Build user dashboard with profile, settings, and activity feed"

Orchestrator:
1. Decompose: Profile (API+UI), Settings (API+UI), Activity (API+UI)
2. Create 3 worktrees
3. Spawn 3 agents simultaneously
4. Monitor progress
5. Merge when all complete
6. Run verification
```

### Example 2: Parallel Bug Fixes

```
User: "Fix these 5 bugs: #123, #124, #125, #126, #127"

Orchestrator:
1. Analyze bugs for independence
2. Create worktrees for independent bugs
3. Spawn agents for each
4. Merge fixes sequentially
5. Verify no regressions
```

### Example 3: Monorepo Multi-Package Update

```
User: "Update authentication across all 4 apps"

Orchestrator:
1. Identify packages: web-app, mobile-app, admin-app, api
2. Create worktree per package
3. Spawn agent per package with shared contract
4. Merge and verify cross-package compatibility
```

## Command Integration

Invoke this orchestrator with:
- `/parallel-spawn <task-description>` - Start parallel build
- `/parallel-status` - Check agent status
- `/parallel-merge` - Merge completed work
- `/parallel-abort` - Cancel and cleanup worktrees

## Safety Guardrails

1. **File Conflict Prevention**: Pre-analyze tasks to prevent same-file edits
2. **Resource Limits**: Max 5 parallel agents (configurable)
3. **Timeout Protection**: Kill agents that exceed time limit
4. **Rollback Ready**: Keep main branch clean until verified merge
5. **Manual Override**: User can pause/resume/abort at any point
