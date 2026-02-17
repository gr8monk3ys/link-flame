import { test, expect } from '@playwright/test'
import {
  createTestUser,
  generateTestUser,
  loginUser,
  getMissingStripeCheckoutEnvVars,
  isStripeCheckoutE2EConfigured,
} from './fixtures/auth'

function requireStripeCheckoutConfig() {
  const missingEnvVars = getMissingStripeCheckoutEnvVars()
  test.skip(
    !isStripeCheckoutE2EConfigured(),
    `Stripe billing E2E requires env vars: ${missingEnvVars.join(', ')}`
  )
}

test.describe('Billing / Plans', () => {
  test('plans page prompts sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/billing/plans')
    await expect(page.getByRole('heading', { name: 'Plans' })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('authenticated user can create an organization and see paid plans', async ({ page }) => {
    const user = generateTestUser('Billing')
    await createTestUser(page, user)
    await loginUser(page, user.email, user.password)

    await page.goto('/billing/plans')
    await page.waitForLoadState('networkidle')

    const orgName = `Acme ${Date.now()}`
    await page.getByPlaceholder('e.g. Acme Co.').fill(orgName)
    await page.getByRole('button', { name: 'Create' }).click()

    // Org pill should appear and be selectable.
    await expect(page.getByRole('button', { name: orgName })).toBeVisible({
      timeout: 15000,
    })

    // Paid plans should be visible.
    await expect(page.getByRole('heading', { name: /^Starter$/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Pro$/ })).toBeVisible()
  })

  test('can start Stripe checkout for a paid plan when configured', async ({ page }) => {
    requireStripeCheckoutConfig()

    const user = generateTestUser('BillingCheckout')
    await createTestUser(page, user)
    await loginUser(page, user.email, user.password)

    await page.goto('/billing/plans')
    await page.waitForLoadState('networkidle')

    const orgName = `Checkout Org ${Date.now()}`
    await page.getByPlaceholder('e.g. Acme Co.').fill(orgName)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('button', { name: orgName })).toBeVisible({
      timeout: 15000,
    })

    // Click the first "Start free trial" which should initiate checkout.
    await page.getByRole('button', { name: /start free trial/i }).first().click()

    // Stripe checkout should be on a stripe.com domain.
    await expect
      .poll(() => page.url(), { timeout: 20000 })
      .toContain('stripe.com')
  })
})
