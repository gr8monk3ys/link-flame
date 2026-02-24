# Staging Payment Drills

This runbook validates production-critical payment behavior in staging.

## 1. Preflight + Automated Checks

Run:

```bash
scripts/run-staging-payment-drills.sh --base-url https://staging.linkflame.com
```

What it verifies:

- Required Stripe env vars are present
- Stripe account/price configuration is valid (`npm run check:stripe-config`)
- Database is reachable
- API health endpoint responds
- Targeted checkout session creation E2E probes pass

## 2. Manual Drill: Partial Refund on Discounted Order

Goal: ensure partial refunds are prorated correctly when order-level discounts exist.

Steps:

1. Create a paid order in staging that includes a loyalty and/or gift card discount.
2. In admin order management, issue a **partial refund** for one item quantity.
3. Confirm Stripe created the refund for the expected prorated amount.
4. Confirm order/item state in DB:

```sql
SELECT id, status, amount, refund_amount, refund_reason, refunded_at
FROM "Order"
WHERE id = '<order_id>';

SELECT id, title, quantity, refunded_quantity, price
FROM "OrderItem"
WHERE "orderId" = '<order_id>'
ORDER BY id;
```

Expected:

- `Order.status = 'partially_refunded'` (unless fully refunded)
- `Order.refund_amount` tracks cumulative refunded amount
- `OrderItem.refunded_quantity` increments only for refunded items
- Refunded amount does not exceed remaining refundable amount

## 3. Manual Drill: Concurrent Loyalty Holds

Goal: ensure points cannot be over-held by racing checkouts.

Steps:

1. Use one test user with known points balance (example: 1,000 points).
2. Open two browser sessions with that user.
3. In both sessions, attempt checkout using high loyalty redemption (for example, 800 points each).
4. Submit both checkouts near-simultaneously.
5. Verify one succeeds and the other is rejected with insufficient points.

DB verification:

```sql
SELECT id, status, "pointsUsed", "orderId", "redeemedAt"
FROM "LoyaltyRedemption"
WHERE "userId" = '<user_id>'
ORDER BY "redeemedAt" DESC
LIMIT 20;
```

Expected:

- No oversubscription of points across `pending` + `applied` redemptions
- Failed hold attempt does not leave stale redemption records

## 4. Manual Drill: Checkout Session Expiry Hold Reversal

Goal: ensure `checkout.session.expired` reverses all temporary discount holds.

Steps:

1. Start checkout with loyalty and/or gift card discount; capture `session_id`.
2. Expire the Stripe session:

```bash
stripe checkout sessions expire <session_id>
```

3. Trigger/replay `checkout.session.expired` to staging webhook if needed.
4. Verify order + hold cleanup:

```sql
SELECT id, status, "stripeSessionId", "stripeCouponId", "loyaltyRedemptionId", "giftCardId", "giftCardAmountUsed"
FROM "Order"
WHERE "stripeSessionId" = '<session_id>';

SELECT id, status, "pointsUsed"
FROM "LoyaltyRedemption"
WHERE id = '<loyalty_redemption_id>';
```

Expected:

- Order transitions to `failed`
- Pending loyalty hold is deleted/reversed
- Gift card hold is reversed
- One-time Stripe coupon is removed

## 5. Manual Drill: Subscription Lifecycle

Goal: validate create -> paid -> failed -> recovered progression.

Steps:

1. Create subscription via UI; complete checkout.
2. Confirm subscription webhook processing:
   - `checkout.session.completed` activates local subscription
   - first `invoice.paid` creates `Order` + `SubscriptionOrder`
3. Simulate failure cycle (test mode):
   - trigger or replay `invoice.payment_failed` three times
4. Simulate recovery:
   - update payment method
   - trigger or replay `invoice.paid`

DB verification:

```sql
SELECT id, "visibleId", status, "stripeSubscriptionId", "stripeStatus", "paymentFailedCount", "paymentFailedAt"
FROM "Subscription"
WHERE id = '<subscription_id>';

SELECT id, "subscriptionId", "orderId", "stripeInvoiceId", "createdAt"
FROM "SubscriptionOrder"
WHERE "subscriptionId" = '<subscription_id>'
ORDER BY "createdAt" DESC;
```

Expected:

- After 3 failures: `Subscription.status = 'PAYMENT_FAILED'`
- On paid recovery: `paymentFailedCount` resets and `stripeStatus` returns active
- `SubscriptionOrder.stripeInvoiceId` uniqueness prevents duplicate orders on retries

## Exit Criteria

- Automated script passes
- All 4 manual drills pass
- No webhook 5xx retries left unresolved in Stripe dashboard
- No unexplained refund amount mismatches between Stripe and local DB
