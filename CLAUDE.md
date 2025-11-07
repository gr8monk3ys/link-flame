# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Link Flame is an eco-friendly living blog and e-commerce platform built with Next.js 13+ (App Router), featuring blog content management, user authentication, and Stripe-powered product sales.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database operations
npx prisma migrate dev        # Create and apply migrations
npx prisma generate          # Generate Prisma Client (runs automatically on postinstall)
npx prisma studio            # Open database GUI
npx prisma db seed           # Seed database with initial data
npx prisma db push           # Push schema changes without migrations (dev only)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16.0.1 with App Router (React 19) and MCP Server for AI agent integration
- **Database**: SQLite via Prisma ORM (development setup, easily switchable to PostgreSQL)
- **Authentication**: NextAuth v5 with JWT strategy and credentials provider
- **Payments**: Stripe integration for e-commerce checkout
- **Styling**: Tailwind CSS + Radix UI components
- **Content**: MDX support for rich blog content
- **State**: React Context for cart management, client-side hooks for other state
- **Validation**: Zod for API input validation with comprehensive type safety
- **AI Integration**: Model Context Protocol (MCP) server configured in `.mcp.json` for real-time agent access

### Directory Structure

```
app/                         # Next.js App Router pages and API routes
├── api/                     # API route handlers
│   ├── blog/               # Blog CRUD operations
│   ├── products/           # Product catalog endpoints
│   ├── cart/               # Shopping cart management
│   ├── checkout/           # Stripe checkout sessions
│   └── webhook/            # Stripe webhook handler
├── blogs/                  # Blog listing and individual post pages
├── products/               # Product catalog pages
├── authentication/         # Auth pages (handled by Clerk)
└── layout.tsx             # Root layout with providers

components/                 # React components organized by feature
├── blogs/                 # Blog-specific components
├── cart/                  # Shopping cart UI
├── checkout/              # Checkout flow components
├── collections/           # Product collections
├── home/                  # Homepage sections
├── layout/                # Header, footer, navigation
├── shared/                # Reusable components
└── ui/                    # Radix UI component wrappers

lib/                       # Utility functions and business logic
├── blog.ts               # Blog data fetching (hybrid: mock data + API)
├── posts.ts              # Alternative post management (mock data)
├── products.ts           # Product utilities
├── auth.ts               # NextAuth server-side helpers (getServerAuth, requireRole)
├── session.ts            # Guest session management for anonymous users
├── api-response.ts       # Standardized API response helpers
├── rate-limit.ts         # Rate limiting utilities
├── prisma.ts             # Prisma client singleton
├── providers/            # React Context providers
│   └── CartProvider.tsx  # Cart state management with Context API
└── utils/                # Generic utilities

content/                   # MDX blog content files
├── blogs/                # Blog posts in MDX format

prisma/                    # Database schema and migrations
├── schema.prisma         # Database schema definition
└── seed.ts               # Database seeding script

hooks/                     # Custom React hooks
├── useProducts.ts        # Product data fetching
└── useSavedItems.ts      # Saved items functionality

Note: Cart management now uses React Context Provider (see lib/providers/CartProvider.tsx)

config/                    # Configuration files
├── site.ts               # Site metadata and navigation config
└── docs.ts               # Documentation structure
```

## Key Architectural Patterns

### 1. Dual Blog Content System
The codebase uses **two parallel blog systems** (likely mid-refactor):
- **`lib/posts.ts`**: Simple mock data array of posts
- **`lib/blog.ts`**: Hybrid system that uses mock data during build/SSR and fetches from `/api/blog/*` endpoints in browser
- **API Routes**: `/app/api/blog/` endpoints interact with Prisma database for blog posts

When working with blog features, understand which system is being used in that part of the codebase.

### 2. Authentication Flow (NextAuth v5)
- **Middleware** (`middleware.ts`) uses NextAuth to protect routes and redirect unauthenticated users
- **Strategy**: JWT-based sessions (no database sessions for better performance)
- **Provider**: Credentials provider with bcrypt password hashing
- **Server-side**: Use `getServerAuth()` from `lib/auth.ts` to access user session in API routes
- **Client-side**: Use `useSession()` hook from `next-auth/react` in components
- **Authorization**: Role-based access control via `requireRole()` helper (supports ADMIN, EDITOR, USER roles)
- **Guest Sessions**: Anonymous users get guest session IDs for cart persistence before login

**Auth Routes**:
- Sign in: `/auth/signin`
- Sign up: `/auth/signup`
- Sign out: `/auth/signout`
- Error page: `/auth/error`

**Protected Routes**: `/account/*`, `/checkout` require authentication

