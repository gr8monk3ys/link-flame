---
name: eval-harness
description: |
  WHEN to auto-invoke: Measuring code quality, testing AI outputs, establishing success criteria, defining acceptance tests, checking implementation correctness.
  WHEN NOT to invoke: Simple implementations, prototyping, exploration phases, when speed matters more than measurement.
---

# Eval Harness Skill

Implement eval-driven development (EDD) - treating evaluations as "unit tests of AI development."

## Core Concept

**Evals are to AI development what unit tests are to traditional development.**

Define expected behaviors *before* implementation, then continuously validate code against these criteria.

## Grader Types

### 1. Code-Based Graders (Deterministic)

Objective, automated checks:

```typescript
// Example: API response validation
const grader = {
  name: 'api-response-format',
  type: 'code',
  check: (response) => {
    // Must have success/error structure
    if (!('success' in response)) return { pass: false, reason: 'Missing success field' }
    if (response.success && !('data' in response)) return { pass: false, reason: 'Success without data' }
    if (!response.success && !('error' in response)) return { pass: false, reason: 'Failure without error' }
    return { pass: true }
  }
}
```

**Use for**:
- Pattern matching (correct structure)
- Test execution (tests pass)
- Build validation (compiles)
- Type checking (no errors)
- Linting (no violations)

### 2. Model-Based Graders (Qualitative)

Claude evaluates subjective qualities:

```markdown
## Model Grader: Code Quality

Rate the following code on a scale of 1-5:

**Criteria**:
- Problem-solving effectiveness
- Code structure and organization
- Edge case handling
- Error management
- Readability

**Code to evaluate**:
[code block]

**Expected output**:
{
  "score": 4,
  "reasoning": "Good structure, handles main cases, could improve error messages",
  "suggestions": ["Add more specific error types", "Consider edge case X"]
}
```

**Use for**:
- Code quality assessment
- Documentation clarity
- API design evaluation
- UX considerations

### 3. Human Graders (Manual Review)

Flag changes requiring human review:

```yaml
human_review_triggers:
  - security_sensitive_files:
      patterns: ["**/auth/**", "**/security/**", "**/*.key"]
  - high_impact_changes:
      lines_changed: ">500"
  - critical_paths:
      paths: ["src/core/**", "src/database/**"]
```

**Use for**:
- Security-sensitive changes
- Architectural decisions
- Breaking changes
- Compliance requirements

## Reliability Metrics

### pass@k: At least one success in k attempts

```
pass@1 = Single attempt success rate
pass@3 = At least one success in 3 attempts
pass@5 = At least one success in 5 attempts
```

**Target**: pass@3 > 90% for production code

### pass^k: All k trials succeed

```
pass^1 = Single attempt (same as pass@1)
pass^3 = All 3 attempts succeed
pass^5 = All 5 attempts succeed
```

**Target**: pass^3 > 80% for critical functionality

## Eval Workflow

### Phase 1: Define Evals

Before coding, specify success criteria:

```markdown
## Feature: User Authentication

### Eval 1: Login Success
- **Type**: Code
- **Criteria**:
  - Returns JWT token on valid credentials
  - Token contains user ID and expiry
  - Sets httpOnly cookie

### Eval 2: Login Failure
- **Type**: Code
- **Criteria**:
  - Returns 401 on invalid credentials
  - Does not leak whether email exists
  - Rate limits after 5 failures

### Eval 3: Code Quality
- **Type**: Model
- **Criteria**:
  - Score ≥ 4/5 on security practices
  - Score ≥ 4/5 on error handling
```

### Phase 2: Implement

Write code designed to satisfy evals:

```typescript
async function login(email: string, password: string) {
  // Implementation targeting eval criteria
}
```

### Phase 3: Evaluate

Run evals during and after implementation:

```bash
# Run all evals
/eval check

# Run specific eval
/eval check auth-login

# Run with multiple attempts
/eval check --attempts=3
```

### Phase 4: Report

Generate comprehensive results:

```markdown
## Eval Report: User Authentication

| Eval | Type | pass@1 | pass@3 | Status |
|------|------|--------|--------|--------|
| Login Success | Code | 100% | 100% | ✅ |
| Login Failure | Code | 100% | 100% | ✅ |
| Code Quality | Model | 4.2/5 | 4.1/5 | ✅ |

**Overall**: 3/3 evals passing
**Confidence**: High
```

## Creating Evals

### Eval File Format

```yaml
# .claude/evals/auth-login.eval.yaml
name: auth-login
description: User login functionality
version: 1.0

evals:
  - name: valid-credentials
    type: code
    run: npm test -- --grep "login success"
    expect:
      exit_code: 0

  - name: invalid-credentials
    type: code
    run: npm test -- --grep "login failure"
    expect:
      exit_code: 0

  - name: security-review
    type: model
    prompt: |
      Review this authentication code for security:
      - Password hashing (argon2/bcrypt)
      - Timing-safe comparison
      - Rate limiting
      - No credential leakage
    expect:
      min_score: 4
```

### Inline Evals

For quick checks during development:

```markdown
## Quick Eval

**Code**: [implementation]

**Check**:
- [ ] Types pass (`npx tsc --noEmit`)
- [ ] Tests pass (`npm test`)
- [ ] No security issues (`grep -r "password" src/`)
- [ ] Model score ≥ 4/5
```

## Best Practices

### 1. Define evals BEFORE implementation

```
❌ Write code → Think of tests
✅ Define success criteria → Write code to satisfy
```

### 2. Run evals frequently

```
Every commit: Code-based evals
Every feature: Model-based evals
Every PR: All evals
```

### 3. Prefer code-based graders

```
Code graders: Consistent, fast, automated
Model graders: Subjective, slower, variable
Human graders: Most accurate, slowest
```

### 4. Version your evals

```
Evals should evolve with code
Track eval changes in version control
Document why evals changed
```

### 5. Use appropriate pass@k

```
Prototyping: pass@1 acceptable
Production: pass@3 required
Critical: pass^3 required
```

## Integration

### With Verification Loop
- Verification phases become structured evals
- Each phase has explicit pass/fail criteria
- Results feed into eval metrics

### With Continuous Learning
- Eval failures become learning opportunities
- Successful patterns become skills
- Metrics track improvement over time

### With TDD Workflow
- Tests are code-based evals
- TDD ensures pass@1 before commit
- Coverage maps to eval coverage

## Remember

- **Evals define success** - Be specific about what "working" means
- **Run early, run often** - Catch issues before they compound
- **Trust the metrics** - Data beats intuition
- **Evolve your evals** - Requirements change, evals should too
