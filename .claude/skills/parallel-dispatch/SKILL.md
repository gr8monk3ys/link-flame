---
name: parallel-dispatch
description: Use this skill to coordinate concurrent agent work. Activates when tasks can be parallelized, during multi-agent workflows, or when orchestrating independent work streams.
---

# Parallel Dispatch Skill

Coordinate multiple agents or work streams running concurrently.

## Core Principle

**Independent work should run in parallel.**

If tasks don't depend on each other, running them sequentially wastes time.

## Identifying Parallelizable Work

### Can Run in Parallel
- ✅ Independent file changes
- ✅ Separate test suites
- ✅ Unrelated code reviews
- ✅ Different components
- ✅ Parallel API calls

### Must Run Sequentially
- ❌ Code that depends on previous output
- ❌ Database migrations (order matters)
- ❌ Build before test
- ❌ Test before deploy

## Dependency Graph

```
       ┌─────────┐
       │  START  │
       └────┬────┘
            │
    ┌───────┴───────┐
    ▼               ▼
┌───────┐       ┌───────┐
│ Task A │       │ Task B │    ← Can run in parallel
└───┬───┘       └───┬───┘
    │               │
    └───────┬───────┘
            ▼
       ┌─────────┐
       │ Task C  │              ← Must wait for A and B
       └────┬────┘
            │
            ▼
       ┌─────────┐
       │   END   │
       └─────────┘
```

## Dispatch Protocol

### Step 1: Analyze Dependencies
```yaml
tasks:
  - id: A
    depends_on: []       # Can start immediately
  - id: B
    depends_on: []       # Can start immediately
  - id: C
    depends_on: [A, B]   # Must wait
  - id: D
    depends_on: [C]      # Must wait for C
```

### Step 2: Group by Wave
```yaml
wave_1: [A, B]      # Start together
wave_2: [C]         # After wave_1 complete
wave_3: [D]         # After wave_2 complete
```

### Step 3: Dispatch Wave
```markdown
## Dispatching Wave 1

Starting parallel tasks:
- [ ] Task A: [description] → Agent 1
- [ ] Task B: [description] → Agent 2

Waiting for completion...
```

### Step 4: Aggregate Results
```markdown
## Wave 1 Results

Task A: ✅ Complete
- Output: [summary]
- Artifacts: [files changed]

Task B: ✅ Complete
- Output: [summary]
- Artifacts: [files changed]

Proceeding to Wave 2...
```

## Parallel Patterns

### Pattern: Code Review
```yaml
parallel_reviews:
  - agent: security-engineer
    focus: Security vulnerabilities
  - agent: performance-engineer
    focus: Performance issues
  - agent: accessibility-auditor
    focus: Accessibility compliance

aggregation:
  combine: All findings into unified report
  deduplicate: Similar issues
  prioritize: By severity
```

### Pattern: Multi-File Changes
```yaml
parallel_changes:
  - file: src/components/Button.tsx
    change: Add loading state
  - file: src/components/Input.tsx
    change: Add error state
  - file: src/components/Select.tsx
    change: Add disabled state

merge_strategy: All changes are independent
```

### Pattern: Test Suites
```yaml
parallel_tests:
  - suite: unit
    command: npm run test:unit
  - suite: integration
    command: npm run test:integration
  - suite: e2e
    command: npm run test:e2e

wait_for: All suites to complete
fail_fast: true  # Stop all if one fails
```

## Coordination Protocols

### Handoff Between Agents
```yaml
agent_1_output:
  status: complete
  artifacts:
    - src/components/Button.tsx
  notes: Added loading prop, needs testing

agent_2_input:
  receives: agent_1_output.artifacts
  task: Write tests for loading state
```

### Conflict Resolution
```yaml
conflict_detected:
  file: src/lib/utils.ts
  agent_1_change: Added formatDate function
  agent_2_change: Added formatCurrency function

resolution:
  strategy: merge_both  # Both changes are compatible
  # or: agent_1_wins / agent_2_wins / manual_review
```

### Progress Tracking
```markdown
## Parallel Execution Status

| Task | Agent | Status | Progress |
|------|-------|--------|----------|
| A | Agent-1 | 🔄 Running | 60% |
| B | Agent-2 | ✅ Complete | 100% |
| C | Agent-3 | ⏳ Waiting | 0% |
```

## Error Handling

### One Task Fails
```yaml
on_failure:
  strategy: continue_others  # Don't block parallel work
  # or: fail_fast / retry

failed_task:
  id: B
  error: "TypeScript error in component"

action:
  - Complete other parallel tasks
  - Report failure in aggregation
  - Decide: fix and retry, or proceed without
```

### Timeout Handling
```yaml
timeout:
  per_task: 10 minutes
  total_wave: 30 minutes

on_timeout:
  - Cancel stuck task
  - Log partial progress
  - Continue with completed tasks
```

## Output Aggregation

### Merge Strategy
```markdown
## Aggregated Results

### Completed Tasks
- Task A: Added Button component
- Task B: Added Input component

### Combined Changes
Files modified:
- src/components/Button.tsx (Task A)
- src/components/Input.tsx (Task B)

### Unified Test Results
- Unit tests: 45/45 passing
- Integration: 12/12 passing

### Issues Found
1. [Task A] Minor: Consider memo for Button
2. [Task B] Minor: Add aria-label to Input
```

## Integration

Works with:
- `/riper` - Execute phase can parallelize independent tasks
- `/review` - Parallel code review from multiple perspectives
- `code-review-workflow` orchestrator - Multi-agent review
