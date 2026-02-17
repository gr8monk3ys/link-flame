'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Plan } from '@/lib/billing/plans'
import type { OrganizationSummary } from './types'

type Interval = 'monthly' | 'yearly'

async function getCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const data = await res.json()
  if (!data?.token) throw new Error('CSRF token missing in response')
  return data.token as string
}

export function BillingPlansClient(props: {
  userEmail: string
  userName?: string | null
  initialOrganizations: OrganizationSummary[]
  plans: Plan[]
}) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(
    props.initialOrganizations
  )
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    organizations[0]?.id ?? null
  )
  const [interval, setInterval] = useState<Interval>('monthly')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [creatingOrgName, setCreatingOrgName] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const paidPlans = useMemo(
    () => props.plans.filter((p) => p.id === 'starter' || p.id === 'pro'),
    [props.plans]
  )

  async function createOrganization() {
    const name = creatingOrgName.trim()
    if (name.length < 2) {
      toast.error('Organization name must be at least 2 characters')
      return
    }

    try {
      setCreatingOrg(true)
      const csrfToken = await getCsrfToken()

      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ name }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to create organization')
      }

      const created = json?.data as OrganizationSummary | undefined
      if (!created?.id) throw new Error('Organization creation returned invalid data')

      setOrganizations((prev) => [created, ...prev])
      setSelectedOrgId(created.id)
      setCreatingOrgName('')
      toast.success('Organization created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreatingOrg(false)
    }
  }

  async function startCheckout(planIdUpper: 'STARTER' | 'PRO') {
    if (!selectedOrgId) {
      toast.error('Create or select an organization first')
      return
    }

    try {
      setCheckoutLoading(planIdUpper)
      const csrfToken = await getCsrfToken()

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          planId: planIdUpper,
          interval,
          organizationId: selectedOrgId,
          email: props.userEmail,
          name: props.userName || undefined,
          enableTrial: true,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to start checkout')
      }

      const sessionUrl = json?.data?.sessionUrl as string | undefined
      if (!sessionUrl) throw new Error('Stripe checkout URL missing in response')

      window.location.href = sessionUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
        <p className="text-muted-foreground">
          Choose a plan that fits your team. Upgrade or downgrade anytime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your organization</CardTitle>
          <CardDescription>
            Billing is managed per organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              {organizations.map((org) => (
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
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              You do not have any organizations yet.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                Create a new organization
              </label>
              <input
                value={creatingOrgName}
                onChange={(e) => setCreatingOrgName(e.target.value)}
                placeholder="e.g. Acme Co."
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={createOrganization}
              disabled={creatingOrg}
              className="sm:w-auto"
            >
              {creatingOrg ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Pricing</h2>
        <div className="flex items-center gap-2 rounded-full border bg-background p-1">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${
              interval === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setInterval('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${
              interval === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setInterval('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {paidPlans.map((plan) => {
          const price = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly
          const planUpper = plan.id === 'starter' ? 'STARTER' : 'PRO'
          const isLoading = checkoutLoading === planUpper

          return (
            <Card key={plan.id} className={plan.isPopular ? 'border-primary' : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {plan.isPopular ? (
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${price ?? 'Custom'}
                  </span>
                  {price !== null ? (
                    <span className="text-sm text-muted-foreground">
                      / {interval === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 8).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => startCheckout(planUpper)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Start free trial
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/contact">Talk to sales</Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  14-day trial. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

