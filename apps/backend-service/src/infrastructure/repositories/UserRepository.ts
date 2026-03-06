/**
 * UserRepository Implementation
 * Sprint 2 - Auth System
 * Implementa IUserRepository usando Prisma
 */

import type { User, UserWithRoles } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../domain/interfaces/IAuthServices.js';
import { prisma } from '../../shared/config/prisma.js';

export class UserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return user;
  }

  async findByIdWithRoles(id: bigint): Promise<UserWithRoles | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roles: user.userRoles.map((ur) => ({
        roleId: ur.roleId,
        role: {
          id: ur.role.id,
          name: ur.role.name,
        },
      })),
    };
  }

  async create(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}
