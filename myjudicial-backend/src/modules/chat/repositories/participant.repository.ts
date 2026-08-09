import { prisma } from "../../../infrastructure/database/prisma.js";
import type { Prisma, ParticipantRole } from "../../../generated/prisma/client.js";

export const ParticipantRepository = {
  /**
   * Add a participant to a conversation
   */
  create: async (data: {
    conversationId: string;
    userId: string;
    role?: ParticipantRole;
  }, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    return db.conversationParticipant.create({
      data: {
        conversationId: data.conversationId,
        userId: data.userId,
        role: data.role || "MEMBER",
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  },

  /**
   * Find participant by conversation and user
   */
  findByConversationAndUser: async (conversationId: string, userId: string) => {
    return prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  },

  /**
   * List participants in a conversation
   */
  findByConversationId: async (conversationId: string) => {
    return prisma.conversationParticipant.findMany({
      where: { conversationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            preferredLanguage: true,
            avatarObjectKey: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  /**
   * Update participant (last read tracking)
   */
  update: async (conversationId: string, userId: string, data: {
    lastReadAt?: Date;
    lastReadMessageId?: string;
    isActive?: boolean;
    leftAt?: Date;
  }) => {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data,
    });
  },

  /**
   * Mark messages as read for a participant
   */
  markAsRead: async (conversationId: string, userId: string, lastReadMessageId: string) => {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: new Date(),
        lastReadMessageId,
      },
    });
  },

  /**
   * Remove participant from conversation
   */
  remove: async (conversationId: string, userId: string) => {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  },

  /**
   * Get unread message count for a participant in a conversation
   */
  getUnreadCount: async (conversationId: string, userId: string): Promise<number> => {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { lastReadAt: true },
    });

    if (!participant) return 0;

    const lastRead = participant.lastReadAt || new Date(0);
    return prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isDeleted: false,
        createdAt: { gt: lastRead },
      },
    });
  },
};
