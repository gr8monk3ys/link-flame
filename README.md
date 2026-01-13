# 🌱 Link Flame - E-commerce & Blog Platform

A Next.js 16 full-stack application demonstrating modern web development patterns with blog management, e-commerce functionality, user authentication, and AI coding agent integration via MCP.

## Project Status

**This is a demonstration/learning project** showcasing:
- Modern Next.js App Router architecture
- Stripe payment integration
- NextAuth v5 authentication with JWT strategy
- Prisma ORM with SQLite/PostgreSQL
- TypeScript throughout
- API design patterns

**Known Limitations:**
- No production deployment configuration
- Business model undefined
- Branding/naming needs refinement for production use
- No CSRF protection implemented
- No email delivery service (newsletter/contact forms store data only)

## Tech Stack

### Core
- **Next.js 16.0.1** - App Router, Server Components, API Routes, MCP Server
- **React 19** - UI library with enhanced features
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend
- **Prisma ORM** - Database modeling and migrations
- **SQLite** (dev) / **PostgreSQL** (production-ready)
- **NextAuth v5** - Authentication with JWT strategy and credentials provider
- **Stripe** - Payment processing and webhooks

### Infrastructure
- **Upstash Redis** - Rate limiting
- **Zod** - Runtime validation
- **DOMPurify** - XSS protection
- **Zustand** - Client-side state management

## Implemented Features

### ✅ E-commerce
- Product catalog with categories
- Shopping cart with session management
- Stripe checkout integration
- Order history and tracking
- Webhook handling for payment events

### ✅ Blog System
- Database-backed blog posts with Prisma
- Category and tag-based filtering
- Featured posts
- Author profiles with roles
- Dynamic sitemap generation
- SEO-optimized metadata

### ✅ User Management
- NextAuth v5 authentication (JWT-based, credentials provider)
- Protected routes and API endpoints
- User-specific cart and order data
- Guest session handling with unique IDs

### ✅ Security & Performance
- Rate limiting on API endpoints
- Input validation with Zod schemas
- XSS protection with sanitization
- CSRF considerations (see TODO.md)
- Database indexing for query performance
- Error boundaries for fault tolerance

## Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **SQLite** (for local development)

### Environment Setup

1. **Clone and install:**
```bash
git clone https://github.com/gr8monk3ys/link-flame.git
cd link-flame
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth v5 (https://next-auth.js.org)
# Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (https://stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Upstash Redis (https://upstash.com) - Optional for rate limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

3. **Initialize database:**
```bash
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
```

## Model Context Protocol (MCP) Integration

This project includes Next.js 16's built-in MCP server support, allowing AI coding agents to interact with your running application in real-time.

### What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard that enables AI agents and coding assistants to access your application's internals through a standardized interface. With MCP, coding agents can:

- **Detect and diagnose errors** - Query build errors, runtime errors, and type errors from your dev server
- **Access live application state** - Get real-time information about routes, components, and configuration
- **Query documentation** - Access Next.js knowledge base and best practices
- **Assist with migrations** - Automated upgrade helpers and codemods

### Setup

MCP is already configured in this project via `.mcp.json`:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

### Usage

1. **Start your development server:**
```bash
npm run dev
```

2. **Your MCP-compatible coding agent** (like Claude Code) will automatically discover and connect to the running Next.js instance at `http://localhost:3000/_next/mcp`

3. **Ask your agent questions** like:
   - "What errors are currently in my application?"
   - "Help me upgrade to the latest Next.js features"
   - "What pages are in my app?"

### Available MCP Tools

The Next.js MCP server provides these tools to coding agents:

- **`get_errors`** - Retrieve current build errors, runtime errors, and type errors
- **`get_logs`** - Access development server logs and browser console output
- **`get_page_metadata`** - Get information about specific pages and their rendering
- **`get_project_metadata`** - Retrieve project structure and configuration
- **`get_server_action_by_id`** - Look up Server Actions by ID

