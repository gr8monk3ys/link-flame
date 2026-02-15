export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  logo: string | null
  plan: string
  billingInterval: string | null
  subscriptionStatus: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  role: string | null
  createdAt: string
  updatedAt: string
}

