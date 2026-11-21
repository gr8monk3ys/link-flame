type Env = Record<string, string | undefined>

const REQUIRED = ['RESEND_API_KEY', 'EMAIL_FROM', 'NEXT_PUBLIC_SUPPORT_EMAIL'] as const

/**
 * What stops a production deploy from taking money and confirming orders.
 * Returns variable names with the problem, never their values.
 * Gated on VERCEL_ENV (not NODE_ENV) for the reason given in lib/sentry-enabled.ts.
 */
export function getProductionReadinessIssues(env: Env = process.env): string[] {
  if (env.VERCEL_ENV !== 'production') return []

  const issues: string[] = []
  const stripeKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  if (!stripeKey) issues.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing')
  else if (stripeKey.startsWith('pk_test_')) issues.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a test-mode key')

  for (const name of REQUIRED) {
    if (!env[name]?.trim()) issues.push(`${name} is missing`)
  }
  return issues
}
