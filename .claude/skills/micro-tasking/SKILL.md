---
name: micro-tasking
description: Use this skill to break work into small, verifiable chunks. Activates when planning implementation, breaking down features, or when tasks seem too large.
---

# Micro-Tasking Skill

Break work into 2-5 minute tasks with clear completion criteria.

## Core Principle

**Large tasks fail. Small tasks succeed.**

A task that takes more than 10 minutes is not a task—it's a project that needs decomposition.

## Micro-Task Anatomy

Every micro-task has:

```yaml
task:
  id: TASK-001
  title: Short, action-oriented description
  duration: 2-5 minutes
  file: exact/path/to/file.ts
  line_hint: ~50-75  # approximate location

  action: |
    Specific action to take

  verification: |
    How to know it's done

  depends_on: []  # or [TASK-000]
```

## Task Sizing Guide

### Too Big (Break Down)
- ❌ "Implement authentication"
- ❌ "Add form validation"
- ❌ "Create user dashboard"
- ❌ "Fix the bug"

### Just Right (2-5 min)
- ✅ "Add email input field to login form"
- ✅ "Add required validator to email input"
- ✅ "Create UserAvatar component skeleton"
- ✅ "Add console.log to trace the bug"

### Too Small (Combine)
- ⚠️ "Import React" (part of larger task)
- ⚠️ "Add semicolon" (trivial)

## Decomposition Patterns

### Feature → Tasks

```yaml
feature: "Add user login"
tasks:
  - Create LoginForm component skeleton (3 min)
  - Add email input with label (3 min)
  - Add password input with label (3 min)
  - Add submit button (2 min)
  - Add form onSubmit handler (3 min)
  - Add loading state to button (3 min)
  - Add error message display (3 min)
  - Connect to auth API (5 min)
  - Add success redirect (3 min)
  - Write unit test for form render (5 min)
  - Write unit test for submission (5 min)
```

### Bug Fix → Tasks

```yaml
bug: "Login fails silently"
tasks:
  - Add console.log to trace request (2 min)
  - Verify API endpoint is correct (2 min)
  - Check response handling (3 min)
  - Add error state to component (3 min)
  - Display error message to user (3 min)
  - Add test for error case (5 min)
```

### Refactor → Tasks

```yaml
refactor: "Extract shared button styles"
tasks:
  - Identify all button variants (3 min)
  - Create Button component file (2 min)
  - Add base button styles (3 min)
  - Add variant prop (primary/secondary) (3 min)
  - Replace first usage (3 min)
  - Replace second usage (3 min)
  - Verify styles match original (2 min)
  - Run visual regression test (3 min)
```

## Task Templates

### Add Component
```yaml
- id: TASK-XXX
  title: Create [Component] skeleton
  duration: 3 min
  file: src/components/[Component].tsx
  action: Create component with props interface, return null
  verification: Component imports without error
```

### Add Test
```yaml
- id: TASK-XXX
  title: Add test for [behavior]
  duration: 5 min
  file: src/components/[Component].test.tsx
  action: Write describe block with it() for [behavior]
  verification: Test runs (can be failing)
```

### Fix Bug
```yaml
- id: TASK-XXX
  title: Add error handling for [case]
  duration: 3 min
  file: src/lib/[file].ts
  line_hint: ~45
  action: Add try/catch around [operation]
  verification: Error case shows message instead of crashing
```

## Execution Protocol

```
For each task:
1. Announce: "Starting TASK-XXX: [title]"
2. Set timer: 5 minutes max
3. Do the ONE thing
4. Verify completion criteria
5. Commit if appropriate
6. Announce: "Completed TASK-XXX"
7. If over time: Task was too big, note for future
```

## Benefits

| Aspect | Large Tasks | Micro-Tasks |
|--------|-------------|-------------|
| Progress visibility | Unclear | Clear |
| Context switching | Loses state | Easy resume |
| Estimation accuracy | Way off | Reasonable |
| Verification | Hard | Easy |
| Morale | Frustrating | Satisfying |

## Warning Signs

### Task is Too Big If:
- Can't describe in one sentence
- Has "and" in the title
- Duration estimate is "about an hour"
- Can't name the exact file to change
- Completion criteria is vague

### Then:
1. Stop
2. Break it down further
3. Create sub-tasks
4. Continue with first sub-task

## Integration

Works with:
- `/ledger` - Track micro-task completion
- `/execute-plan` - Execute task by task
- `/riper` - Plan phase creates micro-tasks
