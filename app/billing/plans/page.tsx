import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerAuth } from '@/lib/auth'
import { getAllPlans } from '@/lib/billing/plans'
import { BillingPlansClient } from '@/components/billing'

export const dynamic = 'force-dynamic'

export default async function BillingPlansPage() {
  const { userId, user } = await getServerAuth()
  const plans = getAllPlans()

  if (!userId || !user?.email) {
    return (
      <div className="container max-w-3xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to create an organization and start a subscription.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/signin?callbackUrl=%2Fbilling%2Fplans"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      plan: true,
      billingInterval: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  })

  const shaped = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    plan: org.plan,
    billingInterval: org.billingInterval,
    subscriptionStatus: org.subscriptionStatus,
    stripeCustomerId: org.stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
    role: org.members[0]?.role ?? null,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }))

  return (
    <div className="container max-w-6xl py-10">
      <BillingPlansClient
        userEmail={user.email}
        userName={user.name}
        initialOrganizations={shaped}
        plans={plans}
      />
    </div>
  )
}

