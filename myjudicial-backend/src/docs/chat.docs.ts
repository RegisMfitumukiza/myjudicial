/**
 * Chat module OpenAPI documentation.
 * Uses zod-to-openapi to generate schemas from Zod definitions.
 * registry.ts must be imported first — it calls extendZodWithOpenApi(z).
 */
import { z, registry } from "./registry.js";

const uuidField = z.string().uuid().describe("UUID identifier");

const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    message: z.string(),
    errors: z.array(z.string()).optional(),
  })
  .openapi("ChatErrorResponse");

const errResponses = {
  400: { description: "Validation error", content: { "application/json": { schema: ErrorResponseSchema } } },
  401: { description: "Authentication failed", content: { "application/json": { schema: ErrorResponseSchema } } },
  403: { description: "Access denied", content: { "application/json": { schema: ErrorResponseSchema } } },
  404: { description: "Not found", content: { "application/json": { schema: ErrorResponseSchema } } },
};

const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string().optional(), data: dataSchema });

const ParticipantUserSchema = z
  .object({
    id: uuidField,
    firstName: z.string(),
    lastName: z.string(),
    avatarObjectKey: z.string().nullable(),
  })
  .openapi("ChatParticipantUser");

const ConversationParticipantSchema = z
  .object({
    id: uuidField,
    userId: uuidField,
    role: z.enum(["MEMBER", "MODERATOR", "ADMIN"]),
    lastReadAt: z.string().datetime().nullable(),
    isActive: z.boolean(),
    user: ParticipantUserSchema,
  })
  .openapi("ChatConversationParticipant");

const ConversationSchema = z
  .object({
    id: uuidField,
    bookingId: uuidField,
    type: z.enum(["CONSULTATION", "SUPPORT", "GROUP", "SYSTEM"]),
    status: z.enum(["ACTIVE", "ARCHIVED", "CLOSED"]),
    lastMessageAt: z.string().datetime().nullable(),
    lastMessageText: z.string().nullable(),
    isArchived: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    participants: z.array(ConversationParticipantSchema),
  })
  .openapi("ChatConversation");

const MessageSenderSchema = z
  .object({
    id: uuidField,
    firstName: z.string(),
    lastName: z.string(),
    avatarObjectKey: z.string().nullable(),
  })
  .openapi("ChatMessageSender");

const MessageSchema = z
  .object({
    id: uuidField,
    conversationId: uuidField,
    senderId: uuidField,
    messageType: z.enum(["TEXT", "EMOJI", "IMAGE", "PDF", "DOCUMENT", "SYSTEM"]),
    content: z.string().nullable(),
    attachmentIds: z.array(uuidField),
    status: z.enum(["SENDING", "SENT", "DELIVERED", "READ", "FAILED"]),
    isEdited: z.boolean(),
    isDeleted: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    sender: MessageSenderSchema,
  })
  .openapi("ChatMessage");

const SendMessageDtoSchema = z
  .object({
    conversationId: uuidField,
    messageType: z.enum(["TEXT", "EMOJI", "IMAGE", "PDF", "DOCUMENT", "SYSTEM"]).default("TEXT"),
    content: z.string().max(10000).optional(),
    attachmentIds: z.array(uuidField).max(5).optional(),
    replyToId: uuidField.optional(),
  })
  .openapi("SendMessageDto");

const EditMessageDtoSchema = z
  .object({
    content: z.string().min(1).max(10000),
  })
  .openapi("EditMessageDto");

const MarkAsReadDtoSchema = z
  .object({
    conversationId: uuidField,
    lastReadMessageId: uuidField,
  })
  .openapi("MarkAsReadDto");

const SetTypingDtoSchema = z
  .object({
    conversationId: uuidField,
    isTyping: z.boolean(),
  })
  .openapi("SetTypingDto");

const UpdatePresenceDtoSchema = z
  .object({
    status: z.enum(["ONLINE", "OFFLINE", "BUSY"]),
  })
  .openapi("UpdateChatPresenceDto");

const TypingUserSchema = z
  .object({
    userId: uuidField,
    firstName: z.string(),
    lastName: z.string(),
  })
  .openapi("ChatTypingUser");

