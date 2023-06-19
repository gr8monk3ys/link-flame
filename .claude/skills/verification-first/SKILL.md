---
name: verification-first
description: |
  WHEN to auto-invoke: Finishing tasks, claiming "done" or "complete", before marking work finished, when asserting code works, wrapping up implementations.
  WHEN NOT to invoke: During active development, exploration phases, planning discussions, research tasks.
priority: 90
---

# Verification-First Skill

Never claim completion without evidence. Verify before asserting.

## Core Principle

**"Trust, but verify"** - Don't assume code works; prove it works.

## The Iron Law: 5-Step Gate Process

Before making ANY claim about code working, you MUST complete all 5 steps:

### Step 1: IDENTIFY
**Question:** What command proves this claim?
- Identify the exact command that will verify your claim
- Must be a concrete, runnable command
- Not "check the file" but `npm test path/to/file.test.ts`

### Step 2: RUN
**Action:** Execute the FULL command fresh
- Run it NOW, not "I ran it earlier"
- Run the complete command, not a partial version
- No skipping "because it probably works"

### Step 3: READ
**Action:** Read FULL output and check exit code
- Read every line of output
- Check the exit code (0 = success)
- Don't skim - actually read it

### Step 4: VERIFY
**Question:** Does output ACTUALLY confirm the claim?
- Does it say what you think it says?
- Are there hidden warnings or deprecations?
- Is "0 tests found" really a pass?

### Step 5: ONLY THEN
**Action:** Make the claim with evidence
- Quote the actual output
- Reference specific line numbers
- Show the evidence, don't just assert

## Red Flags (STOP Before Proceeding)

If you notice yourself doing ANY of these, STOP immediately:

- Using hedging language ("should," "probably," "seems to")
- Expressing satisfaction BEFORE running verification
- About to commit/push/PR without verification
- Trusting success reports without reading output
- Rationalizing "just this once" or "it's a small change"
- Saying "I already tested this mentally"
- Relying on memory of a previous run

## Verification Protocol

### Before Claiming "Done"

1. **Run the Code**
   - Execute the actual code path
   - Don't just read it and assume it works
   - Test with real inputs, not just mental simulation

2. **Check the Output**
   - Verify output matches expectations
   - Look at actual results, not just "no errors"
   - Compare against acceptance criteria

3. **Test Edge Cases**
   - What happens with empty input?
   - What happens with invalid input?
   - What happens at boundaries?

4. **Verify in Context**
   - Does it work in the actual environment?
   - Does it integrate correctly?
   - Are there side effects?

## Verification Checklist

```markdown
Before marking complete:
- [ ] Code compiles/transpiles without errors
- [ ] Tests pass (existing + new)
- [ ] Manual verification performed
- [ ] Edge cases checked
- [ ] Error handling works
- [ ] Integration verified
```

## Anti-Patterns to Avoid

### Don't Say
- ❌ "This should work..."
- ❌ "I believe this is correct..."
- ❌ "This looks right to me..."
- ❌ "Based on my understanding..."

### Instead Say
- ✅ "I've verified this works by..."
- ✅ "Tests confirm this behavior..."
- ✅ "I ran this and observed..."
- ✅ "The output shows..."

## Verification Methods

### For Code Changes
```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Build verification
npm run build
```

### For Bug Fixes
1. Reproduce the bug first
2. Apply the fix
3. Verify bug no longer occurs
4. Verify no regression

### For New Features
1. Write failing test first
2. Implement feature
3. Verify test passes
4. Test manually in UI/API

### For Refactoring
1. Ensure tests exist (add if needed)
2. Make refactoring change
3. Verify all tests still pass
4. Verify behavior unchanged

## Evidence Collection

When claiming completion, provide evidence:

```markdown
## Verification Evidence

**What was verified:**
- Feature X works correctly

**How it was verified:**
- Ran `npm test` - 45/45 tests passing
- Manually tested in browser at /feature-x
- Checked error handling with invalid input

**Results observed:**
- Success case: Shows expected output
- Error case: Displays user-friendly message
- Edge case: Handles empty state gracefully
```

## Confidence Levels

| Level | Meaning | Evidence Required |
|-------|---------|-------------------|
| Certain | Verified with tests + manual | Tests + screenshots/logs |
| High | Verified with tests | Passing test output |
| Medium | Manually verified | Description of manual test |
| Low | Code review only | Should verify more |
| None | Assumption only | Must verify before claiming |

## Integration with Workflow

```
Write code
    ↓
Run verification
    ↓
Evidence collected? ─No→ Verify more
    ↓ Yes
Claim completion with evidence
```

## Remember

- **No verification = No completion claim**
- **"It should work" is not verification**
- **Evidence beats confidence**
- **When in doubt, verify again**
