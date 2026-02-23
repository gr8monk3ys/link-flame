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

const STRIPE_CHECKOUT_E2E_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'STRIPE_STARTER_YEARLY_PRICE_ID',
  'STRIPE_PRO_MONTHLY_PRICE_ID',
  'STRIPE_PRO_YEARLY_PRICE_ID',
] as const

/**
 * Return the Stripe env vars required to validate end-to-end checkout session creation.
 */
export function getMissingStripeCheckoutEnvVars(): string[] {
  return STRIPE_CHECKOUT_E2E_ENV_VARS.filter((name) => {
    const value = process.env[name]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

/**
 * True when Stripe checkout E2E can assert successful session creation.
 */
export function isStripeCheckoutE2EConfigured(): boolean {
  return getMissingStripeCheckoutEnvVars().length === 0
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

const RETRYABLE_NAV_ERRORS = [
  'ERR_NETWORK_IO_SUSPENDED',
  'net::ERR_ABORTED',
  'net::ERR_CONNECTION_CLOSED',
  'Timeout',
]

function isRetryableNavigationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return RETRYABLE_NAV_ERRORS.some((fragment) => message.includes(fragment))
}

async function gotoWithRetry(page: Page, url: string, maxAttempts = 3) {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('domcontentloaded')
      return
    } catch (error) {
      lastError = error
      if (!isRetryableNavigationError(error) || attempt >= maxAttempts) {
        throw error
      }
      await page.waitForTimeout(300 * attempt)
    }
  }

  throw lastError ?? new Error(`Failed to navigate to ${url}`)
}

async function requestJsonWithRetry(page: Page, url: string, retries = 3) {
  let lastStatus = 0
  let lastBody = ''

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await page.request.get(url)
    if (response.ok()) {
      const json = await response.json()
      return { response, json }
    }

    lastStatus = response.status()
    lastBody = await response.text().catch(() => '')
    if (attempt < retries - 1) {
      await page.waitForTimeout(250 * (attempt + 1))
    }
  }

  throw new Error(`GET ${url} failed with ${lastStatus}: ${lastBody}`)
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
  retries = 5
) {
  await setUniqueIpHeader(page)
  let lastResponse: Awaited<ReturnType<Page['request']['post']>> | null = null

  // Warm up the signup route while Next.js compiles in development mode.
  await page.request
    .post('/api/auth/signup', {
      headers: { 'content-type': 'application/json' },
      data: {},
    })
    .catch(() => null)

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
      // Route compilation can briefly surface 404 before the API is ready.
      const waitMs = response.status() === 404 ? 500 * Math.pow(2, attempt) : 150 * Math.pow(2, attempt)
      await page.waitForTimeout(waitMs)
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

  const submitSignIn = async () => {
    await gotoWithRetry(page, '/auth/signin')
    await page.waitForLoadState('domcontentloaded')
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitButton = page.getByRole('button', {
      name: /sign in|signing in/i,
    })

    await expect(emailInput).toBeVisible({ timeout: 15_000 })
    await expect(passwordInput).toBeVisible({ timeout: 15_000 })
    await expect(submitButton).toBeVisible({ timeout: 15_000 })

    await emailInput.fill('', { timeout: 15_000 })
    await emailInput.fill(email, { timeout: 15_000 })
    await passwordInput.fill('', { timeout: 15_000 })
    await passwordInput.fill(password, { timeout: 15_000 })
    await submitButton.click()
  }

  const waitForSession = async () => {
    // Session endpoint might not be called in some edge cases.
    await page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/auth/session') && response.status() === 200,
        { timeout: 25_000 }
      )
      .catch(() => null)

    await expect
      .poll(
        async () => {
          try {
            const response = await page.request.get('/api/auth/session', {
              timeout: 5000,
            })
            if (!response.ok()) {
              return false
            }
            const session = await response.json()
            return session?.user?.email === email
          } catch {
            // Transient request failures can happen while the app settles.
            return false
          }
        },
        { timeout: 25_000 }
      )
      .toBeTruthy()
  }

  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await submitSignIn()
      await waitForSession()
      if (attempt > 1 && lastError instanceof Error) {
        console.warn('[E2E] login retry succeeded after initial failure:', lastError.message)
      }
      lastError = null
      break
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await page.waitForTimeout(350 * attempt)
        continue
      }
      throw error
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }

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
  await page.waitForLoadState('domcontentloaded')

  const signOutButton = page.locator(
    'button:has-text("Sign Out"), button:has-text("Sign out")'
  )
  if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signOutButton.click()
    await page.waitForLoadState('domcontentloaded')
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
    page.waitForLoadState('domcontentloaded', { timeout: 5000 }),
  ]).catch(() => {
    // Cart update may have completed already
  })
}

/**
 * Add an item to cart from the collections page
 * @param page - Playwright page instance
 */
export async function addItemToCart(page: Page) {
  const { json: productsBody } = await requestJsonWithRetry(
    page,
    '/api/products?page=1&pageSize=1'
  )
  const productId = productsBody?.data?.[0]?.id as string | undefined
  if (!productId) {
    throw new Error('No products available for cart setup')
  }

  const csrfToken = await getCsrfToken(page)
  const addResponse = await page.request.post('/api/cart', {
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
    data: {
      productId,
      quantity: 1,
    },
  })

  if (!addResponse.ok()) {
    const body = await addResponse.text().catch(() => '')
    throw new Error(`Failed to add cart item via API: ${addResponse.status()} ${body}`)
  }

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
      { timeout: 30_000 }
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
