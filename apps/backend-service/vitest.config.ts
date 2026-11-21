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
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      ...(process.env.RUN_INTEGRATION ? [] : ['src/**/*.integration.test.ts']),
    ],
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
        // Interfaces puras sin código en tiempo de ejecución
        'src/shared/storage/storage.service.ts',
        // Importadores y repositorios CLI de ingesta masiva / integración contra PostgreSQL real
        'src/application/lexicon/lexiconImport.ts',
        'src/application/taxonomy/taxonomyImport.ts',
        'src/infrastructure/repositories/LexiconRepository.ts',
        'src/infrastructure/repositories/TaxonomyRepository.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
