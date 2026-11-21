import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import type { ITokenService } from '../../domain/interfaces/IAuthServices.js';
import {
  classifyRateLimitBucket,
  createRateLimitPluginOptions,
  extractVerifiedActorId,
  parseTimeWindowMs,
} from './rateLimitPolicy.js';

function createMockRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    url: '/api/health',
    method: 'GET',
    ip: '177.73.155.18',
    headers: {},
    ...overrides,
  } as FastifyRequest;
}

describe('rateLimitPolicy', () => {
  it('parseTimeWindowMs convierte unidades comunes y usa fallback ante entradas inválidas', () => {
    expect(parseTimeWindowMs('1m')).toBe(60_000);
    expect(parseTimeWindowMs('15m')).toBe(900_000);
    expect(parseTimeWindowMs('30s')).toBe(30_000);
    expect(parseTimeWindowMs('2 hours')).toBe(7_200_000);
    expect(parseTimeWindowMs(5000)).toBe(5000);
    expect(parseTimeWindowMs('invalid', 12_345)).toBe(12_345);
  });

  it('classifyRateLimitBucket separa streaming, admin, diccionario público y rutas globales', () => {
    expect(
      classifyRateLimitBucket(
        createMockRequest({
          url: '/api/media/123e4567-e89b-12d3-a456-426614174000/stream?download=1',
        }),
      ),
    ).toBe('stream');
    expect(classifyRateLimitBucket(createMockRequest({ url: '/api/admin/medios/7/stream' }))).toBe(
      'stream',
    );
    expect(classifyRateLimitBucket(createMockRequest({ url: '/api/admin/sentidos?page=1' }))).toBe(
      'admin',
    );
    expect(
      classifyRateLimitBucket(
        createMockRequest({ url: '/api/dictionary/semantic-fields/slug/ya' }),
      ),
    ).toBe('public');
    expect(classifyRateLimitBucket(createMockRequest({ url: '/api/health' }))).toBe('global');
  });

  it('extractVerifiedActorId obtiene userId verificado desde Bearer o cookie misak_at', () => {
    const tokenService: Pick<ITokenService, 'verifyAccessToken'> = {
      verifyAccessToken: vi.fn((token) =>
        token === 'valid-jwt'
          ? { userId: 42n, username: 'test.uno', email: 'test@misak.edu', roles: ['editor'] }
          : null,
      ),
    };

    const bearerReq = createMockRequest({
      headers: { authorization: 'Bearer valid-jwt' },
    });
    expect(extractVerifiedActorId(bearerReq, tokenService)).toBe('42');

    const cookieReq = createMockRequest({
      headers: { cookie: 'other=1; misak_at=valid-jwt' },
    });
    expect(extractVerifiedActorId(cookieReq, tokenService)).toBe('42');

    const forgedReq = createMockRequest({
      headers: { authorization: 'Bearer forged-jwt' },
    });
    expect(extractVerifiedActorId(forgedReq, tokenService)).toBeNull();
  });

  it('asigna claves aisladas por userId en admin/stream y por IP en público, y exime HEAD de streams', async () => {
    const tokenService: Pick<ITokenService, 'verifyAccessToken'> = {
      verifyAccessToken: vi.fn((token) =>
        token === 'jwt-u1'
          ? { userId: 10n, username: 'editor1', email: 'e1@misak.edu', roles: ['editor'] }
          : null,
      ),
    };

    const options = createRateLimitPluginOptions(
      {
        globalMax: 100,
        globalWindow: '15m',
        publicMax: 300,
        publicWindow: '1m',
        adminMax: 600,
        adminWindow: '1m',
        streamMax: 600,
        streamWindow: '1m',
      },
      tokenService,
    );

    const keyGen = options.keyGenerator as (req: FastifyRequest) => string;
    const maxFn = options.max as (req: FastifyRequest, key: string) => number;
    const windowFn = options.timeWindow as (req: FastifyRequest, key: string) => number;
    const allowListFn = options.allowList as (req: FastifyRequest, key: string) => boolean;

    const adminReq = createMockRequest({
      url: '/api/admin/sentidos',
      ip: '177.73.155.18',
      headers: { authorization: 'Bearer jwt-u1' },
    });
    const publicReq = createMockRequest({
      url: '/api/dictionary/home-slots',
      ip: '177.73.155.18',
    });
    const streamHeadReq = createMockRequest({
      method: 'HEAD',
      url: '/api/media/uuid-1/stream',
    });

    expect(keyGen(adminReq)).toBe('admin:user:10');
    expect(maxFn(adminReq, 'admin:user:10')).toBe(600);
    expect(windowFn(adminReq, 'admin:user:10')).toBe(60_000);

    expect(keyGen(publicReq)).toBe('public:ip:177.73.155.18');
    expect(maxFn(publicReq, 'public:ip:177.73.155.18')).toBe(300);
    expect(windowFn(publicReq, 'public:ip:177.73.155.18')).toBe(60_000);

    expect(allowListFn(streamHeadReq, 'stream:ip:177.73.155.18')).toBe(true);
    expect(allowListFn(publicReq, 'public:ip:177.73.155.18')).toBe(false);
  });
});
