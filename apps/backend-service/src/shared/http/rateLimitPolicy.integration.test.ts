import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
    systemSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    homeSlot: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    campoSemantico: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    medioCultural: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { buildApp } from '../../app.js';
import { TokenService } from '../../infrastructure/auth/TokenService.js';

describe('Rate limiting integration in buildApp()', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('aplica límites independientes para /api/dictionary/* (300/m), /api/admin/* (600/m) y /api/health (100/15m)', async () => {
    const resHealth = await app.inject({ method: 'GET', url: '/api/health' });
    const resPublic = await app.inject({ method: 'GET', url: '/api/dictionary/home-slots' });
    const resAdmin = await app.inject({ method: 'GET', url: '/api/admin/sentidos' });

    expect(resHealth.headers['x-ratelimit-limit']).toBe('100');
    expect(resPublic.headers['x-ratelimit-limit']).toBe('300');
    expect(resAdmin.headers['x-ratelimit-limit']).toBe('600');
  });

  it('aísla contadores admin por userId verificado bajo la misma IP de túnel/NAT', async () => {
    const tokenService = new TokenService();
    const tokenUser1 = tokenService.generateAccessToken({
      userId: 101n,
      username: 'editor.uno',
      email: 'uno@misak.edu',
      roles: ['editor'],
    });
    const tokenUser2 = tokenService.generateAccessToken({
      userId: 202n,
      username: 'editor.dos',
      email: 'dos@misak.edu',
      roles: ['editor'],
    });

    const r1 = await app.inject({
      method: 'GET',
      url: '/api/admin/sentidos',
      headers: { authorization: `Bearer ${tokenUser1}` },
    });
    const r2 = await app.inject({
      method: 'GET',
      url: '/api/admin/sentidos',
      headers: { authorization: `Bearer ${tokenUser2}` },
    });

    expect(r1.headers['x-ratelimit-limit']).toBe('600');
    expect(r1.headers['x-ratelimit-remaining']).toBe('599');
    expect(r2.headers['x-ratelimit-limit']).toBe('600');
    expect(r2.headers['x-ratelimit-remaining']).toBe('599');
  });

  it('exime peticiones HEAD de streaming multimedia para sondas móviles sin consumir cuota GET', async () => {
    const resHead = await app.inject({
      method: 'HEAD',
      url: '/api/media/00000000-0000-0000-0000-000000000000/stream',
    });

    expect(resHead.headers['x-ratelimit-remaining']).toBeUndefined();

    const resGetStream = await app.inject({
      method: 'GET',
      url: '/api/media/00000000-0000-0000-0000-000000000000/stream',
    });

    expect(resGetStream.headers['x-ratelimit-limit']).toBe('600');
    expect(resGetStream.headers['x-ratelimit-remaining']).toBe('599');
  });
});
