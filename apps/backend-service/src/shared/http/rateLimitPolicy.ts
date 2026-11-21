/**
 * Differentiated Rate Limiting Policy
 * Aísla cuotas y claves entre diccionarios públicos, panel editorial administrativo,
 * streaming multimedia con HTTP Range y rutas generales detrás de NAT/Cloudflare Tunnel.
 */

import type { RateLimitPluginOptions } from '@fastify/rate-limit';
import type { FastifyRequest } from 'fastify';
import type { ITokenService } from '../../domain/interfaces/IAuthServices.js';

export type RateLimitBucket = 'stream' | 'admin' | 'public' | 'global';

export interface RateLimitPolicySettings {
  globalMax: number;
  globalWindow: string;
  publicMax: number;
  publicWindow: string;
  adminMax: number;
  adminWindow: string;
  streamMax: number;
  streamWindow: string;
}

const TIME_UNIT_MS: Record<string, number> = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  secs: 1000,
  second: 1000,
  seconds: 1000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hrs: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
};

/**
 * Convierte expresiones tipo '1m', '15m', '30s' o milisegundos numéricos a milisegundos.
 */
export function parseTimeWindowMs(value: string | number, fallbackMs = 60_000): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallbackMs;
  }

  const trimmed = value.trim();
  const match =
    /^(\d+)\s*(ms|milliseconds?|s|secs?|seconds?|m|mins?|minutes?|h|hrs?|hours?|d|days?)?$/i.exec(
      trimmed,
    );
  if (!match) {
    return fallbackMs;
  }

  const amount = Number.parseInt(match[1] ?? '', 10);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return fallbackMs;
  }

  const unit = (match[2] ?? 'ms').toLowerCase();
  const multiplier = TIME_UNIT_MS[unit] ?? 1;
  return amount * multiplier;
}

function extractCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex).trim();
    if (key === name) {
      const value = part.slice(eqIndex + 1).trim();
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

/**
 * Extrae y verifica criptográficamente el userId desde Authorization Bearer o cookie `misak_at`.
 */
export function extractVerifiedActorId(
  request: FastifyRequest,
  tokenService: Pick<ITokenService, 'verifyAccessToken'>,
): string | null {
  let token: string | null = null;
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) {
      token = bearer;
    }
  }

  if (!token) {
    const cookies = (request as FastifyRequest & { cookies?: Record<string, string | undefined> })
      .cookies;
    token = cookies?.['misak_at'] ?? extractCookieValue(request.headers.cookie, 'misak_at');
  }

  if (!token) {
    return null;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    return payload ? payload.userId.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Clasifica la ruta entrante en su dominio de rate limiting independiente.
 */
export function classifyRateLimitBucket(request: FastifyRequest): RateLimitBucket {
  const pathOnly = (request.url || '/').split('?')[0] ?? '/';

  if (
    /^\/api\/media\/[^/]+\/stream\/?$/.test(pathOnly) ||
    /^\/api\/admin\/medios\/[^/]+\/stream\/?$/.test(pathOnly)
  ) {
    return 'stream';
  }

  if (pathOnly === '/api/admin' || pathOnly.startsWith('/api/admin/')) {
    return 'admin';
  }

  if (
    pathOnly === '/api/dictionary' ||
    pathOnly.startsWith('/api/dictionary/') ||
    pathOnly === '/api/media' ||
    pathOnly.startsWith('/api/media/')
  ) {
    return 'public';
  }

  return 'global';
}

/**
 * Construye la configuración de `@fastify/rate-limit` con buckets aislados por dominio y actor.
 */
export function createRateLimitPluginOptions(
  settings: RateLimitPolicySettings,
  tokenService: Pick<ITokenService, 'verifyAccessToken'>,
): RateLimitPluginOptions {
  const globalWindowMs = parseTimeWindowMs(settings.globalWindow, 15 * 60_000);
  const publicWindowMs = parseTimeWindowMs(settings.publicWindow, 60_000);
  const adminWindowMs = parseTimeWindowMs(settings.adminWindow, 60_000);
  const streamWindowMs = parseTimeWindowMs(settings.streamWindow, 60_000);

  return {
    allowList: (request: FastifyRequest) =>
      request.method === 'HEAD' && classifyRateLimitBucket(request) === 'stream',
    keyGenerator: (request: FastifyRequest) => {
      const bucket = classifyRateLimitBucket(request);
      if (bucket === 'admin' || bucket === 'stream') {
        const actorId = extractVerifiedActorId(request, tokenService);
        return actorId ? `${bucket}:user:${actorId}` : `${bucket}:ip:${request.ip}`;
      }
      return `${bucket}:ip:${request.ip}`;
    },
    max: (request: FastifyRequest) => {
      switch (classifyRateLimitBucket(request)) {
        case 'stream':
          return settings.streamMax;
        case 'admin':
          return settings.adminMax;
        case 'public':
          return settings.publicMax;
        case 'global':
          return settings.globalMax;
      }
    },
    timeWindow: (request: FastifyRequest) => {
      switch (classifyRateLimitBucket(request)) {
        case 'stream':
          return streamWindowMs;
        case 'admin':
          return adminWindowMs;
        case 'public':
          return publicWindowMs;
        case 'global':
          return globalWindowMs;
      }
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes en poco tiempo. Por favor espere antes de reintentar.',
      retryAfterSeconds: Math.max(1, Math.ceil((context.ttl ?? 60_000) / 1000)),
    }),
  };
}
