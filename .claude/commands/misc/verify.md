---
description: Run comprehensive 6-phase verification loop (build, types, lint, tests, security, diff)
model: claude-sonnet-4-5
---

# Verification Loop

Run a comprehensive 6-phase verification process to ensure code quality before claiming completion or creating PRs.

## Target

$ARGUMENTS

## Verification Protocol

Execute each phase sequentially, stopping if critical failures occur.

### Phase 1: Build Verification

```bash
# Check if project builds successfully
npm run build 2>&1 | tail -20
# OR
pnpm build 2>&1 | tail -20
# OR for Python
python -m py_compile **/*.py
```

**Stop criteria**: Build fails = STOP and fix before proceeding

**Report format**:
```
Phase 1 - Build: [PASS/FAIL]
- Build command: npm run build
- Result: [Success/Failed with X errors]
- Critical errors: [List if any]
```

### Phase 2: Type Checking

```bash
# TypeScript
npx tsc --noEmit 2>&1 | head -30

# Python
pyright . 2>&1 | head -30
# OR
mypy . 2>&1 | head -30
```

**Report format**:
```
Phase 2 - Types: [PASS/WARN/FAIL]
- Type errors found: [count]
- Critical errors: [List any that must be fixed]
- Warnings: [List non-blocking issues]
```

### Phase 3: Linting Analysis

```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30
# OR
npx eslint . --max-warnings 0 2>&1 | head -30
# OR
npx biome check . 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

**Report format**:
```
Phase 3 - Lint: [PASS/WARN/FAIL]
- Errors: [count]
- Warnings: [count]
- Auto-fixable: [count]
```

### Phase 4: Test Suite Execution

```bash
# JavaScript/TypeScript
npm test -- --coverage 2>&1
# OR
npx vitest run --coverage 2>&1
# OR
npx jest --coverage 2>&1

# Python
pytest --cov=. --cov-report=term-missing 2>&1
```

**Target**: 80% minimum coverage

**Report format**:
```
Phase 4 - Tests: [PASS/FAIL]
- Total tests: [count]
- Passed: [count]
- Failed: [count]
- Skipped: [count]
- Coverage: [percentage]%
- Coverage target (80%): [MET/NOT MET]
```

### Phase 5: Security Scanning

```bash
# Check for hardcoded secrets
grep -rn "sk-\|api_key\s*=\s*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" src/ app/ 2>/dev/null | head -10

# Check for console.log in production code
grep -rn "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ 2>/dev/null | head -10

# Check for TODO/FIXME comments
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ 2>/dev/null | head -10
```

**Report format**:
```
Phase 5 - Security: [PASS/WARN/FAIL]
- Potential secrets found: [count]
- Console.log statements: [count]
- TODO/FIXME comments: [count]
- Recommendations: [List]
```

### Phase 6: Diff Review

```bash
# Check what files changed
git diff --stat HEAD~1 2>/dev/null || git diff --stat

# List changed files
git diff --name-only HEAD~1 2>/dev/null || git diff --name-only

# Show actual changes for review
git diff HEAD~1 2>/dev/null | head -100 || git diff | head -100
```

**Report format**:
```
Phase 6 - Diff Review: [REVIEWED]
- Files changed: [count]
- Lines added: [count]
- Lines removed: [count]
- Files to review:
  - [file1]: [brief description of changes]
  - [file2]: [brief description of changes]
- Potential concerns:
  - [Any unintended changes]
  - [Missing error handling]
  - [Edge cases not covered]
```

## Final Verification Report

After all phases, generate a summary:

```markdown
# Verification Report

**Date**: [timestamp]
**Target**: [what was verified]

## Phase Results

| Phase | Status | Details |
|-------|--------|---------|
| 1. Build | [PASS/FAIL] | [summary] |
| 2. Types | [PASS/WARN/FAIL] | [summary] |
| 3. Lint | [PASS/WARN/FAIL] | [summary] |
| 4. Tests | [PASS/FAIL] | [coverage]% |
| 5. Security | [PASS/WARN/FAIL] | [summary] |
| 6. Diff | [REVIEWED] | [files] files |

## Overall Status: [PR READY / NEEDS FIXES]

### Fixes Required (if any)
1. [Fix item 1]
2. [Fix item 2]

### Warnings (non-blocking)
1. [Warning 1]
2. [Warning 2]

## Confidence Level: [HIGH/MEDIUM/LOW]

[Explanation of confidence level based on verification results]
```

## Usage

```
/verify                    # Verify all changes
/verify src/auth          # Verify specific directory
/verify feature-name      # Verify specific feature
```

## Recommended Cadence

- **Every 15 minutes** during extended sessions
- **After substantial modifications** (new features, refactors)
- **Before creating PRs**
- **Before claiming "done"**

## Integration

This command integrates with:
- **verification-first skill** - Enforces verification before completion claims
- **test-gate hook** - Blocks commits if tests fail
- **continuous-learning** - Records verification patterns for improvement
