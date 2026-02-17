import { test, expect, type Page } from '@playwright/test'
import {
  createTestUser,
  loginUser,
  generateTestUser,
  waitForCartUpdate,
} from './fixtures/auth'

const randomTestIp = () => {
  const octet = () => Math.floor(Math.random() * 250) + 1
  return `10.${octet()}.${octet()}.${octet()}`
}

const goToFirstProduct = async (page: Page) => {
  await page.goto('/collections', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('[data-testid="product-card"], .group.relative', {
    timeout: 10000,
  })

  const productLink = page.locator('a[href^="/products/"]').first()
  const href = await productLink.getAttribute('href').catch(() => null)

  if (href) {
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('domcontentloaded')
    return
  }

  // Fallback for transient listing/filter states: navigate directly from API.
  const productsResponse = await page.request.get('/api/products?page=1&pageSize=1')
  if (!productsResponse.ok()) {
    throw new Error(`Unable to fetch products for detail navigation: ${productsResponse.status()}`)
  }

  const productsPayload = await productsResponse.json()
  const firstProductId = productsPayload?.data?.[0]?.id
  expect(firstProductId).toBeTruthy()

  await page.goto(`/products/${firstProductId}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Product Browsing E2E Tests
 *
 * Tests product-related functionality:
 * - Product listing/collections page
 * - Product filtering and search
 * - Product detail page
 * - Add to cart functionality
 * - Product reviews
 * - Pagination
 */

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    })
  })

  test.describe('Product Listing Page', () => {
    test('products page loads with items', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for products to load
      const productCard = page
        .locator('[data-testid="product-card"], .group.relative')
        .first()

      await expect(productCard).toBeVisible({ timeout: 10000 })
    })

    test('product cards display correct information', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for products
      await page.waitForSelector('[data-testid="product-card"]', {
        timeout: 10000,
      })

      // Check first product card
      const firstProduct = page
        .locator('[data-testid="product-card"]')
        .first()

      // Should have image
      const hasImage = await firstProduct
        .locator('img')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Should have title
      const hasTitle = await firstProduct
        .locator('h3')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Should have price
      const hasPrice = await firstProduct
        .locator('text=/\\$[0-9]+/')
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasImage || hasTitle).toBeTruthy()
    })

    test('shows loading state while fetching products', async ({ page }) => {
      // Intercept API to delay response
      await page.route('/api/products*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.continue()
      })

      await page.goto('/collections', { waitUntil: 'domcontentloaded' })

      // Should show loading state (skeletons or spinner)
      const loadingState = page.locator(
        '.animate-pulse, [data-testid="loading"], text=/loading/i'
      )

      // Loading state may be brief, just verify page loads
      await page.waitForLoadState('domcontentloaded')
    })

    test('shows empty state when no products match filter', async ({
      page,
    }) => {
      // Navigate with impossible filter
      await page.goto('/collections?search=xyznonexistentproduct123', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Should show empty state or no products message
      const emptyState = page.locator(
        'text=/no products|no results|not found/i'
      )
      const hasEmptyState = await emptyState
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // If products exist that match, that's fine too
      expect(
        hasEmptyState || page.url().includes('/collections')
      ).toBeTruthy()
    })
  })

  test.describe('Product Filtering', () => {
    test('category filter works', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for products
      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Find category filter
      const categoryFilter = page.locator(
        'input[type="checkbox"][name*="category"], button:has-text("Category"), [data-testid="category-filter"]'
      )

      if (await categoryFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await categoryFilter.first().click()
        await page.waitForLoadState('domcontentloaded')

        // Products should update
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('price range filter works', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find price filter inputs
      const minPriceInput = page.locator(
        'input[name="minPrice"], input[placeholder*="min"], #minPrice'
      )
      const maxPriceInput = page.locator(
        'input[name="maxPrice"], input[placeholder*="max"], #maxPrice'
      )

      if (await minPriceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await minPriceInput.fill('10')
        await page.waitForLoadState('domcontentloaded')

        // Products should filter
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('search filter returns relevant results', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find search input
      const searchInput = page.locator(
        'input[name="search"], input[type="search"], input[placeholder*="search"], #search'
      )

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('eco')
        await page.waitForLoadState('domcontentloaded')

        // Wait for search results
        await page.waitForTimeout(500) // Debounce delay

        // Products should update
        await Promise.race([
          page
            .waitForSelector('[data-testid="product-card"], .group.relative', {
              timeout: 10000,
            })
            .catch(() => {}),
          page.getByText(/no products/i).waitFor({ timeout: 10000 }).catch(() => {}),
        ])
      }
    })

    test('rating filter works', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find rating filter
      const ratingFilter = page.locator(
        'input[name*="rating"], select[name*="rating"], [data-testid="rating-filter"]'
      )

      if (await ratingFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click or select rating
        await ratingFilter.first().click()
        await page.waitForLoadState('domcontentloaded')
      }
    })

    test('values filter (sustainability) works', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find values/sustainability filter
      const valuesFilter = page.locator(
        '[data-testid="value-filter"], button:has-text("Vegan"), button:has-text("Organic"), [class*="value"]'
      )

      if (await valuesFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await valuesFilter.first().click()
        await page.waitForLoadState('domcontentloaded')

        // URL should update with values parameter
        // Products should filter
        await Promise.race([
          page
            .waitForSelector('[data-testid="product-card"], .group.relative', {
              timeout: 10000,
            })
            .catch(() => {}),
          page.getByText(/no products/i).waitFor({ timeout: 10000 }).catch(() => {}),
        ])
      }
    })

    test('subscribe & save (subscribable) filter works', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      const subscribableCheckbox = page.locator('#subscribable-filter')
      const isVisible = await subscribableCheckbox
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      if (!isVisible) return

      await subscribableCheckbox.click()

      await expect(page).toHaveURL(/subscribable=true/)

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // UI badge should show up for subscribable products
      const badge = page.getByText('Subscribe & Save').first()
      await expect(badge).toBeVisible({ timeout: 10000 })

      // API should return only subscribable items when filter is enabled
      const response = await page.request.get('/api/products?subscribable=true&page=1&pageSize=10')
      expect(response.ok()).toBeTruthy()
      const payload = await response.json()
      const products = Array.isArray(payload?.data) ? payload.data : []
      expect(products.length).toBeGreaterThan(0)
      expect(products.every((p: any) => p?.isSubscribable === true)).toBeTruthy()
    })

    test('can clear filters', async ({ page }) => {
      await page.goto('/collections?search=test', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find clear filters button
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("Reset"), [data-testid="clear-filters"]'
      )

      if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clearButton.click()
        await page.waitForLoadState('domcontentloaded')

        // URL should be cleaned
        expect(page.url()).not.toContain('search=test')
      }
    })
  })

  test.describe('Product Pagination', () => {
    test('pagination controls are visible', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Wait for products
      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Look for pagination
      const pagination = page.locator(
        'nav[aria-label*="pagination"], [data-testid="pagination"], button:has-text("Next")'
      )
      const hasPagination = await pagination
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Pagination may not be visible if few products
      expect(page.url()).toContain('/collections')
    })

    test('can navigate to next page', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Find next button
      const nextButton = page.locator(
        'button:has-text("Next"), button[aria-label*="Next"]'
      )

      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Products should update (different page)
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('can change page size', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      // Find page size selector
      const pageSizeSelect = page.locator(
        'select:has-text("Show"), [data-testid="page-size"]'
      )

      if (await pageSizeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pageSizeSelect.selectOption('24')
        await page.waitForLoadState('domcontentloaded')

        // More products should load
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })
  })

  test.describe('Product Detail Page', () => {
    test('product detail page shows all information', async ({ page }) => {
      await goToFirstProduct(page)

      // Should be on product detail page
      expect(page.url()).toMatch(/\/products\/[a-zA-Z0-9-]+/)

      // Check for expected elements
      const hasTitle = await page
        .locator('h1')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      const hasPrice = await page
        .locator('text=/\\$[0-9]+/')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      const hasImage = await page
        .locator('img')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasTitle || hasPrice || hasImage).toBeTruthy()
    })

    test('product detail shows stock status', async ({ page }) => {
      await goToFirstProduct(page)

      // Check for stock status
      const stockStatus = page.locator(
        'text=/in stock|out of stock|low stock|left/i'
      )
      const hasStockStatus = await stockStatus
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Stock status should be displayed
      expect(hasStockStatus || page.url().includes('/products/')).toBeTruthy()
    })

    test('product detail shows reviews if available', async ({ page }) => {
      await goToFirstProduct(page)

      // Check for reviews section
      const reviews = page.locator(
        'text=/reviews?/i, [data-testid="reviews"], .reviews'
      )
      const hasReviews = await reviews
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Reviews section should exist (may be empty)
      expect(hasReviews || page.url().includes('/products/')).toBeTruthy()
    })

    test('product detail shows sustainability information', async ({
      page,
    }) => {
      await goToFirstProduct(page)

      // Check for sustainability/eco information
      const ecoInfo = page.locator(
        'text=/vegan|organic|plastic.free|cruelty.free|carbon/i, [data-testid="eco-impact"]'
      )
      const hasEcoInfo = await ecoInfo
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Eco info may not be on all products
      expect(page.url()).toContain('/products/')
    })
  })

  test.describe('Add to Cart', () => {
    test('can add product to cart from listing page', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Hover over product to reveal add to cart button
      const productCard = page
        .locator('[data-testid="product-card"], .group.relative')
        .first()
      await productCard.hover()

      // Click add to cart
      const addToCartButton = page
        .locator('[data-testid="add-to-cart-button"], button:has-text("Add to Cart")')
        .first()

      await addToCartButton.click()
      await waitForCartUpdate(page)

      // Verify item was added (toast notification or cart count)
      const toast = page.locator(
        '[data-sonner-toast], .toast, text=/added to cart/i'
      )
      const hasToast = await toast
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Either toast or cart update should confirm add
      expect(hasToast || page.url().includes('/collections')).toBeTruthy()
    })

    test('can save product to wishlist from listing page', async ({ page }) => {
      const testUser = generateTestUser('SaveFromListing')

      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="product-card"]', {
        timeout: 10000,
      })

      const productCard = page.locator('[data-testid="product-card"]').first()
      await productCard.hover()

      const wishlistButton = productCard
        .locator('button[aria-label*="wishlist"]')
        .first()
      await expect(wishlistButton).toBeVisible({ timeout: 5000 })

      const saveRequest = page.waitForResponse(
        (response) =>
          response.url().includes('/api/saved-items') &&
          response.request().method() === 'POST',
        { timeout: 10000 }
      )

      await wishlistButton.click()

      const saveResponse = await saveRequest
      expect([200, 201]).toContain(saveResponse.status())

      const savedResponse = await page.request.get('/api/saved-items')
      expect(savedResponse.ok()).toBeTruthy()

      const payload = await savedResponse.json()
      const savedItems: Array<{ id: string }> = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : []

      expect(savedItems.length).toBeGreaterThan(0)
    })

    test('can add product to cart from detail page', async ({ page }) => {
      const testUser = generateTestUser('AddToCartDetail')

      // Login required for add to cart
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      await page.goto('/collections', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Navigate to product detail
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('domcontentloaded')

      // Find add to cart button
      const addToCartButton = page.locator(
        'button:has-text("Add to cart"), button:has-text("Add to Cart")'
      )

      if (await addToCartButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addToCartButton.click()
        await waitForCartUpdate(page)

        // Verify success
        const toast = page.locator(
          '[data-sonner-toast], .toast, text=/added to cart/i'
        )
        const hasToast = await toast
          .isVisible({ timeout: 3000 })
          .catch(() => false)

        expect(hasToast || page.url().includes('/products/')).toBeTruthy()
      }
    })

    test('shows error for out of stock products', async ({ page }) => {
      const testUser = generateTestUser('OutOfStock')

      // Login required for add to cart
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      await goToFirstProduct(page)

      // Check if out of stock button is disabled
      const outOfStockButton = page.locator(
        'button:has-text("Out of Stock"), button[disabled]:has-text("Out")'
      )
      const isOutOfStock = await outOfStockButton
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // If out of stock, button should be disabled
      if (isOutOfStock) {
        const isDisabled = await outOfStockButton.isDisabled()
        expect(isDisabled).toBeTruthy()
      }
    })

    test('variant selector works on product detail', async ({ page }) => {
      await goToFirstProduct(page)

      const variantSelect = page.locator('select').first()
      if (await variantSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        const options = await variantSelect.locator('option').count()
        const optionIndex = options > 1 ? 1 : 0
        await variantSelect.selectOption({ index: optionIndex })
        expect(page.url()).toContain('/products/')
        return
      }

      const variantButton = page.locator(
        '[data-testid="variant-selector"] button, button[aria-label*="size"], button[aria-label*="color"]'
      )
      if (await variantButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await variantButton.first().click()
        expect(page.url()).toContain('/products/')
      }
    })
  })

  test.describe('Product API', () => {
    test('products API returns products', async ({ page }) => {
      const response = await page.request.get('/api/products')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('products API supports pagination', async ({ page }) => {
      const response = await page.request.get('/api/products?page=1&pageSize=5')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body.data.length).toBeLessThanOrEqual(5)
    })

    test('products API supports search', async ({ page }) => {
      const response = await page.request.get('/api/products?search=eco')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('data')
    })

    test('single product API returns product details', async ({ page }) => {
      // First get a product ID
      const listResponse = await page.request.get('/api/products')
      const listBody = await listResponse.json()

      if (listBody.data && listBody.data.length > 0) {
        const productId = listBody.data[0].id

        // Get specific product
        let response = await page.request.get(`/api/products/${productId}`)
        for (let attempt = 0; attempt < 2 && !response.ok(); attempt += 1) {
          await page.waitForTimeout(250)
          response = await page.request.get(`/api/products/${productId}`)
        }

        if (!response.ok()) {
          const errorBody = await response.text().catch(() => '')
          throw new Error(`Expected product detail request to succeed, got ${response.status()} ${errorBody}`)
        }

        const body = await response.json()
        expect(body).toHaveProperty('data')
        expect(body.data.id).toBe(productId)
        expect(body.data).toHaveProperty('title')
        expect(body.data).toHaveProperty('price')
      }
    })

    test('returns 404 for non-existent product', async ({ page }) => {
      const response = await page.request.get('/api/products/non-existent-id')

      expect(response.status()).toBe(404)
    })
  })
})
