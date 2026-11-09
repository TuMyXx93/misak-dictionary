/**
 * Test: ISemanticEmbeddingProvider / NullEmbeddingProvider
 * Spec 012 / ADR-0008
 */

import { describe, expect, it } from 'vitest';
import { NullEmbeddingProvider } from './ISemanticEmbeddingProvider.js';

describe('NullEmbeddingProvider', () => {
  it('tiene 384 dimensiones y está deshabilitado por defecto', async () => {
    const provider = new NullEmbeddingProvider();
    expect(provider.dimensions).toBe(384);
    expect(provider.isEnabled()).toBe(false);
    expect(await provider.embedQuery('test')).toBeNull();
  });
});
