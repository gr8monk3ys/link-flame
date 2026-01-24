#!/bin/bash
# Strategic Compaction Hook
# Monitors Edit/Write operations and suggests compaction at meaningful workflow junctures
# Event: PreToolUse (Edit, Write)

set -e

# Configuration
COUNTER_FILE="${HOME}/.claude/.compact_counter"
THRESHOLD=50
REMINDER_INTERVAL=25

# Ensure counter file exists
mkdir -p "$(dirname "$COUNTER_FILE")"
if [ ! -f "$COUNTER_FILE" ]; then
    echo "0" > "$COUNTER_FILE"
fi

# Read current count
count=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
count=$((count + 1))

# Save updated count
echo "$count" > "$COUNTER_FILE"

# Check if we should suggest compaction
if [ "$count" -eq "$THRESHOLD" ]; then
    echo "" >&2
    echo "=====================================================" >&2
    echo "[Strategic Compact] $count edit operations reached" >&2
    echo "=====================================================" >&2
    echo "" >&2
    echo "Consider using /compact at a natural breakpoint:" >&2
    echo "  - After completing a feature or fix" >&2
    echo "  - After finishing research, before implementation" >&2
    echo "  - When switching between different task types" >&2
    echo "" >&2
    echo "This preserves context better than auto-compaction." >&2
    echo "Reset counter: rm ~/.claude/.compact_counter" >&2
    echo "=====================================================" >&2
    echo "" >&2
elif [ "$count" -gt "$THRESHOLD" ]; then
    # Reminder every REMINDER_INTERVAL operations after threshold
    excess=$((count - THRESHOLD))
    if [ $((excess % REMINDER_INTERVAL)) -eq 0 ]; then
        echo "[Strategic Compact] Reminder: $count edit operations. Consider /compact at a breakpoint." >&2
    fi
fi

exit 0
