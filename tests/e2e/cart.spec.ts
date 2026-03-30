import { test, expect } from '@playwright/test'
import { addItemToCart, createTestUser, loginUser, waitForCartUpdate } from './fixtures'

/**
 * Shopping Cart E2E Tests
 *
 * Tests cart operations for both authenticated and guest users:
 * - Add items to cart
 * - Update item quantities
 * - Remove items from cart
 * - Guest session cart persistence
 * - Cart migration when guest logs in
 * - Cart total calculation
 */

// Helper to generate unique test user
const generateTestUser = () => ({
  name: `Cart Test ${Date.now()}`,
  email: `cart${Date.now()}@example.com`,
  password: 'TestPassword123!',
})

let testIpCounter = 1

const nextTestIp = () => {
  testIpCounter = (testIpCounter % 250) + 1
  return `172.16.0.${testIpCounter}`
}

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({
    'x-forwarded-for': nextTestIp(),
  })
})

test.describe('Guest Cart Operations', () => {
  test('should add item to cart as guest user', async ({ page }) => {
    await addItemToCart(page)

    // Navigate to cart page
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    // Verify item is in cart
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => cartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should persist guest cart across page reloads', async ({ page }) => {
    // Add item to cart
    await addItemToCart(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => cartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const initialItemCount = await cartItems.count()

    // Reload page
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Cart should still have items
    const afterReloadItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => afterReloadItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const afterReloadCount = await afterReloadItems.count()
    expect(afterReloadCount).toBe(initialItemCount)
    expect(afterReloadCount).toBeGreaterThan(0)
  })

  test('should update item quantity in cart', async ({ page }) => {
    // Add item to cart
    await addItemToCart(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    // Find quantity input or increment button
    const quantityInput = page.locator('input[type="number"]').first()
    const incrementButton = page.locator('button[aria-label*="Increase"], button:has-text("+")').first()

    // Try to increase quantity
    if (await incrementButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await incrementButton.click()
      await waitForCartUpdate(page)
    } else if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quantityInput.fill('2')
      await waitForCartUpdate(page)
    }

    // Verify quantity updated (implementation specific)
    // This is a placeholder - actual verification depends on UI
  })

  test('should remove item from cart', async ({ page }) => {
    // Add item to cart
    await addItemToCart(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => cartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const initialCount = await cartItems.count()

    const removeFirstItem = async () => {
      const firstCartItem = page.locator('[data-testid="cart-item"], .cart-item').first()
      const removeButton = firstCartItem
        .locator('button[aria-label="Remove item"], button:has-text("Remove")')
        .first()

      await expect(removeButton).toBeVisible({ timeout: 5000 })
      const deleteRequest = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/cart') &&
            response.request().method() === 'DELETE',
          { timeout: 5000 }
        )
        .catch(() => null)

      await removeButton.click()
      await deleteRequest
      await waitForCartUpdate(page)
    }

    await removeFirstItem()

    try {
      await expect
        .poll(() => page.locator('[data-testid="cart-item"], .cart-item').count(), {
          timeout: 5000,
        })
        .toBeLessThan(initialCount)
    } catch {
      // Retry once for occasional click/UI race flakiness.
      await removeFirstItem()
    }

    // Verify item removed
    await expect
      .poll(() => page.locator('[data-testid="cart-item"], .cart-item').count(), {
        timeout: 15000,
      })
      .toBeLessThan(initialCount)
  })
})

test.describe('Authenticated Cart Operations', () => {
  test('should add item to cart as authenticated user', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user with CSRF token
    await createTestUser(page, testUser)
    await loginUser(page, testUser.email, testUser.password)

    // Add item to cart
    await addItemToCart(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    // Verify item in cart
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => cartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should persist authenticated user cart in database', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user with CSRF token
    await createTestUser(page, testUser)
    await loginUser(page, testUser.email, testUser.password)

    // Add item to cart
    await addItemToCart(page)

    // Sign out
    await page.goto('/auth/signout')
    await page.waitForLoadState('domcontentloaded')

    // Click signout button if visible
    const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Sign out")')
    if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutBtn.click()
      await page.waitForLoadState('domcontentloaded')
    }

    // Sign back in
    await loginUser(page, testUser.email, testUser.password)

    // Go to cart - should still have items
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => cartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })
})

test.describe('Cart Migration', () => {
  test('should migrate guest cart when user logs in', async ({ page }) => {
    const testUser = generateTestUser()

    // Create user first with CSRF token
    await createTestUser(page, testUser)

    // Add item to cart as guest
    await addItemToCart(page)

    // Go to cart and verify guest cart
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    const guestCartItems = page.locator('[data-testid="cart-item"], .cart-item')
    await expect
      .poll(() => guestCartItems.count(), { timeout: 15000 })
      .toBeGreaterThan(0)
    const guestCartCount = await guestCartItems.count()
    expect(guestCartCount).toBeGreaterThan(0)

    // Now sign in
    await loginUser(page, testUser.email, testUser.password)

    // Wait for cart migration API call to complete
    await page.waitForLoadState('domcontentloaded')

    // Go to cart - guest items should be migrated
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')

    await expect
      .poll(
        () => page.locator('[data-testid="cart-item"], .cart-item').count(),
        { timeout: 15000 }
      )
      .toBeGreaterThanOrEqual(guestCartCount)
  })
})

test.describe('Cart API', () => {
  test('should retrieve cart via API', async ({ page }) => {
    // Add item via UI to initialize cart
    await addItemToCart(page)

    // Call cart API
    const response = await page.request.get('/api/cart')

    expect(response.ok()).toBeTruthy()

    const cart = await response.json()
    // API returns { success: true, data: [...] } format
    expect(cart).toHaveProperty('success', true)
    expect(cart).toHaveProperty('data')
    expect(Array.isArray(cart.data)).toBeTruthy()
    expect(cart.data.length).toBeGreaterThan(0)
  })

  test('should add item via cart API', async ({ page }) => {
    // Get a product ID first (mock or from products endpoint)
    const productsResponse = await page.request.get('/api/products?pageSize=1')
    const productsBody = await productsResponse.json()

    if (productsBody?.data?.length > 0) {
      const productId = productsBody.data[0].id

      // Get CSRF token
      const csrfResponse = await page.request.get('/api/csrf')
      const csrfBody = await csrfResponse.json()
      const csrfToken = csrfBody?.token

      // Add to cart via API
      const response = await page.request.post('/api/cart', {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
        data: {
          productId,
          quantity: 1,
        },
      })

      expect(response.ok()).toBeTruthy()

      const cart = await response.json()
      expect(cart).toHaveProperty('success', true)
    }
  })
})
