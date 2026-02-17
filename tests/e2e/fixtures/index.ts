/**
 * E2E Test Fixtures Index
 *
 * Re-exports all fixtures for easy importing.
 */

export {
  // Types
  type TestUser,

  // User generation
  generateTestUser,

  // CSRF utilities
  getCsrfToken,

  // User management
  createTestUser,
  loginUser,
  logoutUser,
  createAndLoginUser,

  // Cart utilities
  waitForCartUpdate,
  addItemToCart,

  // Extended test fixtures
  test,
  expect,

  // Stripe checkout config helpers
  getMissingStripeCheckoutEnvVars,
  isStripeCheckoutE2EConfigured,
} from './auth'
