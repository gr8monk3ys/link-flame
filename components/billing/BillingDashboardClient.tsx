'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrganizationSummary } from './types'

type UsageResource = 'products' | 'orders' | 'teamMembers' | 'storageMB'

interface UsageResponse {
  organizationId: string
  plan: { id: string; name: string }
  usage: Record<
    UsageResource,
    {
      current: number
      limit: number | 'unlimited'
      limitFormatted: string
      percentUsed: number
      remaining: number | 'unlimited'
      isApproaching: boolean
      isExceeded: boolean
    }
  >
  warnings: {
    approachingLimits: UsageResource[]
    exceededLimits: UsageResource[]
  }
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const data = await res.json()
  if (!data?.token) throw new Error('CSRF token missing in response')
  return data.token as string
}

export function BillingDashboardClient(props: {
  initialOrganizations: OrganizationSummary[]
}) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(
    props.initialOrganizations
  )
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    organizations[0]?.id ?? null
  )
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  )

  useEffect(() => {
    const orgId = selectedOrgId
    if (!orgId) return
    const encodedOrgId = encodeURIComponent(orgId)
    let cancelled = false

    async function fetchUsage() {
      try {
        setLoading(true)
        const res = await fetch(`/api/billing/usage?organizationId=${encodedOrgId}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error?.message || 'Failed to load usage')
        if (!cancelled) setUsage(json?.data as UsageResponse)
      } catch (err) {
        if (!cancelled) {
          setUsage(null)
          toast.error(err instanceof Error ? err.message : 'Failed to load usage')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUsage()
    return () => {
      cancelled = true
    }
  }, [selectedOrgId])

  async function openPortal() {
    if (!selectedOrg?.stripeCustomerId) {
      toast.error('This organization does not have a Stripe customer yet')
      return
    }

    try {
      setPortalLoading(true)
      const csrfToken = await getCsrfToken()
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          customerId: selectedOrg.stripeCustomerId,
          returnUrl: window.location.href,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error?.message || 'Failed to open billing portal')
      const url = json?.data?.sessionUrl as string | undefined
      if (!url) throw new Error('Portal URL missing in response')
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open portal')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage plans, usage, and payment methods for your organization.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/billing/plans">View plans</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Select which organization you want to manage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {organizations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No organizations yet. Create one on the plans page.
            </div>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  selectedOrgId === org.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {org.name}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>
                {usage ? `${usage.plan.name} (${usage.plan.id})` : 'Loading plan details'}
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={openPortal}
              variant="outline"
              disabled={portalLoading || !selectedOrg?.stripeCustomerId}
            >
              {portalLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ExternalLink className="mr-2 size-4" />}
              Manage in Stripe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : usage ? (
            <div className="space-y-4">
              {Object.entries(usage.usage).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{labelForResource(key as UsageResource)}</span>
                    <span className="text-muted-foreground">
                      {value.current} / {value.limitFormatted}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        value.isExceeded
                          ? 'bg-red-600'
                          : value.isApproaching
                            ? 'bg-yellow-500'
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, value.percentUsed))}%` }}
                    />
                  </div>
                </div>
              ))}

              {usage.warnings.exceededLimits.length > 0 ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 size-4" />
                  <div>
                    <div className="font-semibold">Limits exceeded</div>
                    <div>
                      You have exceeded: {usage.warnings.exceededLimits.map(labelForResource).join(', ')}. Upgrade your plan to continue.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select an organization to see usage.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function labelForResource(resource: UsageResource): string {
  switch (resource) {
    case 'products':
      return 'Products'
    case 'orders':
      return 'Orders'
    case 'teamMembers':
      return 'Team members'
    case 'storageMB':
      return 'Storage (MB)'
    default:
      return resource
  }
}
