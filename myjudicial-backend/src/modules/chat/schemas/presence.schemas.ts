import { z } from "zod";

export const setTypingSchema = z.object({
  conversationId: z.string().uuid(),
  isTyping: z.boolean(),
});

export const getTypingSchema = z.object({
  conversationId: z.string().uuid(),
});

export const updatePresenceSchema = z.object({
  status: z.enum(["ONLINE", "OFFLINE", "BUSY"]),
});

export const getPresenceSchema = z.object({
  userId: z.string().uuid(),
});

export type SetTypingDto = z.infer<typeof setTypingSchema>;
export type GetTypingDto = z.infer<typeof getTypingSchema>;
export type UpdatePresenceDto = z.infer<typeof updatePresenceSchema>;
export type GetPresenceDto = z.infer<typeof getPresenceSchema>;
