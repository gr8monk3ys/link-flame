#!/usr/bin/env node

import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import Stripe from 'stripe'

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

const env = {
  ...parseEnvFile(path.join(process.cwd(), '.env')),
  ...parseEnvFile(path.join(process.cwd(), '.env.local')),
  ...process.env,
}

const requiredEnv = [
  ['STRIPE_SECRET_KEY', (value) => typeof value === 'string' && value.startsWith('sk_')],
  [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    (value) => typeof value === 'string' && value.startsWith('pk_'),
  ],
  ['STRIPE_STARTER_MONTHLY_PRICE_ID', (value) => typeof value === 'string' && value.startsWith('price_')],
  ['STRIPE_STARTER_YEARLY_PRICE_ID', (value) => typeof value === 'string' && value.startsWith('price_')],
  ['STRIPE_PRO_MONTHLY_PRICE_ID', (value) => typeof value === 'string' && value.startsWith('price_')],
  ['STRIPE_PRO_YEARLY_PRICE_ID', (value) => typeof value === 'string' && value.startsWith('price_')],
]

const missing = requiredEnv
  .filter(([name, validator]) => !validator(env[name]))
  .map(([name]) => name)

const hasWebhookSecret =
  (env.STRIPE_BILLING_WEBHOOK_SECRET || '').startsWith('whsec_') ||
  (env.STRIPE_WEBHOOK_SECRET || '').startsWith('whsec_')

if (!hasWebhookSecret) {
  missing.push('STRIPE_BILLING_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET')
}

if (missing.length > 0) {
  console.error('Stripe configuration check failed. Missing/invalid values:')
  for (const key of missing) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

async function verifyPrice(priceId, label) {
  const price = await stripe.prices.retrieve(priceId)
  if (!price || price.deleted) {
    throw new Error(`${label} (${priceId}) does not exist`)
  }
  if (!price.active) {
    throw new Error(`${label} (${priceId}) is inactive`)
  }
}

async function main() {
  const account = await stripe.accounts.retrieve()
  if (!account || !account.id) {
    throw new Error('Unable to retrieve Stripe account details')
  }

  await verifyPrice(env.STRIPE_STARTER_MONTHLY_PRICE_ID, 'Starter monthly price')
  await verifyPrice(env.STRIPE_STARTER_YEARLY_PRICE_ID, 'Starter yearly price')
  await verifyPrice(env.STRIPE_PRO_MONTHLY_PRICE_ID, 'Pro monthly price')
  await verifyPrice(env.STRIPE_PRO_YEARLY_PRICE_ID, 'Pro yearly price')

  console.log('Stripe configuration check passed.')
  console.log(`Connected account: ${account.id}`)
}

main().catch((error) => {
  console.error('Stripe configuration check failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
