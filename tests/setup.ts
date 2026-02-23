import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-unit-tests-min-32-chars';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.STRIPE_STARTER_MONTHLY_PRICE_ID = 'price_starter_monthly_test';
  process.env.STRIPE_STARTER_YEARLY_PRICE_ID = 'price_starter_yearly_test';
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_pro_monthly_test';
  process.env.STRIPE_PRO_YEARLY_PRICE_ID = 'price_pro_yearly_test';
  // NODE_ENV is automatically set to 'test' by Vitest
});

afterAll(() => {
  // Cleanup if needed
});
