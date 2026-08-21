"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
} from "@/lib/chat-session";
import { useI18n } from "@/lib/i18n/context";
import type { ChatConversation } from "@/lib/types";

export default function ChatBubbleWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const hideOnAdmin = pathname?.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [chat, setChat] = useState<ChatConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    if (hideOnAdmin) setOpen(false);
  }, [hideOnAdmin]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const session = loadChatSession();
      if (!session) {
        if (!cancelled) setRestoring(false);
        return;
      }

      setName(session.clientName);
      setEmail(session.clientEmail);
      if (session.subject) setSubject(session.subject);
      if (session.trackingId) setTrackingId(session.trackingId);

      try {
        const res = await fetch(`/api/chat/${session.chatId}`);
        const data = await res.json();
        if (!res.ok || !data.chat) {
          clearChatSession();
          return;
        }
        if (data.chat.status === "closed") {
          clearChatSession();
          return;
        }
        if (!cancelled) {
          setChat(data.chat);
        }
      } catch {
        // Keep form ready; user can restart
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hideOnAdmin) return null;

  async function startChat(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name,
          clientEmail: email,
          subject: subject || t("chat.defaultSubject"),
          trackingId: trackingId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("chat.startError"));
      setChat(data.chat);
      saveChatSession({
        chatId: data.chat.id,
        clientName: name,
        clientEmail: email,
        subject: subject || t("chat.defaultSubject"),
        trackingId: trackingId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.startError"));
    } finally {
      setLoading(false);
    }
  }

  function endLocalSession() {
    clearChatSession();
    setChat(null);
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-4 right-4 z-[9999] sm:bottom-5 sm:right-5">
          <button
            type="button"
            aria-label={t("chat.title")}
            onClick={() => setOpen(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-700 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition hover:scale-105 sm:h-16 sm:w-16"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {chat && (
              <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            )}
            <span className="pointer-events-none absolute -inset-1 animate-pulse-soft rounded-full bg-primary/30" />
          </button>
        </div>
      )}

      {open && (
        <div
          className="cw-chat-shell fixed inset-0 z-[9999] flex flex-col overflow-hidden border-border bg-panel shadow-large sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,85dvh)] sm:w-[min(400px,92vw)] sm:rounded-2xl sm:border"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-primary to-primary-700 px-4 py-3 text-white">
            <div>
              <p className="font-semibold">{t("chat.brandSupport")}</p>
              <p className="text-xs text-white/80">
                <a href="tel:+33644684920" className="hover:underline">
                  +33 6 44 68 49 20
                </a>
              </p>
            </div>
            <button
              type="button"
              aria-label={t("chat.close")}
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {restoring ? (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-text-muted">
                {t("chat.restoring")}
              </div>
            ) : !chat ? (
              <form
                onSubmit={startChat}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("chat.name")}
                  required
                  autoComplete="name"
                  className="input-field px-3 py-3 text-base"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("chat.email")}
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="input-field px-3 py-3 text-base"
                />
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("chat.helpPlaceholder")}
                  className="input-field px-3 py-3 text-base"
                />
                <input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={t("chat.tracking")}
                  autoCapitalize="characters"
                  className="input-field px-3 py-3 text-base"
                />
                {error && (
                  <div className="rounded-lg border border-red-200 bg-error-50 px-3 py-2 text-sm text-error">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-auto w-full py-3.5 disabled:opacity-60"
                >
                  {loading ? t("chat.starting") : t("chat.start")}
                </button>
              </form>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <ChatPanel
                  conversationId={chat.id}
                  initialMessages={chat.messages}
                  senderType="client"
                  senderName={name || chat.clientName}
                  onClose={endLocalSession}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
