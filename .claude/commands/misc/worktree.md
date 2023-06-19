---
description: Manage git worktrees for isolated parallel development
---

# Git Worktree Management

Create and manage isolated git worktrees for parallel feature development.

## Arguments
$ARGUMENTS

## What are Git Worktrees?

Git worktrees allow you to have multiple working directories attached to the same repository. Each worktree can have a different branch checked out, enabling true parallel development.

## Commands

### Create New Worktree

```bash
# Create worktree for a new feature branch
git worktree add ../project-feature-name -b feature/name

# Create worktree from existing branch
git worktree add ../project-bugfix bugfix/issue-123

# Create worktree at specific commit
git worktree add ../project-release v1.0.0
```

### List Worktrees

```bash
git worktree list
```

### Remove Worktree

```bash
# Remove worktree (keeps branch)
git worktree remove ../project-feature-name

# Force remove (discards changes)
git worktree remove --force ../project-feature-name

# Prune stale worktree info
git worktree prune
```

## Workflow Pattern

### 1. Verified Test Baseline
Before starting feature work, ensure tests pass on main:

```bash
# In main worktree
npm test
git worktree add ../project-feature -b feature/new-feature
cd ../project-feature
```

### 2. Parallel Development
Work on multiple features simultaneously:

```
project/                 # main branch - stable
project-feature-a/       # feature/a - in progress
project-feature-b/       # feature/b - in progress
project-hotfix/          # hotfix/urgent - priority fix
```

### 3. Quick Context Switching
Switch between features without stashing:

```bash
# No need to stash or commit WIP
cd ../project-feature-b
# Continue where you left off
```

### 4. Clean Merge
After feature complete:

```bash
cd ../project  # main worktree
git merge feature/new-feature
git worktree remove ../project-feature
git branch -d feature/new-feature
```

## Best Practices

1. **Naming Convention**: `project-{type}-{name}`
   - `project-feature-auth`
   - `project-bugfix-123`
   - `project-hotfix-security`

2. **Location**: Keep worktrees as siblings to main repo
   ```
   ~/code/
     myproject/           # main
     myproject-feature/   # worktree
   ```

3. **Shared Dependencies**: Run `npm install` in each worktree
   - node_modules are NOT shared
   - Each worktree is independent

4. **IDE Support**: Open each worktree as separate project/window

## Claude Code Integration

When using Claude Code with worktrees:

```bash
# Start Claude in specific worktree
cd ../project-feature
claude

# Claude maintains separate context per worktree
# Each worktree can have its own .claude/ settings
```

## Parallel Agent Spawning

Use worktrees to run multiple Claude agents in parallel:

```bash
# Terminal 1 - Main feature
cd project-feature-a && claude -p "Implement user auth"

# Terminal 2 - Secondary feature
cd project-feature-b && claude -p "Add payment integration"

# Terminal 3 - Tests
cd project-tests && claude -p "Write integration tests"
```

## Cleanup

After merging, clean up worktrees:

```bash
# List all worktrees
git worktree list

# Remove merged feature worktrees
git worktree remove ../project-feature-a
git worktree remove ../project-feature-b

# Prune any stale entries
git worktree prune

# Delete merged branches
git branch -d feature/a feature/b
```

## Troubleshooting

### "fatal: 'branch' is already checked out"
A branch can only be checked out in one worktree at a time.

### Worktree shows as "prunable"
The worktree directory was deleted manually. Run `git worktree prune`.

### Shared hooks not working
Copy `.git/hooks/` to each worktree or use core.hooksPath config.
