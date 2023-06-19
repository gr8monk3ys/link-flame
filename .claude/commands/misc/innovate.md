---
description: RIPER Innovate Phase - Explore multiple solutions before committing
model: claude-sonnet-4-5
---

# Innovate Phase

The second phase of the RIPER workflow: explore multiple solutions before committing to one.

## Command: $ARGUMENTS

## Innovation Protocol

### Step 1: Divergent Thinking

Generate multiple approaches without judgment:
- Aim for 3-5 different solutions
- Include conventional and unconventional ideas
- Consider different trade-offs
- Don't filter ideas yet

### Step 2: Trade-off Analysis

Evaluate each approach against:
- **Effort**: How long to implement?
- **Risk**: What could go wrong?
- **Maintainability**: How easy to change later?
- **Performance**: What's the runtime impact?
- **Compatibility**: Does it fit with existing code?

### Step 3: Decision Making

Select the best approach:
- Compare against requirements
- Consider short-term vs long-term
- Validate against constraints
- Document the rationale

### Step 4: Risk Mitigation

For the chosen approach:
- Identify key risks
- Plan mitigation strategies
- Consider fallback options
- Note assumptions to validate

## Innovation Output Template

```markdown
## Innovation Summary: [Topic]

### Approaches Explored

#### Approach A: [Name]
**Description**: [How it works]

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Effort | Low/Med/High | [details] |
| Risk | Low/Med/High | [details] |
| Maintainability | Low/Med/High | [details] |
| Performance | Low/Med/High | [details] |

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

---

#### Approach B: [Name]
[Same structure as above]

---

#### Approach C: [Name]
[Same structure as above]

---

### Comparison Matrix

| Criteria | Approach A | Approach B | Approach C |
|----------|------------|------------|------------|
| Effort | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Risk | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Maintainability | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Fits Codebase | ⭐⭐⭐ | ⭐ | ⭐⭐ |

### Recommendation

**Selected Approach**: [Name]

**Rationale**:
[Why this approach was chosen over others]

**Key Risks**:
1. Risk 1 - Mitigation: [strategy]
2. Risk 2 - Mitigation: [strategy]

**Assumptions to Validate**:
- [ ] Assumption 1
- [ ] Assumption 2

### Spikes/Prototypes (if any)
- Spike 1: [what was tested, what was learned]
- Spike 2: [what was tested, what was learned]
```

## Innovation Techniques

### Brainstorming Methods

**6-3-5 Technique**:
- Generate 6 ideas
- In 3 categories (simple, moderate, complex)
- Considering 5 dimensions

**Reverse Brainstorming**:
- How could we make this problem worse?
- What's the opposite of what we want?
- Invert insights into solutions

**SCAMPER**:
- **S**ubstitute: What can we swap out?
- **C**ombine: What can we merge?
- **A**dapt: What can we borrow from elsewhere?
- **M**odify: What can we change?
- **P**ut to other uses: What else could this do?
- **E**liminate: What can we remove?
- **R**earrange: What order could change?

### Trade-off Frameworks

**Effort vs Impact Matrix**:
```
High Impact │  Quick Wins  │  Major Projects
            │  (Do First)  │  (Plan Carefully)
────────────┼──────────────┼─────────────────
Low Impact  │  Fill-ins    │  Avoid
            │  (Maybe)     │  (Don't Do)
            └──────────────┴─────────────────
              Low Effort     High Effort
```

**Risk Assessment**:
```
Probability │  Monitor     │  Critical
of Failure  │  Closely     │  Mitigate Now
────────────┼──────────────┼─────────────────
            │  Accept      │  Have Backup
            │  Risk        │  Plan Ready
            └──────────────┴─────────────────
              Low Impact     High Impact
```

## When to Prototype

Create a quick spike when:
- Technical feasibility is uncertain
- Performance impact is unknown
- Integration complexity is unclear
- Team hasn't used the approach before

Spike rules:
- Time-box strictly (1-2 hours max)
- Throw away the code afterward
- Focus on learning, not production quality
- Document findings regardless of outcome

## Innovation Anti-Patterns

### Avoid
- ❌ Choosing the first idea
- ❌ Analysis paralysis (endless comparison)
- ❌ Ignoring proven solutions
- ❌ Over-engineering for hypothetical needs
- ❌ Not considering maintenance burden

### Instead
- ✅ Explore multiple options
- ✅ Time-box decision making
- ✅ Prefer boring technology
- ✅ Build for current needs
- ✅ Consider who maintains this later

## Phase Gate Checklist

Before moving to PLAN:

- [ ] At least 3 approaches explored
- [ ] Trade-offs documented for each
- [ ] Clear recommendation made
- [ ] Rationale documented
- [ ] Key risks identified
- [ ] Assumptions listed

## Integration

```
/research "user authentication"
    ↓
/innovate "auth approaches"  ← You are here
    ↓
/write-plan "auth implementation"  (next phase)
```
