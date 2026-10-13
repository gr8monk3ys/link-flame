# CLAUDE.md

Link Flame: an eco-friendly e-commerce storefront + blog. Next.js 16 (App Router, React 19), PostgreSQL via Neon + Prisma, NextAuth v5, Stripe, Tailwind v4 (CSS-first: no `tailwind.config.js`). Live at https://link-flame-rouge.vercel.app (also https://link-flame.vivancedata.com). Public repo: everything committed is public. Package manager is npm (`package-lock.json`); CI, Vercel, and the Dockerfile all use `npm ci`.

## Run / test

```bash
npm ci && cp .env.example .env    # DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL are required
npx prisma migrate dev && npx prisma db seed
npm run dev                       # localhost:3000
npm run lint && npx tsc --noEmit  # tests/ is excluded from tsconfig
npx vitest run                    # unit (~600 tests, happy-dom)
npm run test:integration          # needs a real DATABASE_URL
npx playwright test               # E2E against `next build && next start`; PLAYWRIGHT_DEV_SERVER=true for dev server
npm run build
```

Toolchain is Node 24 / npm 11 (`.nvmrc`, `engines`, `packageManager`, `NODE_VERSION` in every workflow, `node:24-alpine` in the Dockerfile). `npm ci` under an older npm prints usage help and installs nothing; run the pinned version (`npx -y npm@11 ci` works without a global change).

CI (`.github/workflows/ci.yml`) runs on every PR and push to main: `Validate` (npm ci + audit), `Lint & Type Check`, `Unit Tests` (Postgres service), `E2E Tests` (Playwright, seeded Postgres), `Build`, `Lighthouse (score floors)` (production build, floors in `scripts/check-lighthouse-score.mjs`), and `Migration Check` (PRs only). Main requires Validate, Lint & Type Check, Unit Tests, E2E Tests, Build and Migration Check. `deploy.yml` is manual-dispatch only (staging/production via GitHub secrets); production actually deploys through Vercel's Git integration on every push to main, and `vercel.json` disables preview deployments for other branches. `deploy-watchdog.yml` runs daily and fails if the newest main commit has no successful Production deployment.

## Releases

Commits follow Conventional Commits (`feat:`, `fix:`, `perf:`, `build:`, `chore:`, `content:` …) and that is what cuts releases: `release-please` (`.github/workflows/release-please.yml`) keeps one release PR open against main that bumps `package.json` and writes `CHANGELOG.md`. Merging it tags `vX.Y.Z`, publishes a GitHub Release, and deploys to production like any main push. The release PR carries no CI run (it is opened by `GITHUB_TOKEN`), so it is merged with `gh pr merge --admin` — only after `gh pr diff` shows exactly `CHANGELOG.md` and the version fields in `package.json` / `package-lock.json`; anything else in that diff means something is wrong, not that the bypass should widen. A `feat` bumps minor, a `fix` bumps patch, a `!`/`BREAKING CHANGE` bumps major; `Release-As: x.y.z` in a commit footer forces a version. Squash-merge PRs with a conventional title (`<type>(<scope>): <summary> (#N)`) so the squash commit is what release-please reads.

## Working conventions

- Work in a git worktree under `.worktrees/<branch-slug>` (ignored via `.git/info/exclude`), never in the main checkout except to fast-forward `main`. One PR per worktree; remove it after the merge.
- Husky hooks are not installed here; run `npm run lint` and `npx tsc --noEmit` yourself before pushing.
- Every PR must be green on the required checks before merging; squash-merge with `gh pr merge <N> --squash --delete-branch`.

## Where things live

