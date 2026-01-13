# Testing Guide

This directory contains comprehensive tests for the Link Flame application:
- **Unit Tests**: Utility function tests using Vitest
- **E2E Tests**: End-to-end tests using Playwright

## Test Structure

```
tests/
├── setup.ts                 # Test setup and configuration
├── unit/                    # Unit tests (Vitest)
│   ├── csrf.test.ts        # CSRF protection tests (15 tests)
│   ├── api-response.test.ts # API response helpers (25 tests)
│   └── rate-limit.test.ts  # Rate limiting utilities (21 tests)
└── e2e/                     # E2E tests (Playwright)
    ├── auth.spec.ts        # Authentication flow tests (9 tests)
    ├── rate-limit.spec.ts  # Rate limiting verification (8 tests)
    └── cart.spec.ts        # Shopping cart operations (10 tests)
```

**Total:** 88 automated tests

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   - Copy `.env.example` to `.env`
   - Configure required environment variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)
   - For rate limiting tests: Configure Upstash Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

3. **Initialize database:**
   ```bash
   npx prisma migrate dev
   npx prisma db seed  # Optional: seed with sample data
   ```

### Test Commands

**Run All Tests:**
```bash
npm test                    # Run all tests (unit + E2E)
```

**Unit Tests (Vitest):**
```bash
npm run test:unit           # Run all unit tests
npm run test:unit:watch     # Watch mode (re-run on file changes)
npm run test:unit:ui        # Interactive UI mode
npm run test:unit:coverage  # With coverage report

# Run specific test file
npx vitest tests/unit/csrf.test.ts

# Run tests matching a pattern
npx vitest --grep "token generation"
```

**E2E Tests (Playwright):**
```bash
npm run test:e2e            # Run all E2E tests (headless)
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Run with visible browser
npm run test:e2e:debug      # Debug mode
npm run test:e2e:report     # View test report (after running tests)

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "sign up"
```

## Test Suites

## Unit Tests (61 tests)

Unit tests focus on testing individual utility functions in isolation without external dependencies.

### 1. CSRF Protection Tests (`csrf.test.ts`)

Tests the CSRF token generation and validation logic:

**Test Cases (15 tests):**
- ✅ Token generation with cryptographic randomness
- ✅ Token uniqueness (no collisions in 1000 iterations)
- ✅ Token format validation (64-char hex, 3-part signed token)
- ✅ 24-hour expiry timestamp validation
- ✅ Valid token verification
- ✅ Expired token rejection
- ✅ Invalid signature rejection
- ✅ Tampered token rejection
- ✅ Incorrect format rejection
- ✅ Token mismatch rejection
- ✅ Invalid expiry timestamp rejection
- ✅ Timing-safe comparison (prevents timing attacks)
- ✅ Token lifecycle (generation → verification → expiry)
- ✅ HMAC signature validation
- ✅ Empty/null token rejection

**Key Features Tested:**
- Cryptographically secure random token generation
- HMAC-SHA256 signature verification
- Timing-safe comparison to prevent timing attacks
- Token expiry handling
- Tamper detection

### 2. API Response Tests (`api-response.test.ts`)

Tests the standardized API response helper functions:

**Test Cases (25 tests):**
- ✅ Success responses with custom status codes
- ✅ Success responses with meta information
- ✅ Different data types (arrays, strings, numbers, null)
- ✅ Error responses with codes and details
- ✅ Zod validation error formatting
- ✅ Nested field error handling
- ✅ Paginated response structure
- ✅ Empty data pagination
- ✅ ZodError handling
- ✅ Standard Error handling
- ✅ Unknown error handling
- ✅ Error logging verification
- ✅ Rate limit responses with retry-after
- ✅ Retry-after calculation
- ✅ Unauthorized responses (401)
- ✅ Forbidden responses (403)
- ✅ Not found responses (404)
- ✅ Custom error messages
- ✅ Error codes validation
- ✅ Response structure consistency

**Key Features Tested:**
- Standardized response format
- Error handling patterns
- Pagination metadata
- Rate limit headers
- Zod validation error transformation

### 3. Rate Limiting Tests (`rate-limit.test.ts`)

Tests the rate limiting identifier extraction and graceful degradation:

**Test Cases (21 tests):**
- ✅ User ID prioritization over IP
- ✅ IP extraction from x-forwarded-for
- ✅ IP whitespace trimming
- ✅ x-real-ip fallback
- ✅ Unknown IP fallback
- ✅ Multiple IPs handling (use first)
- ✅ IPv6 address support
- ✅ Empty header handling
- ✅ Different user ID formats
- ✅ Graceful degradation (no Redis)
- ✅ Warning logs when unconfigured
- ✅ Standard rate limit response structure
- ✅ Strict rate limit response structure
- ✅ Authenticated user flow
- ✅ Anonymous user flow
- ✅ Sensitive endpoint protection
- ✅ Identifier format validation
- ✅ Response structure consistency
- ✅ IP header priority logic

**Key Features Tested:**
- IP address extraction from headers
- User ID vs IP prioritization
- IPv6 support
- Graceful degradation when Redis unavailable
- Rate limit response structure

## E2E Tests (27 tests)

E2E tests verify complete user flows in a real browser environment.

### 1. Authentication Tests (`auth.spec.ts`)

Tests the complete authentication flow using NextAuth v5:

