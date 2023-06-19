---
name: git-worktree
description: Use this skill for isolated branch workflows and parallel development. Activates when working on features that need isolation, switching contexts, or managing multiple branches.
---

# Git Worktree Skill

Manage isolated development branches without stashing or losing context.

## Core Principle

**Each feature gets its own workspace.**

Git worktrees let you have multiple branches checked out simultaneously in different directories—no stashing, no context switching pain.

## What is a Worktree?

```
my-project/                  # main branch (main worktree)
my-project-feature-auth/     # feature/auth branch (linked worktree)
my-project-bugfix-123/       # bugfix/123 branch (linked worktree)
```

Each worktree:
- Has its own working directory
- Shares the same .git data (efficient)
- Can have different branches checked out
- Allows true parallel development

## Worktree Commands

### Create a Worktree
```bash
# Create worktree for new branch
git worktree add ../project-feature-name -b feature/name

# Create worktree for existing branch
git worktree add ../project-feature-name feature/name
```

### List Worktrees
```bash
git worktree list
# Output:
# /path/to/project         abc1234 [main]
# /path/to/project-feature def5678 [feature/auth]
```

### Remove a Worktree
```bash
# After merging/done with feature
git worktree remove ../project-feature-name

# Force remove (discards changes)
git worktree remove --force ../project-feature-name
```

### Prune Stale Worktrees
```bash
# Clean up worktrees whose directories were deleted
git worktree prune
```

## Workflow: Feature Development

### 1. Start Feature
```bash
# From main project directory
git worktree add ../myproject-auth -b feature/auth

# Navigate to worktree
cd ../myproject-auth

# Verify clean baseline
npm test
```

### 2. Develop in Isolation
```bash
# Work normally in worktree
# All changes isolated to feature/auth branch
npm run dev
# ... make changes ...
git commit -m "feat: add login form"
```

### 3. Stay Updated with Main
```bash
# In feature worktree
git fetch origin main
git rebase origin/main
# or
git merge origin/main
```

### 4. Complete Feature
```bash
# Ensure tests pass
npm test

# Push for PR
git push -u origin feature/auth

# Return to main
cd ../myproject

# After merge, cleanup
git worktree remove ../myproject-auth
git branch -d feature/auth
```

## Workflow: Hotfix While Feature in Progress

```bash
# Currently in feature worktree, need urgent fix

# Create hotfix worktree from main
cd ../myproject  # go to main worktree
git worktree add ../myproject-hotfix -b hotfix/critical-bug

# Fix the bug
cd ../myproject-hotfix
# ... make fix ...
git commit -m "fix: critical bug"
git push -u origin hotfix/critical-bug

# Create PR, get it merged

# Cleanup and return to feature
git worktree remove ../myproject-hotfix
cd ../myproject-auth
git fetch origin main
git rebase origin/main  # get hotfix
```

## Best Practices

### Naming Convention
```
<project>-<type>-<name>
myapp-feature-auth
myapp-bugfix-123
myapp-hotfix-critical
myapp-experiment-new-approach
```

### Directory Structure
```
~/code/
├── myapp/                    # main (always main/master)
├── myapp-feature-auth/       # feature branch
├── myapp-feature-dashboard/  # another feature
└── myapp-hotfix-123/         # hotfix
```

### Test Baseline Before Starting
```bash
# In new worktree, always verify:
npm install  # if needed
npm test     # establish baseline
# Only proceed if tests pass
```

### Don't Forget Cleanup
```bash
# After merge, always:
git worktree remove ../path-to-worktree
git branch -d branch-name
```

## Common Issues

### "fatal: 'branch' is already checked out"
```bash
# Can't checkout a branch that's in another worktree
# Solution: use different branch or remove other worktree
git worktree list  # find where it's checked out
```

### Shared node_modules?
```bash
# Each worktree needs its own node_modules
cd ../new-worktree
npm install
```

### IDE Confusion
```bash
# Open each worktree as separate project/window
# Don't open parent directory containing multiple worktrees
```

## Integration with Development Flow

### With /riper
```bash
# Research & Innovate in main worktree
# Plan creates worktree for execution
git worktree add ../project-feature -b feature/x
# Execute in isolated worktree
# Review in worktree, merge to main
```

### With /handoff
```yaml
# Include worktree info in handoff
worktrees:
  - path: ../project-feature-auth
    branch: feature/auth
    status: in_progress
    notes: Working on OAuth integration
```

### With /ledger
```yaml
# Track worktree-based tasks
active_worktrees:
  - feature/auth: 75% complete
  - hotfix/123: ready for review
```

## Benefits vs Traditional Workflow

| Aspect | Stash/Switch | Worktrees |
|--------|--------------|-----------|
| Context loss | High | None |
| Speed | Slow | Instant |
| Parallel work | Hard | Easy |
| Mental overhead | High | Low |
| Disk space | Same | Slightly more |
