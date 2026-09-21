"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import {
  Send, Loader2, MessageSquare, ChevronUp, Paperclip, FileText, Download,
  Search, X, Reply, Pencil, Trash2, CheckCheck,
} from "lucide-react";
import {
  useGetChatConversations,
  useGetChatConversationsConversationIdMessages,
  useGetChatConversationsConversationIdUnreadCount,
  useGetChatPresenceUserId,
  usePostChatMessages,
  usePostChatMessagesRead,
  usePostChatPresence,
  usePostChatPresenceHeartbeat,
  usePostChatPresenceTyping,
  usePostFilesUpload,
  usePatchChatMessagesMessageId,
  useDeleteChatMessagesMessageId,
  useGetChatMessagesSearch,
  getChatConversationsConversationIdMessages,
  getGetChatConversationsConversationIdMessagesQueryKey,
  getGetChatConversationsQueryKey,
  getGetChatConversationsUnreadCountQueryKey,
  getGetChatConversationsConversationIdUnreadCountQueryKey,
  type ChatConversation,
  type ChatMessage,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useSearchParams } from "next/navigation";
import { apiFetchBlob } from "@/lib/api/client";
import { useChatRealtime, type ChatTypingPayload } from "../hooks/use-chat-realtime";

const PAGE_SIZE = 30;
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;

function messageTypeForMime(mimeType: string): "IMAGE" | "PDF" | "DOCUMENT" {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType === "application/pdf") return "PDF";
  return "DOCUMENT";
}

