# Production Readiness: Blocker Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all deployment blockers, security gaps, and functional bugs that prevent production readiness.

**Architecture:** Surgical edits to existing files only. No new files, no refactoring, no abstractions. Each task is a single-concern change.

**Tech Stack:** Next.js 16, Prisma, Zod, Stripe webhooks, Upstash Redis rate limiting

---

### Task 1: Add `force-dynamic` to 21 API routes missing it

Without this export, Next.js attempts to statically render these routes during `next build`, which fails because the database isn't available at build time. This is the #1 deployment blocker.

**Files to modify (add `export const dynamic = 'force-dynamic'` after imports):**
- `app/api/auth/user/route.ts`
- `app/api/csrf/route.ts`
- `app/api/docs/route.ts`
- `app/api/gift-cards/[code]/route.ts`
- `app/api/gift-cards/redeem/route.ts`
- `app/api/gift-cards/route.ts`
- `app/api/impact/community/route.ts`
- `app/api/impact/personal/route.ts`
- `app/api/impact/preview/route.ts`
- `app/api/loyalty/balance/route.ts`
- `app/api/loyalty/earn/route.ts`
- `app/api/products/imperfect/reasons/route.ts`
- `app/api/products/price-ranges/route.ts`
- `app/api/quiz/questions/route.ts`
- `app/api/quiz/results/[id]/route.ts`
- `app/api/quiz/submit/route.ts`
- `app/api/referrals/code/route.ts`
- `app/api/referrals/stats/route.ts`
- `app/api/referrals/validate/route.ts`
- `app/api/wishlists/[id]/move/route.ts`
- `app/api/wishlists/[id]/route.ts`

**Step 1: Add the export to each file**

In each file, add `export const dynamic = 'force-dynamic'` right after the last import statement, before any schema/constant definitions. Example pattern:

```typescript
// ... existing imports ...

export const dynamic = 'force-dynamic'

// ... rest of file ...
```

**Step 2: Verify the build succeeds**

Run: `npx next build`
Expected: Build completes without "Dynamic server usage" errors on these routes.

**Step 3: Commit**

```bash
git add app/api/auth/user/route.ts app/api/csrf/route.ts app/api/docs/route.ts \
  app/api/gift-cards/*/route.ts app/api/gift-cards/route.ts \
  app/api/impact/*/route.ts \
  app/api/loyalty/balance/route.ts app/api/loyalty/earn/route.ts \
  app/api/products/imperfect/reasons/route.ts app/api/products/price-ranges/route.ts \
  app/api/quiz/*/route.ts \
  app/api/referrals/*/route.ts \
  app/api/wishlists/*/route.ts app/api/wishlists/[id]/move/route.ts
git commit -m "fix(api): add force-dynamic to 21 routes missing it

Prevents Next.js from attempting static rendering during build,
which fails because the database is unavailable at build time."
```

---

### Task 2: Fix case-sensitive product search on PostgreSQL

The product search in `/api/products/route.ts` uses `contains` without `mode: 'insensitive'`. On PostgreSQL, this means "eco bag" won't match "Eco Bag".

**File:** `app/api/products/route.ts`

**Step 1: Add `mode: 'insensitive'` to each `contains` filter**

Find (around line 96-104):
```typescript
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
```

Replace with:
```typescript
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
```

Also remove the now-stale comment on line 97-98:
```
      // Note: SQLite doesn't support case-insensitive mode, using contains only
      // For production PostgreSQL, add mode: 'insensitive' to each filter
```

**Step 2: Verify type check passes**

Run: `npx tsc --noEmit`
Expected: No errors (Prisma types support `mode` on string filters for PostgreSQL).

**Step 3: Commit**

```bash
git add app/api/products/route.ts
git commit -m "fix(search): add case-insensitive mode to product search

PostgreSQL contains filter is case-sensitive by default. Users searching
'eco bag' now correctly match products titled 'Eco Bag'."
```

---

### Task 3: Fix CSP — remove `unsafe-inline` from script-src

The CSP in `proxy.ts` includes both `'unsafe-inline'` and `'nonce-xxx'`. When `unsafe-inline` is present, browsers ignore nonces entirely, making the nonce-based XSS protection useless.

