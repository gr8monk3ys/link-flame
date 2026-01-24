#!/bin/bash
# Continuous Learning Hook
# Analyzes session patterns and extracts reusable skills
# Event: Stop

set -e

# Configuration
LEARNED_SKILLS_DIR="${HOME}/.claude/skills/learned"
MIN_MESSAGES=10
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Ensure directory exists
mkdir -p "$LEARNED_SKILLS_DIR"

# Check if we have enough context to analyze
# This is a lightweight check - the actual analysis would be done by Claude
# The hook signals that learning should occur

# Get project context
PROJECT_NAME=$(basename "$(pwd)")
PROJECT_TYPE="unknown"
if [ -f "package.json" ]; then
    PROJECT_TYPE="node"
    if grep -q '"next"' package.json 2>/dev/null; then
        PROJECT_TYPE="nextjs"
    elif grep -q '"react"' package.json 2>/dev/null; then
        PROJECT_TYPE="react"
    fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    PROJECT_TYPE="python"
fi

# Check for patterns worth learning
PATTERNS_FOUND=0
PATTERN_HINTS=""

# Check for error resolutions (presence of error-related commits)
if git log --oneline -10 2>/dev/null | grep -qi "fix\|error\|bug"; then
    PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
    PATTERN_HINTS="${PATTERN_HINTS}error-resolution,"
fi

# Check for workarounds (comments with workaround/hack mentions)
if grep -rn "workaround\|HACK\|TODO.*fix" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" . 2>/dev/null | head -1 > /dev/null; then
    PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
    PATTERN_HINTS="${PATTERN_HINTS}workarounds,"
fi

# Check for new patterns (new files created)
NEW_FILES=$(git diff --name-only --diff-filter=A HEAD~5 2>/dev/null | wc -l)
if [ "$NEW_FILES" -gt 3 ]; then
    PATTERNS_FOUND=$((PATTERNS_FOUND + 1))
    PATTERN_HINTS="${PATTERN_HINTS}new-patterns,"
fi

# Output learning hints
if [ "$PATTERNS_FOUND" -gt 0 ]; then
    echo "" >&2
    echo "[Learning] Session analysis complete" >&2
    echo "[Learning] Project: $PROJECT_NAME ($PROJECT_TYPE)" >&2
    echo "[Learning] Patterns detected: ${PATTERN_HINTS%,}" >&2
    echo "[Learning] Consider extracting reusable skills from this session" >&2
    echo "" >&2

    # Create a learning prompt file that can be used
    LEARNING_PROMPT_FILE="${LEARNED_SKILLS_DIR}/.pending_${TIMESTAMP}.txt"
    cat > "$LEARNING_PROMPT_FILE" << EOF
# Learning Opportunity - $TIMESTAMP

Project: $PROJECT_NAME
Type: $PROJECT_TYPE
Patterns: ${PATTERN_HINTS%,}

## Questions to Consider

1. Were there any error resolutions that could become reusable patterns?
2. Were there workarounds for framework/library limitations worth documenting?
3. Were there debugging techniques that proved effective?
4. Are there project conventions that should be captured?

## To Create a Learned Skill

Create a markdown file in: $LEARNED_SKILLS_DIR/
Format:
---
name: skill-name
learned_from: $PROJECT_NAME
date: $(date -I)
---

# Skill Content
[Document the pattern here]
EOF

    echo "[Learning] Prompt saved: $LEARNING_PROMPT_FILE" >&2
fi

exit 0