registry.register("ChatConversation", ConversationSchema);
registry.register("ChatMessage", MessageSchema);
registry.register("SendMessageDto", SendMessageDtoSchema);
registry.register("EditMessageDto", EditMessageDtoSchema);
registry.register("MarkAsReadDto", MarkAsReadDtoSchema);
registry.register("SetTypingDto", SetTypingDtoSchema);
registry.register("UpdateChatPresenceDto", UpdatePresenceDtoSchema);
registry.register("ChatTypingUser", TypingUserSchema);

registry.registerPath({
  method: "get",
  path: "/chat/conversations",
  tags: ["Chat"],
  summary: "List my conversations",
  description: "Returns conversations the authenticated user participates in, most recently active first.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(["ACTIVE", "ARCHIVED", "CLOSED"]).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: {
      description: "Conversations retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(ConversationSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/conversations/unread-count",
  tags: ["Chat"],
  summary: "Get total unread message count",
  description: "Returns the total number of unread messages across all of the authenticated user's conversations.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Unread count retrieved",
      content: {
        "application/json": {
          schema: success(z.object({ unreadCount: z.number() })),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/conversations/{conversationId}/messages",
  tags: ["Chat"],
  summary: "List messages in a conversation",
  description: "Cursor-paginated message history for a conversation. Only participants may access it.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ conversationId: uuidField }),
    query: z.object({
      cursor: uuidField.optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: {
      description: "Messages retrieved",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(MessageSchema),
            nextCursor: uuidField.nullable(),
            hasMore: z.boolean(),
          }),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/chat/messages",
  tags: ["Chat"],
  summary: "Send a message",
  description: "Sends a text message or attachment into a conversation. Rate-limited to 30 messages/minute.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: SendMessageDtoSchema } },
    },
  },
  responses: {
    201: {
      description: "Message sent",
      content: { "application/json": { schema: success(MessageSchema) } },
    },
    429: { description: "Too many messages sent", content: { "application/json": { schema: ErrorResponseSchema } } },
    ...errResponses,
  },
});

/* ══════════════════════════════════════════
   CONVERSATIONS (previously undocumented)
══════════════════════════════════════════ */

registry.registerPath({
  method: "get",
  path: "/chat/conversations/by-booking/{bookingId}",
  tags: ["Chat"],
  summary: "Resolve the conversation tied to a booking",
  description: "Used for a 'Message expert/client' deep link from the booking UI. Only the booking's citizen/expert (or an ADMIN) may resolve it. 404 if the booking has no conversation yet.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ bookingId: uuidField }) },
  responses: {
    200: {
      description: "Conversation retrieved",
      content: { "application/json": { schema: success(ConversationSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/conversations/{conversationId}",
  tags: ["Chat"],
  summary: "Get conversation details",
  description: "Returns full details for a single conversation. Only participants (or an ADMIN) may access it.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ conversationId: uuidField }) },
  responses: {
    200: {
      description: "Conversation retrieved",
      content: { "application/json": { schema: success(ConversationSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/chat/conversations/{conversationId}/archive",
  tags: ["Chat"],
  summary: "Archive a conversation",
  description: "Marks a conversation as archived for the requester. Only participants (or an ADMIN) may archive it.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ conversationId: uuidField }) },
  responses: {
    200: {
      description: "Conversation archived",
      content: { "application/json": { schema: success(ConversationSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/conversations/{conversationId}/participants",
  tags: ["Chat"],
  summary: "List conversation participants",
  description: "Returns every participant (active or not) in a conversation. Only participants (or an ADMIN) may access it.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ conversationId: uuidField }) },
  responses: {
    200: {
      description: "Participants retrieved",
      content: { "application/json": { schema: success(z.array(ConversationParticipantSchema)) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/conversations/{conversationId}/unread-count",
  tags: ["Chat"],
  summary: "Get unread message count for a conversation",
  description: "Returns the number of unread messages in a single conversation for the authenticated user.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ conversationId: uuidField }) },
  responses: {
    200: {
      description: "Unread count retrieved",
      content: { "application/json": { schema: success(z.object({ unreadCount: z.number() })) } },
    },
    ...errResponses,
  },
});

/* ══════════════════════════════════════════
   MESSAGES (previously undocumented)
══════════════════════════════════════════ */

registry.registerPath({
  method: "get",
  path: "/chat/messages/search",
  tags: ["Chat"],
  summary: "Search messages",
  description: "Full-text substring search across the authenticated user's messages, optionally scoped to one conversation.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      conversationId: uuidField.optional(),
      query: z.string().min(1).max(200),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  },
  responses: {
    200: {
      description: "Matching messages retrieved",
      content: { "application/json": { schema: success(z.array(MessageSchema)) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/chat/messages/read",
  tags: ["Chat"],
  summary: "Mark messages as read",
  description: "Advances the authenticated user's read cursor in a conversation up to the given message.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { "application/json": { schema: MarkAsReadDtoSchema } } },
  },
  responses: {
    200: {
      description: "Messages marked as read",
      content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/messages/{messageId}",
  tags: ["Chat"],
  summary: "Get a single message",
  description: "Returns one message by ID.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ messageId: uuidField }) },
  responses: {
    200: {
      description: "Message retrieved",
      content: { "application/json": { schema: success(MessageSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/chat/messages/{messageId}",
  tags: ["Chat"],
  summary: "Edit a message",
  description: "Edits a message's content. Sender-only, within a 7-day edit window.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ messageId: uuidField }),
    body: { required: true, content: { "application/json": { schema: EditMessageDtoSchema } } },
  },
  responses: {
    200: {
      description: "Message edited",
      content: { "application/json": { schema: success(MessageSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: "/chat/messages/{messageId}",
  tags: ["Chat"],
  summary: "Delete a message",
  description: "Soft-deletes a message. Sender or ADMIN only, within a 7-day window.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ messageId: uuidField }) },
  responses: {
    200: {
      description: "Message deleted",
      content: { "application/json": { schema: success(MessageSchema) } },
    },
    ...errResponses,
  },
});

/* ══════════════════════════════════════════
   PRESENCE / TYPING (previously undocumented)
══════════════════════════════════════════ */

registry.registerPath({
  method: "post",
  path: "/chat/presence/typing",
  tags: ["Chat"],
  summary: "Set typing indicator",
  description: "Sets or clears the authenticated user's typing indicator in a conversation. Auto-expires after 5 seconds.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { "application/json": { schema: SetTypingDtoSchema } } },
  },
  responses: {
    200: {
      description: "Typing indicator updated",
      content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/presence/typing/{conversationId}",
  tags: ["Chat"],
  summary: "Get who is typing",
  description: "Returns the other participants currently typing in a conversation (excludes the requester).",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ conversationId: uuidField }) },
  responses: {
    200: {
      description: "Typing users retrieved",
      content: {
        "application/json": {
          schema: success(z.object({ typingUsers: z.array(TypingUserSchema) })),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/chat/presence",
  tags: ["Chat"],
  summary: "Update online presence",
  description: "Sets the authenticated user's chat presence status. ONLINE/BUSY expire after 60 seconds without a heartbeat.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { "application/json": { schema: UpdatePresenceDtoSchema } } },
  },
  responses: {
    200: {
      description: "Presence updated",
      content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/chat/presence/heartbeat",
  tags: ["Chat"],
  summary: "Send a presence heartbeat",
  description: "Refreshes the authenticated user's ONLINE presence TTL. Call periodically while the chat UI is open.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Heartbeat received",
      content: { "application/json": { schema: z.object({ success: z.literal(true), message: z.string() }) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/chat/presence/{userId}",
  tags: ["Chat"],
  summary: "Get a user's presence status",
  description: "Returns ONLINE, BUSY, or OFFLINE (default) for the given user.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ userId: uuidField }) },
  responses: {
    200: {
      description: "Presence retrieved",
      content: {
        "application/json": {
          schema: success(z.object({ status: z.enum(["ONLINE", "OFFLINE", "BUSY"]) })),
        },
      },
    },
    ...errResponses,
  },
});
