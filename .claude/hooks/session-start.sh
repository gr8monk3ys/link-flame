#!/bin/bash
# Session Start Hook - Memory Persistence System
# Restores previous context when Claude sessions begin
# Event: SessionStart

set -e

# Configuration
SESSIONS_DIR="${HOME}/.claude/sessions"
LEARNED_SKILLS_DIR="${HOME}/.claude/skills/learned"
MAX_AGE_DAYS=7

# Ensure directories exist
mkdir -p "$SESSIONS_DIR" "$LEARNED_SKILLS_DIR"

# Count recent sessions
recent_sessions=$(find "$SESSIONS_DIR" -name "*.json" -mtime -${MAX_AGE_DAYS} 2>/dev/null | wc -l)
latest_session=$(find "$SESSIONS_DIR" -name "*.json" -mtime -${MAX_AGE_DAYS} -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

# Count learned skills
learned_skills=$(find "$LEARNED_SKILLS_DIR" -name "*.md" 2>/dev/null | wc -l)

# Output context information (to stderr so it doesn't interfere with tool output)
if [ "$recent_sessions" -gt 0 ]; then
    echo "[Memory] Found $recent_sessions recent session(s) from the past $MAX_AGE_DAYS days" >&2
    if [ -n "$latest_session" ]; then
        echo "[Memory] Latest session: $(basename "$latest_session")" >&2
        # Extract key context from the latest session if it exists
        if [ -f "$latest_session" ]; then
            project_context=$(jq -r '.project_context // empty' "$latest_session" 2>/dev/null)
            if [ -n "$project_context" ]; then
                echo "[Memory] Project context available: $project_context" >&2
            fi
        fi
    fi
fi

if [ "$learned_skills" -gt 0 ]; then
    echo "[Memory] $learned_skills learned skill(s) available from previous sessions" >&2
    # List learned skills
    for skill in "$LEARNED_SKILLS_DIR"/*.md; do
        if [ -f "$skill" ]; then
            skill_name=$(basename "$skill" .md)
            echo "[Memory] - $skill_name" >&2
        fi
    done
fi

# Check for project-specific memory
if [ -f ".claude/memory.json" ]; then
    echo "[Memory] Project-specific memory file found" >&2
fi

# Output nothing to stdout (success)
exit 0
