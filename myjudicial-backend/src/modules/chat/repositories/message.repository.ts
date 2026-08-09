import { prisma } from "../../../infrastructure/database/prisma.js";
import type { Prisma, MessageType, MessageStatus } from "../../../generated/prisma/client.js";

export const MessageRepository = {
  /**
   * Create a new message
   */
  create: async (data: {
    conversationId: string;
    senderId: string;
    messageType: MessageType;
    content?: string;
    attachmentIds?: string[];
    replyToId?: string;
  }, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    return db.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        messageType: data.messageType,
        content: data.content,
        attachmentIds: data.attachmentIds || [],
        replyToId: data.replyToId,
        status: "SENT",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarObjectKey: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Find message by ID
   */
  findById: async (id: string) => {
    return prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarObjectKey: true,
          },
        },
        conversation: {
          select: {
            id: true,
            bookingId: true,
          },
        },
      },
    });
  },

  /**
   * List messages in a conversation with cursor pagination
   */
  findByConversationId: async (conversationId: string, filters: {
    cursor?: string;
    limit: number;
    includeDeleted?: boolean;
  }) => {
    const { cursor, limit, includeDeleted } = filters;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      ...((!includeDeleted) && { isDeleted: false }),
    };

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarObjectKey: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check for next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  },

  /**
   * Update a message
   */
  update: async (id: string, data: {
    content?: string;
    status?: MessageStatus;
    deliveredAt?: Date;
    isEdited?: boolean;
    editedAt?: Date;
    isDeleted?: boolean;
    deletedAt?: Date;
  }) => {
    return prisma.message.update({
      where: { id },
      data,
    });
  },

  /**
   * Edit a message
   */
  edit: async (id: string, content: string) => {
    return prisma.message.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
    });
  },

  /**
   * Soft delete a message
   */
  softDelete: async (id: string) => {
    return prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "[Message deleted]",
      },
    });
  },

  /**
   * Search messages by content
   */
  search: async (filters: {
    conversationId?: string;
    userId: string; // For authorization
    query: string;
    limit: number;
  }) => {
    const { conversationId, userId, query, limit } = filters;

    const where: Prisma.MessageWhereInput = {
      content: {
        contains: query,
        mode: "insensitive",
      },
      isDeleted: false,
      conversation: {
        participants: {
          some: { userId, isActive: true },
        },
      },
      ...(conversationId && { conversationId }),
    };

    return prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
        conversation: {
          select: { id: true, bookingId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Get message count in a conversation
   */
  count: async (conversationId: string): Promise<number> => {
    return prisma.message.count({
      where: {
        conversationId,
        isDeleted: false,
      },
    });
  },

  /**
   * Get last message in conversation
   */
  findLastMessage: async (conversationId: string) => {
    return prisma.message.findFirst({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        messageType: true,
        createdAt: true,
      },
    });
  },
};
