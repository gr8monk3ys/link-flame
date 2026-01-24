---
name: systematic-debugging
description: |
  WHEN to auto-invoke: Debugging issues where root-cause-analysis already identified the problem, implementing fixes for diagnosed bugs, applying systematic debugging methodology, stuck on a bug after initial investigation.
  WHEN NOT to invoke: Initial problem investigation (use root-cause-analysis first), new feature development, refactoring working code.
---

# Systematic Debugging Skill

A rigorous 4-phase methodology for eliminating bugs after root cause is identified.

## Core Principle

**Evidence before claims, always.** Never trust memory, assumptions, or "it should work."

## The Iron Law of Debugging

Before claiming any fix works, you MUST:

1. **IDENTIFY**: What command proves this claim?
2. **RUN**: Execute the FULL command fresh
3. **READ**: Read FULL output, check exit code
4. **VERIFY**: Does output actually confirm the claim?
5. **ONLY THEN**: Make the claim

## 4-Phase Protocol

### Phase 1: Problem Stabilization

Before fixing, ensure you can reliably reproduce:

```markdown
## Reproduction Recipe

**Steps to reproduce:**
1. [exact step 1]
2. [exact step 2]
3. [observe symptom]

**Reproduction rate:** X/10 attempts
**Environment:** [dev/staging/prod]

**Verification command:**
```bash
[command that demonstrates the bug]
```
```

### Phase 2: Hypothesis Validation

Test your root cause hypothesis with controlled experiments:

```markdown
## Controlled Experiment

**Hypothesis:** [statement of believed cause]

**Experiment:**
- Control: [baseline without change]
- Treatment: [with proposed fix]

**Prediction if hypothesis correct:**
- Control shows: [expected behavior]
- Treatment shows: [expected behavior]

**Actual results:**
- Control: [observed]
- Treatment: [observed]

**Conclusion:** Hypothesis [confirmed/rejected]
```

### Phase 3: Surgical Fix

Apply the **minimal change** that addresses root cause:

```markdown
## Fix Applied

**Root cause:** [one sentence]

**Fix approach:** [one sentence]

**Changes made:**
- File: `path/to/file.ts`
- Lines: X-Y
- Change: [description]

**Diff size:** X lines changed
```

### Phase 4: Verification Loop

Verify the fix with multiple methods:

```markdown
## Verification Checklist

### Automated Verification
- [ ] Unit tests pass: `npm test`
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] E2E tests pass: `npx playwright test`

### Manual Verification
- [ ] Original bug no longer reproduces
- [ ] Related functionality still works
- [ ] Edge cases handled

### Regression Check
- [ ] No new errors in console
- [ ] No new test failures
- [ ] Performance not degraded
```

## Rationalization Counters

When tempted to skip verification, remember:

| Excuse | Reality |
|--------|---------|
| "The fix is obvious" | Obvious fixes often have subtle bugs |
| "I already tested mentally" | Mental simulation misses runtime issues |
| "It's a one-line change" | One-line changes can have huge impact |
| "Tests are slow" | Slow tests beat production bugs |
| "It worked on my machine" | Environment differences are real |
| "I'm confident" | Confidence without evidence is dangerous |

## Red Flags (Stop Before Proceeding)

If you notice yourself:

- Using hedging language ("should," "probably," "seems to")
- Expressing satisfaction before running verification
- About to commit/push/PR without full verification
- Trusting success reports without checking output
- Rationalizing "just this once"

**STOP.** Run verification again.

## Debug Techniques by Category

### For Timing/Race Conditions
```typescript
// Add logging with timestamps
console.log(`[${Date.now()}] Event: ${eventName}`);

// Add artificial delays to expose races
await new Promise(r => setTimeout(r, 100));

// Use locks/mutexes for critical sections
const release = await mutex.acquire();
try {
  // critical section
} finally {
  release();
}
```

### For State Bugs
```typescript
// Snapshot state at key points
console.log('State before:', JSON.stringify(state, null, 2));
// ... operation ...
console.log('State after:', JSON.stringify(state, null, 2));

// Use immutable patterns
const newState = { ...oldState, updated: true };
```

### For Integration Bugs
```bash
# Test component in isolation
npm test -- --testPathPattern="component.test"

# Test with mocked dependencies
npm test -- --testPathPattern="component.integration"

# Test full integration
npm run test:e2e
```

## Output Template

```markdown
## Bug Fix: [Title]

### Problem
[One-sentence description]

### Root Cause
[One-sentence root cause]

### Fix
```diff
- old code
+ new code
```

### Verification Evidence
**Commands run:**
```bash
npm test
# Output: 45/45 tests passing

npx tsc --noEmit
# Output: No errors

npm run build
# Output: Build successful
```

**Manual verification:**
- Tested [scenario] - [result]
- Tested [edge case] - [result]

### Confidence Level
[High/Medium/Low] - [reasoning]
```

## Integration

Works with:
- `root-cause-analysis` skill - For initial investigation
- `verification-first` skill - For completion verification
- `/tdd` command - Write test for bug first
- `/verify` command - Full verification suite
