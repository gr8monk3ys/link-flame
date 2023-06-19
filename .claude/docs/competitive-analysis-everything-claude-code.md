# Competitive Analysis: everything-claude-code

> Research conducted: January 2026
> Repository: https://github.com/affaan-m/everything-claude-code
> Notable: **Anthropic x Forum Ventures Hackathon Winner (Sep 2025)** - Built zenith.chat entirely with Claude Code

---

## Executive Summary

The `everything-claude-code` repository represents a lean, battle-tested approach to Claude Code configuration developed through 10+ months of daily production use. While our plugin has more components (55 commands, 24 agents vs their 14 commands, 9 agents), their repository excels in several key areas that we should learn from:

| Metric | Our Plugin | everything-claude-code |
|--------|-----------|------------------------|
| Commands | 55 (36 unique + 15 aliases) | 14 focused commands |
| Agents | 24 specialized | 9 core agents |
| Skills | 14 | 11 (more sophisticated) |
| MCP Servers | 22 | 4-6 (selective) |
| Hooks | 8 | 13+ (advanced patterns) |
| Orchestrators | 4 | Via `/orchestrate` command |

**Key Insight**: They prioritize depth over breadth, with sophisticated automation patterns that compound productivity over time.

---

## Key Differentiators & Missing Features

### 1. 🧠 Memory Persistence System (HIGH VALUE)

**What they have:**
- `session-start.sh` hook - Restores previous context when sessions begin
- `session-end.sh` hook - Persists state when sessions complete
- Sessions stored in `~/.claude/sessions/` with 7-day retention
- Learned skills saved to `~/.claude/skills/learned/`

**Why it matters:** Claude Code sessions are ephemeral. Their system maintains continuity across sessions, preserving debugging context, project conventions, and learned patterns.

**Our gap:** We have no cross-session memory persistence. Each session starts fresh.

**Recommendation:** Implement memory persistence hooks:
```bash
# .claude/hooks/session-start.sh
# .claude/hooks/session-end.sh
```

---

### 2. 📊 Strategic Compaction (HIGH VALUE)

**What they have:**
- Hook that monitors Edit/Write operations
- Suggests compaction at meaningful workflow junctures
- Prevents auto-compaction from triggering mid-task
- User-controlled timing vs arbitrary system compaction

**Why it matters:** Auto-compaction can trigger at the worst times, losing critical context mid-implementation. Strategic compaction preserves workflow coherence.

**Configuration:**
```json
{
  "event": "PreToolUse",
  "matcher": { "tool_name": "Edit|Write" },
  "command": "./hooks/strategic-compact/suggest-compact.sh"
}
```

**Our gap:** No compaction awareness or management.

**Recommendation:** Add strategic compaction skill and hook.

---

### 3. ✅ Verification Loop (HIGH VALUE)

**What they have:**
A comprehensive 6-phase verification process:

1. **Build Verification** - `npm run build` with failure detection
2. **Type Checking** - `tsc --noEmit` with error documentation
3. **Linting Analysis** - ESLint/Biome with first 30 results
4. **Test Suite Execution** - Coverage reporting (80% minimum target)
5. **Security Scanning** - grep for secrets, console.log detection
6. **Diff Review** - `git diff` for unintended changes

**Why it matters:** Provides systematic quality gates that catch issues before they reach code review.

**Our gap:** We have individual lint/test commands but no unified verification workflow.

**Recommendation:** Create `/verify` command that runs all phases with structured reporting.

---

### 4. 📚 Continuous Learning System (MEDIUM-HIGH VALUE)

**What they have:**
- Stop hook that analyzes session transcripts
- Extracts patterns: error resolutions, user corrections, workarounds, debugging techniques
- Automatically saves learned skills for future sessions
- Minimum 10 messages threshold for analysis

**Pattern categories:**
- Error resolution methods
- User correction insights
- Framework workarounds
- Debugging approaches
- Project conventions

**Why it matters:** The system gets smarter over time, accumulating project-specific knowledge.

**Our gap:** No learning mechanism - knowledge is lost after each session.

**Recommendation:** Implement continuous learning skill with session analysis.

---

### 5. 📈 Eval Harness (MEDIUM VALUE)

**What they have:**
Eval-driven development (EDD) framework with three grader types:

1. **Code-Based Graders** - Deterministic checks (pattern matching, tests, builds)
2. **Model-Based Graders** - Claude evaluates subjective qualities (1-5 scale)
3. **Human Graders** - Flags changes needing manual review

**Metrics tracked:**
- `pass@k` - At least one success in k attempts (target: >90% at k=3)
- `pass^k` - All k trials succeed (stricter)

**Why it matters:** Treats AI outputs as testable artifacts, bringing engineering rigor to AI development.

**Our gap:** No eval framework for measuring AI output quality.

**Recommendation:** Add eval harness skill for systematic quality measurement.

---

### 6. 🎯 Context Modes (MEDIUM VALUE)

**What they have:**
Dynamic system prompts for different work modes:

- **dev.md** - Active development (code-first, rapid iteration)
- **review.md** - Code review (quality-focused, standards-first)
- **research.md** - Investigation (exploration, analysis)

**Dev mode priorities:**
1. Get it working (functional)
2. Get it right (correct)
3. Get it clean (polished)

**Why it matters:** Different tasks require different behaviors. Context modes optimize Claude's approach.

**Our gap:** We have agents but no switchable context modes.

