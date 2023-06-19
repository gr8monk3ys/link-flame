---
description: Trigger extended thinking mode for complex problems
model: claude-opus-4-5
---

# Extended Thinking Mode

Trigger Claude's extended thinking capabilities for complex problems.

## User Request
$ARGUMENTS

## Thinking Levels

Claude Code supports progressive thinking budget allocation:

| Level | Trigger | Token Budget | Best For |
|-------|---------|--------------|----------|
| **Standard** | (default) | ~1,000 tokens | Simple tasks |
| **Think** | "think" | ~4,000 tokens | Moderate complexity |
| **Megathink** | "think hard" | ~10,000 tokens | Complex problems |
| **Ultrathink** | "ultrathink" | ~31,999 tokens | Major architecture |

## How to Use

### Method 1: Natural Language Triggers

Include trigger words in your prompt:

```
think about how to structure this authentication system

think hard about the race condition in this code

ultrathink about the best architecture for this distributed system
```

### Method 2: This Command

```
/think <level> <your question or problem>
```

Examples:
```
/think standard How should I name this variable?
/think think What's the best way to handle errors here?
/think megathink Design a caching strategy for this API
/think ultrathink Architect a multi-tenant SaaS platform
```

## When to Use Each Level

### Standard (Default)
- Variable naming
- Simple bug fixes
- Straightforward implementations
- Documentation

### Think (~4K tokens)
- API design decisions
- Debugging non-obvious issues
- Code review analysis
- Testing strategy

### Megathink (~10K tokens)
- Complex refactoring plans
- Performance optimization
- Security vulnerability analysis
- Database schema design

### Ultrathink (~31K tokens)
- System architecture decisions
- Major technology choices
- Complex algorithm design
- Multi-service integration planning

## Thinking Mode Indicators

When thinking mode is active, you'll see:
- Extended response time
- More thorough analysis
- Multiple perspectives considered
- Trade-offs explicitly discussed

## Best Practices

### Do
- Start with lower levels, escalate if needed
- Be specific about what needs deep thought
- Use for genuinely complex problems
- Allow time for thorough responses

### Don't
- Use ultrathink for simple questions (wastes tokens)
- Interrupt thinking with new prompts
- Expect instant responses at higher levels
- Use for tasks that need action, not thought

## Example Problems by Level

### Think Level
```
/think think What's the best error handling pattern for this API endpoint that needs to handle rate limiting, validation errors, and database failures?
```

### Megathink Level
```
/think megathink I have a monolithic Next.js app with 50+ pages. How should I gradually migrate to a micro-frontend architecture while maintaining development velocity?
```

### Ultrathink Level
```
/think ultrathink Design a real-time collaborative editing system like Google Docs that handles concurrent edits, offline support, version history, and scales to millions of documents.
```

## Keyboard Shortcut

Press `Tab` to toggle extended thinking mode (sticky - stays on until toggled off).

## Token Usage

| Level | Approximate Cost | Time |
|-------|-----------------|------|
| Standard | Base rate | Instant |
| Think | ~4x base | 5-15 seconds |
| Megathink | ~10x base | 15-45 seconds |
| Ultrathink | ~32x base | 45-120 seconds |

## Integration with Other Commands

Combine with planning commands:
```
/think megathink then /feature-plan user authentication with OAuth, MFA, and session management
```

Use before architecture decisions:
```
/think ultrathink
Then: /architect Design the data model for a multi-tenant invoicing system
```

## Remember

- **Thinking is not doing** - Use for planning, not implementation
- **Quality over quantity** - Ultrathink once beats think five times
- **Right-size your requests** - Match thinking level to problem complexity
- **Trust the process** - Let Claude think fully before responding
