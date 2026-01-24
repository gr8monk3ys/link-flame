---
description: Spawn parallel Claude agents using git worktrees for 10x development
argument-hint: <task-description> or "status" or "merge" or "cleanup"
---

# Parallel Agent Spawner

Execute parallel development with **$ARGUMENTS**.

## Commands

| Command | Description |
|---------|-------------|
| `/parallel-spawn <task>` | Analyze task and spawn parallel agents |
| `/parallel-spawn status` | Check status of running agents |
| `/parallel-spawn merge` | Merge all completed worktree branches |
| `/parallel-spawn cleanup` | Remove worktrees and cleanup |

## Workflow

### Step 1: Task Analysis

When given a task like "Build user authentication system":

1. **Decompose** into independent subtasks
2. **Identify** parallelizable vs sequential work
3. **Estimate** effort and dependencies
4. **Confirm** plan with user before spawning

```markdown
## Parallel Build Plan

**Task**: Build user authentication system

### Subtasks Identified
| # | Task | Agent Type | Can Parallelize | Est. Time |
|---|------|------------|-----------------|-----------|
| 1 | Auth API endpoints | api-architect | ✅ Yes | 15 min |
| 2 | JWT middleware | backend-architect | ✅ Yes | 10 min |
| 3 | Login/Signup UI | frontend-architect | ✅ Yes | 20 min |
| 4 | Auth tests | test-strategist | ⏳ After 1-3 | 15 min |

### Execution Plan
- **Phase 1** (parallel): Tasks 1, 2, 3
- **Phase 2** (sequential): Task 4 (needs Phase 1 complete)

Proceed with parallel spawn? (y/n)
```

### Step 2: Worktree Creation

For each parallelizable task:

```bash
# Create base branch
BRANCH_BASE="feature/$(echo "$TASK" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
git checkout -b "$BRANCH_BASE"

# Create worktrees
git worktree add "../$(basename $PWD)-api" "$BRANCH_BASE-api"
git worktree add "../$(basename $PWD)-frontend" "$BRANCH_BASE-frontend"
git worktree add "../$(basename $PWD)-middleware" "$BRANCH_BASE-middleware"
```

### Step 3: Agent Spawning

For each worktree, provide spawning instructions:

```markdown
## Agent Spawn Instructions

### Agent 1: API Development
**Directory**: `cd ../project-api`
**Command**:
\`\`\`bash
claude -p "You are working on: Auth API endpoints.

SCOPE: Only modify files in app/api/auth/
CREATE:
- app/api/auth/login/route.ts
- app/api/auth/signup/route.ts
- app/api/auth/logout/route.ts
- app/api/auth/refresh/route.ts

REQUIREMENTS:
- Zod validation for all inputs
- Proper error responses
- Rate limiting consideration

When complete:
1. Run tests: npm test
2. Commit: git commit -am 'feat(auth): Add auth API endpoints'
3. Write summary to /tmp/agent-api-done.txt"
\`\`\`

### Agent 2: Frontend Development
**Directory**: `cd ../project-frontend`
**Command**:
\`\`\`bash
claude -p "You are working on: Auth UI components..."
\`\`\`
```

### Step 4: Monitor Progress

Check agent status by looking for completion markers:

```bash
# Check completion files
for agent in api frontend middleware; do
  if [[ -f "/tmp/agent-$agent-done.txt" ]]; then
    echo "✅ $agent: Complete"
    cat "/tmp/agent-$agent-done.txt"
  else
    echo "🔄 $agent: Running"
  fi
done

# Check worktree git status
for wt in ../project-*; do
  echo "=== $(basename $wt) ==="
  cd "$wt" && git log --oneline -3
done
```

### Step 5: Merge Results

When all agents complete:

```bash
# Return to main project
cd ../project

# Merge each worktree branch
git merge feature/auth-api --no-edit
git merge feature/auth-frontend --no-edit
git merge feature/auth-middleware --no-edit

# Run full test suite
npm test

# If successful, cleanup
git worktree remove ../project-api
git worktree remove ../project-frontend
git worktree remove ../project-middleware

# Delete feature branches
git branch -d feature/auth-api
git branch -d feature/auth-frontend
git branch -d feature/auth-middleware
```

## Best Practices

### Task Decomposition Rules

✅ **Good for parallel:**
- Different API endpoints
- Independent UI components
- Separate database tables
- Different test suites

❌ **Not good for parallel:**
- Changes to same file
- Dependent data flows
- Shared state modifications
- Sequential logic

### Resource Management

```yaml
parallel_config:
  max_agents: 5          # Don't overwhelm system
  timeout_minutes: 30    # Kill stuck agents
  auto_cleanup: true     # Remove worktrees after merge
  conflict_strategy: manual  # How to handle merge conflicts
```

### Communication Protocol

Agents communicate via files:
- `/tmp/agent-{name}-status.txt` - Current status
- `/tmp/agent-{name}-done.txt` - Completion marker
- `/tmp/agent-{name}-error.txt` - Error information
- `/tmp/agent-{name}-handoff.md` - Handoff document

## Example Sessions

### Example 1: Feature Development

```
User: /parallel-spawn Build complete e-commerce checkout flow

Claude: Analyzing task for parallel execution...

## Parallel Build Plan

| Task | Agent | Parallelizable |
|------|-------|----------------|
| Cart API | api | ✅ |
| Payment integration | backend | ✅ |
| Checkout UI | frontend | ✅ |
| Order confirmation | frontend | ✅ |
| E2E tests | test | ⏳ After others |

Creating 4 worktrees...
Providing spawn instructions...

[Instructions for each terminal]
```

### Example 2: Bug Bash

```
User: /parallel-spawn Fix bugs #101, #102, #103, #104

Claude: Analyzing bugs for independence...

Bugs #101, #102, #104 are independent (different files)
Bug #103 depends on #101 fix

Plan:
- Phase 1: Parallel fix #101, #102, #104
- Phase 2: Sequential fix #103

[Spawn instructions]
```

### Example 3: Monorepo Update

```
User: /parallel-spawn Update React to v19 across all packages

Claude: Scanning monorepo structure...

Found packages:
- packages/web (React 18.2)
- packages/mobile (React 18.2)
- packages/shared (React 18.2)

Creating worktree per package...
[Spawn instructions with shared upgrade patterns]
```

## Troubleshooting

### Merge Conflicts
```bash
# If conflicts occur during merge:
git merge --abort  # Cancel merge
# Then manually review conflicting changes
git diff feature/auth-api feature/auth-frontend
# Resolve and retry
```

### Stuck Agent
```bash
# Find and kill stuck process
ps aux | grep claude
kill -9 <pid>

# Cleanup partial work
cd ../project-stuck
git stash
cd ../project
git worktree remove ../project-stuck --force
```

### Worktree Issues
```bash
# List all worktrees
git worktree list

# Force remove broken worktree
git worktree remove <path> --force

# Prune stale worktrees
git worktree prune
```