**Recommendation:** Add `/context` command with dev/review/research modes.

---

### 7. 🔧 Token Optimization Philosophy (MEDIUM VALUE)

**Their approach:**
- Maintain 20-30 configured MCPs
- Keep fewer than 10 enabled per project
- Stay under 80 active tools
- Prevents context window shrinkage (200k → 70k)

**Why it matters:** More tools ≠ better. Excessive tools consume context budget.

**Our gap:** We have 22 MCP servers, 55 commands, 24 agents. May be over-tooled.

**Recommendation:**
- Add per-project tool selection
- Document tool subset recommendations by project type
- Consider "tool profiles" feature

---

### 8. 🏗️ Focused Agent Architecture (LOW-MEDIUM VALUE)

**Their 9 agents (focused):**
1. planner - Implementation planning
2. architect - System design
3. tdd-guide - Test-driven development
4. code-reviewer - Quality review
5. security-reviewer - Security analysis
6. build-error-resolver - Build fixes
7. e2e-runner - E2E test execution
8. refactor-cleaner - Refactoring
9. doc-updater - Documentation updates

**Our 24 agents (comprehensive):**
More specialized roles (fintech-engineer, chaos-engineer, accessibility-auditor, etc.)

**Insight:** Their agents are workflow-oriented; ours are domain-oriented. Both approaches valid.

**Recommendation:** Consider adding workflow-oriented agents to complement domain experts.

---

### 9. 🛡️ Advanced Hook Patterns (HIGH VALUE)

**Hooks we're missing:**

| Hook | Purpose |
|------|---------|
| Block dev servers outside tmux | Prevents orphaned processes |
| Remind tmux for long commands | Better process management |
| Pause before git push | Review opportunity |
| Block markdown file creation | Prevents doc sprawl |
| Auto-detect PR creation | GitHub Actions monitoring |
| Console.log audit | Clean code enforcement |

**Recommendation:** Add process management and code quality hooks.

---

## Prioritized Implementation Roadmap

### Phase 1: Quick Wins (1-2 days each)

1. **Verification Loop Command** (`/verify`)
   - Unified quality check command
   - Structured pass/fail reporting
   - Build on existing lint/test commands

2. **Context Modes** (`/context dev|review|research`)
   - Three mode files in `.claude/contexts/`
   - Mode-switching command

3. **Enhanced Hooks**
   - Pre-push review pause
   - Console.log audit on Stop
   - Tmux reminder for long commands

### Phase 2: Core Infrastructure (3-5 days each)

4. **Memory Persistence System**
   - Session start/end hooks
   - Session storage structure
   - Context restoration logic

5. **Strategic Compaction**
   - Edit/Write operation counter
   - Compaction suggestion thresholds
   - User-controlled timing

### Phase 3: Advanced Features (1 week each)

6. **Continuous Learning System**
   - Session transcript analysis
   - Pattern extraction
   - Skill persistence

7. **Eval Harness**
   - Grader framework
   - pass@k metrics
   - `/eval` command

### Phase 4: Optimization

8. **Tool Profiles**
   - Per-project tool selection
   - Recommended subsets by project type
   - Context budget monitoring

---

## Commands to Add

| Command | Priority | Description |
|---------|----------|-------------|
| `/verify` | HIGH | 6-phase verification loop |
| `/context` | HIGH | Switch between dev/review/research modes |
| `/checkpoint` | MEDIUM | Create development checkpoints |
| `/learn` | MEDIUM | Trigger learning analysis |
| `/eval` | MEDIUM | Run eval-driven checks |
| `/orchestrate` | LOW | General multi-step coordination |

---

## Skills to Add

| Skill | Priority | Description |
|-------|----------|-------------|
| `verification-loop` | HIGH | Systematic quality checks |
| `strategic-compact` | HIGH | Intelligent compaction timing |
| `continuous-learning` | MEDIUM | Session pattern extraction |
| `eval-harness` | MEDIUM | AI output quality measurement |

---

## Hooks to Add

| Hook | Event | Priority | Description |
|------|-------|----------|-------------|
| `session-start.sh` | SessionStart | HIGH | Restore previous context |
| `session-end.sh` | Stop | HIGH | Persist session state |
| `suggest-compact.sh` | PreToolUse | HIGH | Strategic compaction |
| `evaluate-session.sh` | Stop | MEDIUM | Learning analysis |
| `pre-push-review.sh` | PreToolUse | MEDIUM | Pause before push |
| `console-log-audit.sh` | Stop | LOW | Clean code check |

---

## Key Takeaways

1. **Quality over quantity** - Their 14 commands are more integrated than our 55
2. **Automation compounds** - Their hooks create a productivity flywheel
3. **Memory matters** - Cross-session persistence is a significant advantage
4. **Context management** - Strategic compaction prevents workflow disruption
5. **Continuous improvement** - Learning system accumulates project knowledge

---

## Conclusion

The `everything-claude-code` repository succeeds by focusing on **workflow automation** and **session continuity** rather than breadth of features. Their hackathon win demonstrates that a well-integrated, lean toolset outperforms a comprehensive but disconnected one.

**Our opportunity:** Combine our extensive domain coverage (24 specialized agents, framework support) with their automation patterns (memory persistence, verification loops, continuous learning) to create the most complete Claude Code enhancement available.

**Recommended focus:** Phases 1-2 would provide the highest ROI, bringing memory persistence and quality automation without major architectural changes.
