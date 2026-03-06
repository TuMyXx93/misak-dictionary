/**
 * Vitest Configuration
 * Backend Service Testing Setup
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'prisma/**',
        'src/app.ts',
        'src/server.ts',
        'src/shared/config/prisma.ts',
        'src/domain/entities/**',
        'src/domain/interfaces/**',
        'src/**/routes/**',
        'src/generated/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
