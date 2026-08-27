# Link Flame

An eco-friendly e-commerce storefront and blog: every product carries
certifications, values, and a per-unit yearly impact figure versus its
single-use equivalent, and the shop is built to surface that (filter by
values, see what a year of swaps adds up to, buy imperfect stock at a
discount). Live at https://link-flame-rouge.vercel.app.

![Link Flame storefront home](docs/screenshot.png)

**The decision that shaped the codebase.** For a while this repo also carried
a multi-tenant SaaS layer (organizations with white-label domains, seat
billing, invitations, API keys, an audit log) whose only storefront surface
was a "Plans" nav link. [PR #58](https://github.com/gr8monk3ys/link-flame/pull/58)
removed it because the app is one storefront with a blog, and anything that
only serves *running a platform* rather than shopping, content, or
sustainability was scope with no user. Net: 7 Prisma models (51 to 44), 10
API routes, 268 tests of SaaS code, and one required deploy secret gone.
Product subscriptions, loyalty, referrals, gift cards, bundles, and wishlists
stayed; they are all wired into the shop.

Stack: Next.js 16 (App Router, React 19), PostgreSQL on Neon via Prisma,
NextAuth v5 (split Edge/Node config), Stripe checkout + webhooks, Tailwind v3.
Package manager is npm; CI, Vercel, and the Dockerfile all run `npm ci`.

## Run

```bash
git clone https://github.com/gr8monk3ys/link-flame.git && cd link-flame
npm ci
cp .env.example .env
```

Minimum `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/linkflame?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/linkflame?schema=public"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

Stripe, Upstash Redis (rate limiting), Resend (email), and Sentry are
optional and switch off when unset.

```bash
npx prisma migrate dev   # schema
npx prisma db seed       # sample products, brands, posts, impact data
npm run dev              # http://localhost:3000
```

## Test

```bash
npm run lint
npx tsc --noEmit
npx vitest run           # unit, ~500 tests
npx playwright test      # E2E, ~140 tests, runs against `next build && next start`
```

Set `PLAYWRIGHT_DEV_SERVER=true` to run E2E against the dev server instead
of a production build.

## Deploy

```bash
npm run preflight:production   # env check + Stripe config check + lint + unit + build
```

Production additionally needs `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and two webhook signing secrets:
`STRIPE_WEBHOOK_SECRET` for `/api/webhook` and
`STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` for `/api/subscriptions/webhook`. The
preflight refuses a shared or missing secret. Every API route exports
`dynamic = 'force-dynamic'` so the Vercel build does not try to prerender
against a database it cannot reach. See `docs/DEPLOYMENT.md` for the rest.

## License

GPL-3.0
