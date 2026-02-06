import { test as base, Page, expect } from '@playwright/test'

/**
 * Authentication Test Fixtures
 *
 * Provides reusable authentication utilities for E2E tests:
 * - Pre-authenticated pages
 * - Login/logout helpers
 * - Test user management
 */

/**
 * Test user data interface
 */
export interface TestUser {
  name: string
  email: string
  password: string
}

/**
 * Generate unique test user data
 * @param prefix - Optional prefix for the user name
 * @returns User data object with unique email
 */
export function generateTestUser(prefix = 'Test'): TestUser {
  const timestamp = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  return {
    name: `${prefix} User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
  }
}

function randomTestIp() {
  const octet = () => Math.floor(Math.random() * 250) + 1
  return `10.${octet()}.${octet()}.${octet()}`
}

async function setUniqueIpHeader(page: Page) {
  await page.context().setExtraHTTPHeaders({
    'x-forwarded-for': randomTestIp(),
  })
}

/**
 * Fetch a CSRF token from the API with retry logic
 * @param page - Playwright page instance
 * @param retries - Number of retries (default: 3)
 * @returns The CSRF token string
 */
export async function getCsrfToken(page: Page, retries = 3): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await page.request.get('/api/csrf')

      if (!response.ok()) {
        throw new Error(`CSRF endpoint returned status ${response.status()}`)
      }

      const contentType = response.headers()['content-type'] || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`)
      }

      const data = await response.json()
      if (!data.token) {
        throw new Error('CSRF token not found in response')
      }

      return data.token
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < retries - 1) {
        await page.waitForTimeout(100 * Math.pow(2, attempt))
      }
    }
  }

  throw lastError || new Error('Failed to get CSRF token after retries')
}

/**
 * Create a test user via API with CSRF protection
 * @param page - Playwright page instance
 * @param userData - User data to create
 * @returns The API response
 */
export async function createTestUser(
  page: Page,
  userData: TestUser,
  retries = 2
) {
  await setUniqueIpHeader(page)
  let lastResponse: Awaited<ReturnType<Page['request']['post']>> | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const csrfResponse = await page.request.get('/api/csrf')
    const csrfData = csrfResponse.ok() ? await csrfResponse.json() : null
    const csrfToken = csrfData?.token || (await getCsrfToken(page))

    let csrfCookieHeader: string | undefined
    const csrfCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'csrf_token'
    )
    if (csrfCookie) {
      csrfCookieHeader = `${csrfCookie.name}=${csrfCookie.value}`
    } else {
      const setCookie = csrfResponse.headers()['set-cookie']
      if (setCookie) {
        csrfCookieHeader = setCookie.split(';')[0]
      }
    }

    const headers: Record<string, string> = {
      'X-CSRF-Token': csrfToken,
    }
    if (csrfCookieHeader) {
      headers.Cookie = csrfCookieHeader
    }

    const response = await page.request.post('/api/auth/signup', {
      data: userData,
      headers,
    })

    if (response.ok()) {
      return response
    }

    lastResponse = response

    if (attempt < retries) {
      await page.waitForTimeout(100 * Math.pow(2, attempt))
    }
  }

  return lastResponse!
}

/**
 * Login a user via the UI
 * @param page - Playwright page instance
 * @param email - User email
 * @param password - User password
 */
export async function loginUser(page: Page, email: string, password: string) {
  await setUniqueIpHeader(page)
  await page.goto('/auth/signin')
  await page.waitForLoadState('networkidle')

  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')

  // Wait for session to be established
  await page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/auth/session') && response.status() === 200,
      { timeout: 15000 }
    )
    .catch(() => {
      // Session endpoint might not be called in some edge cases
    })

  // Ensure auth session cookie exists
  await expect
    .poll(
      async () => {
        const cookies = await page.context().cookies()
        return cookies.some((cookie) =>
          cookie.name.includes('session-token') || cookie.name.includes('authjs')
        )
      },
      { timeout: 15000 }
    )
    .toBeTruthy()

  // Wait for sign-in to complete - redirect away from auth
  await page
    .waitForURL((url) => !url.pathname.startsWith('/auth/signin'), {
      timeout: 15000,
    })
    .catch(() => {
      // Some flows keep the user on /auth/signin even after session is set
    })
  await page.waitForLoadState('domcontentloaded').catch(() => {
    // Best-effort; avoid hanging on long network activity
  })
}

/**
 * Logout the current user
 * @param page - Playwright page instance
 */
export async function logoutUser(page: Page) {
  await page.goto('/auth/signout')
  await page.waitForLoadState('networkidle')

  const signOutButton = page.locator(
    'button:has-text("Sign Out"), button:has-text("Sign out")'
  )
  if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signOutButton.click()
    await page.waitForLoadState('networkidle')
  }
}

/**
 * Create and login a test user
 * @param page - Playwright page instance
 * @param userData - Optional user data (generates if not provided)
 * @returns The test user data
 */
export async function createAndLoginUser(
  page: Page,
  userData?: TestUser
): Promise<TestUser> {
  const user = userData || generateTestUser()

  // Create user via API
  const response = await createTestUser(page, user)
  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${response.status()}`)
  }

  // Login via UI
  await loginUser(page, user.email, user.password)

  return user
}

/**
 * Wait for cart API response or network idle
 * @param page - Playwright page instance
 */
export async function waitForCartUpdate(page: Page) {
  await Promise.race([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/cart') && response.status() === 200,
      { timeout: 5000 }
    ),
    page.waitForLoadState('networkidle', { timeout: 5000 }),
  ]).catch(() => {
    // Cart update may have completed already
  })
}

/**
 * Add an item to cart from the collections page
 * @param page - Playwright page instance
 */
export async function addItemToCart(page: Page) {
  await page.goto('/collections')
  await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

  const productCard = page.locator('[data-testid="product-card"]').first()
  await productCard.scrollIntoViewIfNeeded()
  await productCard.hover()

  // Click the add to cart button (revealed on hover)
  const addToCartButton = productCard.locator('[data-testid="add-to-cart-button"]')
  await expect(addToCartButton).toBeVisible({ timeout: 5000 })
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/cart') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    ),
    addToCartButton.click(),
  ])

  await waitForCartUpdate(page)

  // Ensure cart has at least one item
  await expect
    .poll(
      async () => {
        const response = await page.request.get('/api/cart')
        if (!response.ok()) return 0
        const body = await response.json()
        return Array.isArray(body.data) ? body.data.length : 0
      },
      { timeout: 15000 }
    )
    .toBeGreaterThan(0)
}

/**
 * Extended test fixture with pre-authenticated page
 */
export const test = base.extend<{
  authenticatedPage: Page
  testUser: TestUser
}>({
  // Pre-authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    const testUser = generateTestUser('Auth')
    await createAndLoginUser(page, testUser)
    await use(page)
  },

  // Test user fixture
  testUser: async ({}, use) => {
    const user = generateTestUser()
    await use(user)
  },
})

export { expect }
