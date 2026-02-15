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

const hasWebhookSecret =
  startsWith(env.STRIPE_BILLING_WEBHOOK_SECRET, 'whsec_') ||
  startsWith(env.STRIPE_WEBHOOK_SECRET, 'whsec_')

if (!hasWebhookSecret) {
  addIssue(
    errors,
    'STRIPE_BILLING_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET',
    'one of these must be set and start with whsec_'
  )
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

if (errors.length > 0) {
  console.error('Production environment check failed:')
  for (const issue of errors) {
    console.error(issue)
  }
  process.exit(1)
}

console.log('Production environment check passed.')
