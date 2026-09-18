// Whether Sentry may initialise at all, shared by every entry point
// (`instrumentation-client.ts`, `sentry.server.config.ts`,
// `sentry.edge.config.ts`) so the four of them cannot drift apart.
//
// Why this exists: the Sentry org's ERROR quota is shared by every project in
// it, and it ran out. 36% of the errors that spent it came from
// `environment:development` — laptops running this app locally with a DSN in
// `.env`, filing their own bugs into the same budget production reports into.
// Per-DSN rate limits are not available on the plan, so this gate is the only
// control there is.
//
// The gate is VERCEL_ENV, not NODE_ENV. Vercel sets VERCEL_ENV to
// "production" | "preview" | "development" on a deploy and leaves it undefined
// anywhere else; NODE_ENV is "production" for a local `next build && next
// start` too, which is exactly the local case that burned the quota.
//
// NEXT_PUBLIC_VERCEL_ENV is what the browser bundle can read — `next.config.js`
// defines it from VERCEL_ENV at build time so it is present whether or not the
// Vercel project exposes system variables to the client.
//
// Deliberate local testing: build and start with
//   NEXT_PUBLIC_SENTRY_FORCE_ENABLE=1
// to open the gate on a machine Vercel never touched (a DSN is still
// required). NEXT_PUBLIC_SENTRY_FORCE_DISABLE=1 closes it everywhere,
// including on a deploy, and wins over the force-enable.
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || ''

const DEPLOYED = VERCEL_ENV === 'production' || VERCEL_ENV === 'preview'

const FORCE_ENABLE = process.env.NEXT_PUBLIC_SENTRY_FORCE_ENABLE === '1'
const FORCE_DISABLE = process.env.NEXT_PUBLIC_SENTRY_FORCE_DISABLE === '1'

/**
 * The value to tag events with, so production and preview stay tellable apart.
 * Falls back to "development" for the forced-on local case.
 */
export const SENTRY_ENV = VERCEL_ENV || 'development'

/**
 * True only where reporting is wanted. Callers still require a DSN of their
 * own — this says nothing about whether one is configured.
 */
export const SENTRY_ENABLED = !FORCE_DISABLE && (DEPLOYED || FORCE_ENABLE)
