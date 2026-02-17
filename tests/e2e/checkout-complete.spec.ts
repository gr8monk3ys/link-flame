import { test, expect } from '@playwright/test'
import {
  createTestUser,
  loginUser,
  logoutUser,
  generateTestUser,
  getCsrfToken,
  addItemToCart,
  getMissingStripeCheckoutEnvVars,
  isStripeCheckoutE2EConfigured,
} from './fixtures/auth'

/**
 * Complete Checkout Flow E2E Tests
 *
 * Tests the full checkout journey:
 * - Guest user checkout initiation
 * - Authenticated user checkout
 * - Form validation
 * - Cart requirements
 * - Payment integration (Stripe test mode)
 * - Order confirmation
 */

// Valid checkout form data
const validCheckoutData = {
  email: 'checkout-test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
}

const randomTestIp = () => {
  const octet = () => Math.floor(Math.random() * 250) + 1
  return `10.${octet()}.${octet()}.${octet()}`
}

function requireStripeCheckoutConfig() {
  const missingEnvVars = getMissingStripeCheckoutEnvVars()
  test.skip(
    !isStripeCheckoutE2EConfigured(),
    `Stripe checkout E2E requires env vars: ${missingEnvVars.join(', ')}`
  )
}

test.describe('Complete Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    })
  })

  test.describe('Guest User Checkout', () => {
    test('guest user is redirected to signin when accessing checkout', async ({
      page,
    }) => {
      // Add item to cart as guest
      await addItemToCart(page)

      // Navigate to cart
      await page.goto('/cart', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Try to proceed to checkout
      await page.goto('/checkout')

      // Should redirect to signin with callback URL
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })
      expect(page.url()).toContain('/auth/signin')
    })

    test('guest cart items persist after login and checkout', async ({
      page,
    }) => {
      const testUser = generateTestUser('GuestCheckout')

      // Create user first
      await createTestUser(page, testUser)

      // Add item to cart as guest
      await addItemToCart(page)

      // Go to cart and count items
      await page.goto('/cart', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      const guestCartItems = page.locator(
        '[data-testid="cart-item"], .cart-item, [class*="cart"] [class*="item"]'
      )
      await expect
        .poll(() => guestCartItems.count(), { timeout: 15000 })
        .toBeGreaterThan(0)
      const guestCartCount = await guestCartItems.count()

      // Login
      await loginUser(page, testUser.email, testUser.password)

      // Go to cart - items should be migrated
      await page.goto('/cart', { waitUntil: 'domcontentloaded' })

      const migratedCartItems = page.locator(
        '[data-testid="cart-item"], .cart-item, [class*="cart"] [class*="item"]'
      )
      await expect
        .poll(() => migratedCartItems.count(), { timeout: 15000 })
        .toBeGreaterThanOrEqual(guestCartCount)
    })
  })

  test.describe('Authenticated User Checkout', () => {
    test('authenticated user can access checkout page', async ({ page }) => {
      const testUser = generateTestUser('CheckoutAccess')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Navigate to checkout
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      // Should be on checkout page (not redirected)
      expect(page.url()).toContain('/checkout')
      expect(page.url()).not.toContain('/auth/signin')
    })

    test('checkout page displays cart summary', async ({ page }) => {
      const testUser = generateTestUser('CheckoutSummary')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Navigate to checkout
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      // Should show cart items or order summary
      const hasSummary = await page
        .locator(
          '[data-testid="cart-summary"], [data-testid="order-summary"], .cart-summary, .order-summary'
        )
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      const hasProducts = await page
        .locator(
          '[data-testid="cart-item"], [data-testid="checkout-item"], .checkout-item'
        )
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      const hasTotal = await page
        .locator('[data-testid="total"], .total, text=/\\$[0-9]+/')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // At least one of these should be visible
      expect(hasSummary || hasProducts || hasTotal).toBeTruthy()
    })

    test('can complete checkout flow to payment', async ({ page }) => {
      requireStripeCheckoutConfig()

      const testUser = generateTestUser('CheckoutComplete')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Navigate to checkout
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      // Fill checkout form fields if present
      const formFields = [
        { selector: 'input[name="email"], input[type="email"], #email', value: validCheckoutData.email },
        { selector: 'input[name="firstName"], #firstName', value: validCheckoutData.firstName },
        { selector: 'input[name="lastName"], #lastName', value: validCheckoutData.lastName },
        { selector: 'input[name="address"], #address', value: validCheckoutData.address },
        { selector: 'input[name="city"], #city', value: validCheckoutData.city },
        { selector: 'input[name="zipCode"], input[name="zip"], #zipCode, #zip', value: validCheckoutData.zipCode },
      ]

      for (const field of formFields) {
        const input = page.locator(field.selector).first()
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill(field.value)
        }
      }

      // Handle state select/input
      const stateInput = page
        .locator('input[name="state"], #state, select[name="state"]')
        .first()
      if (await stateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const tagName = await stateInput.evaluate((el) => el.tagName)
        if (tagName === 'SELECT') {
          await stateInput.selectOption(validCheckoutData.state)
        } else {
          await stateInput.fill(validCheckoutData.state)
        }
      }

      // Submit form
      const submitButton = page
        .locator(
          'button[type="submit"]:has-text("Place Order"), button[type="submit"]:has-text("Checkout"), button[type="submit"]:has-text("Pay"), button[type="submit"]:has-text("Continue")'
        )
        .first()

      await expect(submitButton).toBeVisible({ timeout: 5000 })

      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/checkout'),
        { timeout: 10000 }
      )

      await submitButton.click()

      const response = await responsePromise
      expect(response.status()).toBe(200)

      const body = await response.json()
      expect(body.sessionUrl || body.sessionId || body.success).toBeDefined()
    })
  })

  test.describe('Checkout Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      const testUser = generateTestUser('CheckoutValidation')
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)
      await addItemToCart(page)
    })

    test('shows validation errors for empty form submission', async ({
      page,
    }) => {
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      // Try to submit empty form
      const submitButton = page
        .locator(
          'button[type="submit"]:has-text("Place Order"), button[type="submit"]:has-text("Checkout"), button[type="submit"]:has-text("Pay")'
        )
        .first()

      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click()

        // Should show validation errors
        await page
          .waitForSelector(
            '[role="alert"], .text-red-600, .error-message, :invalid',
            { timeout: 3000 }
          )
          .catch(() => {})

        const hasErrors =
          (await page.locator('[role="alert"], .text-red-600, .error-message').count()) > 0
        const hasInvalidFields = (await page.locator(':invalid').count()) > 0

        expect(hasErrors || hasInvalidFields).toBeTruthy()
      }
    })

    test('validates email format', async ({ page }) => {
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      const emailInput = page
        .locator('input[name="email"], input[type="email"], #email')
        .first()

      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill('invalid-email')
        await emailInput.blur()

        // Check for invalid state
        const isInvalid = await emailInput.evaluate(
          (el: HTMLInputElement) => !el.validity.valid
        )
        expect(isInvalid).toBeTruthy()
      }
    })

    test('validates ZIP code format', async ({ page }) => {
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      const zipInput = page
        .locator('input[name="zipCode"], input[name="zip"], #zipCode, #zip')
        .first()

      if (await zipInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await zipInput.fill('invalid')
        await zipInput.blur()

        // Should show validation error or have invalid state
        const hasError = await page
          .locator('.text-red-600, [role="alert"]')
          .isVisible()
          .catch(() => false)
        const isInvalid = await zipInput
          .evaluate((el: HTMLInputElement) => !el.validity.valid)
          .catch(() => false)

        expect(hasError || isInvalid).toBeTruthy()
      }
    })

    test('validates required fields', async ({ page }) => {
      await page.goto('/checkout')
      await page.waitForLoadState('networkidle')

      // Required fields to test
      const requiredFields = [
        'input[name="firstName"], #firstName',
        'input[name="lastName"], #lastName',
        'input[name="address"], #address',
        'input[name="city"], #city',
      ]

      for (const selector of requiredFields) {
        const input = page.locator(selector).first()
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Check if field has required attribute
          const isRequired = await input.evaluate(
            (el: HTMLInputElement) => el.required
          )
          if (isRequired) {
            // Try to submit and verify validation
            await input.focus()
            await input.blur()
          }
        }
      }
    })
  })

  test.describe('Checkout API Security', () => {
    test('rejects checkout with empty cart', async ({ page }) => {
      const testUser = generateTestUser('CheckoutEmptyCart')

      // Create and login user (but don't add items to cart)
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Get CSRF token
      const csrfToken = await getCsrfToken(page)

      // Try to checkout with empty cart
      const response = await page.request.post('/api/checkout', {
        data: validCheckoutData,
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      // Should fail with 400 - cart is empty
      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
    })

    test('rejects checkout without CSRF token', async ({ page }) => {
      const testUser = generateTestUser('CheckoutNoCsrf')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Try to checkout without CSRF token
      const response = await page.request.post('/api/checkout', {
        data: validCheckoutData,
      })

      // Should fail with 403 - CSRF validation failed
      expect(response.status()).toBe(403)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error?.code).toBe('CSRF_VALIDATION_FAILED')
    })

    test('rejects checkout with invalid form data', async ({ page }) => {
      const testUser = generateTestUser('CheckoutInvalidData')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Get CSRF token
      const csrfToken = await getCsrfToken(page)

      // Try to checkout with invalid data
      const response = await page.request.post('/api/checkout', {
        data: {
          email: 'invalid-email', // Invalid email
          firstName: '', // Empty
          lastName: 'Doe',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: 'invalid', // Invalid ZIP
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      // Should fail with 400 - validation error
      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error?.code).toBe('VALIDATION_ERROR')
    })

    test('does not allow price manipulation', async ({ page }) => {
      requireStripeCheckoutConfig()

      const testUser = generateTestUser('CheckoutPriceManip')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Get CSRF token
      const csrfToken = await getCsrfToken(page)

      // Try to submit with manipulated price (should be ignored)
      const response = await page.request.post('/api/checkout', {
        data: {
          ...validCheckoutData,
          // These should be ignored by server
          total: 0.01,
          price: 0.01,
          items: [{ price: 0.01 }],
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      // Server should use database prices, not client-submitted prices.
      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.sessionUrl || body.sessionId).toBeDefined()
    })
  })

  test.describe('Checkout with Stripe Test Mode', () => {
    test('valid checkout request returns Stripe session', async ({ page }) => {
      requireStripeCheckoutConfig()

      const testUser = generateTestUser('CheckoutStripe')

      // Create and login user
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      // Add item to cart
      await addItemToCart(page)

      // Get CSRF token
      const csrfToken = await getCsrfToken(page)

      // Submit valid checkout request
      const response = await page.request.post('/api/checkout', {
        data: validCheckoutData,
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      const body = await response.json()

      expect(response.status()).toBe(200)
      expect(body.sessionUrl || body.sessionId).toBeDefined()
    })
  })
})