- `auth.config.ts` is Edge-safe (used by `proxy.ts`); `auth.ts` adds Credentials + Prisma + bcrypt. Never import Node-only modules into `auth.config.ts`.
- `proxy.ts` protects `/account/*` and `/admin/*` and sets the CSP + request-id headers. Policy lives in `lib/csp.ts`: only the routes in `NONCE_ROUTE_PREFIXES` get a per-request nonce (and each has a `force-dynamic` layout); everything else is prerenderable. Never read `headers()`/`cookies()` in `app/layout.tsx` — it makes every route dynamic.
- `lib/auth.ts` (`getServerAuth`, `requireRole`), `lib/csrf.ts`, `lib/api-response.ts`, `lib/env.ts` (Zod; warns, never throws at build), `lib/session.ts` (30-day guest cart cookie), `lib/providers/CartProvider.tsx`, `lib/rate-limit.ts` (Upstash when configured, in-memory otherwise), `lib/safe-redirect.ts` (the only accepted `callbackUrl` shapes).
- API routes in `app/api/*`; each exports `dynamic = 'force-dynamic'` or the Vercel build tries to prerender it without a DB.
- `prisma/schema.prisma` (Postgres, money is `@db.Decimal(10,2)`), `prisma/seed.ts`, migrations in `prisma/migrations/`. `prisma/migrations_legacy_sqlite/` is history only.
- Styling: Tailwind v4. `styles/globals.css` is the whole theme: `@import "tailwindcss"`, the HSL tokens on `:root`/`.dark`, and `@theme inline` mapping them onto utility names (`--color-*`, `--radius-*`, `--font-*`, `--shadow-warm-*`); there is no `tailwind.config.js`. `@theme inline` is required so `hsl(var(--x))` resolves per element and `.dark` works; never define `--spacing-*` tokens there (they shadow `max-w-*`). Custom classes are `@utility` blocks. `tests/unit/tailwind-v4-renames.test.ts` rejects v3-only spellings (`outline-none`, `bg-gradient-to-*`, `variant="outline-solid"`, ...). Fonts in `lib/fonts.ts`, `cn()` in `lib/utils.ts` (`tailwind-merge` 3). `DESIGN.md` is the design system; read it before touching a className.

## Gotchas

- PR #58 removed the multi-tenant SaaS layer (orgs, seat billing, API keys, audit log). Do not add it back; this is one storefront.
- `turbopack: {}` in `next.config.js` must stay even though it is empty.
- Stripe needs two webhook secrets: `STRIPE_WEBHOOK_SECRET` (`/api/webhook`) and `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` (`/api/subscriptions/webhook`); `npm run preflight:production` refuses a shared one.
- Gift cards are created `PENDING_PAYMENT` and only become `ACTIVE` when Stripe reports the Checkout session paid (webhook `checkout.session.completed` with `metadata.type = gift_card`, or `GET /api/gift-cards/purchase?session_id=`). Both activation paths are idempotent; balance changes take a `SELECT … FOR UPDATE` row lock. Loyalty redemptions run `SERIALIZABLE` with a P2034 retry because the balance is a ledger sum.
- Prisma `Decimal` fields serialise to strings; API routes convert money to `Number` before returning it (the order and subscription pages call `toFixed`).
- `postinstall` runs `scripts/prisma-wasm-base64.js` then `prisma generate`.
- `next-themes` is held at 0.2.1 on purpose: from 0.3 the pre-paint script is `(${fn.toString()})(args)`, whose SHA-256 differs between vitest, Node and the Turbopack build, so the hash in `lib/csp.ts` cannot be a constant. Upgrading needs one of: own the pre-paint script as a literal, pass the request nonce from the nonce-route layouts, or derive the hash from the built output (see PR #110).
- Vercel has no custom build command, so `prisma migrate deploy` is not run on deploy; apply migrations by hand (or via `deploy.yml`) before merging schema changes.

<!-- BEGIN:nextjs-agent-rules -->
This Next.js version has breaking changes vs. training data. Read `node_modules/next/dist/docs/` before writing framework code. (Block is re-added by `next dev`.)
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/link-flame`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

See `docs/agents/domain.md`. (`CONTEXT.md` and `docs/adr/` are referenced there but do not exist yet.)