**File:** `proxy.ts`

**Step 1: Remove `'unsafe-inline'` from production script-src**

Find (line 39):
```typescript
    : `'self' 'unsafe-inline' 'nonce-${nonce}' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`
```

Replace with:
```typescript
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`
```

Also update the TODO comment (lines 28-32) to reflect that this has been done:

Find:
```typescript
 * TODO: tighten `script-src` by removing `'unsafe-inline'` once we pass a nonce
 * through to all scripts that need it.
```

Replace with:
```typescript
 * Production uses nonce-based script-src with 'strict-dynamic' for CSP Level 3
 * browsers. The nonce is generated per-request and propagated via x-nonce header.
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add proxy.ts
git commit -m "fix(security): remove unsafe-inline from CSP script-src

Browsers ignore nonces when unsafe-inline is present. Replace with
strict-dynamic which delegates trust to nonced scripts."
```

---

### Task 4: Standardize password minimum length to 8 characters

Signup requires 8 chars but password change allows 6, letting users downgrade their password security.

**File:** `app/api/account/password/route.ts`

**Step 1: Change min(6) to min(8)**

Find (line 22):
```typescript
    .min(6, "New password must be at least 6 characters")
```

Replace with:
```typescript
    .min(8, "New password must be at least 8 characters")
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/api/account/password/route.ts
git commit -m "fix(auth): standardize password minimum to 8 characters

Password change previously allowed 6-char passwords while signup
required 8. Users could downgrade their password security."
```

---

### Task 5: Fix rate limit identifier on password change to use userId

The password change endpoint passes only the request (IP-based) to `getIdentifier()`, even though the authenticated `userId` is available. This means rate limiting is per-IP instead of per-user.

**File:** `app/api/account/password/route.ts`

**Step 1: Pass userId to getIdentifier**

Find (line 57):
```typescript
    const identifier = getIdentifier(request);
```

Replace with:
```typescript
    const identifier = getIdentifier(request, userId);
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors. `getIdentifier` already accepts an optional `userId` parameter.

**Step 3: Commit**

```bash
git add app/api/account/password/route.ts
git commit -m "fix(security): rate limit password changes by userId not IP

Previously rate-limited by IP only. An attacker and victim behind the
same IP would share rate limit buckets."
```

---

### Task 6: Add warning when billing webhook falls back to shared secret

The billing webhook at `/api/billing/webhook/route.ts` silently falls back to `STRIPE_WEBHOOK_SECRET` when `STRIPE_BILLING_WEBHOOK_SECRET` isn't configured. This means compromising one webhook secret compromises both.

**File:** `app/api/billing/webhook/route.ts`

**Step 1: Add a warning log in `getWebhookSecret()`**

Find (lines 23-30):
```typescript
function getWebhookSecret(): string {
  // Use a separate webhook secret for billing webhooks if available
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('Missing STRIPE_BILLING_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET')
  }
  return secret
}
```

Replace with:
```typescript
function getWebhookSecret(): string {
  const billingSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET
  if (billingSecret) {
    return billingSecret
  }

  const sharedSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sharedSecret) {
    throw new Error('Missing STRIPE_BILLING_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET')
  }

  logger.warn('STRIPE_BILLING_WEBHOOK_SECRET not configured — falling back to shared STRIPE_WEBHOOK_SECRET. Configure a separate secret for production.', {
    recommendation: 'Create a separate webhook endpoint in Stripe Dashboard for billing events',
  })
  return sharedSecret
}
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors. `logger` is already imported in this file.

**Step 3: Commit**

```bash
git add app/api/billing/webhook/route.ts
git commit -m "fix(billing): warn when falling back to shared webhook secret

Logs a structured warning when STRIPE_BILLING_WEBHOOK_SECRET is not
configured and the billing webhook uses the shared secret."
```

---

### Task 7: Replace console.error in client-side error boundaries

The error boundaries (`app/error.tsx` and others) call `console.error(error)` which leaks raw error objects to browser consoles. Use `error.digest` (the safe production identifier) instead.

**Files:**
- `app/error.tsx`
- `app/account/error.tsx`
- `app/admin/error.tsx`
- `app/blogs/error.tsx`
- `app/cart/error.tsx`
- `app/checkout/error.tsx`
- `app/products/error.tsx`
- `app/search/error.tsx`

**Step 1: Replace console.error in each error boundary**

In each file, find:
```typescript
  useEffect(() => { console.error(error) }, [error])
