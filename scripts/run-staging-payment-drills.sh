#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${BASE_URL:-http://localhost:3000}"
RUN_PLAYWRIGHT=1
RUN_DB_CHECK=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --skip-playwright)
      RUN_PLAYWRIGHT=0
      shift
      ;;
    --skip-db-check)
      RUN_DB_CHECK=0
      shift
      ;;
    *)
      echo "Unknown arg: $1"
      echo "Usage: scripts/run-staging-payment-drills.sh [--base-url URL] [--skip-playwright] [--skip-db-check]"
      exit 1
      ;;
  esac
done

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

echo "==> Staging Payment Drills Preflight"

required_vars=(
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_STARTER_MONTHLY_PRICE_ID
  STRIPE_STARTER_YEARLY_PRICE_ID
  STRIPE_PRO_MONTHLY_PRICE_ID
  STRIPE_PRO_YEARLY_PRICE_ID
)

missing=()
for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing required env vars:"
  printf ' - %s\n' "${missing[@]}"
  echo "Populate these in .env or shell environment, then rerun."
  exit 1
fi

if [[ -z "${STRIPE_WEBHOOK_SECRET:-}" && -z "${STRIPE_SUBSCRIPTION_WEBHOOK_SECRET:-}" ]]; then
  echo "Missing webhook secret: set STRIPE_WEBHOOK_SECRET or STRIPE_SUBSCRIPTION_WEBHOOK_SECRET."
  exit 1
fi

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI is required. Install from https://stripe.com/docs/stripe-cli"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for health checks."
  exit 1
fi

echo "==> Stripe account/config verification"
npm run check:stripe-config

if [[ "$RUN_DB_CHECK" -eq 1 ]]; then
  echo "==> Database connectivity check"
  if ! printf 'SELECT 1;' | npx prisma db execute --schema prisma/schema.prisma --stdin >/dev/null 2>&1; then
    echo "Database connectivity check failed (prisma db execute)."
    echo "Ensure DATABASE_URL is reachable from this environment."
    exit 1
  fi
fi

echo "==> API health check ($BASE_URL/api/health)"
health_status="$(curl -sS -o /tmp/linkflame-health.json -w '%{http_code}' "$BASE_URL/api/health" || true)"
if [[ "$health_status" != "200" ]]; then
  echo "Health check failed with HTTP $health_status"
  echo "Response:"
  cat /tmp/linkflame-health.json || true
  exit 1
fi
echo "Health check passed."

if [[ "$RUN_PLAYWRIGHT" -eq 1 ]]; then
  echo "==> Targeted E2E probe: checkout session creation"
  npx playwright test tests/e2e/checkout-complete.spec.ts -g "valid checkout request returns Stripe session" --reporter=line

  echo "==> Targeted E2E probe: billing checkout session creation"
  npx playwright test tests/e2e/billing.spec.ts -g "can start Stripe checkout for a paid plan when configured" --reporter=line
fi

echo
echo "Automated drills completed."
echo "Next: run manual webhook/payment drills in docs/STAGING_PAYMENT_DRILLS.md"
