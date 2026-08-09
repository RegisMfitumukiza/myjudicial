import type { Request, Response, NextFunction } from "express";
import { ConversationService } from "../services/conversation.service.js";
import type { ListConversationsDto } from "../schemas/conversation.schemas.js";

export const ConversationController = {
  /**
   * GET /api/v1/chat/conversations
   * List conversations for authenticated user
   */
  listConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const filters = {
        status: req.query.status as string | undefined,
        page: Math.max(1, parseInt(req.query.page as string, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)),
      };

      const result = await ConversationService.listUserConversations(userId, filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/by-booking/:bookingId
   * Resolve the conversation tied to a booking (for a "Message expert/client" deep link)
   */
  getConversationByBookingId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.bookingId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const conversation = await ConversationService.getConversationByBookingId(bookingId, userId, role);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/:conversationId
   * Get conversation details
   */
  getConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const conversation = await ConversationService.getConversationDetails(
        conversationId,
        userId,
        role
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/chat/conversations/:conversationId/archive
   * Archive a conversation
   */
  archiveConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const conversation = await ConversationService.archiveConversation(
        conversationId,
        userId,
        role
      );

      res.json({
        success: true,
        data: conversation,
        message: "Conversation archived successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/:conversationId/participants
   * List participants in a conversation
   */
  getParticipants: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const participants = await ConversationService.getParticipants(
        conversationId,
        userId,
        role
      );

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/unread-count
   * Get total unread message count across all conversations
   */
  getUnreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const count = await ConversationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  },
};