function formatTime(iso: string | null, locale: string = "en"): string {
  if (!iso) return "";
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function dedupeAndSort(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Map<string, ChatMessage>();
  for (const m of messages) seen.set(m.id, m);
  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* audio not available */ }
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1 w-1 rounded-full bg-brand-blue animate-bounce [animation-delay:0ms]" />
      <span className="h-1 w-1 rounded-full bg-brand-blue animate-bounce [animation-delay:150ms]" />
      <span className="h-1 w-1 rounded-full bg-brand-blue animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

/* ─── Conversation List Item ─── */
function ConversationListItem({
  conversation,
  isActive,
  currentUserId,
  onSelect,
  noMessagesText,
  locale,
}: {
  conversation: ChatConversation;
  isActive: boolean;
  currentUserId: string | undefined;
  onSelect: () => void;
  noMessagesText: string;
  locale: string;
}) {
  const participant = conversation.participants.find((p) => p.user.id !== currentUserId)?.user
    ?? conversation.participants[0]?.user;
  const name = participant ? `${participant.firstName} ${participant.lastName}` : "User";

  const { data: unreadData } = useGetChatConversationsConversationIdUnreadCount(conversation.id, {
    query: { refetchInterval: 15_000 },
  });
  const unreadCount = unreadData?.status === 200 ? unreadData.data.data.unreadCount : 0;

  const { data: presenceData } = useGetChatPresenceUserId(participant?.id ?? "", {
    query: { enabled: !!participant?.id, refetchInterval: 20_000 },
  });
  const isOnline = presenceData?.status === 200 && presenceData.data.data.status === "ONLINE";

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 border-b border-brand-border/10 px-4 py-3 text-left transition-colors dark:border-gray-800 ${
        isActive ? "bg-brand-blue/5 dark:bg-brand-blue/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue dark:bg-brand-blue/20">
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm text-brand-dark dark:text-gray-100 ${unreadCount > 0 ? "font-bold" : "font-semibold"}`}>
          {name}
        </p>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{conversation.lastMessageText ?? noMessagesText}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(conversation.lastMessageAt, locale)}</span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({
  message,
  isMine,
  user,
  onReply,
  onEdit,
  onDelete,
  downloadingAttachmentId,
  onDownloadAttachment,
  locale,
  tMessageDeleted,
  tEdited,
  tAttachment,
  tReply,
  tEdit,
  tDelete,
}: {
  message: ChatMessage;
  isMine: boolean;
  user: { id: string } | undefined;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  downloadingAttachmentId: string | null;
  onDownloadAttachment: (fileId: string) => void;
  locale: string;
  tMessageDeleted: string;
  tEdited: string;
  tAttachment: string;
  tReply: string;
  tEdit: string;
  tDelete: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <div className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            isMine
              ? "rounded-tr-none bg-brand-blue text-white"
              : "rounded-tl-none bg-gray-100 text-brand-dark dark:bg-gray-800 dark:text-gray-100"
          }`}
        >
          {message.isDeleted ? (
            <p className="italic opacity-60">{tMessageDeleted}</p>
          ) : (
            <>
              {message.content}
              {message.isEdited && (
                <span className={`ml-1 text-[10px] ${isMine ? "text-white/50" : "text-gray-400"}`}>{tEdited}</span>
              )}
            </>
          )}
          {message.attachmentIds && message.attachmentIds.length > 0 && (
            <div className={message.content && !message.isDeleted ? "mt-2 space-y-1" : "space-y-1"}>
              {message.attachmentIds.map((attachmentId) => (
                <button
                  key={attachmentId}
                  onClick={() => onDownloadAttachment(attachmentId)}
                  disabled={downloadingAttachmentId === attachmentId}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                    isMine
                      ? "border-white/30 text-white hover:bg-white/10"
                      : "border-gray-300 text-brand-dark hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {downloadingAttachmentId === attachmentId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <FileText size={12} />
                  )}
                  {tAttachment}
                  <Download size={11} />
                </button>
              ))}
            </div>
          )}
          <p className={`mt-1 text-[10px] ${isMine ? "text-white/60" : "text-gray-400"}`}>
            {formatTime(message.createdAt, locale)}
          </p>
        </div>

        {/* Context menu trigger */}
        {!message.isDeleted && (
          <div ref={menuRef} className="absolute -top-1 z-10">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300 ${
                isMine ? "-left-8" : "-right-8"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div
                className={`absolute top-7 z-20 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 ${
                  isMine ? "right-0" : "left-0"
                }`}
              >
                <button
                  onClick={() => { onReply(message); setShowMenu(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Reply size={14} /> {tReply}
                </button>
                {isMine && !message.isDeleted && (
                  <>
                    <button
                      onClick={() => { onEdit(message); setShowMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Pencil size={14} /> {tEdit}
                    </button>
                    <button
                      onClick={() => { onDelete(message); setShowMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={14} /> {tDelete}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */
export function MessagesPanel({ subtitle }: { subtitle: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations("features.chat");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const deepLinkConversationId = searchParams.get("conversationId");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: searchData } = useGetChatMessagesSearch(
    { query: searchQuery, limit: 20 },
    { query: { enabled: searchQuery.length >= 2 } }
  );
  const searchResults = searchData?.status === 200 ? searchData.data.data : [];

  // Reply / Edit state
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: convData, isLoading: convLoading } = useGetChatConversations(
    { limit: 50 },
    { query: { refetchInterval: 45_000 } }
  );
  const conversations = convData?.status === 200 ? convData.data.data : [];

  useEffect(() => {
    if (activeId) return;
    if (deepLinkConversationId && conversations.some((c) => c.id === deepLinkConversationId)) {
      setActiveId(deepLinkConversationId);
    } else if (conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId, deepLinkConversationId]);

  useEffect(() => {
    setOlderMessages([]);
    setNextCursor(null);
    setHasMore(false);
    lastMessageIdRef.current = null;
    setOtherIsTyping(false);
    setReplyTo(null);
    setEditingMessage(null);
    setSearchQuery("");
    setSearchOpen(false);
  }, [activeId]);

  const { data: msgData, isLoading: msgLoading } = useGetChatConversationsConversationIdMessages(
    activeId ?? "",
    { limit: PAGE_SIZE },
    { query: { enabled: !!activeId, refetchInterval: 45_000 } }
  );

  const currentPage = useMemo(() => {
    const list = msgData?.status === 200 ? msgData.data.data : [];
    return [...list].reverse();
  }, [msgData]);

  useEffect(() => {
    if (msgData?.status === 200 && olderMessages.length === 0) {
      setNextCursor(msgData.data.nextCursor);
      setHasMore(msgData.data.hasMore);
    }
  }, [msgData, olderMessages.length]);

  const messages = useMemo(
    () => dedupeAndSort([...olderMessages, ...currentPage]),
    [olderMessages, currentPage]
  );

  const { mutate: sendMessage, isPending: isSending } = usePostChatMessages();
  const { mutate: markAsRead } = usePostChatMessagesRead();
  const { mutate: updatePresence } = usePostChatPresence();
  const { mutate: heartbeat } = usePostChatPresenceHeartbeat();
  const { mutate: setTyping } = usePostChatPresenceTyping();
  const { mutateAsync: uploadFile, isPending: isUploadingAttachment } = usePostFilesUpload();
  const { mutate: editMessage } = usePatchChatMessagesMessageId();
  const { mutate: deleteMessage } = useDeleteChatMessagesMessageId();
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const activeConversation = conversations.find((c) => c.id === activeId);
  const otherParticipant = activeConversation?.participants.find((p) => p.user.id !== user?.id)?.user
    ?? activeConversation?.participants[0]?.user;

  // Presence + heartbeat
  useEffect(() => {
    updatePresence({ data: { status: "ONLINE" } });
    const interval = setInterval(() => heartbeat(), 45_000);
    return () => {
      clearInterval(interval);
      updatePresence({ data: { status: "OFFLINE" } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online status for header
  const { data: headerPresence } = useGetChatPresenceUserId(otherParticipant?.id ?? "", {
    query: { enabled: !!otherParticipant?.id, refetchInterval: 20_000 },
  });
  const headerIsOnline = headerPresence?.status === 200 && headerPresence.data.data.status === "ONLINE";

  const handleRealtimeTyping = useCallback(
    (payload: ChatTypingPayload) => {
      if (payload.userId === user?.id) return;
      if (typingClearTimeoutRef.current) clearTimeout(typingClearTimeoutRef.current);
      setOtherIsTyping(payload.isTyping);
      if (payload.isTyping) {
        typingClearTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 5_000);
      }
    },
    [user?.id]
  );
  useChatRealtime(activeId, handleRealtimeTyping);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!activeId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTyping({ data: { conversationId: activeId, isTyping: true } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTyping({ data: { conversationId: activeId, isTyping: false } });
    }, 3_000);
  }

  async function loadOlderMessages() {
    if (!activeId || !nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const result = await getChatConversationsConversationIdMessages(activeId, {
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      if (result.status === 200) {
        setOlderMessages((prev) => [...[...result.data.data].reverse(), ...prev]);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
      }
    } catch {
      toast.error(t("loadMessagesFailed"));
    } finally {
      setIsLoadingOlder(false);
    }
  }

  // Sound + browser notification on new incoming message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sender.id === user?.id) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    if (prevMessageCountRef.current > 0 && messages.length > prevMessageCountRef.current) {
      // New incoming message
      if (document.hidden) {
        playNotificationSound();
        if (Notification.permission === "granted") {
          const senderName = otherParticipant
            ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
            : "Someone";
          new Notification(`${senderName}`, {
            body: last.content || "Sent an attachment",
            icon: "/favicon.ico",
          });
        }
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, user?.id, otherParticipant]);

  // Auto mark-as-read
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!activeId || !last || last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    markAsRead(
      { data: { conversationId: activeId, lastReadMessageId: last.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatConversationsUnreadCountQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetChatConversationsConversationIdUnreadCountQueryKey(activeId) });
        },
      }
    );
  }, [messages, activeId, markAsRead, queryClient]);

  function invalidateAfterSend(conversationId: string) {
    queryClient.invalidateQueries({ queryKey: getGetChatConversationsConversationIdMessagesQueryKey(conversationId, { limit: PAGE_SIZE }) });
    queryClient.invalidateQueries({ queryKey: getGetChatConversationsQueryKey({ limit: 50 }) });
  }

  function handleSend() {
    if (!activeId) return;
    const content = editingMessage ? editContent.trim() : draft.trim();
    if (content.length === 0 && !editingMessage) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    setTyping({ data: { conversationId: activeId, isTyping: false } });

    if (editingMessage) {
      editMessage(
        { messageId: editingMessage.id, data: { content } },
        {
          onSuccess: () => {
            setEditingMessage(null);
            setEditContent("");
            invalidateAfterSend(activeId);
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : t("editFailed")),
        }
      );
      return;
    }

    sendMessage(
      {
        data: {
          conversationId: activeId,
          content,
          ...(replyTo ? { replyToId: replyTo.id } : {}),
        },
      },
      {
        onSuccess: () => {
          setDraft("");
          setReplyTo(null);
          invalidateAfterSend(activeId);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("sendFailed"));
        },
      }
    );
  }

  function handleEditMessage(msg: ChatMessage) {
    setEditingMessage(msg);
    setEditContent(msg.content || "");
    setReplyTo(null);
  }

  function handleDeleteMessage(msg: ChatMessage) {
    if (!activeId) return;
    deleteMessage(
      { messageId: msg.id },
      {
        onSuccess: () => invalidateAfterSend(activeId),
        onError: (error) => toast.error(error instanceof Error ? error.message : t("deleteFailed")),
      }
    );
  }

  async function handleAttachmentSelected(file: File) {
    if (!activeId) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(t("fileTooLarge"));
      return;
    }
    try {
      const metadata = JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        category: "chat-attachment",
        sensitivity: "PRIVATE",
      });
      const uploadResult = await uploadFile({ data: { file, metadata } });
      if (uploadResult.status !== 201) {
        toast.error(t("uploadFailed"));
        return;
      }
      const fileId = uploadResult.data.data.id;
      sendMessage(
        {
          data: {
            conversationId: activeId,
            messageType: messageTypeForMime(file.type || "application/octet-stream"),
            attachmentIds: [fileId],
          },
        },
        {
          onSuccess: () => invalidateAfterSend(activeId),
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : t("sendAttachmentFailed"));
          },
        }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("uploadFailed"));
    }
  }

  async function handleDownloadAttachment(fileId: string) {
    try {
      setDownloadingAttachmentId(fileId);
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      if (blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `attachment-${fileId.substring(0, 6)}`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("downloadFailed"));
    } finally {
      setDownloadingAttachmentId(null);
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-brand-border/20 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto border-r border-brand-border/10 dark:border-gray-800">
          {convLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">{t("noConversations")}</p>
          ) : (
            conversations.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                isActive={activeId === c.id}
                currentUserId={user?.id}
                onSelect={() => setActiveId(c.id)}
                noMessagesText={t("noMessagesPreview")}
                locale={locale}
              />
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageSquare size={28} className="mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t("selectConversation")}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-brand-border/10 px-4 py-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
                    {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : "User"}
                  </p>
                  {headerIsOnline && (
                    <span className="h-2 w-2 rounded-full bg-green-500" title={t("online")} />
                  )}
                </div>
                {otherIsTyping && (
                  <p className="mt-0.5 text-xs italic text-brand-blue flex items-center gap-1">
                    {t("typing")} <TypingDots />
                  </p>
                )}
              </div>

              {/* Search bar */}
              {searchOpen && (
                <div className="flex items-center gap-2 border-b border-brand-border/10 px-4 py-2 dark:border-gray-800">
                  <Search size={14} className="shrink-0 text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchInConversation")}
                    className="flex-1 bg-transparent text-sm text-brand-dark outline-none dark:text-gray-100"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); }} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              )}
              {searchOpen && searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border-b border-brand-border/10 dark:border-gray-800">
                  {searchResults.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-brand-dark dark:text-gray-100">
                          {msg.sender.firstName} {msg.sender.lastName}
                        </p>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatTime(msg.createdAt, locale)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {msgLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-2/3 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t("noMessages")}</p>
                ) : (
                  <div className="space-y-3">
                    {hasMore && (
                      <div className="flex justify-center pb-2">
                        <button
                          onClick={loadOlderMessages}
                          disabled={isLoadingOlder}
                          className="flex items-center gap-1 rounded-full border border-brand-border/30 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          {isLoadingOlder ? <Loader2 size={12} className="animate-spin" /> : <ChevronUp size={12} />}
                          {t("loadOlderMessages")}
                        </button>
                      </div>
                    )}
                    {messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        isMine={m.sender.id === user?.id}
                        user={user ?? undefined}
                        onReply={(msg) => { setReplyTo(msg); setEditingMessage(null); }}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        downloadingAttachmentId={downloadingAttachmentId}
                        onDownloadAttachment={handleDownloadAttachment}
                        locale={locale}
                        tMessageDeleted={t("messageDeleted")}
                        tEdited={t("edited")}
                        tAttachment={t("attachment")}
                        tReply={t("reply")}
                        tEdit={t("edit")}
                        tDelete={t("delete")}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Reply / Edit preview */}
              {(replyTo || editingMessage) && (
                <div className="flex items-center gap-2 border-t border-brand-border/10 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-brand-blue">
                      {editingMessage ? t("editingMessage") : t("replyingTo", { name: replyTo?.sender.firstName ?? "" })}
                    </p>
                    <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">
                      {editingMessage ? editContent : replyTo?.content}
                    </p>
                  </div>
                  <button
                    onClick={() => { setReplyTo(null); setEditingMessage(null); setEditContent(""); }}
                    className="shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2 border-t border-brand-border/10 p-3 dark:border-gray-800">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleAttachmentSelected(file);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  aria-label={t("attachFile")}
                >
                  {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    searchOpen
                      ? "bg-brand-blue/10 text-brand-blue"
                      : "text-gray-400 hover:bg-gray-100 hover:text-brand-dark dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`}
                  aria-label={t("searchMessages")}
                >
                  <Search size={16} />
                </button>
                {editingMessage ? (
                  <input
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === "Escape") { setEditingMessage(null); setEditContent(""); } }}
                    placeholder={t("editMessage")}
                    className="flex-1 rounded-full border border-brand-blue/30 px-4 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-brand-blue/50 dark:bg-gray-800 dark:text-gray-100"
                  />
                ) : (
                  <input
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={t("typeMessage")}
                    className="flex-1 rounded-full border border-brand-border/30 px-4 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                )}
                <button
                  onClick={handleSend}
                  disabled={isSending || (editingMessage ? editContent.trim().length === 0 : draft.trim().length === 0)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-40"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : editingMessage ? <CheckCheck size={16} /> : <Send size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
