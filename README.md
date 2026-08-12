# 🌱 Link Flame

<p align="center">
  <img src="docs/assets/hero.png" alt="Link Flame storefront" width="640">
</p>

An eco-friendly e-commerce storefront and blog. Every product carries measured
sustainability data — certifications, values, and per-unit yearly impact versus
its single-use equivalent — and the storefront is built to surface it: filter
by values, see what a year of swaps adds up to, shop imperfect stock at a
discount.

Built with Next.js 16 (App Router), PostgreSQL, Stripe, and NextAuth v5.

## Features

**Shopping** — product catalog with variants, value/certification filters,
cart with guest sessions (auto-merged on login), Stripe checkout, order
history, product bundles, gift cards, imperfect/seconds sales,
Subscribe & Save product subscriptions.

**Sustainability** — per-product impact metrics aggregated into a homepage
impact band, personal and community impact dashboards, carbon-neutral
shipping messaging, TerraCycle recycling program, brand directory with
vetted certifications.

**Engagement** — product-match quiz, loyalty tiers with point redemption,
referral program, wishlists (shareable), saved-for-later, newsletter.

**Content** — database-backed blog with categories and author profiles,
sustainable-living guides, dynamic sitemap, SEO metadata with JSON-LD.

**Platform** — admin dashboard (blog, products, orders), role-based access
(ADMIN/EDITOR/USER), rate limiting, CSRF protection on mutations, CSP with
per-request nonces, standardized API responses, Zod validation throughout.

## Tech stack

- **Next.js 16** — App Router, React 19, Turbopack
- **PostgreSQL** via Neon (pooled + direct connections) with **Prisma ORM**
- **NextAuth v5** — JWT strategy, credentials provider, bcrypt; split config
  for Edge Runtime compatibility
- **Stripe** — checkout + webhooks (separate signing secret per endpoint)
- **Tailwind CSS v3** + Radix UI, Inter/Lora type pairing
- **Vitest** (~500 unit tests) + **Playwright** (~140 E2E, run against a
  production build, including a WCAG contrast audit in both themes)

## Getting started

```bash
git clone https://github.com/gr8monk3ys/link-flame.git
cd link-flame
npm install
cp .env.example .env   # then fill in the values below
```

Minimum `.env` for local development:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/linkflame?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/linkflame?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

Optional integrations degrade gracefully when unset: Stripe (checkout),
Upstash Redis (rate limiting), Resend (email), Sentry (error tracking).

```bash
npx prisma migrate dev   # create schema
npx prisma db seed       # sample products, brands, blog posts, impact data
npm run dev              # http://localhost:3000
```

## Testing

```bash
npx vitest run           # unit tests
npx playwright test      # E2E — builds and runs a production server
npx tsc --noEmit         # type check
npm run lint             # ESLint
```

E2E runs against `next build && next start` by default so production-only
behavior (CSP, caching) is exercised; set `PLAYWRIGHT_DEV_SERVER=true` to
use the dev server instead.

## Deploying

```bash
npm run check:prod-env       # validates required production env vars
npm run check:stripe-config  # verifies Stripe account configuration
npm run preflight:production # full gate
```

Production requires, in addition to the local minimum:

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` — signing secret for the endpoint at `/api/webhook`
- `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` — a **separate** endpoint at
  `/api/subscriptions/webhook` with its own signing secret

Register both webhook endpoints in the Stripe dashboard; the pre-deploy gate
refuses to pass with a shared or missing secret, by design.

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhook
stripe trigger checkout.session.completed
```

Vercel notes: builds use `bun` with `NODE_ENV=production`; all API routes
export `dynamic = 'force-dynamic'`; configure `DATABASE_URL` and `DIRECT_URL`
in the dashboard. See [CLAUDE.md](./CLAUDE.md) for the full architecture
reference (auth split-config pattern, guest cart sessions, API conventions,
key files).

## AI tooling

The repo ships configuration for AI-assisted development: a Next.js MCP
server plus supporting MCP servers (see [.mcp-setup-guide.md](./.mcp-setup-guide.md))
and specialized agent definitions in [.claude/agents/](./.claude/agents/).
None of it is required to build or run the app.

## License

GNU GPL 3.0
