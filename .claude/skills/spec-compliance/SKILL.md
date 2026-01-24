---
name: spec-compliance
description: Use this skill to verify work matches requirements. Activates when checking against specifications, validating acceptance criteria, or ensuring implementation matches design.
---

# Spec Compliance Skill

Verify that implementation matches specifications and requirements.

## Core Principle

**Build what was asked, not what you think should be built.**

The spec is the contract. Deviation without approval is a bug, not a feature.

## Compliance Check Protocol

### Step 1: Load the Spec
```markdown
## Original Specification

Source: [PRD / Issue / Design Doc / User Story]

### Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Out of Scope
- Item 1
- Item 2
```

### Step 2: Map Implementation to Spec
```markdown
## Implementation Mapping

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Req 1 | `src/feature.ts:23` | ✅ Met |
| Req 2 | `src/feature.ts:45` | ✅ Met |
| Req 3 | Not implemented | ❌ Gap |
```

### Step 3: Verify Acceptance Criteria
```markdown
## Acceptance Criteria Verification

### Criterion 1: "User can log in with email"
- **Verification method**: Manual test
- **Steps taken**:
  1. Navigated to /login
  2. Entered email and password
  3. Clicked submit
- **Result**: ✅ Successfully logged in
- **Evidence**: [screenshot/log]

### Criterion 2: "Error shown for invalid credentials"
- **Verification method**: Manual test
- **Steps taken**:
  1. Entered wrong password
  2. Clicked submit
- **Result**: ✅ Error message displayed
- **Evidence**: Shows "Invalid credentials"
```

### Step 4: Report Compliance
```markdown
## Compliance Report

**Overall Status**: ✅ Compliant / ⚠️ Partial / ❌ Non-compliant

### Summary
- Requirements met: 8/10
- Acceptance criteria passed: 5/5
- Gaps identified: 2

### Gaps
1. **Requirement 9**: Password reset flow
   - Status: Not implemented
   - Reason: Deferred to phase 2
   - Tracking: ISSUE-456

2. **Requirement 10**: Remember me checkbox
   - Status: Partial
   - Gap: Cookie not persisting
   - Action needed: Fix cookie setting

### Additions (not in spec)
1. Added loading spinner
   - Rationale: UX improvement
   - Risk: None, additive only
```

## Spec Sources

### User Stories
```markdown
As a [user type]
I want to [action]
So that [benefit]

Acceptance Criteria:
- Given [context]
- When [action]
- Then [result]
```

### PRD (Product Requirements Doc)
```markdown
## Feature: [Name]
### Overview
### Requirements
### Success Metrics
### Out of Scope
```

### Technical Design Doc
```markdown
## Design: [Component]
### API Contract
### Data Model
### Behavior Specification
```

### Issue/Ticket
```markdown
## Issue #123
### Description
### Acceptance Criteria
### Technical Notes
```

## Compliance Categories

### Functional Compliance
- Does it do what was specified?
- Does behavior match requirements?
- Are all use cases handled?

### API Compliance
- Do endpoints match spec?
- Are request/response formats correct?
- Are error codes as specified?

### UI Compliance
- Does UI match designs?
- Are interactions as specified?
- Is copy/text correct?

### Performance Compliance
- Does it meet performance requirements?
- Are SLAs met?
- Is resource usage within limits?

## Handling Deviations

### Intentional Deviation
```markdown
## Deviation Record

**Requirement**: [Original requirement]
**Deviation**: [What was done differently]
**Rationale**: [Why the change]
**Approval**: [Who approved, when]
**Impact**: [Effect on other requirements]
```

### Discovered Gap
```markdown
## Gap Identified

**Requirement**: [Missed requirement]
**Discovery**: [How/when found]
**Severity**: Critical / High / Medium / Low
**Action**:
- [ ] Implement now
- [x] Defer to next phase
- [ ] Descope (with approval)
**Tracking**: [Issue number]
```

## Compliance Checklist

```markdown
## Pre-Completion Compliance Check

### Requirements
- [ ] All requirements traced to implementation
- [ ] Each requirement verified working
- [ ] Gaps documented and tracked

### Acceptance Criteria
- [ ] All criteria testable
- [ ] All criteria tested
- [ ] All criteria passing

### Scope
- [ ] No unplanned additions (or documented)
- [ ] Nothing removed without approval
- [ ] Deferred items tracked

### Documentation
- [ ] Spec updated if changes approved
- [ ] Deviations documented
- [ ] Compliance report generated
```

## Integration

Works with:
- `/riper` - Research phase loads spec, Review phase checks compliance
- `/execute-plan` - Each task maps to spec requirement
- `/review` - Final compliance verification
- `verification-first` skill - Verify against spec, not assumptions
