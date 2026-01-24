#!/bin/bash
# Test Gate Hook - Blocks commits until tests pass
# Event: PreToolUse (git commit)
#
# This hook creates a deterministic quality gate that prevents commits
# when tests are failing. It forces Claude into a "test-and-fix" loop.
#
# Usage in settings.json:
# {
#   "hooks": {
#     "PreToolUse": [
#       {
#         "matcher": "Bash",
#         "command": ".claude/hooks/test-gate.sh \"$TOOL_INPUT\""
#       }
#     ]
#   }
# }

set -e

TOOL_INPUT="$1"
TEST_PASS_FILE="/tmp/claude-test-gate-pass"
SKIP_FILE="/tmp/claude-test-gate-skip"

# Only intercept git commit commands
if ! echo "$TOOL_INPUT" | grep -qE "git\s+commit"; then
    exit 0
fi

# Allow skip if explicitly requested
if [[ -f "$SKIP_FILE" ]]; then
    rm -f "$SKIP_FILE"
    exit 0
fi

# Check if tests have passed recently (within last 5 minutes)
if [[ -f "$TEST_PASS_FILE" ]]; then
    FILE_AGE=$(($(date +%s) - $(stat -f %m "$TEST_PASS_FILE" 2>/dev/null || stat -c %Y "$TEST_PASS_FILE" 2>/dev/null)))
    if [[ $FILE_AGE -lt 300 ]]; then
        echo "✓ Tests passed recently, commit allowed"
        exit 0
    fi
fi

# Detect test runner
detect_test_runner() {
    if [[ -f "package.json" ]]; then
        if grep -q '"vitest"' package.json 2>/dev/null; then
            echo "npm run test"
        elif grep -q '"jest"' package.json 2>/dev/null; then
            echo "npm test"
        elif grep -q '"test":' package.json 2>/dev/null; then
            echo "npm test"
        fi
    elif [[ -f "pytest.ini" ]] || [[ -f "pyproject.toml" ]]; then
        echo "pytest"
    elif [[ -f "Cargo.toml" ]]; then
        echo "cargo test"
    elif [[ -f "go.mod" ]]; then
        echo "go test ./..."
    fi
}

TEST_CMD=$(detect_test_runner)

if [[ -z "$TEST_CMD" ]]; then
    echo "⚠ No test runner detected, allowing commit"
    exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST GATE: Running tests before commit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command: $TEST_CMD"
echo ""

# Run tests
if eval "$TEST_CMD"; then
    echo ""
    echo "✓ All tests passed!"
    touch "$TEST_PASS_FILE"
    exit 0
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✗ COMMIT BLOCKED: Tests are failing"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Fix the failing tests before committing."
    echo "To skip this check once: touch /tmp/claude-test-gate-skip"
    echo ""
    exit 1
fi
