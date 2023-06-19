---
description: Initialize plans directory for version-controlled planning
model: claude-sonnet-4-5
---

# Initialize Plans Directory

Set up a project-local plans directory for version-controlled planning documents.

## User Request
$ARGUMENTS

## About plansDirectory

Claude Code v2.1.9+ supports a `plansDirectory` setting that stores plans locally instead of globally.

**Benefits:**
- Version control plans alongside code
- Project isolation - each project's plans stay local
- Team sharing via Git
- Automatic directory creation

## Setup Steps

### 1. Create Plans Directory

```bash
mkdir -p .claude/plans
```

### 2. Configure Claude Code

Add to `.claude/settings.json`:

```json
{
  "plansDirectory": ".claude/plans"
}
```

Or for user-wide config, add to `~/.claude/settings.json`.

### 3. Add .gitignore (Optional)

If some plans should stay private:

```gitignore
# .claude/plans/.gitignore
# Keep private plans out of version control
*.private.md
*.draft.md
```

### 4. Create README

```markdown
# Project Plans

This directory contains planning documents for [Project Name].

## Structure

- `feature-*.md` - Feature implementation plans
- `refactor-*.md` - Refactoring plans
- `architecture-*.md` - Architecture decision records
- `*.private.md` - Personal/draft plans (gitignored)

## Usage

Create plans with:
- `/feature-plan <description>` - New feature plans
- `/write-plan <description>` - General plans
- `/execute-plan <plan-file>` - Execute a plan

## Guidelines

1. Name plans descriptively: `feature-user-auth.md` not `plan1.md`
2. Include dates in frontmatter
3. Update status as work progresses
4. Archive completed plans to `archive/`
```

## Directory Structure

After initialization:

```
.claude/
├── plans/
│   ├── README.md
│   ├── .gitignore
│   ├── archive/
│   │   └── .gitkeep
│   └── templates/
│       ├── feature-plan.md
│       └── refactor-plan.md
├── settings.json
└── ...
```

## Plan Templates

### Feature Plan Template

```markdown
---
title: Feature Name
status: draft|in-progress|complete
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: Your Name
---

# Feature: [Name]

## Overview
[Brief description]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Technical Approach
[Implementation strategy]

## Tasks
- [ ] Task 1
- [ ] Task 2

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| ... | ... |

## Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

### Refactor Plan Template

```markdown
---
title: Refactor Name
status: draft|in-progress|complete
created: YYYY-MM-DD
scope: files|module|system
risk: low|medium|high
---

# Refactor: [Name]

## Current State
[What exists now]

## Target State
[What we want]

## Migration Steps
1. Step 1
2. Step 2

## Rollback Plan
[How to revert if needed]

## Verification
- [ ] Tests pass
- [ ] No regressions
- [ ] Performance maintained
```

## Integration with Existing Commands

### /feature-plan
Plans created with `/feature-plan` will automatically save to the plans directory.

### /write-plan
Creates plans in the configured directory.

### /execute-plan
Reads and executes plans from the directory:
```
/execute-plan feature-user-auth.md
```

## Comparison: Global vs Project Plans

| Aspect | Global (~/.claude/plans/) | Project (.claude/plans/) |
|--------|---------------------------|--------------------------|
| Scope | All projects | Single project |
| Version control | Manual | With project |
| Team sharing | No | Yes |
| Privacy | Personal | Configurable |
| Default | Yes (fallback) | Requires setup |

## Best Practices

1. **Use descriptive names** - `feature-oauth-integration.md` not `plan.md`
2. **Include status** - Track draft/in-progress/complete
3. **Archive don't delete** - Move completed plans to `archive/`
4. **Review periodically** - Update or archive stale plans
5. **Link to issues** - Reference GitHub issues/PRs in plans

## Quick Start

Run this command with no arguments to automatically:
1. Create `.claude/plans/` directory structure
2. Add configuration to settings
3. Create README and templates
4. Initialize archive folder

```
/plan-init
```

Or specify a custom path:
```
/plan-init ./docs/plans
```
