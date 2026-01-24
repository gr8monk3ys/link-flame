#!/bin/bash
# Input Modifier Hook Example
# Demonstrates how to modify tool inputs before execution (v2.0.10+)
# Event: PreToolUse
#
# This hook can:
# 1. Allow tool calls with modified inputs
# 2. Deny tool calls entirely
# 3. Ask user for confirmation
# 4. Add context for Claude

set -e

# Read hook input from stdin
INPUT=$(cat)

# Parse tool name and inputs
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")
TOOL_INPUT=$(echo "$INPUT" | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^}]*}' || echo "{}")

# Function to output JSON response
output_response() {
    local decision="$1"
    local reason="$2"
    local updated_input="$3"
    local context="$4"

    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "$decision",
    "permissionDecisionReason": "$reason"$([ -n "$updated_input" ] && echo ",
    \"updatedInput\": $updated_input")$([ -n "$context" ] && echo ",
    \"additionalContext\": \"$context\"")
  }
}
EOF
}

# Example: Auto-approve and modify documentation file writes
case "$TOOL_NAME" in
    "Write"|"Edit")
        # Extract file path from input
        FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")

        # Auto-approve documentation files
        if [[ "$FILE_PATH" == *.md ]] || [[ "$FILE_PATH" == */docs/* ]]; then
            output_response "allow" "Auto-approved documentation file"
            exit 0
        fi

        # Add timestamp to new files
        if [[ "$TOOL_NAME" == "Write" ]] && [[ ! -f "$FILE_PATH" ]]; then
            # Could modify input to add header comment
            # For now, just add context
            output_response "allow" "New file creation" "" "Remember to add appropriate file header"
            exit 0
        fi
        ;;

    "Bash")
        # Extract command from input
        COMMAND=$(echo "$TOOL_INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")

        # Block dangerous commands
        if echo "$COMMAND" | grep -qE "(rm -rf /|dd if=|mkfs\.|:(){:|fork bomb)"; then
            echo "Blocked potentially dangerous command: $COMMAND" >&2
            exit 2  # Exit 2 = block
        fi

        # Modify npm install to use --save-exact
        if echo "$COMMAND" | grep -qE "^npm install [^-]"; then
            MODIFIED_COMMAND=$(echo "$COMMAND" | sed 's/npm install/npm install --save-exact/')
            output_response "allow" "Modified to use --save-exact" "{\"command\": \"$MODIFIED_COMMAND\"}"
            exit 0
        fi

        # Add timeout to curl commands
        if echo "$COMMAND" | grep -qE "^curl " && ! echo "$COMMAND" | grep -q -- "--max-time"; then
            MODIFIED_COMMAND=$(echo "$COMMAND" | sed 's/^curl /curl --max-time 30 /')
            output_response "allow" "Added 30s timeout" "{\"command\": \"$MODIFIED_COMMAND\"}"
            exit 0
        fi
        ;;

    "Read")
        # Extract file path
        FILE_PATH=$(echo "$TOOL_INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")

        # Warn about large files
        if [ -f "$FILE_PATH" ]; then
            FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")
            if [ "$FILE_SIZE" -gt 100000 ]; then
                output_response "allow" "Large file warning" "" "This file is $(($FILE_SIZE / 1024))KB - consider reading specific sections"
                exit 0
            fi
        fi
        ;;
esac

# Default: allow without modification
exit 0
