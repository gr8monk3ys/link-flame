---
description: RIPER Research Phase - Deeply understand the problem before solving
model: claude-sonnet-4-5
---

# Research Phase

The first phase of the RIPER workflow: deeply understand the problem before attempting solutions.

## Command: $ARGUMENTS

## Research Protocol

### Step 1: Clarify Requirements

Ask and document:
- **What** exactly needs to be built?
- **Why** is this needed? What problem does it solve?
- **Who** are the users/stakeholders?
- **When** is it needed? Any deadlines?
- **Where** will it be used? What environment?

### Step 2: Analyze Existing Code

Search for relevant context:
```
1. Find similar implementations
2. Identify patterns used in codebase
3. Note dependencies and integrations
4. Check for existing utilities to reuse
```

### Step 3: Document Constraints

Identify limitations:
- Technical constraints (frameworks, languages, APIs)
- Business constraints (timeline, budget, scope)
- Quality constraints (performance, security, accessibility)
- Compatibility constraints (browsers, devices, versions)

### Step 4: List Open Questions

Capture unknowns:
- Questions needing stakeholder input
- Technical unknowns requiring investigation
- Assumptions that need validation

## Research Output Template

Generate a research summary:

```markdown
## Research Summary: [Topic]

### Problem Statement
[Clear, concise description of what we're solving]

### Requirements
**Functional:**
- [ ] Requirement 1
- [ ] Requirement 2

**Non-Functional:**
- Performance: [targets]
- Security: [requirements]
- Accessibility: [standards]

### Existing Patterns
Found in codebase:
- `src/components/Example.tsx` - Similar component pattern
- `src/lib/utils.ts` - Utility functions to reuse

### Constraints
| Type | Constraint | Impact |
|------|------------|--------|
| Technical | Must use React 18 | Limits library choices |
| Business | 2-week deadline | Scope must be tight |

### Open Questions
1. [ ] Question needing answer
2. [ ] Assumption to validate

### Relevant Files
- `path/to/file.ts` - Why it's relevant
- `path/to/another.ts` - Why it's relevant

### Recommendation
Ready to proceed to INNOVATE phase: Yes/No
Blockers: [list any blockers]
```

## Research Techniques

### For New Features
1. Review product requirements/specs
2. Analyze similar features in codebase
3. Check industry best practices
4. Consider edge cases early

### For Bug Fixes
1. Reproduce the issue
2. Gather error logs and stack traces
3. Identify when it started (git bisect)
4. Find related code paths

### For Refactoring
1. Map current architecture
2. Identify pain points
3. Measure current metrics (performance, complexity)
4. Document dependencies

### For Performance Issues
1. Profile current performance
2. Identify bottlenecks
3. Research optimization techniques
4. Set measurable targets

## Research Anti-Patterns

### Avoid
- ❌ Jumping to solutions too quickly
- ❌ Assuming you understand the problem
- ❌ Ignoring existing code patterns
- ❌ Not documenting constraints
- ❌ Skipping stakeholder alignment

### Instead
- ✅ Ask clarifying questions
- ✅ Read existing code first
- ✅ Document everything
- ✅ Validate assumptions
- ✅ Get alignment before proceeding

## Phase Gate Checklist

Before moving to INNOVATE:

- [ ] Problem statement is clear and agreed upon
- [ ] Requirements are documented
- [ ] Constraints are identified
- [ ] Relevant code has been reviewed
- [ ] Open questions are listed (even if unanswered)
- [ ] Research summary is complete

## Integration

```
/research "user authentication"
    ↓
/memory note: Research findings for auth feature
    ↓
/innovate "auth approaches"  (next phase)
```
