import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, expect, vi } from 'vitest';

// Extend Vitest's expect with custom matchers from jest-dom
expect.extend(matchers);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

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

// Mock useRotatingText to synchronously return a stable title for tests
vi.mock('@/hooks/useRotatingText', () => ({
  useRotatingText: () => ({
    displayText: 'Diccionario Misak',
    isVisible: true,
  }),
}));
