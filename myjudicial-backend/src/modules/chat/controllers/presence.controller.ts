import type { Request, Response, NextFunction } from "express";
import { PresenceService } from "../services/presence.service.js";
import type { SetTypingDto, UpdatePresenceDto } from "../schemas/presence.schemas.js";

export const PresenceController = {
  /**
   * POST /api/v1/chat/typing
   * Set typing indicator for a conversation
   */
  setTyping: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId, isTyping } = req.body as SetTypingDto;
      const userId = req.user!.id;

      await PresenceService.setTypingIndicator(conversationId, userId, isTyping);

      res.json({
        success: true,
        message: isTyping ? "Typing indicator set" : "Typing indicator cleared",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/conversations/:conversationId/typing
   * Get users currently typing in a conversation
   */
  getTyping: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      const userId = req.user!.id;

      const typingUsers = await PresenceService.getTypingUsersWithDetails(conversationId, userId);

      res.json({
        success: true,
        data: { typingUsers },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/chat/presence
   * Update user's online presence
   */
  updatePresence: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as UpdatePresenceDto;
      const userId = req.user!.id;

      await PresenceService.updatePresence(userId, status);

      res.json({
        success: true,
        message: "Presence updated",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/chat/presence/:userId
   * Get a user's presence status
   */
  getPresence: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;

      const status = await PresenceService.getPresence(userId);

      res.json({
        success: true,
        data: { status },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/chat/presence/heartbeat
   * Keep user online (heartbeat)
   */
  heartbeat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      await PresenceService.heartbeat(userId);

      res.json({
        success: true,
        message: "Heartbeat received",
      });
    } catch (error) {
      next(error);
    }
  },
};
