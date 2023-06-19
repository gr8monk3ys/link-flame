#!/bin/bash
# Subagent Logger Hook
# Logs subagent completions for debugging and orchestration tracking
# Event: SubagentStop

set -e

# Configuration
LOG_DIR="${HOME}/.claude/logs"
LOG_FILE="${LOG_DIR}/subagent-completions.jsonl"
MAX_LOG_SIZE=1048576  # 1MB

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Read input from stdin (contains subagent completion data)
INPUT=$(cat)

# Extract relevant fields using basic parsing
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Parse agent type from input if available (JSON expected)
AGENT_TYPE=$(echo "$INPUT" | grep -o '"agent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"agent_type"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "unknown")
AGENT_ID=$(echo "$INPUT" | grep -o '"agent_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"agent_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "unknown")
EXIT_STATUS=$(echo "$INPUT" | grep -o '"exit_status"[[:space:]]*:[[:space:]]*[0-9]*' | sed 's/.*"exit_status"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/' || echo "0")

# Create log entry
LOG_ENTRY=$(cat << EOF
{"timestamp":"$TIMESTAMP","agent_type":"$AGENT_TYPE","agent_id":"$AGENT_ID","exit_status":$EXIT_STATUS,"event":"subagent_stop"}
EOF
)

# Append to log file
echo "$LOG_ENTRY" >> "$LOG_FILE"

# Log to stderr for visibility
echo "[Subagent Logger] Recorded completion: $AGENT_TYPE ($AGENT_ID) - exit: $EXIT_STATUS" >&2

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        echo "[Subagent Logger] Log rotated (exceeded 1MB)" >&2
    fi
fi

# Special handling for certain agent types
case "$AGENT_TYPE" in
    "code-reviewer"|"security-engineer")
        echo "[Subagent Logger] Review agent completed - check output for findings" >&2
        ;;
    "test-strategist"|"e2e-runner")
        echo "[Subagent Logger] Test agent completed - verify test results" >&2
        ;;
    "build-error-resolver")
        echo "[Subagent Logger] Build resolver completed - run verification" >&2
        ;;
esac

exit 0
