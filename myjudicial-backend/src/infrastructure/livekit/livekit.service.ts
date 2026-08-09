import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { logger } from "../../shared/utils/logger.js";
import { ValidationError } from "../../shared/errors/index.js";

const getLiveKitConfig = () => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = process.env.LIVEKIT_HOST;

  if (!apiKey || !apiSecret || !host) {
    throw new ValidationError(
      "LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_HOST in environment variables."
    );
  }

  return { apiKey, apiSecret, host };
};

export const LiveKitService = {
  createRoom: async (bookingId: string, durationMin: number): Promise<string> => {
    const { apiKey, apiSecret, host } = getLiveKitConfig();
    const roomClient = new RoomServiceClient(host, apiKey, apiSecret);

    const roomName = `consultation_${bookingId}`;

    const room = await roomClient.createRoom({
      name: roomName,
      emptyTimeout: 5 * 60,       // 5 minutes — auto-close if nobody joins
      departureTimeout: 60,        // 1 minute grace after last participant leaves
      maxParticipants: 2,          // citizen + expert only
      metadata: JSON.stringify({ bookingId, maxDuration: durationMin * 60 }),
    });

    logger.info("LiveKit room created", { bookingId, roomName, roomId: room.sid });
    return room.sid;
  },

  /**
   * Generate an access token for a participant to join a consultation room.
   * @param bookingId - used to derive the room name
   * @param userId - the user joining (citizen or expert)
   * @param displayName - the display name shown to the other participant
   * @param isExpert - whether this participant is the expert
   */
  generateToken: async (
    bookingId: string,
    userId: string,
    displayName: string,
    isExpert: boolean
  ): Promise<string> => {
    const { apiKey, apiSecret } = getLiveKitConfig();
    const roomName = `consultation_${bookingId}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName,
      ttl: "4h", // Tokens expire 4 hours from issuance
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // Experts can mute participants; citizens cannot
      canPublishSources: undefined,
      hidden: false,
      recorder: false,
      roomAdmin: isExpert,
    });

    const jwt = await token.toJwt();

    logger.info("LiveKit token generated", {
      bookingId,
      userId,
      roomName,
      isExpert,
    });

    return jwt;
  },

  /**
   * Force-close a consultation room (e.g., after session timeout or admin action).
   */
  closeRoom: async (bookingId: string): Promise<void> => {
    const { apiKey, apiSecret, host } = getLiveKitConfig();
    const roomClient = new RoomServiceClient(host, apiKey, apiSecret);
    const roomName = `consultation_${bookingId}`;

    try {
      await roomClient.deleteRoom(roomName);
      logger.info("LiveKit room closed", { bookingId, roomName });
    } catch (error: any) {
      // Room may not exist — treat as idempotent
      if (!error?.message?.includes("not found")) {
        throw error;
      }
      logger.warn("Attempted to close non-existent LiveKit room", { roomName });
    }
  },
};
