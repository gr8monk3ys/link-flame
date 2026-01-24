#!/bin/bash
# Pre-Compact Hook
# Saves critical context before compaction to prevent knowledge loss
# Event: PreCompact

set -e

# Configuration
MEMORY_DIR="${HOME}/.claude/memory"
CONTEXT_FILE="${MEMORY_DIR}/pre-compact-context.md"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVE_DIR="${MEMORY_DIR}/archives"

# Ensure directories exist
mkdir -p "$MEMORY_DIR"
mkdir -p "$ARCHIVE_DIR"

# Read input from stdin (contains compaction context)
INPUT=$(cat)

# Extract key information if available
echo "=============================================" >&2
echo "[Pre-Compact] Preserving context before compaction" >&2
echo "=============================================" >&2

# Archive previous context if exists
if [ -f "$CONTEXT_FILE" ]; then
    mv "$CONTEXT_FILE" "${ARCHIVE_DIR}/context_${TIMESTAMP}.md"
    echo "[Pre-Compact] Archived previous context" >&2
fi

# Create new context preservation file
cat > "$CONTEXT_FILE" << 'CONTEXT_HEADER'
# Pre-Compaction Context Snapshot

This file preserves critical context from before the last compaction.
Use this to restore understanding if needed after /compact.

## Timestamp
CONTEXT_HEADER

echo "$TIMESTAMP" >> "$CONTEXT_FILE"

cat >> "$CONTEXT_FILE" << 'CONTEXT_BODY'

## Active Work Context

The following information was preserved before compaction:

### Key Decisions Made
- [Review git log for recent commits]

### Files Recently Modified
CONTEXT_BODY

# Add recently modified files (last hour)
echo '```' >> "$CONTEXT_FILE"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" 2>/dev/null | \
    xargs ls -lt 2>/dev/null | head -20 >> "$CONTEXT_FILE" || echo "No recent files found" >> "$CONTEXT_FILE"
echo '```' >> "$CONTEXT_FILE"

cat >> "$CONTEXT_FILE" << 'CONTEXT_FOOTER'

### Git Status at Compaction
```
CONTEXT_FOOTER

git status --short 2>/dev/null >> "$CONTEXT_FILE" || echo "Not a git repository" >> "$CONTEXT_FILE"

echo '```' >> "$CONTEXT_FILE"

cat >> "$CONTEXT_FILE" << 'CONTEXT_END'

### Recent Commits
```
CONTEXT_END

git log --oneline -10 2>/dev/null >> "$CONTEXT_FILE" || echo "No git history" >> "$CONTEXT_FILE"

echo '```' >> "$CONTEXT_FILE"

cat >> "$CONTEXT_FILE" << 'USAGE_NOTE'

## How to Use This File

After compaction, if you need to restore context:
1. Read this file to understand what was being worked on
2. Check the recent commits for context
3. Review modified files to understand current state

To restore this context to Claude, use:
```
/memory restore pre-compact
```
USAGE_NOTE

echo "[Pre-Compact] Context saved to $CONTEXT_FILE" >&2
echo "[Pre-Compact] Ready for compaction - context preserved" >&2
echo "" >&2

# Clean up old archives (keep last 10)
ls -t "${ARCHIVE_DIR}"/context_*.md 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

exit 0
