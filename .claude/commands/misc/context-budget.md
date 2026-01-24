---
description: Monitor and optimize context/token usage for efficient sessions
---

# Context Budget Monitor

Track and optimize token usage to maintain efficient Claude Code sessions.

## Arguments
$ARGUMENTS

## Why Monitor Context?

Claude Code sessions have context limits. As you work:
- Each file read adds to context
- Tool outputs consume tokens
- Conversation history accumulates
- Eventually, context must be compacted

Proactive monitoring helps you:
- Avoid unexpected context resets
- Optimize what gets loaded
- Plan session handoffs
- Maintain productivity

## Context Budget Principles

### 1. Compound, Don't Compact

From Continuous-Claude methodology:
- **Bad**: Let context fill up, then compact (lose detail)
- **Good**: Progressively summarize, preserve key info

### 2. Load Lazily

- Don't read entire files upfront
- Use symbolic tools (find_symbol) over full reads
- Request specific line ranges
- Cache summaries of large files

### 3. Summarize Proactively

Before context fills:
- Summarize completed work
- Archive resolved discussions
- Extract key decisions to memory

## Estimation Guidelines

Approximate token costs:

| Content Type | Tokens (approx) |
|-------------|-----------------|
| 1 line of code | 10-20 |
| 100 lines of code | 1,000-2,000 |
| Average file read | 2,000-5,000 |
| npm install output | 500-1,000 |
| Test run output | 1,000-3,000 |
| Error stacktrace | 200-500 |

## Optimization Strategies

### For File Reading

```
# Instead of reading entire file
Read entire src/services/user.ts (500 lines = ~5,000 tokens)

# Use targeted reads
Read src/services/user.ts lines 45-60 (15 lines = ~200 tokens)

# Or use symbolic tools
find_symbol UserService (returns just the class = ~500 tokens)
```

### For Search Operations

```
# Instead of broad grep
Grep "error" in entire codebase (might return 1000s of lines)

# Use targeted search
Grep "ValidationError" in src/api/ with context=2
```

### For Long Sessions

1. **Checkpoint Progress**
   ```
   /ledger update "Completed auth implementation"
   ```

2. **Use Memory for Key Info**
   ```
   /memory add "Auth uses JWT with 24h expiry"
   ```

3. **Create Handoff Before Limit**
   ```
   /handoff
   ```

## Session Planning

### Short Session (< 30 min)
- Focus on single task
- Minimal file exploration
- Direct implementation

### Medium Session (30-60 min)
- Use memory for context
- Summarize midway
- Monitor for compaction warnings

### Long Session (> 60 min)
- Plan handoff points
- Use worktrees for parallel work
- Delegate to sub-agents
- Progressive summarization

## Warning Signs

Watch for these indicators:

1. **Slower Responses**: Context processing takes longer
2. **Repetitive Questions**: Claude asking for info it had
3. **Lost Context**: Forgetting earlier decisions
4. **Compaction Notice**: System message about context

## Recovery Actions

If context is filling up:

### Immediate
```
/handoff  # Save current state
# Start new session with /resume
```

### Preventive
```
# Summarize current progress
"Let's summarize what we've accomplished and what remains"

# Clear unnecessary context
"We can forget the debugging output from earlier"
```

## Integration with Workflows

### With RIPER
- **Research**: Load lazily, summarize findings
- **Innovate**: Explore options, document decisions
- **Plan**: Create concise plan in memory
- **Execute**: Focus on current step only
- **Review**: Summarize outcomes

### With Parallel Agents
- Each agent has separate context
- Coordinate via files, not conversation
- Merge results efficiently

## Metrics to Track

For optimizing your workflow:

1. **Files Read per Task**: Target < 10
2. **Average Session Length**: Note when compaction occurs
3. **Handoff Frequency**: Plan based on task complexity
4. **Memory Utilization**: Key facts stored vs repeated

## Best Practices Summary

1. **Read Targeted**: Specific lines/symbols, not whole files
2. **Summarize Early**: Don't wait for context limit
3. **Use Memory**: Persist key info across sessions
4. **Plan Handoffs**: Before context fills, not after
5. **Delegate**: Use sub-agents for parallel exploration
6. **Monitor**: Watch for warning signs
