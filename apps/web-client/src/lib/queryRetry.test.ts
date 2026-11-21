import { describe, expect, it } from 'vitest';
import { AdminApiError } from '@/services/adminHttp';
import { DictionaryApiError } from '@/services/dictionaryApi';
import { extractHttpStatusCode, shouldRetryQuery } from './queryRetry';

describe('queryRetry', () => {
  it('extrae status HTTP desde AdminApiError, DictionaryApiError y mensajes legacy API XXX', () => {
    expect(
      extractHttpStatusCode(
        new AdminApiError(429, 'Rate limited', 'Too Many Requests', undefined, 'RATE_LIMITED'),
      ),
    ).toBe(429);
    expect(extractHttpStatusCode(new DictionaryApiError('Prohibido', 403))).toBe(403);
    expect(extractHttpStatusCode(new Error('API 404: Not Found'))).toBe(404);
    expect(extractHttpStatusCode(new Error('Network offline'))).toBeNull();
  });

  it('no reintenta errores 4xx (401, 403, 404, 409, 429)', () => {
    for (const status of [400, 401, 403, 404, 409, 422, 423, 429]) {
      expect(shouldRetryQuery(0, new AdminApiError(status, 'Client error'))).toBe(false);
      expect(shouldRetryQuery(0, new DictionaryApiError('Client error', status))).toBe(false);
    }
  });

  it('permite 1 reintento ante errores 5xx, 408 o fallos transitorios de red y detiene al segundo', () => {
    expect(shouldRetryQuery(0, new DictionaryApiError('Bad Gateway', 502))).toBe(true);
    expect(shouldRetryQuery(1, new DictionaryApiError('Bad Gateway', 502))).toBe(false);

    expect(shouldRetryQuery(0, new AdminApiError(408, 'Timeout'))).toBe(true);
    expect(shouldRetryQuery(1, new AdminApiError(408, 'Timeout'))).toBe(false);

    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetryQuery(1, new TypeError('Failed to fetch'))).toBe(false);
  });
});
