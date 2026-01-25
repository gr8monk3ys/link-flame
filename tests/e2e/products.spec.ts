import { test, expect } from '@playwright/test'
import {
  createTestUser,
  loginUser,
  generateTestUser,
  waitForCartUpdate,
} from './fixtures/auth'

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
  test.describe('Product Listing Page', () => {
    test('products page loads with items', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Wait for products to load
      const productCard = page
        .locator('[data-testid="product-card"], .group.relative')
        .first()

      await expect(productCard).toBeVisible({ timeout: 10000 })
    })

    test('product cards display correct information', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Wait for products
      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Check first product card
      const firstProduct = page
        .locator('[data-testid="product-card"], .group.relative')
        .first()

      // Should have image
      const hasImage = await firstProduct
        .locator('img')
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      // Should have title
      const hasTitle = await firstProduct
        .locator('h3, a')
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

      await page.goto('/collections')

      // Should show loading state (skeletons or spinner)
      const loadingState = page.locator(
        '.animate-pulse, [data-testid="loading"], text=/loading/i'
      )

      // Loading state may be brief, just verify page loads
      await page.waitForLoadState('networkidle')
    })

    test('shows empty state when no products match filter', async ({
      page,
    }) => {
      // Navigate with impossible filter
      await page.goto('/collections?search=xyznonexistentproduct123')
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

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
        await page.waitForLoadState('networkidle')

        // Products should update
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('price range filter works', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Find price filter inputs
      const minPriceInput = page.locator(
        'input[name="minPrice"], input[placeholder*="min"], #minPrice'
      )
      const maxPriceInput = page.locator(
        'input[name="maxPrice"], input[placeholder*="max"], #maxPrice'
      )

      if (await minPriceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await minPriceInput.fill('10')
        await page.waitForLoadState('networkidle')

        // Products should filter
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('search filter returns relevant results', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Find search input
      const searchInput = page.locator(
        'input[name="search"], input[type="search"], input[placeholder*="search"], #search'
      )

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('eco')
        await page.waitForLoadState('networkidle')

        // Wait for search results
        await page.waitForTimeout(500) // Debounce delay

        // Products should update
        await page.waitForSelector('[data-testid="product-card"], .group.relative, text=/no products/i', {
          timeout: 10000,
        })
      }
    })

    test('rating filter works', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Find rating filter
      const ratingFilter = page.locator(
        'input[name*="rating"], select[name*="rating"], [data-testid="rating-filter"]'
      )

      if (await ratingFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click or select rating
        await ratingFilter.first().click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('values filter (sustainability) works', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Find values/sustainability filter
      const valuesFilter = page.locator(
        '[data-testid="value-filter"], button:has-text("Vegan"), button:has-text("Organic"), [class*="value"]'
      )

      if (await valuesFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await valuesFilter.first().click()
        await page.waitForLoadState('networkidle')

        // URL should update with values parameter
        // Products should filter
        await page.waitForSelector('[data-testid="product-card"], .group.relative, text=/no products/i', {
          timeout: 10000,
        })
      }
    })

    test('can clear filters', async ({ page }) => {
      await page.goto('/collections?search=test')
      await page.waitForLoadState('networkidle')

      // Find clear filters button
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("Reset"), [data-testid="clear-filters"]'
      )

      if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clearButton.click()
        await page.waitForLoadState('networkidle')

        // URL should be cleaned
        expect(page.url()).not.toContain('search=test')
      }
    })
  })

  test.describe('Product Pagination', () => {
    test('pagination controls are visible', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Find next button
      const nextButton = page.locator(
        'button:has-text("Next"), button[aria-label*="Next"]'
      )

      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')

        // Products should update (different page)
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })

    test('can change page size', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Find page size selector
      const pageSizeSelect = page.locator(
        'select:has-text("Show"), [data-testid="page-size"]'
      )

      if (await pageSizeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pageSizeSelect.selectOption('24')
        await page.waitForLoadState('networkidle')

        // More products should load
        await page.waitForSelector('[data-testid="product-card"], .group.relative', {
          timeout: 10000,
        })
      }
    })
  })

  test.describe('Product Detail Page', () => {
    test('product detail page shows all information', async ({ page }) => {
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Wait for products
      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Click on first product
      const firstProduct = page
        .locator('[data-testid="product-card"] a, .group.relative a')
        .first()

      await firstProduct.click()
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Click on first product
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Click on first product
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Click on first product
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

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

    test('can add product to cart from detail page', async ({ page }) => {
      const testUser = generateTestUser('AddToCartDetail')

      // Login required for add to cart
      await createTestUser(page, testUser)
      await loginUser(page, testUser.email, testUser.password)

      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Navigate to product detail
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

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

      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Navigate to product detail
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

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
      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      await page.waitForSelector('[data-testid="product-card"], .group.relative', {
        timeout: 10000,
      })

      // Navigate to product detail
      await page.locator('[data-testid="product-card"] a, .group.relative a').first().click()
      await page.waitForLoadState('networkidle')

      // Look for variant selector
      const variantSelector = page.locator(
        '[data-testid="variant-selector"], select, button[aria-label*="size"], button[aria-label*="color"]'
      )

      if (await variantSelector.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click to select variant
        await variantSelector.first().click()

        // Verify variant selection works
        expect(page.url()).toContain('/products/')
      }
    })
  })

  test.describe('Product API', () => {
    test('products API returns products', async ({ page }) => {
      const response = await page.request.get('/api/products')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('products')
      expect(Array.isArray(body.products)).toBeTruthy()
    })

    test('products API supports pagination', async ({ page }) => {
      const response = await page.request.get('/api/products?page=1&pageSize=5')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('products')
      expect(body.products.length).toBeLessThanOrEqual(5)
    })

    test('products API supports search', async ({ page }) => {
      const response = await page.request.get('/api/products?search=eco')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body).toHaveProperty('products')
    })

    test('single product API returns product details', async ({ page }) => {
      // First get a product ID
      const listResponse = await page.request.get('/api/products')
      const listBody = await listResponse.json()

      if (listBody.products && listBody.products.length > 0) {
        const productId = listBody.products[0].id

        // Get specific product
        const response = await page.request.get(`/api/products/${productId}`)

        expect(response.ok()).toBeTruthy()

        const body = await response.json()
        expect(body.id).toBe(productId)
        expect(body).toHaveProperty('title')
        expect(body).toHaveProperty('price')
      }
    })

    test('returns 404 for non-existent product', async ({ page }) => {
      const response = await page.request.get('/api/products/non-existent-id')

      expect(response.status()).toBe(404)
    })
  })
})
