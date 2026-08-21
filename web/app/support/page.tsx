"use client";

import { FormEvent, useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
} from "@/lib/chat-session";
import { useI18n } from "@/lib/i18n/context";
import type { ChatConversation } from "@/lib/types";

export default function SupportPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [chat, setChat] = useState<ChatConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

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
        if (!res.ok || !data.chat || data.chat.status === "closed") {
          clearChatSession();
          return;
        }
        if (!cancelled) setChat(data.chat);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

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
          subject,
          trackingId: trackingId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("support.startError"));
      setChat(data.chat);
      saveChatSession({
        chatId: data.chat.id,
        clientName: name,
        clientEmail: email,
        subject: subject || t("support.defaultSubject"),
        trackingId: trackingId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("support.startError"));
    } finally {
      setLoading(false);
    }
  }

  function endLocalSession() {
    clearChatSession();
    setChat(null);
  }

  const faqs = [
    { q: t("support.q1"), a: t("support.a1") },
    { q: t("support.q2"), a: t("support.a2") },
    { q: t("support.q3"), a: t("support.a3") },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-bold text-text-primary lg:text-5xl">
            {t("support.heroTitle1")}{" "}
            <span className="text-gradient-primary">{t("support.heroTitle2")}</span>{" "}
            {t("support.heroTitle3")}
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-text-secondary">{t("support.heroSub")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+33644684920" className="btn-primary">
              +33 6 44 68 49 20
            </a>
            <a href="#contact" className="btn-secondary">
              {t("support.contactBtn")}
            </a>
            <a href="#faq" className="btn-ghost">
              {t("support.faqBtn")}
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-panel py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-text-primary">
            {t("support.faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="card p-5">
                <h3 className="font-semibold text-text-primary">{item.q}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-2 text-center text-3xl font-bold text-text-primary">
            {t("support.chatTitle")}
          </h2>
          <p className="mb-8 text-center text-text-secondary">
            {t("support.chatSub1")}{" "}
            <a href="tel:+33644684920" className="font-semibold text-primary hover:underline">
              +33 6 44 68 49 20
            </a>{" "}
            {t("support.chatSub2")}
          </p>

          {restoring ? (
            <div className="card p-8 text-center text-sm text-text-muted">{t("support.restoring")}</div>
          ) : !chat ? (
            <form onSubmit={startChat} className="card space-y-4 p-6 sm:p-8">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("support.name")}
                required
                className="input-field px-4 py-3"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("support.email")}
                required
                className="input-field px-4 py-3"
              />
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("support.subject")}
                className="input-field px-4 py-3"
              />
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder={t("support.trackingOptional")}
                className="input-field px-4 py-3"
              />
              {error && (
                <div className="rounded-lg border border-red-200 bg-error-50 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? t("support.opening") : t("support.startChat")}
              </button>
            </form>
          ) : (
            <div className="card min-h-[480px] p-4 sm:p-6">
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
      </section>
    </div>
  );
}
