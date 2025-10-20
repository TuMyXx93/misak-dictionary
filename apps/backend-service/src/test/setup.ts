/**
 * Vitest Setup
 * Global test configuration and mocks
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars-minimum';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only-32chars-minimum';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '10';

// Global test hooks
beforeAll(() => {
  // Setup global test configuration
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup after all tests
});
