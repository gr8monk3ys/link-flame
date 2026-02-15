import Link from 'next/link'
import { getServerAuth } from '@/lib/auth'
import { BillingSuccessClient } from '@/components/billing'

export const dynamic = 'force-dynamic'

interface BillingSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
  const { userId } = await getServerAuth()
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    return (
      <div className="container max-w-2xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">Missing session</h1>
        <p className="mt-2 text-muted-foreground">
          This page requires a Stripe checkout session id.
        </p>
        <div className="mt-6">
          <Link
            href="/billing/plans"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to plans
          </Link>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="container max-w-2xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">Sign in to continue</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to verify your subscription and access your billing dashboard.
        </p>
        <div className="mt-6">
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/billing/success?session_id=${sessionId}`)}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return <BillingSuccessClient sessionId={sessionId} />
}