**Test Cases:**
- ✅ User signup with validation
- ✅ User signin with correct credentials
- ✅ Reject signin with incorrect password
- ✅ Protected route access (redirect when not authenticated)
- ✅ Access protected routes when authenticated
- ✅ Sign out functionality
- ✅ Email validation on signup
- ✅ Password length validation (min 6 characters)
- ✅ Duplicate email rejection

**Key Features Tested:**
- JWT-based sessions
- Password hashing with bcrypt
- Middleware protection for `/account` and `/checkout` routes
- Zod input validation
- Role-based access control

### 2. Rate Limiting Tests (`rate-limit.spec.ts`)

Verifies rate limiting enforcement on sensitive endpoints:

**Test Cases:**
- ✅ Signup endpoint: 5 requests per minute
- ✅ Signin endpoint: 5 requests per minute
- ✅ Contact form: 5 requests per minute
- ✅ Newsletter: 5 requests per minute
- ✅ IP-based rate limiting for anonymous users
- ✅ Retry-after information in response
- ✅ Valid JSON error format

**Important Notes:**
- Rate limiting requires Upstash Redis configuration
- If Redis is not configured, tests detect graceful degradation (all requests succeed)
- Tests verify both rate limit enforcement and proper error responses

**Rate Limit Response Format:**
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": "2024-01-13T17:30:00.000Z"
}
```

### 3. Cart Tests (`cart.spec.ts`)

Tests shopping cart operations for both guest and authenticated users:

**Test Cases:**
- ✅ Add items to cart as guest
- ✅ Guest cart persistence across reloads
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Add items as authenticated user
- ✅ Cart persistence in database for authenticated users
- ✅ **Cart migration when guest logs in** (important feature)
- ✅ Cart API endpoints

**Key Features Tested:**
- Guest session management with cookies
- Cart state via React Context Provider
- Database persistence for authenticated users
- Automatic cart migration on login (merges guest + user carts)
- API endpoints: `GET /api/cart`, `POST /api/cart`

## Test Configuration

### `playwright.config.ts`

Key configuration options:

```typescript
{
  testDir: './tests/e2e',
  timeout: 30 * 1000,           // 30 seconds per test
  fullyParallel: true,           // Run tests in parallel
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',      // Starts dev server before tests
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

## Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform specific action', async ({ page }) => {
    // Navigate to page
    await page.goto('/some-page');

    // Interact with elements
    await page.click('button');
    await page.fill('input[name="email"]', 'test@example.com');

    // Make assertions
    expect(page.url()).toContain('/success');
  });
});
```

### Best Practices

1. **Use unique test data**: Generate unique emails/names per test run
   ```typescript
   const email = `test${Date.now()}@example.com`;
   ```

2. **Wait for elements**: Use `waitForSelector` for dynamic content
   ```typescript
   await page.waitForSelector('[data-testid="product-card"]');
   ```

3. **Use data-testid attributes**: Add `data-testid` to important elements for reliable selection
   ```tsx
   <button data-testid="add-to-cart">Add to Cart</button>
   ```

4. **Test API and UI**: Combine API requests and UI interactions
   ```typescript
   // Create user via API
   await page.request.post('/api/auth/signup', { data: testUser });

   // Then test UI
   await page.goto('/auth/signin');
   ```

5. **Clean up test data**: Tests create unique users, no cleanup needed currently

## Debugging Tests

### View test in browser
```bash
npm run test:headed
```

### Debug specific test
```bash
npx playwright test --debug tests/e2e/auth.spec.ts
```

### View trace
```bash
npx playwright show-trace trace.zip
```

### Screenshots on failure
Screenshots are automatically saved to `test-results/` when tests fail.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Set up database
        run: npx prisma migrate deploy

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage

Current test coverage:

| Feature | Coverage | Status |
|---------|----------|--------|
| Authentication | ✅ High | 9/9 test cases |
| Rate Limiting | ✅ High | 8/8 test cases |
| Shopping Cart | ✅ High | 10/10 test cases |
| Checkout | ⚠️ Partial | Need Stripe tests |
| Blog | ❌ None | TODO |
| Products | ⚠️ Partial | Basic coverage |

## Known Limitations

1. **Stripe Integration**: Checkout tests don't test actual Stripe payment flow (requires test mode)
2. **Email Sending**: Email tests would require mock SMTP or test service
3. **Rate Limit Reset**: Tests don't wait for 60-second window to test limit reset
4. **Database Cleanup**: Tests create data but don't clean up (uses unique identifiers)

## Future Improvements

- [ ] Add Stripe checkout E2E tests with test mode
- [ ] Add blog post creation/editing tests
- [ ] Add admin dashboard tests
- [ ] Add accessibility tests (WCAG compliance)
- [ ] Add performance tests (Lighthouse CI)
- [ ] Add visual regression tests
- [ ] Add API integration tests (separate from E2E)
- [ ] Add database seeding for test data

## Troubleshooting

### Tests fail with "Timeout waiting for page"
- Ensure dev server is running: `npm run dev`
- Check that port 3000 is available
- Increase timeout in `playwright.config.ts`

### Rate limiting tests always pass (no 429 errors)
- Upstash Redis is not configured
- Tests will log: "⚠️ Rate limiting not enforced (Redis not configured)"
- This is expected behavior (graceful degradation)

### Database errors during tests
- Run migrations: `npx prisma migrate dev`
- Check DATABASE_URL in `.env`
- Ensure SQLite file has write permissions

### Element not found errors
- UI components may have changed
- Update selectors in test files
- Add `data-testid` attributes for stable selection

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated:** 2026-01-13
**Test Framework:** Playwright v1.57.0
**Total Tests:** 27 test cases across 3 suites
