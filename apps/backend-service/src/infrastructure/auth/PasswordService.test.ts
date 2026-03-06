/**
 * PasswordService Tests
 * Sprint 2 - Auth System
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { PasswordService } from './PasswordService.js';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await passwordService.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.compare(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.compare(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.compare('', hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive comparison', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hash(password);
      const isValid = await passwordService.compare('testpassword123!', hashedPassword);

      expect(isValid).toBe(false);
    });
  });
});
