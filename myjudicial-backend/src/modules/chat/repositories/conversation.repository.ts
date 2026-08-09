import { prisma } from "../../../infrastructure/database/prisma.js";
import type { Prisma, ConversationStatus } from "../../../generated/prisma/client.js";

export const ConversationRepository = {
  /**
   * Create a new conversation tied to a booking
   */
  create: async (data: {
    bookingId: string;
    type?: string;
  }, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    return db.conversation.create({
      data: {
        bookingId: data.bookingId,
        type: (data.type as any) || "CONSULTATION",
      },
      include: {
        booking: {
          include: {
            citizen: { select: { id: true, firstName: true, lastName: true, email: true } },
            expert: { select: { id: true, displayName: true, userId: true } },
          },
        },
      },
    });
  },

  /**
   * Find conversation by ID with full details
   */
  findById: async (id: string) => {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            citizen: { select: { id: true, firstName: true, lastName: true, email: true } },
            expert: { select: { id: true, displayName: true, userId: true } },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
        },
        _count: {
          select: { messages: { where: { isDeleted: false } } },
        },
      },
    });
  },

  /**
   * Find conversation by booking ID
   */
  findByBookingId: async (bookingId: string) => {
    return prisma.conversation.findUnique({
      where: { bookingId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  },

  /**
   * List conversations for a user with pagination
   */
  findByUserId: async (userId: string, filters: {
    status?: ConversationStatus;
    page: number;
    limit: number;
  }) => {
    const { status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: { userId, isActive: true },
      },
      ...(status && { status }),
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          participants: {
            where: { userId: { not: userId } }, // Other participants
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarObjectKey: true } },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update conversation metadata
   */
  update: async (id: string, data: {
    status?: ConversationStatus;
    lastMessageAt?: Date;
    lastMessageText?: string;
    isArchived?: boolean;
    archivedAt?: Date;
  }, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    return db.conversation.update({
      where: { id },
      data,
    });
  },

  /**
   * Archive a conversation
   */
  archive: async (id: string) => {
    return prisma.conversation.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        status: "ARCHIVED",
      },
    });
  },

  /**
   * Close a conversation
   */
  close: async (id: string) => {
    return prisma.conversation.update({
      where: { id },
      data: {
        status: "CLOSED",
      },
    });
  },

  /**
   * Check if user is a participant in conversation
   */
  isParticipant: async (conversationId: string, userId: string): Promise<boolean> => {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    return !!participant && participant.isActive;
  },

  /**
   * Get unread count for a user across all conversations
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId, isActive: true },
        },
        status: "ACTIVE",
      },
      include: {
        participants: {
          where: { userId },
          select: { lastReadAt: true },
        },
        messages: {
          where: {
            isDeleted: false,
            senderId: { not: userId },
          },
          select: { createdAt: true },
        },
      },
    });

    let totalUnread = 0;
    for (const conv of conversations) {
      const participant = conv.participants[0];
      const lastRead = participant?.lastReadAt || new Date(0);
      const unreadMessages = conv.messages.filter((m) => m.createdAt > lastRead);
      totalUnread += unreadMessages.length;
    }

    return totalUnread;
  },
};
