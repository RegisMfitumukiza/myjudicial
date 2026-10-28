"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Check,
} from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { useChatRealtime, type ChatTypingPayload } from "@/features/chat/hooks/use-chat-realtime";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

interface InRoomChatPanelProps {
  bookingId: string;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  content: string | null;
  messageType: "TEXT" | "IMAGE" | "PDF" | "DOCUMENT";
  attachmentIds: string[];
  createdAt: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
}

export function InRoomChatPanel({
  bookingId,
  onClose,
  onUnreadChange,
}: InRoomChatPanelProps) {
  const t = useTranslations("expertDashboard_consultation-room");
  const locale = useLocale();
  const { user } = useAuth();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Fetch or resolve conversation ID for this booking
  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch<{ data: { id: string } }>(
          `/chat/conversations/by-booking/${bookingId}`
        );
        if (!cancelled && res?.data?.id) {
          setConversationId(res.data.id);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to resolve conversation for booking:", err);
          setError(err?.message || "Failed to load chat conversation");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Fetch messages once conversationId is resolved
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await apiFetch<{
        data: { messages: Message[] };
      }>(`/chat/conversations/${conversationId}/messages?limit=50`);
      if (res?.data?.messages) {
        // Backend returns newest first; reverse so oldest is at top
        const sorted = [...res.data.messages].reverse();
        setMessages(sorted);
        // Mark read
        apiFetch("/chat/messages/read", {
          method: "POST",
          body: { conversationId },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages().then(() => scrollToBottom(false));
    }
  }, [conversationId, fetchMessages, scrollToBottom]);

  // Supabase Realtime subscription
  const handleTyping = useCallback(
    (payload: ChatTypingPayload) => {
      if (payload.userId !== user?.id) {
        setOtherUserTyping(payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    },
    [user?.id]
  );

  useChatRealtime(conversationId, handleTyping);

  // Poll messages every 5s as a fallback to ensure 100% sync
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || !conversationId || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user?.id || "me",
      sender: {
        id: user?.id || "me",
        firstName: user?.firstName || "You",
        lastName: user?.lastName || "",
      },
      content: text,
      messageType: "TEXT",
      attachmentIds: [],
      createdAt: new Date().toISOString(),
      status: "PENDING",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue("");
    setIsSending(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await apiFetch<{ data: Message }>("/chat/messages", {
        method: "POST",
        body: {
          conversationId,
          content: text,
          messageType: "TEXT",
        },
      });

      // Replace optimistic message with server-confirmed message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...res.data, status: "SENT" } : m))
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m))
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Download attachment helper
  const handleDownloadAttachment = async (fileId: string, fileName?: string) => {
    try {
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `attachment-${fileId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download attachment:", err);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-950 text-white border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            {t("inRoomChatTitle", { defaultValue: "Consultation Chat" })}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          title={t("closePanel", { defaultValue: "Close panel" })}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/50">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">{t("loadingChat", { defaultValue: "Connecting to secure chat..." })}</span>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="text-xs text-white/70">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchMessages}
              className="mt-2 text-xs border-white/20 text-white hover:bg-white/10"
            >
              {t("retry", { defaultValue: "Retry" })}
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-white/40">
            <p className="text-sm font-medium text-white/60">
              {t("noMessagesYet", { defaultValue: "No messages yet" })}
            </p>
            <p className="text-xs max-w-xs leading-relaxed">
              {t("chatEncryptedNote", {
                defaultValue:
                  "Messages sent here are end-to-end encrypted and retained in your case file.",
              })}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id || msg.id.startsWith("temp-");
            const senderName = isMine
              ? t("you")
              : msg.sender
              ? `${msg.sender.firstName} ${msg.sender.lastName}`.trim()
              : t("participant");

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-white/40 mb-1 px-1">
                  {senderName} &bull;{" "}
                  {new Date(msg.createdAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm break-words ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-gray-800 text-gray-100 rounded-bl-xs border border-white/5"
                  }`}
                >
                  {msg.content}

                  {msg.attachmentIds && msg.attachmentIds.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachmentIds.map((attId) => (
                        <button
                          key={attId}
                          onClick={() => handleDownloadAttachment(attId)}
                          className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2 py-1 text-[11px] hover:bg-black/50 transition-colors"
                        >
                          <FileText size={12} className="shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {t("viewAttachment", { defaultValue: "Attachment" })}
                          </span>
                          <Download size={11} className="shrink-0 ml-1 opacity-70" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isMine && msg.status === "PENDING" && (
                  <span className="text-[9px] text-white/40 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {t("sending", { defaultValue: "Sending..." })}
                  </span>
                )}
                {isMine && msg.status === "FAILED" && (
                  <span className="text-[9px] text-red-400 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {t("failedToSend", { defaultValue: "Failed to send" })}
                  </span>
                )}
              </div>
            );
          })
        )}
        {otherUserTyping && (
          <div className="flex items-center gap-1.5 text-xs text-white/50 italic px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>{t("typingIndicator", { defaultValue: "Typing..." })}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/10 p-3 bg-gray-900/90 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t("typeMessagePlaceholder", {
            defaultValue: "Send a message...",
          })}
          disabled={!conversationId || isLoading}
          className="flex-1 rounded-xl bg-gray-800 border border-white/10 px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || !conversationId || isSending}
          size="sm"
          className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white p-0 shrink-0 disabled:opacity-40"
          title={t("sendMessage", { defaultValue: "Send" })}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}
