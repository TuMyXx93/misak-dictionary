/**
 * TokenService Tests
 * Spec 002 — Auth System
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { TokenService } from './TokenService.js';

describe('TokenService', () => {
  let tokenService: TokenService;

  const mockUser = {
    userId: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user'],
  };

  beforeEach(() => {
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = tokenService.generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should generate different tokens for different users', () => {
      const user1 = { ...mockUser, userId: BigInt(1) };
      const user2 = { ...mockUser, userId: BigInt(2) };

      const token1 = tokenService.generateAccessToken(user1);
      const token2 = tokenService.generateAccessToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should include user data in token payload', () => {
      const token = tokenService.generateAccessToken(mockUser);
      const decoded = tokenService.verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUser.userId);
      expect(decoded?.username).toBe(mockUser.username);
      expect(decoded?.email).toBe(mockUser.email);
      expect(decoded?.roles).toEqual(mockUser.roles);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = tokenService.generateRefreshToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate different tokens for different users', () => {
      const user1 = { ...mockUser, userId: BigInt(1) };
      const user2 = { ...mockUser, userId: BigInt(2) };

      const token1 = tokenService.generateRefreshToken(user1);
      const token2 = tokenService.generateRefreshToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should include user data in token payload', () => {
      const token = tokenService.generateRefreshToken(mockUser);
      const decoded = tokenService.verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUser.userId);
      expect(decoded?.username).toBe(mockUser.username);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = tokenService.generateAccessToken(mockUser);
      const decoded = tokenService.verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUser.userId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = tokenService.verifyAccessToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt';
      const decoded = tokenService.verifyAccessToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = tokenService.verifyAccessToken('');

      expect(decoded).toBeNull();
    });

    it('should handle token with wrong signature', () => {
      const token = tokenService.generateAccessToken(mockUser);
      const tamperedToken = `${token.slice(0, -10)}tampered123`;
      const decoded = tokenService.verifyAccessToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = tokenService.generateRefreshToken(mockUser);
      const decoded = tokenService.verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUser.userId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.refresh.token';
      const decoded = tokenService.verifyRefreshToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = tokenService.verifyRefreshToken('');

      expect(decoded).toBeNull();
    });

    it('should not accept access token as refresh token', () => {
      const accessToken = tokenService.generateAccessToken(mockUser);
      const decoded = tokenService.verifyRefreshToken(accessToken);

      expect(decoded).toBeNull();
    });
  });
});
