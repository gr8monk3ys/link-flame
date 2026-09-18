import * as Sentry from '@sentry/nextjs'

import { SENTRY_ENABLED, SENTRY_ENV } from './lib/sentry-enabled'

const dsn = process.env.SENTRY_DSN
const enabled = !!dsn && SENTRY_ENABLED

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  debug: false,
  environment: SENTRY_ENV,
  enabled,
})
