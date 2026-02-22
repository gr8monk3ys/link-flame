import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orgFindUnique: vi.fn(),
  orgUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionCreate: vi.fn(),

  customerList: vi.fn(),
  customerCreate: vi.fn(),
  customerUpdate: vi.fn(),

  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),

  subscriptionsRetrieve: vi.fn(),
  subscriptionsUpdate: vi.fn(),
  subscriptionsCancel: vi.fn(),

  invoicesRetrieveUpcoming: vi.fn(),
  invoicesList: vi.fn(),
  paymentMethodsList: vi.fn(),

  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: mocks.orgFindUnique,
      update: mocks.orgUpdate,
    },
    organizationSubscription: {
      findFirst: mocks.subscriptionFindFirst,
      create: mocks.subscriptionCreate,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/billing/plans', () => {
  const SAAS_PLANS = {
    FREE: {
      id: 'free',
      name: 'Free',
      description: 'Free plan',
      priceMonthly: 0,
      priceYearly: 0,
      stripePriceIdMonthly: null,
      stripePriceIdYearly: null,
      limits: {
        products: 10,
        orders: 50,
        teamMembers: 1,
        storageMB: 100,
      },
      features: [],
    },
    STARTER: {
      id: 'starter',
      name: 'Starter',
      description: 'Starter plan',
      priceMonthly: 29,
      priceYearly: 290,
      stripePriceIdMonthly: 'price_starter_monthly_test',
      stripePriceIdYearly: 'price_starter_yearly_test',
      limits: {
        products: 100,
        orders: 1000,
        teamMembers: 3,
        storageMB: 1000,
      },
      features: [],
    },
    PRO: {
      id: 'pro',
      name: 'Pro',
      description: 'Pro plan',
      priceMonthly: 79,
      priceYearly: 790,
      stripePriceIdMonthly: 'price_pro_monthly_test',
      stripePriceIdYearly: 'price_pro_yearly_test',
      limits: {
        products: -1,
        orders: -1,
        teamMembers: 10,
        storageMB: 10000,
      },
      features: [],
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Enterprise plan',
      priceMonthly: null,
      priceYearly: null,
      stripePriceIdMonthly: null,
      stripePriceIdYearly: null,
      limits: {
        products: -1,
        orders: -1,
        teamMembers: -1,
        storageMB: -1,
      },
      features: [],
    },
  } as const;

  return {
    SAAS_PLANS,
    TRIAL_PERIOD_DAYS: 14,
    isFreePlan: (planId: string) => planId.toLowerCase() === 'free',
    getStripePriceId: (planId: keyof typeof SAAS_PLANS, interval: 'monthly' | 'yearly') =>
      interval === 'monthly'
        ? SAAS_PLANS[planId].stripePriceIdMonthly
        : SAAS_PLANS[planId].stripePriceIdYearly,
  };
});

vi.mock('@/lib/stripe-server', () => ({
  getStripe: () => ({
    customers: {
      list: mocks.customerList,
      create: mocks.customerCreate,
      update: mocks.customerUpdate,
    },
    checkout: {
      sessions: {
        create: mocks.checkoutCreate,
      },
    },
    billingPortal: {
      sessions: {
        create: mocks.portalCreate,
      },
    },
    subscriptions: {
      retrieve: mocks.subscriptionsRetrieve,
      update: mocks.subscriptionsUpdate,
      cancel: mocks.subscriptionsCancel,
    },
    invoices: {
      retrieveUpcoming: mocks.invoicesRetrieveUpcoming,
      list: mocks.invoicesList,
    },
    paymentMethods: {
      list: mocks.paymentMethodsList,
    },
  }),
}));

import {
  SubscriptionError,
  applyCoupon,
  cancelSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
  getInvoices,
  getOrCreateStripeCustomer,
  getPaymentMethods,
  getSubscription,
  getUpcomingInvoice,
  mapStripeStatus,
  pauseSubscription,
  previewSubscriptionChange,
  reactivateSubscription,
  resumeSubscription,
  setDefaultPaymentMethod,
  syncSubscriptionStatus,
  updateSubscription,
} from '@/lib/billing/subscription';

