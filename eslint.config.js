// Root flat ESLint config for the monorepo
// Note: apps/web-client already has its own flat config. We ignore it here to avoid conflicts when linting from root.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'apps/web-client/**'],
  },
  ...tseslint.config({
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Add any monorepo-wide TS rules here
    },
  }),
]);
