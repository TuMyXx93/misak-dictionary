import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with custom matchers from jest-dom
expect.extend(matchers);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Suprimir warnings específicos de jsdom sobre imágenes vacías
// Estos warnings son esperados en tests con LazyImage (lazy loading)
beforeAll(() => {
  const originalConsoleError = console.error.bind(console);

  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    // Ignorar warnings de src="" en imágenes (LazyImage en tests)
    const message = args[0]?.toString() || '';

    if (message.includes('An empty string ("") was passed to the src attribute')) {
      // Silenciar este warning específico
      return;
    }

    // Permitir otros mensajes de error
    originalConsoleError(...args);
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
