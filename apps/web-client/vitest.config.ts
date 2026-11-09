import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',

    // Optimización de CSS
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },

    // Pool config (Vitest 4: opciones top-level)
    pool: 'forks',
    maxWorkers: 4,
    isolate: true,

    // Timeouts (tolerancia adecuada para ejecución de coverage en v8)
    testTimeout: 25000,
    hookTimeout: 25000,

    // Performance
    maxConcurrency: 5,

    // Reporters
    reporters: ['default'],

    // Coverage (Vitest 4: include explícito requerido)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'src/main.tsx',
        '**/index.ts',
        'coverage/**',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
