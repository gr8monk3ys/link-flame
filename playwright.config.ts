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
  timeout: 45 * 1000,

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

  // Serve a production build, not `next dev`.
  //
  // The dev server takes the 'unsafe-inline' branch of the CSP, so a
  // nonce-based production CSP was never exercised by any test. That is
  // precisely how a blocked ThemeProvider script shipped past a green suite:
  // the bug only exists under the production CSP. Building also removes the
  // on-demand compilation that made first-visit assertions race their own
  // timeouts.
  //
  // Set PLAYWRIGHT_DEV_SERVER=true for the fast local loop, accepting that it
  // no longer matches what CI runs.
  webServer: {
    command: process.env.PLAYWRIGHT_DEV_SERVER === 'true'
      ? 'node scripts/e2e-setup-db.mjs && npm run dev'
      : 'node scripts/e2e-setup-db.mjs && npx next build && npx next start -p 4010',
    url: 'http://localhost:4010',
    // Default to isolated, deterministic runs.
    // Opt-in to reuse an existing server with PLAYWRIGHT_REUSE_SERVER=true.
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    // A production build has to finish before the server answers.
    timeout: (process.env.PLAYWRIGHT_DEV_SERVER === 'true' ? 180 : 600) * 1000,
    env: {
      ...process.env,
      PORT: '4010',
      NODE_ENV: process.env.PLAYWRIGHT_DEV_SERVER === 'true' ? 'development' : 'production',
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
