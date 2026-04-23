import { describe, expect, it } from 'vitest';
import { router } from './index';

describe('router', () => {
  it('está exportado y es un router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('object');
  });
});
