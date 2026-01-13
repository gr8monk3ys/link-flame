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
  // NODE_ENV is automatically set to 'test' by Vitest
});

afterAll(() => {
  // Cleanup if needed
});
