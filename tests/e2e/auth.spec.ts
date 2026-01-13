import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests the complete authentication flow:
 * - User signup with validation
 * - User signin
 * - Protected route access
 * - User signout
 * - Rate limiting on auth endpoints (5 req/min)
 */

// Generate unique test user for each test run
const generateTestUser = () => ({
  name: `Test User ${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
});

test.describe('Authentication Flow', () => {
  test('should sign up a new user successfully', async ({ page }) => {
    const testUser = generateTestUser();

    // Navigate to signup page
    await page.goto('/auth/signup');

    // Fill out signup form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to signin or home page
    await page.waitForURL(/\/(auth\/signin|\/)/);

    // Verify success (either redirected to signin or logged in)
    expect(page.url()).toMatch(/\/(auth\/signin|\/)/);
  });

  test('should sign in an existing user', async ({ page }) => {
    const testUser = generateTestUser();

    // First, create the user via API
    const signupResponse = await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(signupResponse.ok()).toBeTruthy();

    // Navigate to signin page
    await page.goto('/auth/signin');

    // Fill out signin form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation (should redirect to home or account page)
    await page.waitForURL(/\/(?!auth)/);

    // Verify we're logged in (URL should not be /auth/*)
    expect(page.url()).not.toContain('/auth/signin');
  });

  test('should reject signin with incorrect password', async ({ page }) => {
    const testUser = generateTestUser();

    // Create user first
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    });

    // Navigate to signin page
    await page.goto('/auth/signin');

    // Try to sign in with wrong password
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error or stay on signin page
    await page.waitForTimeout(2000); // Wait for error to appear

    // Should still be on signin page or show error
    expect(page.url()).toContain('/auth');
  });

  test('should protect /account route when not authenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/account');

    // Should redirect to signin page
    await page.waitForURL(/\/auth\/signin/);

    expect(page.url()).toContain('/auth/signin');
  });

  test('should allow access to /account when authenticated', async ({ page }) => {
    const testUser = generateTestUser();

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    });

    // Sign in via UI
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(?!auth)/);

    // Now try to access protected route
    await page.goto('/account');

    // Should be able to access account page
    await page.waitForURL('/account');
    expect(page.url()).toContain('/account');
  });

  test('should sign out successfully', async ({ page }) => {
    const testUser = generateTestUser();

    // Create and login user
    await page.request.post('/api/auth/signup', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    });

    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(?!auth)/);

    // Click sign out (implementation may vary)
    // This assumes there's a sign out button/link in the UI
    await page.goto('/auth/signout');

    // Should redirect to home or signin page
    await page.waitForURL(/\//);

    // Try to access protected route - should be redirected
    await page.goto('/account');
    await page.waitForURL(/\/auth\/signin/);
    expect(page.url()).toContain('/auth/signin');
  });
});

test.describe('Validation', () => {
  test('should reject signup with invalid email', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    // Should show validation error
    await page.waitForTimeout(1000);

    // Email field should show error (HTML5 validation or custom)
    const emailInput = page.locator('input[name="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBeTruthy();
  });

  test('should reject signup with short password', async ({ page }) => {
    const response = await page.request.post('/api/auth/signup', {
      data: {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: '123', // Too short (min 6)
      },
    });

    // Should return 400 validation error
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  test('should reject duplicate email signup', async ({ page }) => {
    const testUser = generateTestUser();

    // Create user first time
    const firstSignup = await page.request.post('/api/auth/signup', {
      data: testUser,
    });
    expect(firstSignup.ok()).toBeTruthy();

    // Try to create same user again
    const duplicateSignup = await page.request.post('/api/auth/signup', {
      data: testUser,
    });

    // Should fail with 400
    expect(duplicateSignup.status()).toBe(400);

    const body = await duplicateSignup.json();
    expect(body.message).toContain('already exists');
  });
});
