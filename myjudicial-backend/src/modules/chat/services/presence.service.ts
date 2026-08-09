import { redisSet, redisGet, redisDel, redisScan } from "../../../infrastructure/redis/redis.client.js";
import { ConversationRepository } from "../repositories/conversation.repository.js";
import { ParticipantRepository } from "../repositories/participant.repository.js";
import { ChatBroadcastService } from "../realtime/chat-broadcast.service.js";
import { AuthorizationError } from "../../../shared/errors/index.js";
import { logger } from "../../../shared/utils/logger.js";

const TYPING_INDICATOR_TTL = 5; // seconds
const ONLINE_PRESENCE_TTL = 60; // seconds

export const PresenceService = {
  /**
   * Set typing indicator for a user in a conversation
   */
  setTypingIndicator: async (conversationId: string, userId: string, isTyping: boolean) => {
    // Verify user is a participant
    const isParticipant = await ConversationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new AuthorizationError("You are not a participant in this conversation");
    }

    const key = `typing:${conversationId}:${userId}`;

    if (isTyping) {
      // Set with TTL - auto-expires after 5 seconds
      await redisSet(key, "1", TYPING_INDICATOR_TTL);
      logger.debug("Typing indicator set", { conversationId, userId });
    } else {
      // Remove typing indicator
      await redisDel(key);
      logger.debug("Typing indicator cleared", { conversationId, userId });
    }

    // Push the typing state instantly to anyone with the conversation open —
    // Redis stays the source of truth for the GET endpoint's initial state.
    ChatBroadcastService.broadcastToConversation(conversationId, "typing", { userId, isTyping }).catch((err) => {
      logger.error("Failed to broadcast typing indicator", { conversationId, userId, err });
    });
  },

  /**
   * Get list of users currently typing in a conversation
   */
  getTypingUsers: async (conversationId: string, requesterId: string): Promise<string[]> => {
    // Verify requester is a participant
    const isParticipant = await ConversationRepository.isParticipant(conversationId, requesterId);
    if (!isParticipant) {
      throw new AuthorizationError("You are not a participant in this conversation");
    }

    // Get all typing keys for this conversation using Redis SCAN
    const pattern = `typing:${conversationId}:*`;
    
    try {
      const keys = await redisScan(pattern);
      
      // Extract userIds from keys (format: typing:conversationId:userId)
      const typingUserIds = keys
        .map((key) => {
          const parts = key.split(":");
          return parts[2]; // userId is the 3rd part
        })
        .filter((userId) => userId && userId !== requesterId); // Exclude requester
      
      logger.debug("Typing users retrieved", { conversationId, count: typingUserIds.length });
      
      return typingUserIds;
    } catch (error) {
      logger.error("Failed to get typing users", { conversationId, error });
      return [];
    }
  },

  /**
   * Get typing users with full user details
   */
  getTypingUsersWithDetails: async (conversationId: string, requesterId: string) => {
    const userIds = await PresenceService.getTypingUsers(conversationId, requesterId);
    
    if (userIds.length === 0) {
      return [];
    }

    // Fetch user details for typing users
    const participants = await ParticipantRepository.findByConversationId(conversationId);
    
    return participants
      .filter((p) => userIds.includes(p.userId))
      .map((p) => ({
        userId: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
      }));
  },

  /**
   * Update user's online presence
   */
  updatePresence: async (userId: string, status: "ONLINE" | "OFFLINE" | "BUSY") => {
    const key = `presence:${userId}`;
    
    if (status === "OFFLINE") {
      await redisDel(key);
    } else {
      await redisSet(key, status, ONLINE_PRESENCE_TTL);
    }

    logger.debug("Presence updated", { userId, status });
  },

  /**
   * Get user's presence status
   */
  getPresence: async (userId: string): Promise<"ONLINE" | "OFFLINE" | "BUSY"> => {
    const key = `presence:${userId}`;
    const status = await redisGet(key);

    if (!status) return "OFFLINE";
    return status as "ONLINE" | "OFFLINE" | "BUSY";
  },

  /**
   * Heartbeat - keep user online
   */
  heartbeat: async (userId: string) => {
    await PresenceService.updatePresence(userId, "ONLINE");
  },

  /**
   * Clear all typing indicators for a conversation (cleanup utility)
   */
  clearTypingIndicators: async (conversationId: string) => {
    const pattern = `typing:${conversationId}:*`;
    const keys = await redisScan(pattern);
    
    if (keys.length > 0) {
      await redisDel(...keys);
      logger.debug("Typing indicators cleared", { conversationId, count: keys.length });
    }
  },
};
