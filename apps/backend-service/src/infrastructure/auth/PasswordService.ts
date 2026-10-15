/**
 * PasswordService Implementation
 * Spec 002 - Auth RBAC
 * Argon2id (R-004) con verificación legacy bcrypt + rehash transparente (R-005).
 *
 * Se usa @node-rs/argon2 (binarios preconstruidos napi-rs) en lugar del paquete
 * `argon2` clásico: no requiere compilación nativa en la imagen Docker slim
 * (que se construye con --ignore-scripts).
 */

import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';
import type { IPasswordService } from '../../domain/interfaces/IAuthServices.js';
import { env } from '../../shared/config/env.js';

/**
 * @node-rs/argon2 expone Algorithm como const enum (incompatible con
 * verbatimModuleSyntax). Algorithm.Argon2id = 2 (ver index.d.ts del paquete).
 */
const ALGORITHM_ARGON2ID = 2;

/** Detecta hashes bcrypt legacy ($2a$ / $2b$) */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

export class PasswordService implements IPasswordService {
  private readonly argon2Options = {
    algorithm: ALGORITHM_ARGON2ID,
    memoryCost: env.ARGON2_MEMORY_KIB,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  };

  /**
   * Hashear contraseña con Argon2id y los parámetros OWASP configurados
   */
  async hash(password: string): Promise<string> {
    return argon2Hash(password, this.argon2Options);
  }

  /**
   * Verificar contraseña contra un hash Argon2id o bcrypt legacy
   */
  async compare(password: string, hash: string): Promise<boolean> {
    if (isBcryptHash(hash)) {
      return bcrypt.compare(password, hash);
    }
    return argon2Verify(hash, password, this.argon2Options);
  }

  /**
   * R-005: true si el hash está en formato legacy bcrypt y debe rehashearse
   * con Argon2id en el próximo login exitoso.
   */
  needsRehash(hash: string): boolean {
    return isBcryptHash(hash);
  }
}
