# Production Readiness: Blocker Fixes

**Date:** 2026-02-22
**Branch:** gr8monk3ys/prod-readiness
**Scope:** Surgical fixes for deployment blockers, security gaps, and functional bugs only. No refactoring.

## Problem

Audit identified ~15 issues that would cause real production failures or security gaps. These fall into three categories.

## Section 1: Deployment Blockers

### 1a. Add `force-dynamic` to 23 API routes

Without `export const dynamic = 'force-dynamic'`, Next.js attempts static rendering during Vercel build, which fails because the DB isn't available at build time.

**Routes missing it:** All routes under `/api/` that don't already export it. Mechanical fix.

### 1b. Fix case-sensitive product search

Product search uses `contains` without `mode: 'insensitive'` on PostgreSQL. Users searching "eco bag" get zero results when products are titled "Eco Bag".

**Fix:** Add `mode: 'insensitive'` to all `contains` filters in `/api/products/route.ts`.

## Section 2: Security Gaps

### 2a. Fix CSP — remove `unsafe-inline`

CSP includes both `'unsafe-inline'` and nonces. Browsers ignore nonces when `unsafe-inline` is present, making XSS mitigation decorative.

**Fix:** Remove `'unsafe-inline'` from `script-src` in `proxy.ts`.

### 2b. Standardize password minimum length

Signup: 8 chars. Password change: 6 chars. Inconsistent.

**Fix:** Change `/api/account/password/route.ts` Zod schema from `min(6)` to `min(8)`.

### 2c. Fix rate limit identifier on password change

Rate-limits by IP instead of authenticated user ID.

**Fix:** Pass `userId` to `getIdentifier()` in `/api/account/password/route.ts`.

### 2d. Warn on shared billing webhook secret

Billing webhook falls back to `STRIPE_WEBHOOK_SECRET`. Log a structured warning when this happens.

## Section 3: Functional Bugs

### 3a. Clean console.log from client components

159 `console.*` calls across 60 files leak internal state to browser consoles. Focus on client components only.

### 3b. Structured rate limiting production warning

In-memory fallback doesn't work on serverless. Make the warning more visible via structured logger.

## Non-Goals

- No refactoring (CartProvider, CSRF DRY)
- No new tests
- No N+1 query fixes
- No SaaS plan restructuring
