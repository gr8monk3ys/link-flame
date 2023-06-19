---
name: root-cause-analysis
description: |
  WHEN to auto-invoke: Debugging issues, fixing bugs, investigating errors, "not working" problems, unexpected behavior, stack traces, error messages, troubleshooting, "why is this happening".
  WHEN NOT to invoke: Building new features from scratch, documentation, refactoring working code, adding tests to working code.
---

# Root Cause Analysis Skill

A systematic 4-phase methodology for finding the true cause of problems.

## Core Principle

**Fix the disease, not the symptom.**

A quick patch that doesn't address root cause will:
- Recur in different forms
- Cause related issues
- Accumulate technical debt

## 4-Phase Debugging Protocol

### Phase 1: OBSERVE
**Goal**: Gather facts without assumptions

```markdown
## Observation Log

**Symptom**: [What is actually happening?]

**Expected**: [What should happen?]

**Reproduction Steps**:
1. Step 1
2. Step 2
3. Observe [symptom]

**Frequency**: Always / Sometimes / Rare

**Environment**:
- Browser:
- OS:
- Node version:
- Relevant deps:

**Error Messages** (exact text):
```
[paste exact error]
```

**Relevant Logs**:
```
[paste relevant logs]
```
```

### Phase 2: HYPOTHESIZE
**Goal**: Generate possible causes ranked by likelihood

```markdown
## Hypotheses (ranked by probability)

1. **[Most Likely]** - Description
   - Evidence for: [what supports this]
   - Evidence against: [what contradicts this]
   - Test: [how to verify]

2. **[Second Most Likely]** - Description
   - Evidence for:
   - Evidence against:
   - Test:

3. **[Less Likely]** - Description
   - Evidence for:
   - Evidence against:
   - Test:
```

### Phase 3: TEST
**Goal**: Systematically verify or eliminate hypotheses

```markdown
## Testing Log

### Testing Hypothesis 1
**Test performed**: [what you did]
**Expected if true**: [what would happen]
**Actual result**: [what happened]
**Conclusion**: Confirmed / Eliminated / Inconclusive

### Testing Hypothesis 2
[same structure]
```

### Phase 4: FIX
**Goal**: Address root cause, not symptom

```markdown
## Root Cause
[Clear statement of the actual cause]

## Fix Applied
[What was changed]

## Verification
- [ ] Original issue no longer occurs
- [ ] No regression in related areas
- [ ] Tests added to prevent recurrence

## Prevention
[What could prevent this class of issue]
```

## Debugging Techniques

### Binary Search (Git Bisect)
When: Issue started at unknown point
```bash
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
# Git will checkout commits for testing
git bisect good/bad  # mark each
git bisect reset  # when done
```

### Printf Debugging
When: Need to trace execution flow
```typescript
console.log('[DEBUG] functionName:', {
  input,
  intermediateValue,
  timestamp: Date.now()
});
```

### Rubber Duck Debugging
When: Logic seems correct but isn't
1. Explain the code line by line
2. Out loud or in writing
3. The act of explaining reveals assumptions

### Diff Debugging
When: "It was working before"
```bash
git diff <working-commit> HEAD -- path/to/file.ts
```

### Isolation Debugging
When: Complex system with many variables
1. Create minimal reproduction
2. Remove components until issue disappears
3. Last removed component is likely culprit

## Common Root Causes

### Category: Timing
- Race conditions
- Async not awaited
- State read before update
- Event order assumptions

### Category: State
- Stale closure
- Missing dependency in useEffect
- Mutating instead of copying
- State not reset

### Category: Types
- Null/undefined not handled
- Type coercion (== vs ===)
- Array vs single item
- String vs number

### Category: Environment
- Different configs (dev vs prod)
- Missing env variables
- Version mismatch
- Cache issues

## Anti-Patterns

### Avoid
- ❌ Changing random things hoping it helps
- ❌ Assuming you know the cause without evidence
- ❌ Fixing symptoms without understanding cause
- ❌ Not testing after fix
- ❌ Not documenting what was learned

### Instead
- ✅ Systematic hypothesis testing
- ✅ Evidence-based conclusions
- ✅ Root cause fixes
- ✅ Verification after fix
- ✅ Document for future

## Output Template

```markdown
## Bug Investigation: [Title]

### Symptom
[Observable problem]

### Root Cause
[Actual underlying issue]

### Investigation Path
1. Observed: [initial observations]
2. Hypothesized: [top theories]
3. Tested: [how theories were tested]
4. Confirmed: [winning hypothesis]

### Fix
[Code/config change made]

### Verification
- [x] Issue no longer occurs
- [x] Tests added
- [x] No regression

### Lessons Learned
- [What to remember for future]
```

## Integration

Works with:
- `/tdd` - Write test for bug first
- `/review` - Verify fix quality
- `/memory` - Store lessons learned
