import type { Request, Response, NextFunction } from "express";
import { MessageService } from "../services/message.service.js";
import type {
  SendMessageDto,
  ListMessagesDto,
  EditMessageDto,
  MarkAsReadDto,
  SearchMessagesDto,
} from "../schemas/message.schemas.js";

export const MessageController = {
  /**
   * POST /api/v1/chat/messages
   * Send a message in a conversation
   */
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as SendMessageDto;
      const userId = req.user!.id;
      const role = req.user!.role;

      const message = await MessageService.sendMessage({
        conversationId: data.conversationId,
        senderId: userId,
        senderRole: role,
        messageType: data.messageType,
        content: data.content,
        attachmentIds: data.attachmentIds,
        replyToId: data.replyToId,
      });

      res.status(201).json({
        success: true,
        data: message,
        message: "Message sent successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/:conversationId/messages
   * List messages in a conversation with cursor pagination
   */
  listMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;
      const role = req.user!.role;
      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
      const cursor = req.query.cursor as string | undefined;

      const result = await MessageService.listMessages(
        conversationId,
        userId,
        role,
        {
          cursor,
          limit,
        }
      );

      res.json({
        success: true,
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/messages/:messageId
   * Get a single message
   */
  getMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;

      const message = await MessageService.searchMessages(req.user!.id, {
        query: messageId,
        limit: 1,
      });

      if (message.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Message not found",
        });
      }

      res.json({
        success: true,
        data: message[0],
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/chat/messages/:messageId
   * Edit a message (within 7-day window)
   */
  editMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const { content } = req.body as Omit<EditMessageDto, "messageId">;
      const userId = req.user!.id;

      const message = await MessageService.editMessage(messageId, userId, content);

      res.json({
        success: true,
        data: message,
        message: "Message edited successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/chat/messages/:messageId
   * Delete a message (soft delete, within 7-day window)
   */
  deleteMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = req.params.messageId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const message = await MessageService.deleteMessage(messageId, userId, role);

      res.json({
        success: true,
        data: message,
        message: "Message deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/chat/messages/read
   * Mark messages as read
   */
  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId, lastReadMessageId } = req.body as MarkAsReadDto;
      const userId = req.user!.id;

      await MessageService.markAsRead(conversationId, userId, lastReadMessageId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/messages/search
   * Search messages by keyword
   */
  searchMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const rawLimit = parseInt(req.query.limit as string, 10);
      const filters = {
        conversationId: req.query.conversationId as string | undefined,
        query: req.query.query as string,
        limit: Math.min(50, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit)),
      };
      const messages = await MessageService.searchMessages(userId, filters);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/:conversationId/unread-count
   * Get unread message count for a conversation
   */
  getUnreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;

      const count = await MessageService.getUnreadCount(conversationId, userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  },
};
