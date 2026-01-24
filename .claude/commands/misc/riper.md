---
description: RIPER Workflow - Structured 5-phase development methodology
model: claude-opus-4-5
---

# RIPER Workflow

A structured development methodology with 5 phases: **R**esearch → **I**nnovate → **P**lan → **E**xecute → **R**eview.

## Command: $ARGUMENTS

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      RIPER WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  │ RESEARCH │ → │ INNOVATE │ → │   PLAN   │ → │ EXECUTE  │ → │  REVIEW  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
│       │              │              │              │              │
│   Understand     Explore        Detail        Build with      Quality
│   the problem    solutions      the work      verification    gates
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: RESEARCH (R)

**Goal**: Deeply understand the problem before attempting solutions.

### Activities
1. **Requirements Gathering**
   - What exactly needs to be built?
   - Who are the stakeholders?
   - What are the constraints?
   - What's the success criteria?

2. **Codebase Analysis**
   - Which files are relevant?
   - What patterns exist?
   - What dependencies are involved?
   - Are there similar implementations to reference?

3. **Context Loading**
   - Load relevant files with `/context load`
   - Check `/memory` for past decisions
   - Review `/rules` for project constraints

### Research Output
```yaml
research_summary:
  problem_statement: |
    Clear description of what we're solving

  stakeholders:
    - Product team (feature requirements)
    - Users (usability)
    - DevOps (deployment)

  constraints:
    - Must work with existing auth system
    - Performance budget: < 100ms response time
    - No breaking changes to API

  relevant_files:
    - src/components/Button.tsx (reference implementation)
    - src/lib/api.ts (API patterns)
    - tests/components/ (test patterns)

  open_questions:
    - Should we support mobile-first?
    - What's the error handling strategy?
```

### Phase Gate
✅ Move to INNOVATE when:
- Problem is clearly understood
- Constraints are documented
- Relevant code has been reviewed
- Open questions are answered or noted

---

## Phase 2: INNOVATE (I)

**Goal**: Explore multiple solutions before committing to one.

### Activities
1. **Brainstorming**
   - Generate 3+ different approaches
   - Don't judge ideas yet
   - Consider unconventional solutions

2. **Trade-off Analysis**
   - Compare approaches on key dimensions
   - Consider short-term vs long-term
   - Evaluate against constraints

3. **Prototyping** (optional)
   - Quick spike on risky approaches
   - Validate assumptions
   - Discard code after learning

### Innovation Output
```yaml
innovation_summary:
  approaches:
    - name: "Approach A: Component Library"
      pros: [reusable, consistent, tested]
      cons: [upfront investment, learning curve]
      effort: high
      risk: low

    - name: "Approach B: Inline Implementation"
      pros: [fast, simple, flexible]
      cons: [duplication, inconsistent]
      effort: low
      risk: medium

    - name: "Approach C: Third-party Library"
      pros: [battle-tested, feature-rich]
      cons: [dependency, bundle size]
      effort: medium
      risk: low

  recommendation: "Approach A"
  rationale: |
    Component library aligns with long-term goals
    and existing patterns in the codebase.

  spikes_completed:
    - Verified component library supports our use case
    - Measured bundle impact: +5kb acceptable
```

### Phase Gate
✅ Move to PLAN when:
- Multiple approaches explored
- Trade-offs documented
- Decision made with rationale
- Key risks identified

---

## Phase 3: PLAN (P)

**Goal**: Create a detailed, actionable implementation plan.

### Activities
1. **Task Breakdown**
   - Break into 2-5 minute micro-tasks
   - Each task has clear completion criteria
   - Include file paths and line numbers

2. **Dependency Mapping**
   - What must be done first?
   - What can be parallelized?
   - What are the blockers?

3. **Verification Strategy**
   - How will each task be verified?
   - What tests are needed?
   - What manual checks?

### Plan Output
```yaml
implementation_plan:
  overview: |
    Implement reusable Button component with loading state

  tasks:
    - id: TASK-001
      title: Create Button component skeleton
      file: src/components/Button.tsx
      duration: 5min
      verification: Component renders without errors

    - id: TASK-002
      title: Add loading state prop
      file: src/components/Button.tsx
      duration: 5min
      depends_on: [TASK-001]
      verification: Loading spinner appears when loading=true

    - id: TASK-003
      title: Write unit tests
      file: src/components/Button.test.tsx
      duration: 10min
      depends_on: [TASK-002]
      verification: All tests pass, coverage > 80%

  test_strategy:
    unit_tests: [loading state, disabled state, click handler]
    integration_tests: [form submission, API calls]
    manual_tests: [visual review, accessibility audit]

  rollback_plan: |
    If issues arise, revert to previous Button implementation
    in commit abc123.
```

