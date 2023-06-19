---
description: Extract and save learnable patterns from the current session as reusable skills
model: claude-sonnet-4-5
---

# Learn Command

Analyze the current session and extract valuable patterns that can become reusable skills.

## Focus Area

$ARGUMENTS

## Analysis Protocol

### Step 1: Session Review

Review the current session for learnable patterns:

1. **Error Resolutions**
   - What errors were encountered?
   - How were they resolved?
   - Is the solution reusable?

2. **User Corrections**
   - Did the user correct any assumptions?
   - What insights came from feedback?
   - Are these project-specific or general?

3. **Workarounds**
   - Were any framework limitations encountered?
   - What workarounds were implemented?
   - Are these documented anywhere?

4. **Debugging Techniques**
   - What debugging approaches worked?
   - Were there efficient diagnosis patterns?
   - Can these be generalized?

5. **Project Conventions**
   - What conventions were established?
   - Are these worth capturing?
   - Do they differ from defaults?

### Step 2: Pattern Evaluation

For each potential pattern, evaluate:

| Criteria | Question |
|----------|----------|
| Reusability | Will this help in future sessions? |
| Specificity | Is it specific enough to be actionable? |
| Durability | Will this remain valid over time? |
| Uniqueness | Is this already a known pattern? |

**Score each 1-5**. Patterns scoring 15+ are worth saving.

### Step 3: Skill Creation

For valuable patterns, create a skill file:

```markdown
---
name: [descriptive-name]
learned_from: [current-project]
date: [today]
tags: [relevant, tags]
---

# [Pattern Title]

## Context
[When and why this pattern was learned]

## Problem
[What problem does this solve?]

## Solution
[The pattern/technique]

## Example
[Working code example]

## When to Use
[Clear activation criteria]

## Caveats
[Limitations or edge cases]
```

### Step 4: Save Location

Save skill to: `~/.claude/skills/learned/[skill-name].md`

Or for project-specific: `.claude/skills/learned/[skill-name].md`

## Output Format

```markdown
# Learning Report

## Session Analysis

**Project**: [name]
**Session Focus**: [what was worked on]
**Duration**: [approximate]

## Patterns Identified

### 1. [Pattern Name]
- **Category**: [error-resolution|workaround|debugging|convention]
- **Reusability Score**: [X/5]
- **Action**: [Save as skill / Too specific / Already known]

### 2. [Pattern Name]
...

## Skills Created

1. **[skill-name]** - [brief description]
   - Location: `~/.claude/skills/learned/[skill-name].md`
   - Tags: [tags]

## Patterns Deferred

1. **[pattern]** - [reason for deferring]

## Recommendations

- [Any follow-up learning opportunities]
- [Patterns to watch for in future sessions]
```

## Usage Examples

```
/learn                           # Analyze entire session
/learn authentication           # Focus on auth-related patterns
/learn error handling           # Focus on error patterns
/learn "the API retry logic"    # Specific pattern
```

## Integration

This command integrates with:
- **continuous-learning skill** - Framework for pattern extraction
- **memory-persistence** - Stores learned skills across sessions
- **session-end hook** - Automatic learning triggers

## Best Practices

1. **Run at natural breakpoints** - After completing features or solving problems
2. **Be selective** - Only save truly reusable patterns
3. **Include examples** - Working code is more valuable than descriptions
4. **Review periodically** - Prune outdated skills
