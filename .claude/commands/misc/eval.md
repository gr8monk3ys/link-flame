---
description: Run eval-driven development checks with pass@k metrics
model: claude-sonnet-4-5
---

# Eval Command

Run eval-driven development checks to measure and validate code quality.

## Target

$ARGUMENTS

## Eval Protocol

### Step 1: Identify Evals

Determine which evals to run based on context:

**If specific target provided**:
- Run evals matching the target
- Look for `.eval.yaml` files
- Check for inline eval definitions

**If no target (run all)**:
- Scan for eval definitions in `.claude/evals/`
- Include standard code-based evals
- Run comprehensive quality checks

### Step 2: Execute Evals

#### Code-Based Evals

```bash
# Type checking
echo "=== Eval: Type Check ==="
npx tsc --noEmit 2>&1
TYPE_RESULT=$?

# Linting
echo "=== Eval: Lint ==="
npm run lint 2>&1
LINT_RESULT=$?

# Tests
echo "=== Eval: Tests ==="
npm test 2>&1
TEST_RESULT=$?

# Build
echo "=== Eval: Build ==="
npm run build 2>&1
BUILD_RESULT=$?

# Security patterns
echo "=== Eval: Security Scan ==="
grep -rn "password\s*=\s*['\"]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null
grep -rn "api_key\s*=\s*['\"]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null
```

#### Model-Based Evals

For subjective quality assessment, evaluate:

1. **Code Structure** (1-5)
   - Is the code well-organized?
   - Are responsibilities clearly separated?
   - Is it easy to navigate?

2. **Error Handling** (1-5)
   - Are errors properly caught?
   - Are error messages helpful?
   - Are edge cases handled?

3. **Security Practices** (1-5)
   - Is input validated?
   - Are secrets protected?
   - Are best practices followed?

4. **Maintainability** (1-5)
   - Can others understand this code?
   - Is it easy to modify?
   - Is it well-documented?

### Step 3: Calculate Metrics

#### pass@k Calculation

For each eval, calculate:

```
pass@1 = (successful_runs / total_runs) when k=1
pass@3 = 1 - (failures^3 / total^3) approximation
```

**Interpretation**:
- pass@1 = 100%: Reliable, always passes
- pass@1 = 80%: Usually passes, some flakiness
- pass@1 < 80%: Needs investigation

#### Aggregate Scores

```
Overall Score = (Code Evals Pass Rate * 0.6) + (Model Eval Avg * 0.4)
```

### Step 4: Generate Report

```markdown
# Eval Report

**Target**: [what was evaluated]
**Date**: [timestamp]
**Mode**: [full/quick/specific]

## Code-Based Evals

| Eval | Status | pass@1 | pass@3 | Notes |
|------|--------|--------|--------|-------|
| Type Check | [PASS/FAIL] | [%] | [%] | [errors if any] |
| Lint | [PASS/FAIL] | [%] | [%] | [warnings] |
| Tests | [PASS/FAIL] | [%] | [%] | [coverage] |
| Build | [PASS/FAIL] | [%] | [%] | [time] |
| Security | [PASS/WARN] | [%] | [%] | [findings] |

## Model-Based Evals

| Criteria | Score | Reasoning |
|----------|-------|-----------|
| Code Structure | [X/5] | [brief explanation] |
| Error Handling | [X/5] | [brief explanation] |
| Security Practices | [X/5] | [brief explanation] |
| Maintainability | [X/5] | [brief explanation] |

**Model Eval Average**: [X/5]

## Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Code Evals | [X/Y passing] | 100% | [MET/NOT MET] |
| Model Average | [X/5] | 4.0/5 | [MET/NOT MET] |
| pass@3 (critical) | [%] | >90% | [MET/NOT MET] |

## Overall Status: [PASS / NEEDS WORK / FAIL]

## Recommendations

1. [Priority fix 1]
2. [Priority fix 2]
3. [Improvement suggestion]

## Next Steps

- [ ] [Action item 1]
- [ ] [Action item 2]
```

## Usage Examples

```
/eval                    # Run all evals
/eval auth              # Run evals for auth module
/eval --quick           # Run only code-based evals
/eval --model-only      # Run only model-based evals
/eval --attempts=3      # Run with 3 attempts for pass@3
```

## Eval Definitions

### Create Custom Evals

Create `.claude/evals/[name].eval.yaml`:

```yaml
name: api-endpoints
description: API endpoint quality checks

code_evals:
  - name: response-format
    command: npm test -- --grep "api response"

  - name: error-handling
    command: npm test -- --grep "api error"

model_evals:
  - name: api-design
    criteria:
      - RESTful conventions followed
      - Consistent error format
      - Proper status codes
      - Clear documentation
```

## Integration

This command integrates with:
- **eval-harness skill** - Framework for eval definitions
- **verification-loop** - Phases map to evals
- **continuous-learning** - Eval results inform learning
- **tdd workflow** - Tests are code-based evals

## Best Practices

1. **Run before PRs** - Ensure all evals pass
2. **Track metrics over time** - Watch for regression
3. **Define evals early** - Before implementation
4. **Fix failing evals immediately** - Don't let them accumulate
5. **Review model eval scores** - Subjective but valuable
