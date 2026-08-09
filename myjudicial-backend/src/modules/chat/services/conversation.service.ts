import { ConversationRepository } from "../repositories/conversation.repository.js";
import { ParticipantRepository } from "../repositories/participant.repository.js";
import { BookingRepository } from "../../bookings/booking.repository.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { logger } from "../../../shared/utils/logger.js";
import { NotFoundError, AuthorizationError, ValidationError } from "../../../shared/errors/index.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type { Role } from "../../../generated/prisma/client.js";

export const ConversationService = {
  /**
   * Create a conversation for a booking (called automatically on booking confirm)
   */
  createConversation: async (bookingId: string, actorId: string) => {
    // 1. Verify booking exists and is confirmed
    const booking = await BookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "ACTIVE") {
      throw new ValidationError("Conversation can only be created for confirmed or active bookings");
    }

    // 2. Check if conversation already exists
    const existing = await ConversationRepository.findByBookingId(bookingId);
    if (existing) {
      return existing; // Idempotent
    }

    // 3. Create conversation and add participants in transaction
    const conversation = await prisma.$transaction(async (tx) => {
      // Create conversation
      const conv = await ConversationRepository.create(
        {
          bookingId,
          type: "CONSULTATION",
        },
        tx
      );

      // Add citizen as participant
      await ParticipantRepository.create(
        {
          conversationId: conv.id,
          userId: booking.citizenId,
          role: "MEMBER",
        },
        tx
      );

      // Add expert as participant — note booking.expertId is the ExpertProfile.id,
      // not a User.id; ConversationParticipant.userId is a hard FK to User, so this
      // must use the expert's underlying user id or the insert violates the FK.
      await ParticipantRepository.create(
        {
          conversationId: conv.id,
          userId: booking.expert.user.id,
          role: "MEMBER",
        },
        tx
      );

      return conv;
    });

    // 4. Audit log
    await writeAuditLog({
      actorId,
      action: "CREATE",
      resource: "CONVERSATION",
      resourceId: conversation.id,
      description: `Conversation created for booking ${bookingId}`,
      metadata: { bookingId },
    });

    logger.info("Conversation created", { conversationId: conversation.id, bookingId });

    return conversation;
  },

  /**
   * List conversations for a user
   */
  listUserConversations: async (userId: string, filters: {
    status?: any;
    page: number;
    limit: number;
  }) => {
    return ConversationRepository.findByUserId(userId, filters);
  },

  /**
   * Resolve the conversation tied to a booking, for a "Message expert/client"
   * deep link from the booking UI. Only the booking's citizen/expert (or an
   * ADMIN) may resolve it. Throws NotFoundError if the booking has no
   * conversation yet (e.g. not confirmed, or created before the FK fix).
   */
  getConversationByBookingId: async (bookingId: string, userId: string, role: Role) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const isOwner = booking.citizenId === userId || booking.expert.user.id === userId;
    if (role !== "ADMIN" && !isOwner) {
      throw new AuthorizationError("Access denied to this booking's conversation");
    }

    const conversation = await ConversationRepository.findByBookingId(bookingId);
    if (!conversation) {
      throw new NotFoundError("No conversation exists yet for this booking");
    }

    return conversation;
  },

  /**
   * Get conversation details with participants
   */
  getConversationDetails: async (conversationId: string, userId: string, role: Role) => {
    const conversation = await ConversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    // Authorization check
    const hasAccess = await ConversationService.canAccess(conversationId, userId, role);
    if (!hasAccess) {
      throw new AuthorizationError("Access denied to this conversation");
    }

    return conversation;
  },

  /**
   * Archive a conversation
   */
  archiveConversation: async (conversationId: string, userId: string, role: Role) => {
    // Authorization check
    const hasAccess = await ConversationService.canAccess(conversationId, userId, role);
    if (!hasAccess) {
      throw new AuthorizationError("Access denied to this conversation");
    }

    const archived = await ConversationRepository.archive(conversationId);

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "CONVERSATION",
      resourceId: conversationId,
      description: "Conversation archived",
    });

    logger.info("Conversation archived", { conversationId, userId });

    return archived;
  },

  /**
   * Close a conversation (when booking is cancelled/completed)
   */
  closeConversation: async (bookingId: string, reason: string, actorId: string) => {
    const conversation = await ConversationRepository.findByBookingId(bookingId);

    if (!conversation) {
      logger.warn("No conversation to close for booking", { bookingId });
      return null;
    }

    const closed = await ConversationRepository.close(conversation.id);

    await writeAuditLog({
      actorId,
      action: "UPDATE",
      resource: "CONVERSATION",
      resourceId: conversation.id,
      description: `Conversation closed: ${reason}`,
      metadata: { bookingId, reason },
    });

    logger.info("Conversation closed", { conversationId: conversation.id, reason });

    return closed;
  },

  /**
   * Authorization: Check if user can access a conversation
   */
  canAccess: async (conversationId: string, userId: string, role: Role): Promise<boolean> => {
    // 1. Admin can access all conversations
    if (role === "ADMIN") return true;

    // 2. Check if user is an active participant
    const isParticipant = await ConversationRepository.isParticipant(conversationId, userId);
    if (isParticipant) return true;

    // 3. Check booking ownership (citizen or expert on the booking)
    const conversation = await ConversationRepository.findById(conversationId);
    if (!conversation) return false;

    return (
      conversation.booking.citizenId === userId ||
      conversation.booking.expert.userId === userId
    );
  },

  /**
   * List participants in a conversation
   */
  getParticipants: async (conversationId: string, userId: string, role: Role) => {
    // Authorization check
    const hasAccess = await ConversationService.canAccess(conversationId, userId, role);
    if (!hasAccess) {
      throw new AuthorizationError("Access denied to this conversation");
    }

    return ParticipantRepository.findByConversationId(conversationId);
  },

  /**
   * Get unread count across all conversations for a user
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    return ConversationRepository.getUnreadCount(userId);
  },
};
