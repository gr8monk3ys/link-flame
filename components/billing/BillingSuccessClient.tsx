'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface CheckoutDetails {
  organizationId: string
  planId: string
  interval: string
  status?: string
}

export function BillingSuccessClient(props: { sessionId: string }) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<CheckoutDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchDetails() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/billing/checkout?session_id=${encodeURIComponent(props.sessionId)}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error?.message || 'Failed to verify checkout session')
        if (!cancelled) {
          setDetails(json?.data as CheckoutDetails)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to verify checkout'
        if (!cancelled) setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDetails()
    return () => {
      cancelled = true
    }
  }, [props.sessionId])

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            {error ? (
              <AlertTriangle className="mt-1 size-6 text-yellow-600" />
            ) : (
              <CheckCircle2 className="mt-1 size-6 text-green-600" />
            )}
            <div className="space-y-1">
              <CardTitle>{error ? 'Payment received' : 'Subscription activated'}</CardTitle>
              <CardDescription>
                {error
                  ? 'We received your payment, but could not verify the subscription yet. This can take a moment.'
                  : 'Thanks for subscribing. Your plan is now active.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : details ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{details.planId}</span>
              </div>
              <div className="mt-2 flex justify-between gap-6">
                <span className="text-muted-foreground">Interval</span>
                <span className="font-medium">{details.interval}</span>
              </div>
              {details.status ? (
                <div className="mt-2 flex justify-between gap-6">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{details.status}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/billing">Go to billing</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Return home</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If you run into issues, contact support and include your checkout session ID.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

