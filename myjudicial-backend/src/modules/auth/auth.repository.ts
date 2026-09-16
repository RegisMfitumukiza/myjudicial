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
    });
  },

  /**
   * Delete a user record - used for cleanup during sync
   */
  deleteUser: async (userId: string) => {
    return prisma.user.delete({
      where: { id: userId },
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
};
