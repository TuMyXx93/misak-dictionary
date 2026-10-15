/**
 * PasswordService Tests
 * Spec 002 - Auth RBAC
 * R-004: Argon2id con parámetros; R-005: verificación legacy + needsRehash.
 */

import { describe, expect, it } from 'vitest';
import { isBcryptHash, PasswordService } from './PasswordService.js';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  describe('isBcryptHash', () => {
    it('detecta hashes bcrypt legacy', () => {
      expect(isBcryptHash('$2a$10$abcdefghijklmnopqrstuv')).toBe(true);
      expect(isBcryptHash('$2b$10$abcdefghijklmnopqrstuv')).toBe(true);
    });

    it('rechaza hashes argon2', () => {
      expect(isBcryptHash('$argon2id$v=19$m=65536,t=3,p=4$c3RpbGxlcg$aaa')).toBe(false);
    });
  });

  describe('hash (R-004)', () => {
    it('genera hash Argon2id con parámetros OWASP', async () => {
      // Act
      const hash = await passwordService.hash('correct horse battery staple');

      // Assert
      expect(hash.startsWith('$argon2id$')).toBe(true);
      expect(hash).toContain('m=65536'); // ≥ 19MiB (OWASP)
      expect(hash).toContain('t=3'); // ≥ 2
      expect(hash).toContain('p=4'); // ≥ 1
    });

    it('genera hashes distintos para la misma contraseña (salt aleatorio)', async () => {
      const hashA = await passwordService.hash('misma-password');
      const hashB = await passwordService.hash('misma-password');
      expect(hashA).not.toBe(hashB);
    });
  });

  describe('compare', () => {
    it('verifica contraseña correcta contra hash Argon2id', async () => {
      const hash = await passwordService.hash('mi-contraseña-secreta');
      await expect(passwordService.compare('mi-contraseña-secreta', hash)).resolves.toBe(true);
    });

    it('rechaza contraseña incorrecta contra hash Argon2id', async () => {
      const hash = await passwordService.hash('mi-contraseña-secreta');
      await expect(passwordService.compare('otra-contraseña', hash)).resolves.toBe(false);
    });

    it('verifica contraseña contra hash bcrypt legacy (R-005)', async () => {
      // Hash bcrypt pre-generado (salt 10) de "legacy-password"
      const legacyHash = '$2a$10$TtgPP.G1D7Y4.BoQCr8I9e78BV20dygwdGwUCr8jEvrIiuTjishYG';
      await expect(passwordService.compare('legacy-password', legacyHash)).resolves.toBe(true);
      await expect(passwordService.compare('wrong-password', legacyHash)).resolves.toBe(false);
    });
  });

  describe('needsRehash (R-005)', () => {
    it('devuelve true para hashes bcrypt legacy', () => {
      expect(passwordService.needsRehash('$2a$10$N9qo8uLOickgx2ZMRZoMye')).toBe(true);
    });

    it('devuelve false para hashes Argon2id', () => {
      expect(passwordService.needsRehash('$argon2id$v=19$m=65536,t=3,p=4$aaa$bbb')).toBe(false);
    });
  });
});
