/**
 * PasswordService Implementation
 * Sprint 2 - Auth System
 * Implementa IPasswordService usando bcryptjs
 */

import bcrypt from 'bcryptjs';
import type { IPasswordService } from '../../domain/interfaces/IAuthServices.js';
import { env } from '../../shared/config/env.js';

export class PasswordService implements IPasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = env.BCRYPT_ROUNDS;
  }

  /**
   * Hashear contraseña en texto plano
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Comparar contraseña en texto plano con hash
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
