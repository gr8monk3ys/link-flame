#!/bin/bash
# Session End Hook - Memory Persistence System
# Persists session state when Claude sessions complete
# Event: Stop

set -e

# Configuration
SESSIONS_DIR="${HOME}/.claude/sessions"
MAX_SESSIONS=50
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SESSION_FILE="$SESSIONS_DIR/session_${TIMESTAMP}.json"

# Ensure directory exists
mkdir -p "$SESSIONS_DIR"

# Get current working directory info
PROJECT_NAME=$(basename "$(pwd)")
PROJECT_PATH=$(pwd)

# Detect project type
PROJECT_TYPE="unknown"
if [ -f "package.json" ]; then
    PROJECT_TYPE="node"
    if grep -q '"next"' package.json 2>/dev/null; then
        PROJECT_TYPE="nextjs"
    elif grep -q '"react"' package.json 2>/dev/null; then
        PROJECT_TYPE="react"
    elif grep -q '"vue"' package.json 2>/dev/null; then
        PROJECT_TYPE="vue"
    fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    PROJECT_TYPE="python"
elif [ -f "Cargo.toml" ]; then
    PROJECT_TYPE="rust"
elif [ -f "go.mod" ]; then
    PROJECT_TYPE="go"
fi

# Get git branch if available
GIT_BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
fi

# Get recent files modified (last 10)
RECENT_FILES=""
if git rev-parse --git-dir > /dev/null 2>&1; then
    RECENT_FILES=$(git diff --name-only HEAD~5 2>/dev/null | head -10 | tr '\n' ',' | sed 's/,$//')
fi

# Create session file
cat > "$SESSION_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "project_name": "$PROJECT_NAME",
  "project_path": "$PROJECT_PATH",
  "project_type": "$PROJECT_TYPE",
  "git_branch": "$GIT_BRANCH",
  "recent_files": "$RECENT_FILES",
  "session_id": "$TIMESTAMP"
}
EOF

echo "[Memory] Session saved: $SESSION_FILE" >&2

# Cleanup old sessions (keep only MAX_SESSIONS most recent)
session_count=$(find "$SESSIONS_DIR" -name "*.json" | wc -l)
if [ "$session_count" -gt "$MAX_SESSIONS" ]; then
    excess=$((session_count - MAX_SESSIONS))
    find "$SESSIONS_DIR" -name "*.json" -printf '%T@ %p\n' | sort -n | head -$excess | cut -d' ' -f2- | xargs rm -f
    echo "[Memory] Cleaned up $excess old session(s)" >&2
fi

exit 0
