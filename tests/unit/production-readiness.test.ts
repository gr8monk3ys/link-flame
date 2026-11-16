import { describe, expect, it } from 'vitest'
import { getProductionReadinessIssues } from '@/lib/production-readiness'

const ready = {
  VERCEL_ENV: 'production',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc123',
  RESEND_API_KEY: 're_secret_value',
  EMAIL_FROM: 'orders@example.com',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'help@example.com',
}

describe('getProductionReadinessIssues', () => {
  it('reports nothing when production is configured to take money', () => {
    expect(getProductionReadinessIssues(ready)).toEqual([])
  })

  it('reports nothing outside a production deploy', () => {
    expect(getProductionReadinessIssues({ VERCEL_ENV: 'preview' })).toEqual([])
    expect(getProductionReadinessIssues({ NODE_ENV: 'production' })).toEqual([])
  })

  it('flags a test-mode Stripe publishable key', () => {
    expect(
      getProductionReadinessIssues({ ...ready, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc123' })
    ).toEqual(['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a test-mode key'])
  })

  it('flags a missing Stripe publishable key', () => {
    expect(
      getProductionReadinessIssues({ ...ready, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined })
    ).toEqual(['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing'])
  })

  it.each(['RESEND_API_KEY', 'EMAIL_FROM', 'NEXT_PUBLIC_SUPPORT_EMAIL'])(
    'flags %s when missing or blank',
    (name) => {
      expect(getProductionReadinessIssues({ ...ready, [name]: undefined })).toEqual([
        `${name} is missing`,
      ])
      expect(getProductionReadinessIssues({ ...ready, [name]: '  ' })).toEqual([
        `${name} is missing`,
      ])
    }
  )

  it('names every problem at once and never echoes a value', () => {
    const issues = getProductionReadinessIssues({
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_secretish',
    })
    expect(issues).toEqual([
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a test-mode key',
      'RESEND_API_KEY is missing',
      'EMAIL_FROM is missing',
      'NEXT_PUBLIC_SUPPORT_EMAIL is missing',
    ])
    expect(issues.join(' ')).not.toContain('secretish')
  })
})
