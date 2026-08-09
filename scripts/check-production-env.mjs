#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const values = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function startsWith(value, prefix) {
  return typeof value === 'string' && value.startsWith(prefix)
}

function addIssue(issues, name, message) {
  issues.push(`- ${name}: ${message}`)
}

const cwd = process.cwd()
const env = {
  ...parseEnvFile(path.join(cwd, '.env')),
  ...parseEnvFile(path.join(cwd, '.env.local')),
  ...process.env,
}

const errors = []

const requiredVars = [
  ['DATABASE_URL', (v) => Boolean(v), 'is required'],
  ['DIRECT_URL', isValidUrl, 'must be a valid URL'],
  ['NEXTAUTH_SECRET', (v) => typeof v === 'string' && v.length >= 32, 'must be at least 32 characters'],
  ['NEXTAUTH_URL', isValidUrl, 'must be a valid URL'],
  ['NEXT_PUBLIC_APP_URL', isValidUrl, 'must be a valid URL'],
  ['STRIPE_SECRET_KEY', (v) => startsWith(v, 'sk_'), 'must start with sk_'],
  ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', (v) => startsWith(v, 'pk_'), 'must start with pk_'],
  ['UPSTASH_REDIS_REST_URL', isValidUrl, 'must be a valid URL'],
  ['UPSTASH_REDIS_REST_TOKEN', (v) => Boolean(v), 'is required'],
  ['STRIPE_STARTER_MONTHLY_PRICE_ID', (v) => startsWith(v, 'price_'), 'must start with price_'],
  ['STRIPE_STARTER_YEARLY_PRICE_ID', (v) => startsWith(v, 'price_'), 'must start with price_'],
  ['STRIPE_PRO_MONTHLY_PRICE_ID', (v) => startsWith(v, 'price_'), 'must start with price_'],
  ['STRIPE_PRO_YEARLY_PRICE_ID', (v) => startsWith(v, 'price_'), 'must start with price_'],
]

for (const [name, validator, errorMessage] of requiredVars) {
  const value = env[name]
  if (!validator(value)) {
    addIssue(errors, name, errorMessage)
  }
}

// Each webhook route needs its OWN signing secret. Accepting the shared
// STRIPE_WEBHOOK_SECRET in place of a dedicated one - which this gate used to
// do - means a single leaked secret can forge events for every route, and the
// billing and subscription routes mutate subscription state. The runtime
// refuses the fallback in production; this makes the gate agree rather than
// bless a configuration the app will then reject.
for (const name of [
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BILLING_WEBHOOK_SECRET',
  'STRIPE_SUBSCRIPTION_WEBHOOK_SECRET',
]) {
  if (!startsWith(env[name], 'whsec_')) {
    addIssue(
      errors,
      name,
      'must be set to that endpoint\'s own signing secret and start with whsec_'
    )
  }
}

if (isValidUrl(env.NEXTAUTH_URL) && isValidUrl(env.NEXT_PUBLIC_APP_URL)) {
  const authOrigin = new URL(env.NEXTAUTH_URL).origin
  const appOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin
  if (authOrigin !== appOrigin) {
    addIssue(
      errors,
      'NEXTAUTH_URL / NEXT_PUBLIC_APP_URL',
      `origins must match (got ${authOrigin} vs ${appOrigin})`
    )
  }
}

// Sentry is optional, so these warn rather than fail — a hard error would
// break deploys for anyone not using it. They are surfaced loudly because the
// integration is fully wired but gated on `enabled: !!process.env.SENTRY_DSN`,
// which means a missing DSN looks identical to a working install that simply
// has not seen an error yet.
const warnings = []

if (!env.SENTRY_DSN) {
  addIssue(warnings, 'SENTRY_DSN', 'is not set - server errors will not be reported anywhere')
}

if (!env.NEXT_PUBLIC_SENTRY_DSN) {
  addIssue(warnings, 'NEXT_PUBLIC_SENTRY_DSN', 'is not set - browser errors will not be reported')
}

if (env.SENTRY_DSN && !env.SENTRY_AUTH_TOKEN) {
  addIssue(
    warnings,
    'SENTRY_AUTH_TOKEN',
    'is not set - source maps will not upload, so stack traces stay minified'
  )
}

if (errors.length > 0) {
  console.error('Production environment check failed:')
  for (const issue of errors) {
    console.error(issue)
  }
  process.exit(1)
}

if (warnings.length > 0) {
  console.warn('Production environment check passed with warnings:')
  for (const issue of warnings) {
    console.warn(issue)
  }
}

console.log('Production environment check passed.')