### Phase Gate
✅ Move to EXECUTE when:
- All tasks are < 10 minutes
- Verification criteria are clear
- Dependencies are mapped
- Rollback plan exists

---

## Phase 4: EXECUTE (E)

**Goal**: Implement with discipline and continuous verification.

### Activities
1. **TDD Cycle**
   - Write failing test first (RED)
   - Implement minimum code (GREEN)
   - Refactor for quality (REFACTOR)

2. **Task-by-Task Progress**
   - Complete one task at a time
   - Verify before moving on
   - Update `/ledger` after each task

3. **Continuous Integration**
   - Run tests frequently
   - Keep commits small and focused
   - Document decisions as you go

### Execution Protocol
```
For each task:
  1. Announce: "Starting TASK-XXX: [title]"
  2. Write test (if applicable)
  3. Implement
  4. Verify against criteria
  5. Commit with descriptive message
  6. Update ledger: /ledger update TASK-XXX status: completed
  7. Move to next task
```

### Execution Output
```yaml
execution_log:
  tasks_completed: 3
  tasks_remaining: 0

  commits:
    - hash: abc1234
      message: "feat(Button): add loading state with spinner"
      files: [src/components/Button.tsx]

    - hash: def5678
      message: "test(Button): add unit tests for loading state"
      files: [src/components/Button.test.tsx]

  issues_encountered:
    - issue: TypeScript error with spinner import
      resolution: Installed missing @types/spinner package

  verification_results:
    unit_tests: 12/12 passing
    type_check: no errors
    lint: no warnings
```

### Phase Gate
✅ Move to REVIEW when:
- All tasks completed
- All verifications passing
- Code is committed
- No known issues

---

## Phase 5: REVIEW (R)

**Goal**: Ensure quality before considering work complete.

### Activities
1. **Self-Review**
   - Does code match the plan?
   - Are there any shortcuts taken?
   - Is the code readable?

2. **Quality Gates**
   - All tests passing?
   - Type checking clean?
   - Linting clean?
   - Documentation updated?

3. **Final Verification**
   - Manual testing
   - Edge case review
   - Performance check

### Review Checklist
```yaml
review_checklist:
  code_quality:
    - [ ] No TODO comments left
    - [ ] No console.log statements
    - [ ] No commented-out code
    - [ ] Consistent with codebase patterns

  testing:
    - [ ] Unit tests passing
    - [ ] Integration tests passing
    - [ ] Manual testing completed
    - [ ] Edge cases covered

  documentation:
    - [ ] Code comments where needed
    - [ ] README updated if needed
    - [ ] API docs updated if needed

  security:
    - [ ] No secrets in code
    - [ ] Input validation in place
    - [ ] Auth checks where needed

  performance:
    - [ ] No obvious N+1 queries
    - [ ] No unnecessary re-renders
    - [ ] Bundle size acceptable
```

### Review Output
```yaml
review_summary:
  status: approved | needs_work | blocked

  quality_score: A  # A-F scale

  items_addressed:
    - Added missing type annotations
    - Fixed accessibility issue in button

  items_deferred:
    - Performance optimization (not critical)

  ready_for:
    - [ ] Merge to main
    - [ ] PR creation
    - [ ] Deployment
```

---

## Usage

### Full Workflow
```
/riper "Add user authentication feature"
```
Guides through all 5 phases sequentially.

### Start at Specific Phase
```
/riper phase: plan "Add user authentication"
```
Skip to specific phase (when earlier phases done).

### Phase-Specific Commands
```
/research "authentication requirements"
/innovate "auth approaches"
/plan "auth implementation"
/execute "auth feature"
/review "auth changes"
```

## Integration with Other Commands

| Phase | Integrates With |
|-------|-----------------|
| Research | `/context load`, `/map`, `/ask` |
| Innovate | `/brainstorm`, `/architect` |
| Plan | `/write-plan`, `/tdd` |
| Execute | `/execute-plan`, `/ledger` |
| Review | `/code-cleanup`, `/lint` |

## Best Practices

### Don't Skip Phases
Each phase builds on the previous. Skipping leads to:
- Research skipped → solving wrong problem
- Innovate skipped → suboptimal solution
- Plan skipped → chaotic implementation
- Execute skipped → incomplete work
- Review skipped → quality issues

### Time Boxing
| Phase | Typical Time |
|-------|--------------|
| Research | 10-20% |
| Innovate | 10-15% |
| Plan | 10-15% |
| Execute | 40-50% |
| Review | 10-15% |

### When to Revisit
- New information → back to Research
- Better idea emerges → back to Innovate
- Plan doesn't work → back to Plan
- Verification fails → stay in Execute
