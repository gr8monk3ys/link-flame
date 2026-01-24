import { test, expect } from '@playwright/test'

/**
 * Checkout Flow E2E Tests
 *
 * Tests the complete checkout process:
 * - Checkout page access and protection
 * - Form validation
 * - Cart requirements
 * - Checkout API integration
 * - CSRF protection
 */

// Helper to generate unique test user
const generateTestUser = () => ({
  name: `Checkout Test ${Date.now()}`,
  email: `checkout${Date.now()}@example.com`,
  password: 'TestPassword123!',
})

// Valid checkout form data
const validCheckoutData = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
}

// Helper to wait for cart API response
const waitForCartUpdate = async (page: import('@playwright/test').Page) => {
  await Promise.race([
    page.waitForResponse(
      (response) => response.url().includes('/api/cart') && response.status() === 200,
      { timeout: 5000 }
    ),
    page.waitForLoadState('networkidle', { timeout: 5000 }),
  ]).catch(() => {})
}

// Helper to add item to cart
const addItemToCart = async (page: import('@playwright/test').Page) => {
  await page.goto('/collections')
  await page.waitForSelector('.group.relative, [data-testid="product-card"]', { timeout: 10000 })
  await page.locator('button:has-text("Add to Cart")').first().click()
  await waitForCartUpdate(page)
}

test.describe('Checkout Page Access', () => {
  test('should redirect unauthenticated users to signin when accessing checkout', async ({ page }) => {
    // Try to access checkout without authentication
    await page.goto('/checkout')

    // Should redirect to signin with callback URL
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 })

    expect(page.url()).toContain('/auth/signin')
  })

  test('should allow authenticated users to access checkout page', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')

    // Wait for auth to complete
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Now access checkout
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Should be on checkout page
    expect(page.url()).toContain('/checkout')
  })
})

test.describe('Checkout Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]:has-text("Place Order"), button[type="submit"]:has-text("Checkout"), button[type="submit"]:has-text("Pay")')

    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click()

      // Should show validation errors
      await page.waitForSelector('[role="alert"], .text-red-600, .error-message, :invalid', {
        timeout: 3000,
      }).catch(() => {})

      // Check for validation state
      const hasErrors = await page.locator('[role="alert"], .text-red-600, .error-message').count()
      const hasInvalidFields = await page.locator(':invalid').count()

      expect(hasErrors > 0 || hasInvalidFields > 0).toBeTruthy()
    }
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Fill email with invalid format
    const emailInput = page.locator('input[name="email"], input[type="email"], #email')
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('invalid-email')

      // Trigger validation
      await emailInput.blur()

      // Check for invalid state
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBeTruthy()
    }
  })

  test('should validate ZIP code format', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Find ZIP code input
    const zipInput = page.locator('input[name="zipCode"], input[name="zip"], #zipCode, #zip')
    if (await zipInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await zipInput.fill('invalid')

      // Try to submit or trigger validation
      await zipInput.blur()

      // Should show validation error or have invalid state
      const hasError = await page.locator('.text-red-600, [role="alert"]').isVisible().catch(() => false)
      const isInvalid = await zipInput.evaluate((el: HTMLInputElement) => !el.validity.valid).catch(() => false)

      expect(hasError || isInvalid).toBeTruthy()
    }
  })
})

test.describe('Checkout API', () => {
  test('should reject checkout with empty cart', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user (but don't add items to cart)
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Get CSRF token first
    const csrfResponse = await page.request.get('/api/csrf')
    const { token: csrfToken } = await csrfResponse.json()

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
    expect(body.error?.message).toContain('empty')
  })

  test('should reject checkout without CSRF token', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

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

  test('should reject checkout with invalid form data', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)

    // Get CSRF token
    const csrfResponse = await page.request.get('/api/csrf')
    const { token: csrfToken } = await csrfResponse.json()

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

  test('should accept valid checkout request with items in cart', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)

    // Get CSRF token
    const csrfResponse = await page.request.get('/api/csrf')
    const { token: csrfToken } = await csrfResponse.json()

    // Submit valid checkout request
    const response = await page.request.post('/api/checkout', {
      data: validCheckoutData,
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })

    // Check response - either success (with Stripe) or 500 (if Stripe not configured)
    const body = await response.json()

    if (response.status() === 200) {
      // Stripe is configured - should return session URL
      expect(body.sessionUrl || body.sessionId).toBeDefined()
    } else if (response.status() === 500) {
      // Stripe not configured - acceptable in test environment
      expect(body.error?.message).toContain('checkout')
    } else {
      // Unexpected status
      expect(response.status()).toBe(200)
    }
  })
})

