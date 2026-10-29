import { prisma } from "../../infrastructure/database/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

type CreateUserParams = {
  id: string; // Supabase Auth UUID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  preferredLanguage: string;
};

/**
 * AuthRepository — owns all database operations for the auth module.
 * Controllers and services never call Prisma directly.
 */
export const AuthRepository = {
  /**
   * Create a new user record after Supabase Auth registration.
   * The id must match the Supabase Auth UUID so JWT verification links correctly.
   */
  createUser: async (params: CreateUserParams) => {
    return prisma.user.upsert({
      where: { id: params.id },
      update: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
        role: params.role,
        preferredLanguage: params.preferredLanguage,
        status: "ACTIVE",
      },
      create: {
        id: params.id,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
        role: params.role,
        preferredLanguage: params.preferredLanguage,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  },

  /**
   * Find a user by email — used for login and duplicate checks.
   */
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        preferredLanguage: true,
        status: true,
        expertProfile: {
          select: { id: true, status: true },
        },
      },
    });
  },

  /**
   * Find a user by Supabase Auth UUID.
   */
  findById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        preferredLanguage: true,
        clientDistrictId: true,
        clientSectorId: true,
        clientDistrict: { select: { id: true, code: true, name: true } },
        clientSector: { select: { id: true, code: true, name: true } },
        expertProfile: {
          select: { id: true, status: true },
        },
      },
    });
  },

  /**
   * Update lastLoginAt timestamp.
   */
  recordLogin: async (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
      select: { id: true, lastLoginAt: true },
    });
  },

  /**
   * Delete a user record - used for cleanup during sync
   */
  deleteUser: async (userId: string) => {
    return prisma.user.delete({
      where: { id: userId },
      select: { id: true },
    });
  },

  /**
   * Update user profile information
   */
  updateUser: async (userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferredLanguage?: string;
    clientDistrictId?: string | null;
    clientSectorId?: string | null;
  }) => {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        preferredLanguage: true,
        status: true,
        clientDistrictId: true,
        clientSectorId: true,
        clientDistrict: { select: { id: true, code: true, name: true } },
        clientSector: { select: { id: true, code: true, name: true } },
      },
    });
  },

  updateAvatarObjectKey: async (userId: string, avatarObjectKey: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarObjectKey },
      select: { id: true, avatarObjectKey: true },
    });
  },

  /**
   * Get notification preferences for a user (creates defaults if missing).
   */
  getNotificationPreferences: async (userId: string) => {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { email: true, push: true, inApp: true },
    });
  },

  /**
   * Update notification preferences for a user.
   */
  updateNotificationPreferences: async (userId: string, data: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  }) => {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
      select: { email: true, push: true, inApp: true },
    });
  },

  /**
   * Record a new refresh token / device session.
   */
  recordRefreshToken: async (params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    rememberMe: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) => {
    return prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
        rememberMe: params.rememberMe,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  },

  /**
   * Update an existing refresh token session during token rotation.
   */
  rotateRefreshToken: async (oldTokenHash: string, newTokenHash: string, newExpiresAt: Date) => {
    return prisma.refreshToken.updateMany({
      where: { tokenHash: oldTokenHash, revokedAt: null },
      data: {
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });
  },

  /**
   * List all unrevoked, unexpired sessions for a user.
   */
  listUserSessions: async (userId: string) => {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tokenHash: true,
        ipAddress: true,
        userAgent: true,
        rememberMe: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
      take: 20,
    });
  },

  /**
   * Revoke a specific session.
   */
  revokeSession: async (sessionId: string, userId?: string) => {
    return prisma.refreshToken.updateMany({
      where: {
        id: sessionId,
        ...(userId ? { userId } : {}),
      },
      data: { revokedAt: new Date() },
    });
  },

  /**
   * Revoke a session by token hash.
   */
  revokeSessionByTokenHash: async (tokenHash: string) => {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  },

  /**
   * Revoke all other active sessions for a user.
   */
  revokeAllOtherSessions: async (userId: string, currentSessionId?: string) => {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  },
};
