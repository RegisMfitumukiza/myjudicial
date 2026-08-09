import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  messageType: z.enum(["TEXT", "EMOJI", "IMAGE", "PDF", "DOCUMENT", "SYSTEM"]).default("TEXT"),
  content: z.string().max(10000).optional(),
  attachmentIds: z.array(z.string().uuid()).max(5).optional(),
  replyToId: z.string().uuid().optional(),
}).refine(data => {
  // Either content or attachments must be present
  return data.content || (data.attachmentIds && data.attachmentIds.length > 0);
}, {
  message: "Message must have content or attachments",
});

export const listMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const getMessageSchema = z.object({
  messageId: z.string().uuid(),
});

export const editMessageSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});

export const markAsReadSchema = z.object({
  conversationId: z.string().uuid(),
  lastReadMessageId: z.string().uuid(),
});

export const searchMessagesSchema = z.object({
  conversationId: z.string().uuid().optional(),
  query: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const getUnreadCountSchema = z.object({
  conversationId: z.string().uuid(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type ListMessagesDto = z.infer<typeof listMessagesSchema>;
export type GetMessageDto = z.infer<typeof getMessageSchema>;
export type EditMessageDto = z.infer<typeof editMessageSchema>;
export type DeleteMessageDto = z.infer<typeof deleteMessageSchema>;
export type MarkAsReadDto = z.infer<typeof markAsReadSchema>;
export type SearchMessagesDto = z.infer<typeof searchMessagesSchema>;
export type GetUnreadCountDto = z.infer<typeof getUnreadCountSchema>;
