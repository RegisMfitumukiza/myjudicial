import { supabaseAdmin } from "./supabase.client.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { normaliseNamePair } from "../../shared/utils/name-format.js";
import type { User } from "../../generated/prisma/client.js";

/**
 * Supabase Auth <-> PostgreSQL Sync Service
 * 
 * Handles bidirectional synchronization between Supabase Auth users
 * and PostgreSQL user records to maintain data consistency.
 */

export const SupabaseSyncService = {
  /**
   * Sync user from Supabase Auth to PostgreSQL
   * Called when Supabase Auth user is created/updated
   */
  syncFromSupabaseAuth: async (supabaseUserId: string, email: string, metadata?: any) => {
    try {
      logger.info("Syncing user from Supabase Auth to PostgreSQL", { 
        supabaseUserId, 
        email 
      });

      // Check if user already exists in PostgreSQL
      const existingUser = await prisma.user.findUnique({
        where: { id: supabaseUserId }
      });

      const fullName = metadata?.full_name || metadata?.name || '';
      const rawFirstName = metadata?.first_name || (fullName ? fullName.split(" ")[0] : '') || 'User';
      const rawLastName = metadata?.last_name || (fullName ? fullName.split(" ").slice(1).join(" ") : '') || rawFirstName;
      const role = metadata?.role || 'CITIZEN';
      const phone = metadata?.phone;
      const preferredLanguage = metadata?.preferred_language || 'en';

      // Normalise names to Title Case before persisting
      const { firstName, lastName } = normaliseNamePair(rawFirstName, rawLastName);

      if (existingUser) {
        // Update existing PostgreSQL user
        const updatedUser = await prisma.user.update({
          where: { id: supabaseUserId },
          data: {
            email,
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            role: role || existingUser.role,
            ...(phone && { phone }),
          }
        });

        logger.info("User updated in PostgreSQL", { userId: updatedUser.id });
        return updatedUser;
      } else {
        // Create new PostgreSQL user
        const newUser = await prisma.user.create({
          data: {
            id: supabaseUserId,
            email,
            firstName,
            lastName,
            role: role as any,
            phone,
            status: 'ACTIVE',
            preferredLanguage,
          }
        });

        logger.info("User created in PostgreSQL", { userId: newUser.id });
        return newUser;
      }
    } catch (error) {
      logger.error("Failed to sync user from Supabase Auth to PostgreSQL", {
        supabaseUserId,
        email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  /**
   * Sync user deletion from Supabase Auth to PostgreSQL
   */
  syncDeleteFromSupabaseAuth: async (supabaseUserId: string) => {
    try {
      logger.info("Syncing user deletion from Supabase Auth to PostgreSQL", { 
        supabaseUserId 
      });

      // Check if user exists in PostgreSQL
      const existingUser = await prisma.user.findUnique({
        where: { id: supabaseUserId }
      });

      if (existingUser) {
        // Delete user and all related data (cascading deletes handled by schema)
        await prisma.user.delete({
          where: { id: supabaseUserId }
        });

        logger.info("User deleted from PostgreSQL", { userId: supabaseUserId });
        return true;
      } else {
        logger.info("User not found in PostgreSQL, no deletion needed", { 
          userId: supabaseUserId 
        });
        return false;
      }
    } catch (error) {
      logger.error("Failed to sync user deletion from Supabase Auth to PostgreSQL", {
        supabaseUserId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  /**
   * Sync user from PostgreSQL to Supabase Auth
   * Called when PostgreSQL user is updated
   */
  syncToSupabaseAuth: async (user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>) => {
    try {
      logger.info("Syncing user from PostgreSQL to Supabase Auth", { 
        userId: user.id,
        email: user.email 
      });

      // Update Supabase Auth user metadata
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email: user.email,
          user_metadata: {
            full_name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            first_name: user.firstName,
            last_name: user.lastName,
          }
        }
      );

      if (error) {
        logger.error("Failed to update Supabase Auth user", {
          userId: user.id,
          error: error.message
        });
        throw new Error(`Supabase Auth update failed: ${error.message}`);
      }

      logger.info("User updated in Supabase Auth", { userId: user.id });
      return data.user;
    } catch (error) {
      logger.error("Failed to sync user from PostgreSQL to Supabase Auth", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  /**
   * Sync user deletion from PostgreSQL to Supabase Auth
   */
  syncDeleteToSupabaseAuth: async (userId: string) => {
    try {
      logger.info("Syncing user deletion from PostgreSQL to Supabase Auth", { userId });

      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        logger.error("Failed to delete Supabase Auth user", {
          userId,
          error: error.message
        });
        throw new Error(`Supabase Auth deletion failed: ${error.message}`);
      }

      logger.info("User deleted from Supabase Auth", { userId });
      return data;
    } catch (error) {
      logger.error("Failed to sync user deletion from PostgreSQL to Supabase Auth", {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  /**
   * Full sync check - ensures all users exist in both systems
   * Use sparingly for maintenance/recovery
   */
  performFullSync: async () => {
    try {
      logger.info("Starting full user sync between Supabase Auth and PostgreSQL");

      // Get all users from Supabase Auth
      const { data: supabaseUsers, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        throw new Error(`Failed to fetch Supabase users: ${error.message}`);
      }

      // Get all users from PostgreSQL
      const postgresUsers = await prisma.user.findMany();

      const syncResults = {
        supabaseToPostgres: 0,
        postgresCleanup: 0,
        errors: [] as string[]
      };

      // Sync Supabase users to PostgreSQL
      for (const supabaseUser of supabaseUsers.users) {
        try {
          await SupabaseSyncService.syncFromSupabaseAuth(
            supabaseUser.id, 
            supabaseUser.email || '', 
            supabaseUser.user_metadata
          );
          syncResults.supabaseToPostgres++;
        } catch (error) {
          syncResults.errors.push(`Failed to sync ${supabaseUser.id}: ${error}`);
        }
      }

      // Clean up PostgreSQL users not in Supabase
      const supabaseUserIds = new Set(supabaseUsers.users.map(u => u.id));
      for (const pgUser of postgresUsers) {
        if (!supabaseUserIds.has(pgUser.id)) {
          try {
            await prisma.user.delete({ where: { id: pgUser.id } });
            syncResults.postgresCleanup++;
            logger.info("Cleaned up orphaned PostgreSQL user", { userId: pgUser.id });
          } catch (error) {
            syncResults.errors.push(`Failed to cleanup ${pgUser.id}: ${error}`);
          }
        }
      }

      logger.info("Full sync completed", syncResults);
      return syncResults;
    } catch (error) {
      logger.error("Full sync failed", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
};