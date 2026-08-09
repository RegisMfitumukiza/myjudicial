import type { Request, Response, NextFunction } from "express";
import { ConversationService } from "../services/conversation.service.js";
import { AuthorizationError } from "../../../shared/errors/index.js";

/**
 * Middleware to verify user has access to a conversation
 * Must be used after authenticate middleware
 */
export const requireConversationAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required"));
    }

    // Get conversation ID from params or body
    const conversationId = req.params.conversationId || req.body.conversationId;

    if (!conversationId) {
      return next(new AuthorizationError("Conversation ID required"));
    }

    // Check access
    const hasAccess = await ConversationService.canAccess(
      conversationId,
      req.user.id,
      req.user.role
    );

    if (!hasAccess) {
      return next(new AuthorizationError("Access denied to this conversation"));
    }

    next();
  } catch (error) {
    next(error);
  }
};
