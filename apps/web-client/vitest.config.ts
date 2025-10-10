import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',

    // Optimización de CSS: solo procesar cuando sea necesario
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },

    // Pool options: optimizar para tu sistema (8 cores)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4, // Usar mitad de los cores disponibles
        minForks: 1,
      },
    },

    // Timeouts optimizados
    testTimeout: 10000, // 10 segundos por test
    hookTimeout: 10000,

    // Performance: limitar recursos
    isolate: true,
    maxConcurrency: 5, // Max 5 tests simultáneos

    // Reporters optimizados
    reporters: ['default'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'src/main.tsx', // Entry point - no requiere tests unitarios
        '**/index.ts', // Archivos de exportación - solo re-exports
        'coverage/**', // Archivos generados de coverage
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
