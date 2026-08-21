"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import type { ChatMessage } from "@/lib/types";

interface ChatPanelProps {
  conversationId: string;
  initialMessages?: ChatMessage[];
  senderType: "client" | "admin";
  senderName: string;
  onClose?: () => void;
}

export default function ChatPanel({
  conversationId,
  initialMessages = [],
  senderType,
  senderName,
  onClose,
}: ChatPanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg: ChatMessage = {
            id: String(row.id),
            text: String(row.text),
            image: (row.image as string) || null,
            senderType: row.sender_type as "client" | "admin",
            senderName: (row.sender_name as string) || null,
            timestamp: String(row.created_at),
            read: Boolean(row.read),
          };
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), senderType, senderName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible");
      setText("");
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h3 className="font-semibold text-text-primary">{t("chat.conversation")}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-primary hover:underline">
            {senderType === "client" ? t("chat.newConversation") : t("chat.close")}
          </button>
        )}
      </div>
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl bg-surface/60 p-3"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.senderType === senderType
                ? "ml-auto bg-primary text-white"
                : "border border-border bg-panel text-text-primary"
            }`}
          >
            <p className="text-[10px] opacity-70">
              {m.senderName || (m.senderType === "admin" ? "Agent" : "Client")}
            </p>
            <p className="break-words">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={send}
        className="mt-2 flex shrink-0 gap-2 border-t border-border/60 bg-panel pt-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          enterKeyHint="send"
          autoComplete="off"
          className="input-field min-w-0 flex-1 px-3 py-3 text-base"
        />
        <button
          type="submit"
          disabled={sending}
          className="btn-primary shrink-0 px-4 py-3 text-sm disabled:opacity-60"
        >
          {t("chat.send")}
        </button>
      </form>
    </div>
  );
}
