---
description: Switch between context modes (dev, review, research) to optimize Claude's behavior
model: claude-sonnet-4-5
---

# Context Mode Switcher

Switch to a context mode that optimizes behavior for specific work types.

## Target Mode

$ARGUMENTS

## Available Modes

### `dev` - Development Mode
**Focus**: Rapid iteration, working code, pragmatic solutions

Best for:
- Active feature development
- Prototyping
- Bug fixing
- Quick implementations

Behavior:
- Code-first approach
- Brief explanations
- Tolerance for TODOs
- Fast feedback loops

### `review` - Review Mode
**Focus**: Quality, correctness, standards enforcement

Best for:
- Code reviews
- PR evaluations
- Quality checks
- Pre-merge verification

Behavior:
- Thorough analysis
- Structured feedback
- Security awareness
- Standards enforcement

### `research` - Research Mode
**Focus**: Exploration, investigation, understanding

Best for:
- Technical research
- Codebase exploration
- Architecture analysis
- Documentation review

Behavior:
- Comprehensive exploration
- Multiple perspectives
- Evidence-based conclusions
- Well-documented findings

## Mode Switching

When switching modes, I will:

1. **Acknowledge** the mode change
2. **Adjust** my behavior according to mode guidelines
3. **Apply** mode-specific priorities and communication style

## Mode Comparison

| Aspect | Dev | Review | Research |
|--------|-----|--------|----------|
| **Priority** | Working code | Quality | Understanding |
| **Speed** | Fast | Thorough | Variable |
| **Detail** | Minimal | High | Comprehensive |
| **Focus** | Implementation | Evaluation | Exploration |
| **Output** | Code | Feedback | Reports |

## Usage

```
/context-mode dev        # Switch to development mode
/context-mode review     # Switch to review mode
/context-mode research   # Switch to research mode
```

## Context Files

Mode definitions are stored in `.claude/contexts/`:
- `dev.md` - Development mode guidelines
- `review.md` - Review mode guidelines
- `research.md` - Research mode guidelines

## Integration

Context modes work with:
- **verification-first skill** - Enhanced in review mode
- **continuous-learning** - Active in all modes
- **strategic-compact** - Mode-aware compaction suggestions

## When to Switch

| Current Mode | Switch When |
|--------------|-------------|
| dev → review | Feature complete, ready for quality check |
| dev → research | Hit a blocker, need to investigate |
| review → dev | Review done, implementing fixes |
| review → research | Need deeper understanding |
| research → dev | Research complete, ready to implement |
| research → review | Evaluating existing solutions |

## Mode Persistence

The current mode persists throughout the session until:
- You explicitly switch modes
- Session ends
- Context is compacted (mode should be re-established)

## Best Practices

1. **Start sessions in appropriate mode** - Match mode to task
2. **Switch at natural boundaries** - Not mid-task
3. **Document mode switches** - Helps maintain context
4. **Use review before PRs** - Quality gate
5. **Use research before major decisions** - Informed choices
