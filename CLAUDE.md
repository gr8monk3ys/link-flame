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
- **Framework**: Next.js 15.1.1 with App Router (React 18.2)
- **Database**: SQLite via Prisma ORM (development setup, easily switchable to PostgreSQL)
- **Authentication**: Clerk (`@clerk/nextjs`) - handles user auth, sessions, and protected routes
- **Payments**: Stripe integration for e-commerce checkout
- **Styling**: Tailwind CSS + Radix UI components
- **Content**: MDX support for rich blog content
- **State**: Zustand for client-side state (cart, saved items)

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
├── auth.ts               # Auth helpers
├── cart.ts               # Cart state management utilities
├── prisma.ts             # Prisma client singleton
└── utils/                # Generic utilities

content/                   # MDX blog content files
├── blogs/                # Blog posts in MDX format

prisma/                    # Database schema and migrations
├── schema.prisma         # Database schema definition
└── seed.ts               # Database seeding script

hooks/                     # Custom React hooks
├── useCart.ts            # Cart management hook (Zustand)
├── useProducts.ts        # Product data fetching
└── useSavedItems.ts      # Saved items functionality

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

### 2. Authentication Flow (Clerk)
- Middleware (`middleware.ts`) runs Clerk authentication on all routes except static assets and Next.js internals
- Protected routes automatically redirect unauthenticated users
- User data accessible via `useUser()` hook or `auth()` helper in Server Components
- Clerk handles sign-in/sign-up UI out of the box

### 3. Database Models (Prisma)
Key models in `prisma/schema.prisma`:
- **User**: Auth (managed by Clerk) + app-specific data
- **BlogPost**: Blog content with author, category, tags, featured status
- **Product**: E-commerce products with reviews
- **CartItem**: Shopping cart items (per-user)
- **Order**: Stripe checkout sessions and order history

Note: Schema uses SQLite (`file:./dev.db`) but can be switched to PostgreSQL by updating `datasource.db.provider`.

### 4. E-commerce Integration
- **Stripe Checkout**: Creates sessions via `/api/checkout`
- **Webhooks**: `/api/webhook` handles Stripe events (payment confirmation, order fulfillment)
- **Cart State**: Managed by Zustand (`useCart` hook in `hooks/useCart.ts`)
- Products can be fetched from:
  - Prisma database (`Product` model)
  - Shopify Storefront API (configured via env vars)

### 5. Content Management
- **MDX Files**: Blog content stored in `content/blogs/` as `.mdx` files
- **Database**: Blog metadata and content also stored in Prisma `BlogPost` model
- Content can be rendered from either source depending on the implementation

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: Database connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: Clerk authentication
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Stripe payments
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`: Shopify integration (optional)
- `NEXTAUTH_SECRET`: NextAuth secret (if using NextAuth alongside Clerk)

## Important Development Notes

### Working with the Database
1. After schema changes, run `npx prisma migrate dev` to create and apply migration
2. Prisma Client regenerates automatically on `npm install` (postinstall hook)
3. For quick prototyping, use `npx prisma db push` (skips migrations)

### Authentication
- Clerk middleware protects all routes by default
- To make a route public, configure in `middleware.ts` matcher config
- Access user data: `const { userId } = auth()` in Server Components, `const { user } = useUser()` in Client Components

### Adding New Blog Posts
Two options (depending on which system is active):
1. **MDX files**: Add `.mdx` file to `content/blogs/` with frontmatter
2. **Database**: Use Prisma to create `BlogPost` records or add via API

### API Routes
- All API routes are in `app/api/`
- Use `NextResponse` for responses
- Authentication: Check `auth()` from `@clerk/nextjs/server`
- Rate limiting available via Upstash Redis (`@upstash/ratelimit`)

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