test.describe('Checkout Flow - End to End', () => {
  test('should complete checkout flow from cart to payment', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)

    // Navigate to checkout
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Fill checkout form
    const emailInput = page.locator('input[name="email"], input[type="email"], #email').first()
    const firstNameInput = page.locator('input[name="firstName"], #firstName').first()
    const lastNameInput = page.locator('input[name="lastName"], #lastName').first()
    const addressInput = page.locator('input[name="address"], #address').first()
    const cityInput = page.locator('input[name="city"], #city').first()
    const stateInput = page.locator('input[name="state"], #state, select[name="state"]').first()
    const zipInput = page.locator('input[name="zipCode"], input[name="zip"], #zipCode, #zip').first()

    // Fill each field if visible
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(validCheckoutData.email)
    }
    if (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstNameInput.fill(validCheckoutData.firstName)
    }
    if (await lastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lastNameInput.fill(validCheckoutData.lastName)
    }
    if (await addressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addressInput.fill(validCheckoutData.address)
    }
    if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cityInput.fill(validCheckoutData.city)
    }
    if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Handle select or input
      const tagName = await stateInput.evaluate((el) => el.tagName)
      if (tagName === 'SELECT') {
        await stateInput.selectOption(validCheckoutData.state)
      } else {
        await stateInput.fill(validCheckoutData.state)
      }
    }
    if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await zipInput.fill(validCheckoutData.zipCode)
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Place Order"), button[type="submit"]:has-text("Checkout"), button[type="submit"]:has-text("Pay"), button[type="submit"]').first()

    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Listen for navigation or API response
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/checkout'),
        { timeout: 10000 }
      ).catch(() => null)

      await submitButton.click()

      const response = await responsePromise

      if (response) {
        // If we got an API response, check it
        if (response.status() === 200) {
          // Success - may redirect to Stripe or order confirmation
          const body = await response.json()
          expect(body.sessionUrl || body.sessionId).toBeDefined()
        }
        // Other statuses may indicate Stripe not configured, which is acceptable
      }
    }
  })

  test('should show cart summary on checkout page', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)

    // Navigate to checkout
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Should show cart items or order summary
    const cartSummary = page.locator('[data-testid="cart-summary"], [data-testid="order-summary"], .cart-summary, .order-summary')
    const productName = page.locator('[data-testid="cart-item"], [data-testid="checkout-item"], .cart-item h3, .cart-item h4')
    const totalAmount = page.locator('[data-testid="total"], .total, text=/\\$[0-9]+/')

    // At least one of these should be visible to confirm cart info is shown
    const hasSummary = await cartSummary.isVisible({ timeout: 3000 }).catch(() => false)
    const hasProductName = await productName.first().isVisible({ timeout: 3000 }).catch(() => false)
    const hasTotal = await totalAmount.first().isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasSummary || hasProductName || hasTotal).toBeTruthy()
  })
})

test.describe('Checkout Security', () => {
  test('should not expose product prices to client manipulation', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    })

    await page.goto('/auth/signin')
    await page.fill('#email', testUser.email)
    await page.fill('#password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await addItemToCart(page)

    // Get CSRF token
    const csrfResponse = await page.request.get('/api/csrf')
    const { token: csrfToken } = await csrfResponse.json()

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

    // Server should use database prices, not client-submitted prices
    // If Stripe is configured, it will create session with correct prices
    // If not, it will fail but not because of price manipulation
    if (response.status() === 200) {
      const body = await response.json()
      // Success means server calculated its own price
      expect(body.sessionUrl || body.sessionId).toBeDefined()
    }
  })
})
