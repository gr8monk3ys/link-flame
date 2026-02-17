import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Tests critical user flows:
 * - Authentication (signup, signin, signout)
 * - Rate limiting on auth endpoints
 * - Cart operations (add, update, remove, guest sessions)
 * - Checkout flow
 * - Cart migration when guest users log in
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in parallel (only if multiple workers are enabled)
  fullyParallel: (Number(process.env.PLAYWRIGHT_WORKERS) || (process.env.CI ? 1 : 1)) > 1,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Default to 1 worker locally for stability against shared DB/dev server.
  // Override with PLAYWRIGHT_WORKERS if you have an isolated DB.
  workers: process.env.CI ? 1 : (Number(process.env.PLAYWRIGHT_WORKERS) || 1),

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:4010',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'node scripts/e2e-setup-db.mjs && npm run dev',
    url: 'http://localhost:4010',
    // Default to isolated, deterministic runs.
    // Opt-in to reuse an existing server with PLAYWRIGHT_REUSE_SERVER=true.
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    timeout: 180 * 1000,
    env: {
      ...process.env,
      PORT: '4010',
      NEXTAUTH_URL: 'http://localhost:4010',
      NEXT_PUBLIC_APP_URL: 'http://localhost:4010',
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ||
        'test-secret-for-e2e-only-do-not-use-in-production',
      RATE_LIMIT_STRICT_WINDOW_SECONDS: '5',
      // Prefer an isolated DB for E2E if provided.
      ...(process.env.E2E_DATABASE_URL ? { DATABASE_URL: process.env.E2E_DATABASE_URL } : {}),
      ...(process.env.E2E_DIRECT_URL ? { DIRECT_URL: process.env.E2E_DIRECT_URL } : {}),
    },
  },
});
