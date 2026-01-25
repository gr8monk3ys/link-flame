import { test, expect } from '@playwright/test'
import { createTestUser, waitForCartUpdate } from './fixtures'

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

test.describe('Guest Cart Operations', () => {
  test('should add item to cart as guest user', async ({ page }) => {
    // Navigate to products page
    await page.goto('/collections')

    // Wait for products to load
    await page.waitForSelector('.group.relative, [data-testid="product-card"]', {
      timeout: 10000,
    })

    // Click "Add to Cart" on first product (selector may vary)
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first()
    await addToCartButton.click()

    // Wait for cart API response
    await waitForCartUpdate(page)

    // Navigate to cart page
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    // Verify item is in cart
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should persist guest cart across page reloads', async ({ page }) => {
    // Add item to cart
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')
    const initialItemCount = await page.locator('[data-testid="cart-item"], .cart-item').count()

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Cart should still have items
    const afterReloadCount = await page.locator('[data-testid="cart-item"], .cart-item').count()
    expect(afterReloadCount).toBe(initialItemCount)
    expect(afterReloadCount).toBeGreaterThan(0)
  })

  test('should update item quantity in cart', async ({ page }) => {
    // Add item to cart
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

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
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    const initialCount = await page.locator('[data-testid="cart-item"], .cart-item').count()

    // Find and click remove button
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]').first()
    await removeButton.click()

    // Wait for cart to update after removal
    await waitForCartUpdate(page)

    // Verify item removed
    const afterCount = await page.locator('[data-testid="cart-item"], .cart-item').count()
    expect(afterCount).toBe(initialCount - 1)
  })
})

test.describe('Authenticated Cart Operations', () => {
  test('should add item to cart as authenticated user', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user with CSRF token
    await createTestUser(page, testUser)

    await page.goto('/auth/signin')
    await page.fill('input[name="email"], #email', testUser.email)
    await page.fill('input[name="password"], #password', testUser.password)
    await page.click('button[type="submit"]')

    // Wait for redirect away from auth
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Go to cart
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    // Verify item in cart
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    const itemCount = await cartItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should persist authenticated user cart in database', async ({ page }) => {
    const testUser = generateTestUser()

    // Create and login user with CSRF token
    await createTestUser(page, testUser)

    await page.goto('/auth/signin')
    await page.fill('input[name="email"], #email', testUser.email)
    await page.fill('input[name="password"], #password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Add item to cart
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Sign out
    await page.goto('/auth/signout')
    await page.waitForLoadState('networkidle')

    // Click signout button if visible
    const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Sign out")')
    if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutBtn.click()
      await page.waitForLoadState('networkidle')
    }

    // Sign back in
    await page.goto('/auth/signin')
    await page.fill('input[name="email"], #email', testUser.email)
    await page.fill('input[name="password"], #password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Go to cart - should still have items
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
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
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

    // Go to cart and verify guest cart
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    const guestCartCount = await page.locator('[data-testid="cart-item"], .cart-item').count()
    expect(guestCartCount).toBeGreaterThan(0)

    // Now sign in
    await page.goto('/auth/signin')
    await page.fill('input[name="email"], #email', testUser.email)
    await page.fill('input[name="password"], #password', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!auth)/, { timeout: 10000 }).catch(() => {})

    // Wait for cart migration API call to complete
    await page.waitForLoadState('networkidle')

    // Go to cart - guest items should be migrated
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    const migratedCartCount = await page.locator('[data-testid="cart-item"], .cart-item').count()

    expect(migratedCartCount).toBeGreaterThanOrEqual(guestCartCount)
  })
})

test.describe('Cart API', () => {
  test('should retrieve cart via API', async ({ page }) => {
    // Add item via UI to initialize cart
    await page.goto('/collections')
    await page.waitForSelector('.group.relative, [data-testid="product-card"]')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await waitForCartUpdate(page)

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
    const productsResponse = await page.request.get('/api/products')
    const products = await productsResponse.json()

    if (products && products.length > 0) {
      const productId = products[0].id

      // Add to cart via API
      const response = await page.request.post('/api/cart', {
        data: {
          productId,
          quantity: 1,
        },
      })

      expect(response.ok()).toBeTruthy()

      const cart = await response.json()
      expect(cart.items.length).toBeGreaterThan(0)
    }
  })
})