For more information, see:
- [Next.js MCP documentation](https://nextjs.org/docs/app/api-reference/cli/next#enabling-mcp-server)
- [Link Flame MCP Setup Guide](.mcp-setup-guide.md) - Detailed configuration for all 10 MCP servers

### Advanced MCP Configuration

This project includes 10 MCP servers beyond just Next.js devtools:

| Server | Purpose | Setup Required |
|--------|---------|----------------|
| **next-devtools** | Next.js introspection | ✅ Ready |
| **sequential-thinking** | Complex problem solving | ✅ Ready |
| **memory** | Persistent session knowledge | ✅ Ready |
| **fetch** | Web content retrieval | ✅ Ready |
| **git** | Version control operations | ✅ Ready |
| **postgres** | Database queries | ⚠️ PostgreSQL + config |
| **playwright** | E2E browser testing | ⚠️ npm install |
| **brave-search** | Web research | ⚠️ API key |
| **github** | GitHub API access | ⚠️ Personal token |
| **filesystem** | File operations | ℹ️ Optional |

**Quick Start:** The first 5 servers work immediately without any configuration.

See [.mcp-setup-guide.md](.mcp-setup-guide.md) for detailed setup instructions and use cases.

## AI Subagents System

Link Flame includes a sophisticated **multi-agent AI system** with 7 specialized agents that collaborate to handle different aspects of development, from security reviews to performance optimization.

### Available Agents

| Agent | Specialty | When to Use |
|-------|-----------|-------------|
| **[Security Guardian](.claude/agents/security-guardian.md)** | Security & Auth | Payment security, authentication, OWASP compliance |
| **[Test Engineer](.claude/agents/test-engineer.md)** | QA & Testing | E2E tests, checkout validation, regression testing |
| **[Feature Engineer](.claude/agents/feature-engineer.md)** | Feature Development | Implementing new features, TODO.md tasks |
| **[Database Specialist](.claude/agents/database-specialist.md)** | Data & Schema | Prisma migrations, schema design, query optimization |
| **[Performance Optimizer](.claude/agents/performance-optimizer.md)** | Speed & Performance | Core Web Vitals, bundle size, API response times |
| **[API Guardian](.claude/agents/api-guardian.md)** | API Design | RESTful endpoints, validation, error handling |
| **[Bug Hunter](.claude/agents/bug-hunter.md)** | Debugging & Fixes | Issue investigation, root cause analysis |

### How to Use Subagents

Simply invoke an agent by name when working with AI coding assistants like Claude Code:

```
"Security Guardian, review the Stripe webhook handler"
"Feature Engineer, implement product reviews functionality"
"Test Engineer, write E2E tests for the checkout flow"
```

### Example Workflows

**Implementing a New Feature:**
```
1. Feature Engineer: Plan and implement the feature
2. Security Guardian: Review for vulnerabilities
3. Database Specialist: Design schema changes
4. API Guardian: Review endpoint consistency
5. Test Engineer: Write E2E tests
6. Performance Optimizer: Verify performance impact
```

**Fixing a Production Bug:**
```
1. Bug Hunter: Investigate and diagnose root cause
2. Feature Engineer: Implement fix
3. Test Engineer: Add regression test
4. Security Guardian: Verify no security implications
```

**See [.claude/AGENTS_GUIDE.md](.claude/AGENTS_GUIDE.md) for comprehensive documentation, workflows, and best practices.**

### Running the Application

**Start development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Detailed Service Configuration

#### NextAuth v5 Authentication Setup

1. **Generate a secret key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Add to `.env`**:
   ```env
   NEXTAUTH_SECRET=your_generated_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Authentication features**:
   - JWT-based sessions (no database sessions needed)
   - Credentials provider with bcrypt password hashing
   - Role-based access control (ADMIN, EDITOR, USER)
   - Guest session support for anonymous cart management

4. **Protected routes** (configured in `middleware.ts`):
   - `/account/*` - User account pages
   - `/checkout` - Checkout flow

5. **Auth pages**:
   - Sign in: `/auth/signin`
   - Sign up: `/auth/signup`
   - Sign out: `/auth/signout`

#### Stripe Payment Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get test API keys from **Developers > API Keys**:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. **Configure webhooks** (important for order processing):

   **Development (using Stripe CLI):**
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   # Copy the webhook signing secret to .env
   ```

   **Production:**
   - Go to **Developers > Webhooks** in Stripe dashboard
   - Add endpoint: `https://yourdomain.com/api/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy signing secret to production `.env`

4. **Create test products** (optional):
   - Stripe dashboard > **Products**
   - Or use the seeded products from `npx prisma db seed`

#### Upstash Redis (Optional - for Rate Limiting)

1. Create account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token to `.env`:
   ```env
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. If not configured, rate limiting will be disabled (development only)

### Database Commands
```bash
npx prisma studio           # Open database GUI
npx prisma migrate dev      # Create and apply migrations
npx prisma generate         # Regenerate Prisma Client
npx prisma db push          # Push schema changes (dev only)
```

## Project Structure

```
link-flame/
├── app/                    # Next.js 13 app directory
│   ├── blogs/             # Blog posts and listings
│   ├── eco-living/        # Sustainable living guides
│   ├── community/         # Community features
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions and data
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Architecture Overview

### Directory Structure
```
app/
├── api/                    # API routes
│   ├── blog/              # Blog CRUD (partially implemented)
│   ├── cart/              # Shopping cart operations
│   ├── checkout/          # Stripe checkout sessions
│   ├── contact/           # Contact form submissions
│   ├── newsletter/        # Newsletter subscriptions
│   ├── orders/            # Order history endpoints
│   └── webhook/           # Stripe webhook handler
├── account/               # User account pages
├── blogs/                 # Blog listing and posts
├── cart/                  # Shopping cart page
├── checkout/              # Checkout flow
├── contact/               # Contact form page
├── products/              # Product catalog
└── layout.tsx             # Root layout (providers, auth)

components/
├── blogs/                 # Blog-specific components
├── cart/                  # Cart UI components
├── checkout/              # Checkout components
├── layout/                # Header, footer, error boundary
├── shared/                # Reusable components
└── ui/                    # Radix UI wrappers

lib/
├── api-response.ts        # Standardized API responses
├── auth.ts                # Auth helpers
├── blog.ts                # Blog data fetching
├── cart.ts                # Cart utilities
├── prisma.ts              # Prisma client singleton
├── rate-limit.ts          # Rate limiting logic
├── session.ts             # Guest session management
└── utils/                 # General utilities

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts                # Sample data seeder

types/
├── blog.ts                # Blog-related types
├── cart.ts                # Cart types
├── contact.ts             # Contact form types
├── newsletter.ts          # Newsletter types
├── order.ts               # Order and OrderItem types
├── product.ts             # Product types
└── index.ts               # Central type exports
```

## Contributing

This project welcomes contributions that address items in [TODO.md](./TODO.md). **Current progress: 45/53 tasks complete (85%)**

**High Priority:**
1. Add CSRF protection to API routes
2. Fix product type definitions mismatch (TypeScript vs Prisma)
3. Optimize cart syncing efficiency

**Medium Priority:**
4. Implement wishlist feature
5. Sync saved items to database
6. Implement caching strategy

**Low Priority:**
7. Set up test infrastructure (Jest/Vitest)
8. Add comprehensive test coverage
9. Create API documentation
10. Optimize bundle size

See [TODO.md](./TODO.md) for complete task list with detailed descriptions and complexity ratings.

## License

GNU GPL 3.0
