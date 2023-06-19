#!/bin/bash
# Skill Activator Hook - Forces skill activation based on trigger words
# Event: UserPromptSubmit
#
# This hook detects keywords in user prompts and injects explicit
# skill activation instructions. Solves the unreliable auto-activation problem.
#
# Usage in settings.json:
# {
#   "hooks": {
#     "UserPromptSubmit": [
#       {
#         "command": ".claude/hooks/skill-activator.sh"
#       }
#     ]
#   }
# }

# Read the user's prompt from stdin
PROMPT=$(cat)

# Convert to lowercase for matching
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

SKILLS_TO_ACTIVATE=""

# API Development triggers
if echo "$PROMPT_LOWER" | grep -qE "(api|endpoint|route\.ts|rest|graphql|trpc)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE api-development"
fi

# Frontend Development triggers
if echo "$PROMPT_LOWER" | grep -qE "(component|react|vue|svelte|frontend|ui|ux|page\.tsx|layout)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE frontend-development"
fi

# Database triggers
if echo "$PROMPT_LOWER" | grep -qE "(database|schema|migration|query|sql|prisma|drizzle|supabase)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE database-operations"
fi

# Testing triggers
if echo "$PROMPT_LOWER" | grep -qE "(test|spec|playwright|vitest|jest|e2e|coverage)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE webapp-testing"
fi

# DevOps triggers
if echo "$PROMPT_LOWER" | grep -qE "(deploy|ci|cd|docker|github action|vercel|pipeline)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE devops-automation"
fi

# Code Quality triggers
if echo "$PROMPT_LOWER" | grep -qE "(review|refactor|clean|lint|optimize|performance)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE code-quality"
fi

# MCP Builder triggers
if echo "$PROMPT_LOWER" | grep -qE "(mcp|model context protocol|tool server|extend claude)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE mcp-builder"
fi

# Git Worktree triggers
if echo "$PROMPT_LOWER" | grep -qE "(worktree|parallel branch|isolated branch|multiple branch)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE git-worktree"
fi

# Root Cause Analysis triggers
if echo "$PROMPT_LOWER" | grep -qE "(bug|debug|error|fix|broken|not working|investigate)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE root-cause-analysis"
fi

# Verification triggers
if echo "$PROMPT_LOWER" | grep -qE "(verify|complete|done|finish|make sure|confirm)"; then
    SKILLS_TO_ACTIVATE="$SKILLS_TO_ACTIVATE verification-first"
fi

# If skills detected, output activation instruction
if [[ -n "$SKILLS_TO_ACTIVATE" ]]; then
    # Trim leading space
    SKILLS_TO_ACTIVATE=$(echo "$SKILLS_TO_ACTIVATE" | xargs)

    echo ""
    echo "<skill-activation-hint>"
    echo "CONTEXT: Based on the request, consider activating these skills: $SKILLS_TO_ACTIVATE"
    echo "Use the Skill tool to load relevant skills before proceeding."
    echo "</skill-activation-hint>"
fi

exit 0
