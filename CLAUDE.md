# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Link Flame is an eco-friendly e-commerce and blog platform built with Next.js 16 (App Router), PostgreSQL, Stripe payments, and NextAuth v5.

## Commands

```bash
npm run dev                   # Dev server on localhost:3000
npm run build                 # Production build (verify before pushing to Vercel)
npm run lint                  # ESLint
npx tsc --noEmit              # Type check (tests dir is excluded from tsconfig)

# Unit tests (Vitest, happy-dom)
npx vitest run                # All unit tests (~680 tests)
npx vitest run tests/unit/csrf.test.ts          # Single file
npx vitest run -t "token generation"            # By test name pattern

# E2E tests (Playwright, auto-starts dev server on port 4010)
npx playwright test                             # All E2E tests
npx playwright test tests/e2e/auth.spec.ts      # Single file
npx playwright test --grep "sign in"            # By title pattern

# Database (PostgreSQL via Neon)
npx prisma migrate dev        # Create + apply migration
npx prisma db push            # Push schema without migration (dev only)
npx prisma studio             # Database GUI
npx prisma db seed            # Seed with sample data
npx prisma generate           # Regenerate client (also runs on npm install)
```

## Tech Stack

- **Next.js 16.0.1** (App Router, React 19, Turbopack)
- **PostgreSQL** via Neon (serverless) with **Prisma ORM**
- **NextAuth v5** (JWT strategy, credentials provider, bcrypt)
- **Stripe** for checkout + webhooks
- **Tailwind CSS v3** (pinned, NOT v4) + Radix UI primitives
- **Zod** for API validation, **DOMPurify** for XSS protection

## Architecture

### Authentication (split config pattern)

Auth is split across two files for Edge Runtime compatibility:

- `auth.config.ts` — Minimal config (pages, providers skeleton). Runs in Edge Runtime (middleware). **Must NOT import Prisma, bcrypt, or Node-only modules.**
- `auth.ts` — Full config with Credentials provider, Prisma lookup, bcrypt. Server-side only.
- `middleware.ts` — Imports `auth.config.ts`, protects `/account/*`, `/checkout`, `/admin`. Also generates CSP nonce and request ID headers.

```typescript
// Server Components / API routes
import { getServerAuth } from '@/lib/auth'
const { userId, user, session } = await getServerAuth()

// Role check
import { requireRole } from '@/lib/auth'
await requireRole(userId, ['ADMIN', 'EDITOR'])

// Client Components
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

### Database

PostgreSQL via Neon with connection pooling:
- `DATABASE_URL` — Pooled connection (pgbouncer) for runtime queries
- `DIRECT_URL` — Direct connection for migrations (`directUrl` in schema.prisma)
- All monetary `Decimal` fields use `@db.Decimal(10, 2)`
- Prisma client singleton in `lib/prisma.ts` (cached in `globalThis` for dev HMR)

### Cart + Guest Sessions

Cart supports both authenticated users and anonymous guests:
- `lib/session.ts` — `getGuestSessionId()` creates/reads guest session cookie (30-day httpOnly)
- `getUserIdForCart(authUserId)` — Returns auth user ID or guest session ID
- `lib/providers/CartProvider.tsx` — React Context with `useReducer`, CSRF-protected API calls, debounced sync
- Guest cart auto-merges into user cart on login via `/api/cart/migrate`

### API Routes

All 78 API routes are in `app/api/`. Every route exports `const dynamic = 'force-dynamic'` to prevent static rendering during Vercel builds.

Patterns to follow:
- Use response helpers from `lib/api-response.ts`: `successResponse()`, `errorResponse()`, `validationErrorResponse()`, `unauthorizedResponse()`, `notFoundResponse()`, `handleApiError()`
- Validate input with Zod schemas
- Auth: call `getServerAuth()` from `lib/auth.ts`
- CSRF: validate with `validateCsrfToken()` from `lib/csrf.ts` on mutation endpoints
- Rate limiting: via Upstash Redis (optional; gracefully disabled without config)

### Styling

- Tailwind CSS v3 with CSS custom properties (HSL format) in `styles/globals.css`
- Design tokens: `--primary` (forest green), `--secondary` (warm beige), `--accent` (honey amber)
- Two font families: Inter (sans, body) and Lora (serif, headlines) via `lib/fonts.ts`
- Custom warm box shadows: `shadow-warm-sm`, `shadow-warm`, `shadow-warm-md`, `shadow-warm-lg`
- Component variants: `class-variance-authority` (CVA)
- Class merging: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)

### Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` — Neon pooled PostgreSQL connection string
- `DIRECT_URL` — Neon direct (unpooled) connection string
- `NEXTAUTH_SECRET` — Min 32 chars (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — Base URL (http://localhost:3000)

Optional:
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- `RESEND_API_KEY` (email notifications)

Validation: `lib/env.ts` validates env vars at startup with Zod but never throws during build (warns instead).

## Vercel Deployment

- Builds use `bun` as package manager with `NODE_ENV=production`
- All API routes must have `export const dynamic = 'force-dynamic'` — without this, Next.js tries to statically render them during build, which fails because the DB isn't available
- `turbopack: {}` in `next.config.js` is **required** (even if empty) when webpack config plugins are present — removing it breaks the build
- Configure `DATABASE_URL` and `DIRECT_URL` in Vercel dashboard environment variables

## Key Files

| File | Purpose |
|------|---------|
| `auth.config.ts` | Edge-safe auth config (no Node modules) |
| `auth.ts` | Full auth with Credentials provider + Prisma |
| `middleware.ts` | Route protection, CSP nonce, request ID |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/auth.ts` | `getServerAuth()`, `requireRole()` helpers |
| `lib/session.ts` | Guest session management |
| `lib/api-response.ts` | Standardized API response builders |
| `lib/csrf.ts` | CSRF token generation + validation |
| `lib/env.ts` | Zod-validated environment variables |
| `lib/providers/CartProvider.tsx` | Cart state (Context + useReducer) |
| `config/constants.ts` | App-wide constants (currency, limits, thresholds) |
| `prisma/schema.prisma` | Database schema (PostgreSQL) |
| `prisma/seed.ts` | Sample data seeder |
