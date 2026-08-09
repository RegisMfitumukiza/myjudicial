import { z } from "zod";

export const listConversationsSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const getConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const archiveConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getParticipantsSchema = z.object({
  conversationId: z.string().uuid(),
});

export type ListConversationsDto = z.infer<typeof listConversationsSchema>;
export type GetConversationDto = z.infer<typeof getConversationSchema>;
export type ArchiveConversationDto = z.infer<typeof archiveConversationSchema>;
export type GetParticipantsDto = z.infer<typeof getParticipantsSchema>;
