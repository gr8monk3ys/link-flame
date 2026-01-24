---
description: Run Claude Code in headless mode for CI/CD automated code review
---

# CI/CD Code Review

Run automated code review in CI/CD pipelines using Claude Code's headless mode.

## Arguments
$ARGUMENTS

## Headless Mode Usage

Claude Code supports headless operation for CI/CD integration using the `-p` (print) flag:

```bash
# Basic headless review
claude -p "Review this PR for security issues and code quality"

# With structured JSON output
claude -p "Review changes" --output-format stream-json

# With specific model
claude -p "Review" --model claude-opus-4-5-20251101
```

## GitHub Actions Integration

Add to your workflow:

```yaml
- name: Claude Code Review
  run: |
    npx @anthropic-ai/claude-code -p "
      Review the changes in this PR:
      - Security vulnerabilities (OWASP Top 10)
      - TypeScript type safety
      - Performance implications
      - Code quality issues

      Output format: JSON with severity, file, line, issue, fix
    " --output-format stream-json > review.json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Review Focus Areas

Based on the arguments provided, focus on:

1. **Security Review**
   - Injection vulnerabilities (SQL, XSS, Command)
   - Authentication/Authorization issues
   - Hardcoded secrets or credentials
   - Insecure data handling

2. **Code Quality**
   - TypeScript strict mode compliance
   - No `any` types
   - Proper error handling
   - Clean code principles

3. **Performance**
   - N+1 query patterns
   - Unnecessary re-renders
   - Bundle size implications
   - Memory leaks

4. **Architecture**
   - Single responsibility
   - Proper abstractions
   - Consistent patterns
   - Maintainability

## Output Format

For CI integration, output structured results:

```json
{
  "summary": "Found 3 issues (1 critical, 2 medium)",
  "issues": [
    {
      "severity": "critical",
      "file": "src/api/users.ts",
      "line": 45,
      "type": "security",
      "issue": "SQL injection vulnerability",
      "fix": "Use parameterized query instead of string concatenation"
    }
  ],
  "approved": false
}
```

## Exit Codes

For CI/CD pipelines:
- `0` - Review passed, no critical issues
- `1` - Review found critical issues
- `2` - Review could not complete (error)

## Integration with PR Checks

Combine with GitHub Actions to block PRs:

```yaml
- name: Check Review Results
  run: |
    CRITICAL=$(jq '.issues | map(select(.severity == "critical")) | length' review.json)
    if [ "$CRITICAL" -gt 0 ]; then
      echo "::error::Found $CRITICAL critical issues"
      exit 1
    fi
```
