# CLAUDE.md

Link Flame: an eco-friendly e-commerce storefront + blog. Next.js 16 (App Router, React 19), PostgreSQL via Neon + Prisma, NextAuth v5, Stripe, Tailwind v3 (not v4). Live at https://link-flame-rouge.vercel.app. Package manager is npm (`package-lock.json`); CI, Vercel, and the Dockerfile all use `npm ci`.

## Run / test

```bash
npm ci && cp .env.example .env    # DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL are required
npx prisma migrate dev && npx prisma db seed
npm run dev                       # localhost:3000
npm run lint && npx tsc --noEmit  # tests/ is excluded from tsconfig
npx vitest run                    # unit (~500 tests, happy-dom)
npx playwright test               # E2E against `next build && next start`; PLAYWRIGHT_DEV_SERVER=true for dev server
npm run build
```

## Where things live

- `auth.config.ts` is Edge-safe (used by `proxy.ts`); `auth.ts` adds Credentials + Prisma + bcrypt. Never import Node-only modules into `auth.config.ts`.
- `proxy.ts` protects `/account/*` and `/admin/*` and sets the CSP + request-id headers. Policy lives in `lib/csp.ts`: only the routes in `NONCE_ROUTE_PREFIXES` get a per-request nonce (and each has a `force-dynamic` layout); everything else is prerenderable. Never read `headers()`/`cookies()` in `app/layout.tsx` — it makes every route dynamic.
- `lib/auth.ts` (`getServerAuth`, `requireRole`), `lib/csrf.ts`, `lib/api-response.ts`, `lib/env.ts` (Zod; warns, never throws at build), `lib/session.ts` (30-day guest cart cookie), `lib/providers/CartProvider.tsx`.
- API routes in `app/api/*`; each exports `dynamic = 'force-dynamic'` or the Vercel build tries to prerender it without a DB.
- `prisma/schema.prisma` (Postgres, money is `@db.Decimal(10,2)`), `prisma/seed.ts`. `prisma/migrations_legacy_sqlite/` is history only.
- Styling: HSL tokens in `styles/globals.css`, fonts in `lib/fonts.ts`, `cn()` in `lib/utils.ts`.

## Gotchas

- PR #58 removed the multi-tenant SaaS layer (orgs, seat billing, API keys, audit log). Do not add it back; this is one storefront.
- `turbopack: {}` in `next.config.js` must stay even though it is empty.
- Stripe needs two webhook secrets: `STRIPE_WEBHOOK_SECRET` (`/api/webhook`) and `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` (`/api/subscriptions/webhook`); `npm run preflight:production` refuses a shared one.
- `postinstall` runs `scripts/prisma-wasm-base64.js` then `prisma generate`.

<!-- BEGIN:nextjs-agent-rules -->
This Next.js version has breaking changes vs. training data. Read `node_modules/next/dist/docs/` before writing framework code. (Block is re-added by `next dev`.)
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/link-flame`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
