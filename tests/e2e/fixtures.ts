import { test as base, Page } from '@playwright/test'

/**
 * E2E Test Fixtures
 *
 * Provides shared utilities for E2E tests including:
 * - CSRF token fetching
 * - User creation with CSRF protection
 * - Authentication helpers
 * - Cart helpers
 *
 * For the full authentication fixtures with pre-authenticated pages,
 * see ./fixtures/auth.ts
 */

// Re-export everything from the auth fixtures for convenience
export {
  generateTestUser,
  getCsrfToken,
  createTestUser,
  loginUser,
  logoutUser,
  createAndLoginUser,
  waitForCartUpdate,
  addItemToCart,
  getMissingStripeCheckoutEnvVars,
  isStripeCheckoutE2EConfigured,
  test,
  expect,
  type TestUser,
} from './fixtures/auth'

// Also export base Playwright test for tests that don't need fixtures
export { test as baseTest } from '@playwright/test'