describe('billing subscription helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.orgFindUnique.mockResolvedValue({ stripeCustomerId: null });
    mocks.orgUpdate.mockResolvedValue({ id: 'org_1' });
    mocks.subscriptionFindFirst.mockResolvedValue(null);
    mocks.subscriptionCreate.mockResolvedValue({ id: 'org_sub_1' });

    mocks.customerList.mockResolvedValue({ data: [] });
    mocks.customerCreate.mockResolvedValue({ id: 'cus_new', metadata: {} });
    mocks.customerUpdate.mockResolvedValue({ id: 'cus_updated', metadata: { organizationId: 'org_1' } });

    mocks.checkoutCreate.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.example/cs_1' });
    mocks.portalCreate.mockResolvedValue({ id: 'bps_1', url: 'https://portal.example/bps_1' });

    mocks.subscriptionsRetrieve.mockResolvedValue({
      id: 'sub_1',
      status: 'active',
      items: {
        data: [{ id: 'si_1', price: { id: 'price_pro_monthly_test', recurring: { interval: 'month' }, unit_amount: 7900, currency: 'usd' } }],
      },
      metadata: { planId: 'PRO' },
      customer: 'cus_1',
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
    });
    mocks.subscriptionsUpdate.mockResolvedValue({
      id: 'sub_1',
      status: 'active',
      cancel_at: null,
      current_period_end: 1_700_086_400,
      items: { data: [{ id: 'si_1' }] },
    });
    mocks.subscriptionsCancel.mockResolvedValue({
      id: 'sub_1',
      status: 'canceled',
      cancel_at: null,
      current_period_end: 1_700_086_400,
      items: { data: [{ id: 'si_1' }] },
    });

    mocks.invoicesRetrieveUpcoming.mockResolvedValue({
      id: 'in_upcoming_1',
      amount_due: 1200,
      lines: {
        data: [
          { proration: true, amount: 1500 },
          { proration: true, amount: -300 },
        ],
      },
    });
    mocks.invoicesList.mockResolvedValue({ data: [{ id: 'in_1' }, { id: 'in_2' }] });
    mocks.paymentMethodsList.mockResolvedValue({ data: [{ id: 'pm_1' }] });
  });

  it('reuses existing Stripe customer id on organization record', async () => {
    mocks.orgFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const customerId = await getOrCreateStripeCustomer('org_1', 'owner@example.com');

    expect(customerId).toBe('cus_existing');
    expect(mocks.customerCreate).not.toHaveBeenCalled();
    expect(mocks.customerUpdate).not.toHaveBeenCalled();
  });

  it('creates a new Stripe customer when no existing customer matches org metadata', async () => {
    const customerId = await getOrCreateStripeCustomer('org_1', 'owner@example.com', 'Owner Name', { userId: 'user_1' });

    expect(customerId).toBe('cus_new');
    expect(mocks.customerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        name: 'Owner Name',
        metadata: expect.objectContaining({
          organizationId: 'org_1',
          userId: 'user_1',
        }),
      })
    );
    expect(mocks.orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'org_1' },
        data: expect.objectContaining({
          stripeCustomerId: 'cus_new',
          billingEmail: 'owner@example.com',
        }),
      })
    );
  });

  it('updates matching existing customer for the organization', async () => {
    mocks.customerList.mockResolvedValueOnce({
      data: [{ id: 'cus_match', metadata: { organizationId: 'org_1', previous: 'yes' } }],
    });
    mocks.customerUpdate.mockResolvedValueOnce({ id: 'cus_match', metadata: { organizationId: 'org_1' } });

    const customerId = await getOrCreateStripeCustomer('org_1', 'owner@example.com', 'Owner Name');

    expect(customerId).toBe('cus_match');
    expect(mocks.customerUpdate).toHaveBeenCalledWith(
      'cus_match',
      expect.objectContaining({
        metadata: expect.objectContaining({
          organizationId: 'org_1',
          previous: 'yes',
        }),
      })
    );
  });

  it('warns but still returns customer id when org persistence update fails', async () => {
    mocks.orgUpdate.mockRejectedValueOnce(new Error('race condition'));

    const customerId = await getOrCreateStripeCustomer('org_1', 'owner@example.com');

    expect(customerId).toBe('cus_new');
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      'Failed to persist Stripe customer ID to organization',
      expect.objectContaining({ organizationId: 'org_1', customerId: 'cus_new' })
    );
  });

  it('wraps errors during customer creation flow', async () => {
    mocks.orgFindUnique.mockResolvedValueOnce(null);

    await expect(getOrCreateStripeCustomer('org_missing', 'owner@example.com')).rejects.toMatchObject({
      name: 'SubscriptionError',
      code: 'CUSTOMER_CREATION_FAILED',
    });
  });

  it('creates checkout session with customer id', async () => {
    const session = await createCheckoutSession(
      'org_1',
      'PRO',
      'monthly',
      'https://app.example/success',
      'https://app.example/cancel',
      'owner@example.com',
      'cus_1',
      true
    );

    expect(session.id).toBe('cs_1');
    expect(mocks.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        subscription_data: expect.objectContaining({
          trial_period_days: 14,
        }),
      })
    );
  });

  it('creates checkout session using customer_email when no customer id provided', async () => {
    await createCheckoutSession(
      'org_1',
      'STARTER',
      'yearly',
      'https://app.example/success',
      'https://app.example/cancel',
      'owner@example.com'
    );

    expect(mocks.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'owner@example.com',
      })
    );
  });

  it('throws on invalid plan or missing price id for checkout session', async () => {
    await expect(
      createCheckoutSession(
        'org_1',
        'FREE',
        'monthly',
        'https://app.example/success',
        'https://app.example/cancel',
        'owner@example.com'
      )
    ).rejects.toMatchObject({ code: 'INVALID_PLAN' });

    await expect(
      createCheckoutSession(
        'org_1',
        'ENTERPRISE',
        'monthly',
        'https://app.example/success',
        'https://app.example/cancel',
        'owner@example.com'
      )
    ).rejects.toMatchObject({ code: 'MISSING_PRICE_ID' });
  });

  it('wraps checkout session creation errors', async () => {
    mocks.checkoutCreate.mockRejectedValueOnce(new Error('stripe unavailable'));

    await expect(
      createCheckoutSession(
        'org_1',
        'PRO',
        'monthly',
        'https://app.example/success',
        'https://app.example/cancel',
        'owner@example.com'
      )
    ).rejects.toMatchObject({ code: 'CHECKOUT_SESSION_FAILED' });
  });

  it('creates and wraps customer portal session calls', async () => {
    const portal = await createCustomerPortalSession('cus_1', 'https://app.example/return');
    expect(portal.id).toBe('bps_1');

    mocks.portalCreate.mockRejectedValueOnce(new Error('portal down'));
    await expect(createCustomerPortalSession('cus_1', 'https://app.example/return')).rejects.toMatchObject({
      code: 'PORTAL_SESSION_FAILED',
    });
  });

  it('retrieves and updates subscriptions', async () => {
    const subscription = await getSubscription('sub_1');
    expect(subscription.id).toBe('sub_1');

    await updateSubscription('sub_1', 'PRO', 'yearly', false);
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({
        proration_behavior: 'none',
      })
    );

    await expect(updateSubscription('sub_1', 'ENTERPRISE', 'monthly')).rejects.toMatchObject({
      code: 'MISSING_PRICE_ID',
    });
  });

  it('wraps errors when retrieving or updating subscriptions', async () => {
    mocks.subscriptionsRetrieve.mockRejectedValueOnce(new Error('not found'));
    await expect(getSubscription('sub_missing')).rejects.toMatchObject({ code: 'SUBSCRIPTION_NOT_FOUND' });

    mocks.subscriptionsRetrieve.mockResolvedValueOnce({
      id: 'sub_1',
      items: { data: [{ id: 'si_1' }] },
    });
    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('update failed'));
    await expect(updateSubscription('sub_1', 'PRO', 'monthly')).rejects.toMatchObject({
      code: 'SUBSCRIPTION_UPDATE_FAILED',
    });
  });

  it('supports cancellation/reactivation/pause/resume lifecycle', async () => {
    await cancelSubscription('sub_1', false);
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({ cancel_at_period_end: true })
    );

    await cancelSubscription('sub_1', true);
    expect(mocks.subscriptionsCancel).toHaveBeenCalledWith('sub_1');

    await reactivateSubscription('sub_1');
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({ cancel_at_period_end: false })
    );

    await pauseSubscription('sub_1', new Date('2026-03-01T00:00:00.000Z'));
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({
        pause_collection: expect.objectContaining({
          behavior: 'void',
        }),
      })
    );

    await resumeSubscription('sub_1');
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({
        pause_collection: null,
      })
    );
  });

  it('wraps lifecycle operation errors', async () => {
    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('cancel failed'));
    await expect(cancelSubscription('sub_1')).rejects.toMatchObject({ code: 'SUBSCRIPTION_CANCEL_FAILED' });

    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('reactivate failed'));
    await expect(reactivateSubscription('sub_1')).rejects.toMatchObject({ code: 'SUBSCRIPTION_REACTIVATE_FAILED' });

    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('pause failed'));
    await expect(pauseSubscription('sub_1')).rejects.toMatchObject({ code: 'SUBSCRIPTION_PAUSE_FAILED' });

    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('resume failed'));
    await expect(resumeSubscription('sub_1')).rejects.toMatchObject({ code: 'SUBSCRIPTION_RESUME_FAILED' });
  });

  it('gets upcoming invoices and previews subscription changes', async () => {
    await getUpcomingInvoice('cus_1');
    expect(mocks.invoicesRetrieveUpcoming).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_1' })
    );

    await getUpcomingInvoice('cus_1', 'sub_1');
    expect(mocks.invoicesRetrieveUpcoming).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_1', subscription: 'sub_1' })
    );

    const preview = await previewSubscriptionChange('sub_1', 'STARTER', 'monthly');
    expect(preview).toEqual({
      proratedAmount: 15,
      newAmount: 29,
      immediateCharge: 12,
      creditApplied: 3,
    });

    await expect(previewSubscriptionChange('sub_1', 'ENTERPRISE', 'monthly')).rejects.toMatchObject({
      code: 'MISSING_PRICE_ID',
    });
  });

  it('wraps invoice preview errors', async () => {
    mocks.invoicesRetrieveUpcoming.mockRejectedValueOnce(new Error('invoice failed'));
    await expect(getUpcomingInvoice('cus_1')).rejects.toMatchObject({ code: 'UPCOMING_INVOICE_FAILED' });

    mocks.subscriptionsRetrieve.mockRejectedValueOnce(new Error('preview failed'));
    await expect(previewSubscriptionChange('sub_1', 'PRO', 'monthly')).rejects.toMatchObject({
      code: 'PREVIEW_FAILED',
    });
  });

  it('applies coupon and handles payment method/invoice helpers', async () => {
    await applyCoupon('sub_1', 'coupon_1');
    expect(mocks.subscriptionsUpdate).toHaveBeenCalledWith(
      'sub_1',
      expect.objectContaining({ coupon: 'coupon_1' })
    );

    const paymentMethods = await getPaymentMethods('cus_1');
    expect(paymentMethods).toEqual([{ id: 'pm_1' }]);

    mocks.customerUpdate.mockResolvedValueOnce({ id: 'cus_1' });
    const customer = await setDefaultPaymentMethod('cus_1', 'pm_1');
    expect(customer).toEqual({ id: 'cus_1' });

    const invoices = await getInvoices('cus_1', 20);
    expect(invoices).toEqual([{ id: 'in_1' }, { id: 'in_2' }]);
    expect(mocks.invoicesList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_1', limit: 20 })
    );
  });

  it('wraps coupon/payment method/invoice errors', async () => {
    mocks.subscriptionsUpdate.mockRejectedValueOnce(new Error('coupon failed'));
    await expect(applyCoupon('sub_1', 'coupon_1')).rejects.toMatchObject({ code: 'COUPON_APPLY_FAILED' });

    mocks.paymentMethodsList.mockRejectedValueOnce(new Error('pm failed'));
    await expect(getPaymentMethods('cus_1')).rejects.toMatchObject({ code: 'PAYMENT_METHODS_FAILED' });

    mocks.customerUpdate.mockRejectedValueOnce(new Error('default pm failed'));
    await expect(setDefaultPaymentMethod('cus_1', 'pm_1')).rejects.toMatchObject({
      code: 'DEFAULT_PAYMENT_METHOD_FAILED',
    });

    mocks.invoicesList.mockRejectedValueOnce(new Error('invoice list failed'));
    await expect(getInvoices('cus_1')).rejects.toMatchObject({ code: 'INVOICES_FAILED' });
  });

  it('maps unknown stripe statuses to incomplete', () => {
    expect(mapStripeStatus('active')).toBe('active');
    expect(mapStripeStatus('unpaid')).toBe('unpaid');
    expect(mapStripeStatus('nonexistent')).toBe('incomplete');
  });

  it('syncs subscription from inferred plan/interval and skips unchanged snapshots', async () => {
    mocks.subscriptionFindFirst.mockResolvedValueOnce({
      id: 'org_sub_1',
      stripePriceId: 'price_pro_monthly_test',
      planId: 'PRO',
      billingInterval: 'monthly',
      status: 'active',
      currentPeriodEnd: new Date(1_700_086_400 * 1000),
    });

    const stripeSubscription = {
      id: 'sub_1',
      status: 'active',
      metadata: {},
      customer: { id: 'cus_obj_1' },
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      items: {
        data: [
          {
            price: {
              id: 'price_pro_monthly_test',
              recurring: { interval: 'month' },
              unit_amount: 7900,
              currency: 'usd',
            },
          },
        ],
      },
    };

    await syncSubscriptionStatus('org_1', stripeSubscription as never);

    expect(mocks.orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeCustomerId: 'cus_obj_1',
          plan: 'PRO',
          billingInterval: 'monthly',
        }),
      })
    );
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled();
  });

  it('writes FREE entitlements for canceled subscriptions and warns when price details missing', async () => {
    const canceledWithoutPrice = {
      id: 'sub_1',
      status: 'canceled',
      metadata: { planId: 'PRO' },
      customer: 'cus_1',
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: 1_700_086_400,
      canceled_at: null,
      ended_at: 1_700_086_400,
      items: { data: [{ price: null }] },
    };

    await syncSubscriptionStatus('org_1', canceledWithoutPrice as never);

    expect(mocks.orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: 'FREE',
          billingInterval: null,
        }),
      })
    );
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      'Subscription sync skipped history persistence due to missing price/interval',
      expect.objectContaining({ organizationId: 'org_1', subscriptionId: 'sub_1' })
    );
  });

  it('rethrows sync errors after logging', async () => {
    mocks.orgUpdate.mockRejectedValueOnce(new Error('sync failed'));
    const stripeSubscription = {
      id: 'sub_1',
      status: 'active',
      metadata: {},
      customer: 'cus_1',
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      items: { data: [{ price: { id: 'price_pro_monthly_test', recurring: { interval: 'month' }, unit_amount: 7900, currency: 'usd' } }] },
    };

    await expect(syncSubscriptionStatus('org_1', stripeSubscription as never)).rejects.toThrow('sync failed');
    expect(mocks.loggerError).toHaveBeenCalledWith(
      'Failed to sync subscription status',
      expect.any(Error),
      expect.objectContaining({ organizationId: 'org_1', subscriptionId: 'sub_1' })
    );
  });

  it('exposes SubscriptionError details', () => {
    const error = new SubscriptionError('test', 'ERR_CODE');
    expect(error.message).toBe('test');
    expect(error.code).toBe('ERR_CODE');
    expect(error.name).toBe('SubscriptionError');
  });
});
