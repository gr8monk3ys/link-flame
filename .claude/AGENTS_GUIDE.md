# Link Flame Subagents Guide

This guide explains the specialized AI subagents configured for the Link Flame e-commerce platform. Each agent is an expert in a specific domain and can be invoked to handle complex tasks within their specialty.

## Table of Contents

1. [Overview](#overview)
2. [Available Agents](#available-agents)
3. [How to Use Subagents](#how-to-use-subagents)
4. [Common Workflows](#common-workflows)
5. [Best Practices](#best-practices)
6. [Agent Collaboration Patterns](#agent-collaboration-patterns)

---

## Overview

Link Flame uses **7 specialized subagents** that work together to handle different aspects of the e-commerce platform:

| Agent | Domain | Use When |
|-------|--------|----------|
| **Security Guardian** | Security & Auth | Payment processing, authentication, data protection |
| **Test Engineer** | QA & Testing | E2E tests, checkout flow validation, regression testing |
| **Feature Engineer** | Feature Development | Implementing new features, TODO.md tasks |
| **Database Specialist** | Data & Schema | Prisma migrations, schema design, query optimization |
| **Performance Optimizer** | Speed & Optimization | Core Web Vitals, bundle size, API response times |
| **API Guardian** | API Design | RESTful endpoints, validation, error handling |
| **Bug Hunter** | Debugging & Fixes | Issue investigation, root cause analysis, bug fixes |

---

## Available Agents

### 1. Security Guardian
**Location**: `.claude/agents/security-guardian.md`

**Expertise:**
- Payment security (Stripe integration)
- Authentication & authorization (NextAuth)
- Data protection and encryption
- OWASP Top 10 vulnerabilities
- PCI DSS compliance

**When to invoke:**
```
"Security Guardian, please review the checkout API for security vulnerabilities"
"Have Security Guardian audit the authentication middleware"
"Security Guardian, check if we're properly handling user data"
```

**Critical for:**
- All payment processing code
- Authentication flows
- API routes handling sensitive data
- Before production deployments

---

### 2. Test Engineer
**Location**: `.claude/agents/test-engineer.md`

**Expertise:**
- E2E testing with Playwright
- Critical path testing (checkout, cart, auth)
- Cross-browser compatibility
- Test infrastructure and fixtures
- Quality gates

**When to invoke:**
```
"Test Engineer, write E2E tests for the complete checkout flow"
"Have Test Engineer verify cart persistence across sessions"
"Test Engineer, create tests for the authentication flow"
```

**Critical for:**
- New feature validation
- Regression prevention
- Checkout flow testing
- Before major releases

---

### 3. Feature Engineer
**Location**: `.claude/agents/feature-engineer.md`

**Expertise:**
- Feature implementation (e-commerce & blog)
- Next.js 16 & React 19 patterns
- Component architecture
- TODO.md task management
- Code quality standards

**When to invoke:**
```
"Feature Engineer, implement product reviews functionality"
"Have Feature Engineer add wishlist support to the platform"
"Feature Engineer, work through the next TODO.md task"
```

**Critical for:**
- Building new features
- Implementing TODO.md tasks
- Refactoring existing code
- Component development

---

### 4. Database Specialist
**Location**: `.claude/agents/database-specialist.md`

**Expertise:**
- Prisma schema design
- Database migrations
- Query optimization
- Data integrity
- Relationship modeling

**When to invoke:**
```
"Database Specialist, design a schema for product variants"
"Have Database Specialist optimize the products query"
"Database Specialist, create a migration for adding reviews"
```

**Critical for:**
- Schema changes
- Database migrations
- Query performance issues
- Data modeling decisions

---

### 5. Performance Optimizer
**Location**: `.claude/agents/performance-optimizer.md`

**Expertise:**
- Core Web Vitals (LCP, FID, CLS, INP)
- Bundle size optimization
- Image optimization
- API response time improvement
- React performance (memoization, re-renders)

**When to invoke:**
```
"Performance Optimizer, improve the homepage load time"
"Have Performance Optimizer analyze bundle size"
"Performance Optimizer, optimize the product listing page"
```

**Critical for:**
- Page load performance
- Bundle size concerns
- API slowness
- Before major launches

---

### 6. API Guardian
**Location**: `.claude/agents/api-guardian.md`

**Expertise:**
- RESTful API design
- Input validation (Zod)
- Error handling patterns
- API documentation
- Rate limiting & CORS

**When to invoke:**
```
"API Guardian, design the product reviews API"
"Have API Guardian review all endpoints for consistency"
"API Guardian, add validation to the cart API"
```

**Critical for:**
- New API endpoints
- API refactoring
- Validation issues
- API documentation

---

### 7. Bug Hunter
**Location**: `.claude/agents/bug-hunter.md`

**Expertise:**
- Root cause analysis
- Issue reproduction
- Bug fixing strategies
- Regression prevention
- Production incident response

**When to invoke:**
```
"Bug Hunter, investigate why cart items disappear on refresh"
"Have Bug Hunter debug the checkout payment issue"
"Bug Hunter, find why orders aren't being created"
```

**Critical for:**
- Production bugs
- Hard-to-reproduce issues
- Root cause analysis
- Critical incident response

---

## How to Use Subagents

### Basic Invocation

Simply mention the agent by name in your request:

```
"Security Guardian, please review the Stripe webhook handler for vulnerabilities"
```

Claude Code will automatically invoke the appropriate subagent with the relevant context.

### Multiple Agents

You can invoke multiple agents for complex tasks:

```
"I need to implement product reviews.
- Feature Engineer: implement the feature
- Security Guardian: review for XSS vulnerabilities
- Test Engineer: write E2E tests
- Database Specialist: design the schema"
```

### Agent Consultation

Agents can consult each other. For example:

```
"Feature Engineer, implement checkout flow and consult with:
- Security Guardian on payment security
- Performance Optimizer on page load times
- Test Engineer on test scenarios"
```

---

## Common Workflows

### Workflow 1: Implementing a New Feature

**Scenario:** Add product reviews functionality

**Step 1: Planning**
```
"Feature Engineer, analyze requirements for product reviews feature"
```

**Step 2: Database Design**
```
"Database Specialist, design schema for product reviews with ratings and comments"
```

**Step 3: Security Review**
```
"Security Guardian, what security considerations do we need for user-generated reviews?"
```

**Step 4: Implementation**
```
"Feature Engineer, implement the reviews feature with the approved schema"
```

**Step 5: API Design**
```
"API Guardian, review the reviews API endpoints for consistency and validation"
```

**Step 6: Testing**
```
"Test Engineer, write E2E tests for submitting and viewing reviews"
```

**Step 7: Performance**
```
"Performance Optimizer, ensure reviews don't slow down product pages"
```

---

### Workflow 2: Fixing a Production Bug

**Scenario:** Cart items disappearing after page refresh

**Step 1: Investigation**
```
"Bug Hunter, investigate why cart items disappear on page refresh"
```

**Step 2: Root Cause Analysis**
```
(Bug Hunter identifies: localStorage not syncing with server)
```

**Step 3: Fix Implementation**
```
"Feature Engineer, implement proper cart persistence based on Bug Hunter's findings"
```

**Step 4: Testing**
```
"Test Engineer, create regression test for cart persistence"
```

**Step 5: Deployment**
```
"Security Guardian, verify the fix doesn't introduce security issues"
```

---

### Workflow 3: Performance Optimization

**Scenario:** Homepage loads too slowly

**Step 1: Analysis**
```
"Performance Optimizer, analyze homepage performance and identify bottlenecks"
```

**Step 2: Database Optimization**
```
"Database Specialist, optimize the queries used on the homepage"
```

**Step 3: Implementation**
```
"Feature Engineer, implement Performance Optimizer's recommendations"
```

**Step 4: Verification**
```
"Performance Optimizer, verify improvements meet Core Web Vitals targets"
```

---

### Workflow 4: Security Audit

**Scenario:** Pre-launch security review

**Step 1: Comprehensive Audit**
```
"Security Guardian, perform a comprehensive security audit of:
- All payment processing endpoints
- Authentication flows
- API routes handling user data
- Stripe webhook handling"
```

**Step 2: Vulnerability Fixes**
```
(Security Guardian identifies issues, then...)
"Bug Hunter, fix the XSS vulnerability identified by Security Guardian"
```

**Step 3: Testing Security Controls**
```
"Test Engineer, write tests for the security controls identified by Security Guardian"
```

**Step 4: API Security**
```
"API Guardian, ensure all endpoints have proper authentication and rate limiting"
```

---

### Workflow 5: Database Migration

**Scenario:** Add product variants (size, color)

**Step 1: Schema Design**
```
"Database Specialist, design schema for product variants with inventory tracking"
```

**Step 2: Migration Planning**
```
"Database Specialist, create migration plan that preserves existing product data"
```

**Step 3: Feature Implementation**
```
"Feature Engineer, implement variant selection UI and cart integration"
```

**Step 4: API Updates**
```
"API Guardian, update product APIs to support variant selection"
```

**Step 5: Testing**
```
"Test Engineer, test variant selection and inventory management"
```

---

## Best Practices

### 1. Use the Right Agent for the Job

**✅ Good:**
```
"Security Guardian, review the payment processing code"
```

**❌ Bad:**
```
"Feature Engineer, check if the payment code is secure"
(Feature Engineer isn't security-focused)
```

### 2. Provide Context

**✅ Good:**
```
"Bug Hunter, investigate cart issue:
- Symptom: Items disappear on refresh
- Environment: Production
- Steps: Add item → refresh page → cart empty
- Expected: Cart should persist items"
```

**❌ Bad:**
```
"Bug Hunter, fix the cart"
(Too vague, missing context)
```

### 3. Let Agents Collaborate

**✅ Good:**
```
"Feature Engineer, implement checkout and consult Security Guardian on payment security"
```

**❌ Bad:**
```
"Feature Engineer, implement checkout"
(Then later) "Security Guardian, review checkout"
(Should have been coordinated from the start)
```

### 4. Follow Agent Recommendations

Agents have deep expertise. If Security Guardian flags something as critical, treat it as critical.

**✅ Good:**
```
Security Guardian: "Critical: Missing webhook signature verification"
You: "Bug Hunter, fix this immediately before deployment"
```

**❌ Bad:**
```
Security Guardian: "Critical: Missing webhook signature verification"
You: "Let's deploy anyway and fix later"
(Never ignore critical security issues)
```

### 5. Use for Complex Tasks

**✅ Good:**
```
"Performance Optimizer, improve Core Web Vitals on product pages"
(Complex, requires deep expertise)
```

**❌ Bad:**
```
"Performance Optimizer, change this color to red"
(Simple, doesn't need a specialist)
```

---

## Agent Collaboration Patterns

### Pattern 1: Sequential Handoff
One agent completes work, hands off to next agent.

```
Database Specialist (designs schema)
  ↓
Feature Engineer (implements feature)
  ↓
Test Engineer (writes tests)
  ↓
Security Guardian (reviews security)
```

### Pattern 2: Parallel Consultation
Multiple agents work simultaneously on different aspects.

```
Feature Engineer (implements feature)
    ↓
    ├─ Security Guardian (reviews security)
    ├─ Performance Optimizer (checks performance)
    └─ Test Engineer (writes tests)
```

### Pattern 3: Iterative Review
Agent implements, another reviews, first agent revises.

```
Feature Engineer (implements)
  ↓
Security Guardian (reviews, finds issues)
  ↓
Feature Engineer (fixes issues)
  ↓
Security Guardian (approves)
```

### Pattern 4: Expert Consultation
Primary agent consults specialist for specific question.

```
Feature Engineer: "I'm implementing checkout. Security Guardian,
should I store credit card data or only use Stripe tokens?"

Security Guardian: "Never store credit card data. Only use Stripe tokens."

Feature Engineer: "Understood, implementing token-only approach."
```

---

## Emergency Protocols

### Production Critical (P0)

**Immediate Actions:**
1. Invoke Bug Hunter to diagnose
2. Security Guardian assesses if security-related
3. Feature Engineer implements hot fix
4. Test Engineer verifies fix
5. Deploy immediately

**Example:**
```
"PRODUCTION CRITICAL: Checkout is broken, customers can't complete purchases
- Bug Hunter: diagnose immediately
- Security Guardian: check if this is a security incident
- Feature Engineer: implement fix
- Test Engineer: verify checkout works
Deploy as soon as verified"
```

### High Priority (P1)

**Actions:**
1. Bug Hunter investigates within 2 hours
2. Appropriate specialist implements fix
3. Test Engineer adds regression test
4. Deploy within 24 hours

---

## Subagent File Structure

All agents are located in `.claude/agents/`:

```
.claude/
  agents/
    security-guardian.md      # Security & auth expert
    test-engineer.md          # QA & testing specialist
    feature-engineer.md       # Feature implementation
    database-specialist.md    # Database & Prisma expert
    performance-optimizer.md  # Performance specialist
    api-guardian.md           # API design expert
    bug-hunter.md             # Debugging specialist
  AGENTS_GUIDE.md             # This file
```

---

## Integration with MCP Servers

Subagents work alongside the MCP servers configured in `.mcp.json`:

**Complementary Systems:**
- **MCP Servers**: Provide real-time data (errors, logs, dev server state)
- **Subagents**: Provide expert analysis and implementation

**Example Workflow:**
```
1. next-devtools MCP shows build errors
2. Invoke Bug Hunter to diagnose
3. Bug Hunter analyzes errors using next-devtools data
4. Feature Engineer fixes based on Bug Hunter's findings
5. Test Engineer adds regression test
```

---

## Success Metrics

Your subagents system is working well when:

✅ Bugs are fixed at root cause (not band-aided)
✅ Security reviews catch issues before production
✅ New features have tests before deployment
✅ Performance stays within budgets
✅ APIs follow consistent patterns
✅ Database migrations don't lose data
✅ Production incidents are rare

---

## Getting Help

If you're unsure which agent to use:

```
"Which agent should I use for [describe your task]?"
```

Claude Code will recommend the appropriate agent(s).

---

## Examples by Feature Area

### E-commerce Features

**Product Catalog:**
- Schema: Database Specialist
- Implementation: Feature Engineer
- API: API Guardian
- Performance: Performance Optimizer

**Shopping Cart:**
- State Management: Feature Engineer
- Persistence: Database Specialist
- Security: Security Guardian
- Testing: Test Engineer

**Checkout & Payments:**
- Integration: Feature Engineer
- Security: Security Guardian (CRITICAL)
- Testing: Test Engineer
- Performance: Performance Optimizer

**Order Management:**
- Schema: Database Specialist
- API: API Guardian
- Webhooks: Security Guardian + Feature Engineer
- Testing: Test Engineer

### Blog Features

**Content Management:**
- Schema: Database Specialist
- MDX Rendering: Feature Engineer
- Performance: Performance Optimizer
- SEO: Performance Optimizer

**Comments/Reviews:**
- Schema: Database Specialist
- Implementation: Feature Engineer
- Security: Security Guardian (XSS prevention)
- Moderation: Feature Engineer

---

## Advanced Topics

### Custom Workflows

You can define custom workflows for your team:

```markdown
## Our Team Workflow: New Feature

1. Feature Engineer + Database Specialist: Design
2. Security Guardian: Security review
3. Feature Engineer: Implementation
4. API Guardian: API review
5. Test Engineer: E2E tests
6. Performance Optimizer: Performance check
7. Deploy if all pass
```

### Agent Priorities

When agents disagree, use this priority order:

1. **Security Guardian** - Security is non-negotiable
2. **Database Specialist** - Data integrity is critical
3. **Performance Optimizer** - Performance impacts all users
4. **Test Engineer** - Quality gates must pass
5. **API Guardian** - Consistency matters
6. **Feature Engineer** - Implementation flexibility
7. **Bug Hunter** - Fix approach flexibility

---

## Maintenance

### Updating Agents

Agent prompts can be updated in their respective `.md` files:

```bash
# Edit an agent
code .claude/agents/security-guardian.md

# Test changes
"Security Guardian, review this code..."
```

### Adding New Agents

To add a new specialist agent:

1. Create `.claude/agents/new-agent.md`
2. Add YAML frontmatter with name, description, tools
3. Write comprehensive system prompt
4. Update this guide with the new agent
5. Test with sample tasks

---

**Last Updated:** 2025-11-07
**Link Flame Version:** Next.js 16.0.1 with React 19
**Agents Version:** 1.0.0

---

**Remember**: Subagents are experts, not just tools. Treat them as specialized team members. Give them context, trust their expertise, and let them collaborate to build a better Link Flame platform.
