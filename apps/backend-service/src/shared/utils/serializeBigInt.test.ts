import { describe, expect, it } from 'vitest';
import { serializeBigInt } from './serializeBigInt.js';

describe('serializeBigInt', () => {
  it('convierte BigInt a string en valores primitivos, arrays y objetos', () => {
    expect(serializeBigInt(10n)).toBe('10');
    expect(serializeBigInt([1n, 2n, 3])).toEqual(['1', '2', 3]);
    expect(
      serializeBigInt({
        id: 100n,
        name: 'test',
        nested: { innerId: 200n },
      }),
    ).toEqual({
      id: '100',
      name: 'test',
      nested: { innerId: '200' },
    });
  });

  it('preserva null, undefined y fechas intactas', () => {
    const now = new Date();
    expect(serializeBigInt(null)).toBeNull();
    expect(serializeBigInt(undefined)).toBeUndefined();
    expect(serializeBigInt(now)).toBe(now);
  });
});
