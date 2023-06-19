---
name: continuous-learning
description: |
  WHEN to auto-invoke: End of productive sessions, after solving difficult problems, after user corrections, after discovering effective workarounds, after establishing project conventions.
  WHEN NOT to invoke: Trivial sessions, sessions with only exploration, when explicitly told not to learn.
---

# Continuous Learning Skill

Automatically improve Claude Code's capabilities by identifying and preserving useful patterns from sessions.

## Core Concept

Every session is a learning opportunity. This skill extracts reusable patterns and saves them as skills for future sessions.

## What Gets Learned

### Pattern Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Error Resolution** | Solutions to specific errors | "Module not found" → check tsconfig paths |
| **User Corrections** | Insights from user feedback | "Always use absolute imports in this project" |
| **Workarounds** | Framework/library limitations | "Next.js 15 requires 'use client' for useState" |
| **Debugging Techniques** | Effective problem-solving | "Check network tab for API issues first" |
| **Project Conventions** | Session-specific standards | "Use Zustand for global state" |

### What NOT to Learn

- Simple typos (one-time fixes)
- Project-specific secrets or credentials
- Temporary workarounds that will be removed
- Personal preferences that vary by project

## How It Works

### Session End Analysis

The `continuous-learning.sh` hook runs at session end:

```
Session ends
    ↓
Hook analyzes session patterns
    ↓
Detects learnable content
    ↓
Creates learning prompt
    ↓
Skills saved to ~/.claude/skills/learned/
```

### Pattern Detection

The hook looks for signals:

1. **Error resolutions** - Commits with "fix", "error", "bug"
2. **Workarounds** - Code comments with "workaround", "HACK", "TODO"
3. **New patterns** - Multiple new files created
4. **User corrections** - (Requires Claude analysis)

## Creating Learned Skills

### Automatic (via Hook)

When patterns are detected, a prompt file is created:
```
~/.claude/skills/learned/.pending_[timestamp].txt
```

Review and convert to a skill if valuable.

### Manual

Create a skill file directly:

```markdown
---
name: nextjs-15-server-actions
learned_from: my-app
date: 2026-01-22
---

# Next.js 15 Server Actions Pattern

## Context
Learned while building authentication in my-app.

## Pattern

Server actions in Next.js 15 require specific setup:

1. Create in separate file with 'use server' directive
2. Import in client component
3. Handle errors with try/catch
4. Return typed responses

## Example

\`\`\`typescript
// app/actions/auth.ts
'use server'

import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!parsed.success) {
    return { error: parsed.error.message, success: false }
  }

  // ... auth logic
  return { data: user, success: true }
}
\`\`\`

## When to Use
- Building forms with server-side validation
- Actions that modify database state
- Authentication flows
```

## Skill Storage

### Location
```
~/.claude/skills/learned/
├── nextjs-15-server-actions.md
├── zustand-async-patterns.md
├── vitest-mocking-strategies.md
└── .pending_20260122_103000.txt  # Awaiting review
```

### Skill Format

```yaml
---
name: skill-name           # Unique identifier
learned_from: project-name # Source project
date: YYYY-MM-DD          # When learned
tags: [tag1, tag2]        # Optional categorization
---

# Title

## Context
[When and why this was learned]

## Pattern
[The actual technique/pattern]

## Example
[Code example if applicable]

## When to Use
[Activation criteria]
```

## Using Learned Skills

### At Session Start

The `session-start.sh` hook lists available skills:
```
[Memory] 3 learned skill(s) available from previous sessions
[Memory] - nextjs-15-server-actions
[Memory] - zustand-async-patterns
[Memory] - vitest-mocking-strategies
```

### Explicit Reference

Ask Claude to apply a learned skill:
```
Use the zustand-async-patterns skill for this state management
```

### Automatic Activation

Skills with clear triggers activate automatically when relevant context appears.

## Skill Lifecycle

### Creation
1. Session produces valuable pattern
2. Hook detects pattern signals
3. Prompt file created for review
4. Convert to skill if valuable

### Refinement
1. Use skill in new context
2. Note improvements needed
3. Update skill with better examples
4. Add edge cases discovered

### Retirement
1. Pattern becomes obsolete (framework update)
2. Better pattern discovered
3. Move to archive or delete

## Best Practices

### For High-Quality Skills

1. **Be specific** - "Zustand async patterns" not "state management"
2. **Include context** - When and why this matters
3. **Provide examples** - Working code, not just descriptions
4. **Note limitations** - When this doesn't apply

### For Effective Learning

1. **Review pending skills** - Don't let prompts pile up
2. **Merge similar skills** - Combine related patterns
3. **Update outdated skills** - Frameworks evolve
4. **Prune unused skills** - Quality over quantity

## Integration

### With Memory Persistence
- Sessions save learning opportunities
- Skills persist across sessions
- Project context informs relevance

### With Strategic Compaction
- Compact after learning sessions
- Skills summarize key patterns
- Context preserved in skills

### With Verification Loop
- Verify learned patterns work
- Update skills with test results
- Document edge cases found

## Circuit Breaker Pattern

The learning hook implements a circuit breaker to prevent stuck states and wasteful processing:

### Detection Triggers
| Condition | Threshold | Action |
|-----------|-----------|--------|
| No file changes | 3 loops | Skip learning extraction |
| Identical errors | 5 occurrences | Mark session as stuck |
| Declining output | >70% reduction | Suggest session reset |
| Session too short | <10 messages | Skip analysis entirely |

### Recovery Actions

```bash
# When stuck state detected:
1. Log the stuck condition
2. Skip learning extraction for this session
3. Suggest user intervention or session restart
4. Preserve partial learnings if any
```

### Manual Reset

```bash
# Reset circuit breaker state
rm ~/.claude/.learning_state

# Force learning extraction despite circuit breaker
FORCE_LEARNING=1 claude
```

## Configuration

### In `continuous-learning.sh`:

```bash
MIN_MESSAGES=10  # Minimum session length for analysis
STUCK_THRESHOLD=5  # Identical errors before marking stuck
OUTPUT_DECLINE_THRESHOLD=0.7  # 70% decline triggers warning
```

### Disable for Session:

```bash
export SKIP_LEARNING_HOOK=1
```

## Example Workflow

```
1. Work on feature, encounter and solve tricky issue
2. Session ends, hook detects error-resolution pattern
3. Prompt file created: .pending_20260122_103000.txt
4. Review prompt, decide pattern is valuable
5. Create skill: ~/.claude/skills/learned/api-retry-pattern.md
6. Next session: skill loaded and available
7. Similar problem arises: skill provides solution
8. Refine skill with new edge case
```

## Remember

- **Every session teaches something** - Be attentive to patterns
- **Quality over quantity** - Few good skills > many mediocre ones
- **Skills compound** - Today's learning speeds up tomorrow's work
- **Review regularly** - Keep skills current and relevant
