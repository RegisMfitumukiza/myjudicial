import { MessageRepository } from "../repositories/message.repository.js";
import { ConversationRepository } from "../repositories/conversation.repository.js";
import { ParticipantRepository } from "../repositories/participant.repository.js";
import { FileStorageRepository } from "../../file-storage/repositories/file-storage.repository.js";
import { FileStorageService } from "../../file-storage/services/file-storage.service.js";
import { NotificationRepository } from "../../notifications/notification.repository.js";
import { ChatBroadcastService } from "../realtime/chat-broadcast.service.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { logger } from "../../../shared/utils/logger.js";
import { NotFoundError, AuthorizationError, ValidationError } from "../../../shared/errors/index.js";
import { sendNewMessageEmail } from "../../../infrastructure/email/email.service.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type { MessageType, Role } from "../../../generated/prisma/client.js";

const EDIT_DELETE_WINDOW_DAYS = 7;
const MAX_MESSAGE_LENGTH = 10000;

export const MessageService = {
  /**
   * Send a message in a conversation
   */
  sendMessage: async (data: {
    conversationId: string;
    senderId: string;
    senderRole: Role;
    messageType: MessageType;
    content?: string;
    attachmentIds?: string[];
    replyToId?: string;
  }) => {
    // 1. Verify sender is a participant
    const isParticipant = await ConversationRepository.isParticipant(
      data.conversationId,
      data.senderId
    );

    if (!isParticipant) {
      throw new AuthorizationError("You are not a participant in this conversation");
    }

    // 2. Verify conversation is active
    const conversation = await ConversationRepository.findById(data.conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (conversation.status !== "ACTIVE") {
      throw new ValidationError("Cannot send messages to a closed or archived conversation");
    }

    // 3. Validate message content
    if (data.content && data.content.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`Message content exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }

    if (!data.content && (!data.attachmentIds || data.attachmentIds.length === 0)) {
      throw new ValidationError("Message must have content or attachments");
    }

    // 3b. Attachments must be real documents owned by the sender — chat never
    // trusts a client-supplied attachmentId at face value.
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      for (const attachmentId of data.attachmentIds) {
        const doc = await FileStorageRepository.findById(attachmentId);
        if (!doc) {
          throw new ValidationError(`Attachment ${attachmentId} not found`);
        }
        if (doc.ownerType !== "USER" || doc.ownerId !== data.senderId) {
          throw new AuthorizationError("You can only attach files you uploaded yourself");
        }
      }
    }

    // 4. Create message and update conversation in transaction
    const message = await prisma.$transaction(async (tx) => {
      const msg = await MessageRepository.create(
        {
          conversationId: data.conversationId,
          senderId: data.senderId,
          messageType: data.messageType,
          content: data.content,
          attachmentIds: data.attachmentIds,
          replyToId: data.replyToId,
        },
        tx
      );

      // Update conversation last message
      await ConversationRepository.update(
        data.conversationId,
        {
          lastMessageAt: new Date(),
          lastMessageText: data.content?.substring(0, 100) || "[Attachment]",
        },
        tx
      );

      return msg;
    });

    // 5. Audit log
    await writeAuditLog({
      actorId: data.senderId,
      action: "CREATE",
      resource: "MESSAGE",
      resourceId: message.id,
      description: "Message sent",
      metadata: { conversationId: data.conversationId, messageType: data.messageType },
    });

    // 6. Notify other participants (fire-and-forget)
    MessageService.notifyParticipants(data.conversationId, data.senderId, message.id).catch((err) => {
      logger.error("Failed to notify participants", { conversationId: data.conversationId, err });
    });

    // 6b. Push the new message to anyone with the conversation open right now (fire-and-forget)
    ChatBroadcastService.broadcastToConversation(data.conversationId, "new_message", message).catch((err) => {
      logger.error("Failed to broadcast new message", { conversationId: data.conversationId, err });
    });

    // 7. Grant the other participant(s) read access to any attachments (fire-and-forget) —
    // otherwise only the uploader could ever open a file they sent in the chat.
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      MessageService.shareAttachmentsWithOtherParticipants(
        data.conversationId,
        data.senderId,
        data.senderRole,
        data.attachmentIds
      ).catch((err) => {
        logger.error("Failed to share chat attachments", { conversationId: data.conversationId, err });
      });
    }

    logger.info("Message sent", { messageId: message.id, conversationId: data.conversationId });

    return message;
  },

  /**
   * List messages in a conversation with cursor pagination
   */
  listMessages: async (conversationId: string, userId: string, role: Role, filters: {
    cursor?: string;
    limit: number;
  }) => {
    // Authorization check
    const hasAccess = await ConversationRepository.isParticipant(conversationId, userId) || role === "ADMIN";
    if (!hasAccess) {
      throw new AuthorizationError("Access denied to this conversation");
    }

    return MessageRepository.findByConversationId(conversationId, filters);
  },

  /**
   * Edit a message (within 7-day window)
   */
  editMessage: async (messageId: string, userId: string, content: string) => {
    const message = await MessageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Only sender can edit
    if (message.senderId !== userId) {
      throw new AuthorizationError("You can only edit your own messages");
    }

    // Check if deleted
    if (message.isDeleted) {
      throw new ValidationError("Cannot edit a deleted message");
    }

    // Check edit window (7 days)
    const daysSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > EDIT_DELETE_WINDOW_DAYS) {
      throw new ValidationError(`Messages can only be edited within ${EDIT_DELETE_WINDOW_DAYS} days`);
    }

    // Validate content
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`Message content exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }

    const edited = await MessageRepository.edit(messageId, content);

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "MESSAGE",
      resourceId: messageId,
      description: "Message edited",
    });

    ChatBroadcastService.broadcastToConversation(message.conversationId, "message_edited", edited).catch((err) => {
      logger.error("Failed to broadcast message edit", { messageId, err });
    });

    logger.info("Message edited", { messageId, userId });

    return edited;
  },

  /**
   * Delete a message (soft delete, within 7-day window)
   */
  deleteMessage: async (messageId: string, userId: string, role: Role) => {
    const message = await MessageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Only sender or admin can delete
    if (message.senderId !== userId && role !== "ADMIN") {
      throw new AuthorizationError("You can only delete your own messages");
    }

    // Check if already deleted
    if (message.isDeleted) {
      throw new ValidationError("Message is already deleted");
    }

    // Check delete window (7 days) for non-admin
    if (role !== "ADMIN") {
      const daysSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > EDIT_DELETE_WINDOW_DAYS) {
        throw new ValidationError(`Messages can only be deleted within ${EDIT_DELETE_WINDOW_DAYS} days`);
      }
    }

    const deleted = await MessageRepository.softDelete(messageId);

    await writeAuditLog({
      actorId: userId,
      action: "DELETE",
      resource: "MESSAGE",
      resourceId: messageId,
      description: "Message deleted",
      metadata: { isAdminDelete: role === "ADMIN" },
    });

    ChatBroadcastService.broadcastToConversation(message.conversationId, "message_deleted", deleted).catch((err) => {
      logger.error("Failed to broadcast message delete", { messageId, err });
    });

    logger.info("Message deleted", { messageId, userId, role });

    return deleted;
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId: string, userId: string, lastReadMessageId: string) => {
    // Verify participant
    const isParticipant = await ConversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new AuthorizationError("You are not a participant in this conversation");
    }

    await ParticipantRepository.markAsRead(conversationId, userId, lastReadMessageId);

    logger.info("Messages marked as read", { conversationId, userId, lastReadMessageId });
  },

  /**
   * Search messages
   */
  searchMessages: async (userId: string, filters: {
    conversationId?: string;
    query: string;
    limit: number;
  }) => {
    return MessageRepository.search({
      ...filters,
      userId,
    });
  },

  /**
   * Get unread count for a specific conversation
   */
  getUnreadCount: async (conversationId: string, userId: string): Promise<number> => {
    return ParticipantRepository.getUnreadCount(conversationId, userId);
  },

  /**
   * Notify offline participants about new message
   */
  notifyParticipants: async (conversationId: string, senderId: string, messageId: string) => {
    const participants = await ParticipantRepository.findByConversationId(conversationId);
    const conversation = await ConversationRepository.findById(conversationId);

    if (!conversation) return;

    const sender = participants.find((p) => p.userId === senderId);
    if (!sender) return;

    // Notify other participants
    for (const participant of participants) {
      if (participant.userId === senderId) continue; // Don't notify sender
      if (!participant.isActive) continue;

      const senderName = `${sender.user.firstName} ${sender.user.lastName}`.trim() || "Someone";
      const messagePreview = conversation.lastMessageText || "New message";

      // Send email notification
      try {
        const participantLanguage = (participant.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
        await sendNewMessageEmail(participant.user.email, {
          recipientName: participant.user.firstName,
          senderName,
          messagePreview,
          conversationLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/chat/${conversationId}`,
          recipientRole: participant.user.role as "CITIZEN" | "EXPERT" | "ADMIN",
        }, participantLanguage);
      } catch (error) {
        logger.error("Failed to send new message email", { participantId: participant.userId, error });
      }

      // In-app notification (fire-and-forget — must not fail message delivery)
      try {
        await NotificationRepository.create({
          userId: participant.userId,
          event: "MESSAGE_RECEIVED",
          recipient: participant.user.email,
          subject: `New message from ${senderName}`,
          body: messagePreview,
        });
      } catch (error) {
        logger.error("Failed to write in-app message notification", { participantId: participant.userId, error });
      }
    }
  },

  /**
   * Grant every other active participant read access (via the file-storage
   * module's share mechanism) to each attachment in a just-sent message.
   * Without this, an attachment would only ever be openable by its uploader.
   */
  shareAttachmentsWithOtherParticipants: async (
    conversationId: string,
    senderId: string,
    senderRole: Role,
    attachmentIds: string[]
  ) => {
    const participants = await ParticipantRepository.findByConversationId(conversationId);
    const others = participants.filter((p) => p.userId !== senderId && p.isActive);

    for (const attachmentId of attachmentIds) {
      for (const other of others) {
        await FileStorageService.shareFile(
          attachmentId,
          { userId: senderId, role: senderRole as "CITIZEN" | "EXPERT" | "ADMIN", expertProfileId: null },
          { sharedWithId: other.userId }
        ).catch((error) => {
          logger.error("Failed to share attachment with participant", {
            attachmentId,
            sharedWithId: other.userId,
            error,
          });
        });
      }
    }
  },
};
