---
description: RIPER Review Phase - Quality gates before considering work complete
model: claude-sonnet-4-5
---

# Review Phase

The final phase of the RIPER workflow: ensure quality before considering work complete.

## Command: $ARGUMENTS

## Review Protocol

### Step 1: Self-Review

Before any other checks:
- Does the code match the original plan?
- Are there any shortcuts or hacks?
- Would you be proud to show this code?
- Is it clear what the code does?

### Step 2: Automated Checks

Run all automated quality gates:
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm run test

# Build verification
npm run build
```

### Step 3: Manual Testing

Verify functionality:
- Happy path works as expected
- Edge cases handled gracefully
- Error states display correctly
- Loading states appear when appropriate

### Step 4: Final Verification

Cross-check against requirements:
- All acceptance criteria met
- Non-functional requirements satisfied
- No regressions introduced
- Documentation updated

## Review Checklist

### Code Quality
```
- [ ] No TODO/FIXME comments left unaddressed
- [ ] No console.log or debugging statements
- [ ] No commented-out code
- [ ] Consistent with existing codebase patterns
- [ ] Variable/function names are clear
- [ ] No magic numbers or strings
- [ ] DRY - no unnecessary duplication
- [ ] SOLID principles followed
```

### Testing
```
- [ ] Unit tests passing
- [ ] Integration tests passing (if applicable)
- [ ] E2E tests passing (if applicable)
- [ ] Test coverage acceptable (>80%)
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Manual testing completed
```

### Security
```
- [ ] No secrets/credentials in code
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation in place
- [ ] Authentication/authorization checked
- [ ] Sensitive data handled properly
- [ ] Dependencies have no known vulnerabilities
```

### Performance
```
- [ ] No N+1 query issues
- [ ] No unnecessary re-renders
- [ ] No memory leaks
- [ ] Bundle size impact acceptable
- [ ] Response times within budget
- [ ] No blocking operations on main thread
```

### Accessibility
```
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus states visible
- [ ] Alt text for images
- [ ] ARIA labels where needed
```

### Documentation
```
- [ ] Code comments where needed
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Changelog entry added
- [ ] Breaking changes documented
```

## Review Output Template

```markdown
## Review Summary: [Feature/Change]

### Status: ✅ Approved / ⚠️ Needs Work / ❌ Blocked

### Quality Score: [A-F]

### Automated Checks
| Check | Status | Notes |
|-------|--------|-------|
| TypeScript | ✅ Pass | No errors |
| ESLint | ✅ Pass | No warnings |
| Tests | ✅ Pass | 45/45 passing |
| Build | ✅ Pass | Compiles successfully |

### Manual Verification
| Scenario | Status | Notes |
|----------|--------|-------|
| Happy path | ✅ Pass | Works as expected |
| Error handling | ✅ Pass | Shows appropriate messages |
| Edge cases | ⚠️ Partial | Need to handle empty state |

### Issues Found
1. **[Severity]** Issue description
   - Location: `file.ts:123`
   - Fix: Description of needed fix

### Items Addressed
- Fixed accessibility issue in modal
- Added missing loading state
- Updated error messages

### Items Deferred
- Performance optimization (not critical, tracked in ISSUE-123)
- Additional edge case (out of scope)

### Recommendation
- [x] Ready for merge
- [ ] Ready for PR creation
- [ ] Ready for deployment
- [ ] Needs revision first

### Next Steps
1. Step 1
2. Step 2
```

## Quality Grades

### Grade A (Excellent)
- All automated checks pass
- All manual tests pass
- No issues found
- Documentation complete
- Ready for immediate merge

### Grade B (Good)
- All automated checks pass
- Minor issues found but fixed
- Documentation adequate
- Ready for merge after minor polish

### Grade C (Acceptable)
- Most checks pass
- Some issues deferred
- Basic documentation present
- Merge with known limitations

### Grade D (Needs Work)
- Some checks failing
- Significant issues found
- Missing documentation
- Requires revision before merge

### Grade F (Not Ready)
- Multiple checks failing
- Critical issues found
- Not meeting requirements
- Major rework needed

## Review Anti-Patterns

### Avoid
- ❌ Rubber-stamping without actually checking
- ❌ Only running automated tests
- ❌ Skipping manual verification
- ❌ Ignoring "small" issues
- ❌ Deferring everything to "later"

### Instead
- ✅ Take time to actually review
- ✅ Verify both automated and manual
- ✅ Fix issues before they accumulate
- ✅ Be honest about quality
- ✅ Document deferred items properly

## When to Block

Block the work if:
- Security vulnerability found
- Critical functionality broken
- Data loss possible
- Breaking change undocumented
- Tests failing

## Phase Gate Checklist

Before considering work complete:

- [ ] All automated checks passing
- [ ] Manual testing completed
- [ ] Issues addressed or properly deferred
- [ ] Documentation updated
- [ ] Quality grade acceptable (C or above)
- [ ] Ready for intended next step

## Integration

```
/execute-plan "auth feature"
    ↓
/review "auth changes"  ← You are here
    ↓
Ready for: merge / PR / deployment
```

## Post-Review Actions

After approved review:
```
/ledger update TASK-XXX status: completed
/memory note: Completed auth feature with approach X
/handoff  (if ending session)
```