### 3. Database Models (Prisma)
Key models in `prisma/schema.prisma`:
- **User**: Auth with password field for credentials provider, role field for RBAC
- **BlogPost**: Blog content with author, category, tags, featured status
- **Product**: E-commerce products with optional sale prices and reviews
- **CartItem**: Shopping cart items (supports both authenticated users and guest sessions)
- **Order**: Order records with items, payment status, and customer details
- **Newsletter**: Email subscriptions for newsletter
- **Contact**: Contact form submissions

Note: Schema uses SQLite (`file:./dev.db`) but can be switched to PostgreSQL by updating `datasource.db.provider`. The Account and Session models have been removed as JWT strategy is used instead of database sessions.

### 4. E-commerce Integration
- **Stripe Checkout**: Creates sessions via `/api/checkout` (currently demo mode without real Stripe integration)
- **Webhooks**: `/api/webhook` handles Stripe events (payment confirmation, order fulfillment)
- **Cart State**: Managed by React Context Provider (`lib/providers/CartProvider.tsx`)
  - Supports both authenticated users and anonymous guest sessions
  - Automatic cart migration when guest users log in (merges duplicate items)
  - Guest sessions use cookies with 30-day expiration
- **Guest Sessions**: Managed via `lib/session.ts` with functions:
  - `getGuestSessionId()`: Creates or retrieves guest session ID
  - `getUserIdForCart()`: Returns user ID or guest session ID
  - `clearGuestSession()`: Clears guest session after login
- Products fetched from Prisma database (`Product` model)

### 5. Content Management
- **MDX Files**: Blog content stored in `content/blogs/` as `.mdx` files
- **Database**: Blog metadata and content also stored in Prisma `BlogPost` model
- Content can be rendered from either source depending on the implementation

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: Database connection string (SQLite by default)
- `NEXTAUTH_URL`: Base URL for NextAuth (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Secret for NextAuth JWT encryption (generate with `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY`: Stripe secret key for backend operations
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for frontend
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for event verification
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL for rate limiting (optional)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token for rate limiting (optional)

## Important Development Notes

### Working with the Database
1. After schema changes, run `npx prisma migrate dev` to create and apply migration
2. Prisma Client regenerates automatically on `npm install` (postinstall hook)
3. For quick prototyping, use `npx prisma db push` (skips migrations)

### Authentication
- NextAuth middleware protects specific routes (configured in `middleware.ts`)
- Protected routes: `/account/*`, `/checkout`
- **Server Components/API Routes**:
  ```typescript
  import { getServerAuth } from '@/lib/auth'
  const { userId, user, session } = await getServerAuth()
  ```
- **Client Components**:
  ```typescript
  import { useSession } from 'next-auth/react'
  const { data: session, status } = useSession()
  ```
- **Role-based access**:
  ```typescript
  const hasAccess = await requireRole(userId, ['ADMIN', 'EDITOR'])
  ```

### Adding New Blog Posts
Two options (depending on which system is active):
1. **MDX files**: Add `.mdx` file to `content/blogs/` with frontmatter
2. **Database**: Use Prisma to create `BlogPost` records or add via API

### API Routes
- All API routes are in `app/api/`
- **Standardized responses**: Use helpers from `lib/api-response.ts`:
  - `successResponse(data, options)`: Success responses (200/201)
  - `errorResponse(message, code, details, status)`: Generic errors
  - `validationErrorResponse(zodError)`: Zod validation errors (400)
  - `unauthorizedResponse(message)`: Auth required (401)
  - `forbiddenResponse(message)`: Permission denied (403)
  - `notFoundResponse(resource)`: Resource not found (404)
  - `rateLimitErrorResponse(reset)`: Rate limit exceeded (429)
  - `handleApiError(error)`: Catch-all error handler (500)
- **Authentication**: Use `getServerAuth()` from `lib/auth.ts`
- **Validation**: Use Zod schemas for all API inputs with comprehensive validation:
  - Numeric fields have min/max bounds (e.g., prices max $1M, quantities max 999)
  - String fields have length limits
  - Sale prices validated to be less than regular price
- **Rate limiting**: Available via Upstash Redis (strict and standard modes)

### Component Organization
- Feature-specific components go in `components/{feature}/`
- Shared/reusable components go in `components/shared/`
- Radix UI wrapper components go in `components/ui/`
- Keep components close to where they're used when possible

### Styling
- Tailwind utility classes (primary approach)
- `tailwind.config.js` extends default theme with custom colors/spacing
- `class-variance-authority` (CVA) for component variants
- `tailwind-merge` + `clsx` for conditional classes (see `lib/utils.ts`)

## Testing
No testing framework is currently configured. When adding tests, consider:
- Jest + React Testing Library for components
- Playwright for e2e tests
- Vitest as faster Jest alternative
