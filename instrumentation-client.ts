// Browser-side Sentry. This file name is the one Next's Turbopack build
// actually bundles; `sentry.client.config.ts` is silently ignored there, which
// is why production served a server-side sentry-trace header but no browser
// SDK from the day Turbopack became the default build. Settings are unchanged.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})

// Lets the SDK instrument App Router navigations as transactions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