```

Replace with:
```typescript
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }, [error])
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/error.tsx app/account/error.tsx app/admin/error.tsx \
  app/blogs/error.tsx app/cart/error.tsx app/checkout/error.tsx \
  app/products/error.tsx app/search/error.tsx
git commit -m "fix(client): suppress error boundary console.error in production

Raw error objects were logged to browser consoles in production,
potentially leaking internal state."
```

---

### Task 8: Replace console.error in CartProvider with silent catch

CartProvider has 12 `console.error` calls that leak cart sync internals to browser consoles.

**File:** `lib/providers/CartProvider.tsx`

**Step 1: Wrap each console.error in a development check**

For every `console.error(...)` call in this file (12 occurrences), wrap with:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error(...)
}
```

The 12 locations are approximately lines: 28, 95, 116, 150, 153, 179, 183, 224, 244, 283, 327, 401.

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add lib/providers/CartProvider.tsx
git commit -m "fix(client): suppress CartProvider console.error in production

12 console.error calls leaked cart sync internals to browser consoles."
```

---

### Task 9: Replace console.error in remaining client components

Replace `console.error` calls in the remaining client components with dev-only logging.

**Files (28 components with console.error):**
- `components/bundles/BundleBuilder.tsx`
- `components/blogs/blog-search.tsx`
- `components/checkout/checkout-form.tsx`
- `components/checkout/ExpressCheckout.tsx`
- `components/checkout/PaymentRequestButton.tsx`
- `components/collections/FilterSidebar.tsx`
- `components/collections/ProductGrid.tsx`
- `components/filters/ActiveFilters.tsx`
- `components/filters/ValueFilterBar.tsx`
- `components/filters/ValueFilterSidebar.tsx`
- `components/gift-cards/GiftCardBalance.tsx`
- `components/gift-cards/GiftCardCheckout.tsx`
- `components/gift-cards/GiftCardPurchase.tsx`
- `components/home/FeaturedBrands.tsx`
- `components/impact/CartImpactPreview.tsx`
- `components/impact/ImpactShareCard.tsx`
- `components/imperfect/ImperfectProductCard.tsx`
- `components/loyalty/LoyaltyBadge.tsx`
- `components/loyalty/LoyaltyDashboard.tsx`
- `components/loyalty/RedeemPointsModal.tsx`
- `components/products/ProductDetails.tsx`
- `components/products/product-reviews.tsx`
- `components/products/QuickViewModal.tsx`
- `components/products/QuickViewTrigger.tsx`
- `components/referrals/ReferralCodeInput.tsx`
- `components/referrals/ReferralDashboard.tsx`
- `components/shared/service-worker-registration.tsx`
- `components/teams/InviteMemberModal.tsx`

And client-side app pages:
- `app/admin/blog/page.tsx`
- `app/admin/blog/[id]/edit/page.tsx`
- `app/admin/blog/new/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/products/page.tsx`
- `app/collections/CollectionsPageClient.tsx`
- `app/contact/page.tsx`
- `app/imperfect/page.tsx`
- `app/order-confirmation/page.tsx`

**Step 1: Wrap each console.error/console.log in a dev check**

Same pattern as Task 8. For each `console.error(...)` or `console.log(...)`:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error(...)
}
```

Leave the `console.log` calls in `service-worker-registration.tsx` as-is since those are standard SW lifecycle logs.

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add components/ app/admin/ app/collections/ app/contact/ app/imperfect/ app/order-confirmation/
git commit -m "fix(client): suppress console.error in production across all components

~65 console.error calls across 37 client components were leaking
internal error details to browser consoles in production."
```

---

### Task 10: Verify everything — build, types, tests

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Clean pass.

**Step 2: Unit tests**

Run: `npx vitest run`
Expected: All ~780 tests pass.

**Step 3: Build**

Run: `npx next build`
Expected: Build succeeds with no static rendering errors.

**Step 4: Done**

All production blockers resolved.
