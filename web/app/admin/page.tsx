"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Shipment, ChatConversation, ShipmentStatus } from "@/lib/types";
import ChatPanel from "@/components/ChatPanel";
import { STATUS_FLOW, STATUS_META } from "@/lib/shipment-status";

type ReceiptRow = {
  trackingId: string;
  receipt: string | null;
  receiptUploadedAt?: string | null;
  status: string;
  sender?: string;
  recipient?: string;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "delivered":
      return "bg-success-50 text-success";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "exception":
      return "bg-error-50 text-error";
    case "out_for_delivery":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-primary-50 text-primary";
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [tab, setTab] = useState<"shipments" | "chat" | "receipts">("shipments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [sRes, cRes, rRes] = await Promise.all([
        fetch("/api/shipments"),
        fetch("/api/chat"),
        fetch("/api/receipts"),
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      const rData = await rRes.json();
      if (!sRes.ok) throw new Error(sData.error || "Impossible de charger les envois");
      if (!cRes.ok) throw new Error(cData.error || "Impossible de charger les discussions");
      if (!rRes.ok) throw new Error(rData.error || "Impossible de charger les reçus");
      setShipments(sData.shipments || []);
      setChats(cData.chats || []);
      setReceipts(rData.receipts || []);
      if (!silent) setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const liveKey = useMemo(
    () =>
      shipments
        .filter((s) =>
          ["picked_up", "in_transit", "out_for_delivery"].includes(s.status)
        )
        .map((s) => `${s.trackingId}:${s.autoProgress?.paused ? "1" : "0"}`)
        .join("|"),
    [shipments]
  );

  useEffect(() => {
    load();
  }, []);

  // Tick live progress on the server so statuses advance without opening /track
  useEffect(() => {
    if (tab !== "shipments" || !liveKey) return;

    const activeIds = liveKey
      .split("|")
      .map((part) => part.split(":")[0])
      .filter(Boolean);

    if (activeIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      await Promise.all(
        activeIds.map((id) => fetch(`/api/shipments/${encodeURIComponent(id)}`).catch(() => null))
      );
      if (!cancelled) await load(true);
    };

    const timer = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tab, liveKey]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter((s) =>
      ["in_transit", "picked_up", "out_for_delivery"].includes(s.status)
    ).length;
    const delivered = shipments.filter((s) => s.status === "delivered").length;
    const pending = shipments.filter((s) => s.status === "pending").length;
    return { total, inTransit, delivered, pending };
  }, [shipments]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function setStatus(
    trackingId: string,
    status: string,
    opts: { force?: boolean; forceRestart?: boolean } = {}
  ) {
    setStatusBusy(trackingId);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${trackingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          force: opts.force,
          forceRestart: opts.forceRestart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mise à jour du statut impossible");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de statut");
    } finally {
      setStatusBusy(null);
    }
  }

  async function startJourney(shipment: Shipment) {
    await setStatus(shipment.trackingId, "picked_up");
  }

  async function togglePause(shipment: Shipment) {
    setStatusBusy(shipment.trackingId);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${shipment.trackingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: !shipment.autoProgress?.paused }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de modifier la pause");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de pause");
    } finally {
      setStatusBusy(null);
    }
  }

  function autoLabel(s: Shipment) {
    if (s.status === "pending") return "En attente de départ";
    if (s.status === "delivered") return "Terminé";
    if (s.status === "exception") return "Incident";
    if (s.autoProgress?.paused) return "En pause";
    if (s.autoProgress?.enabled) return "En cours";
    return "Inactif";
  }

  function isLiveJourney(s: Shipment) {
    return ["picked_up", "in_transit", "out_for_delivery"].includes(s.status);
  }

  async function generateReceipt(trackingId: string) {
    setBusyId(trackingId);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${trackingId}/receipt/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Génération du reçu impossible");
      await load();
      if (data.receipt) {
        const receipt = String(data.receipt);
        if (receipt.startsWith("data:")) {
          const link = document.createElement("a");
          link.href = receipt;
          link.download = `recu-${trackingId}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          window.open(receipt, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de reçu");
    } finally {
      setBusyId(null);
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-text-primary sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="text-sm text-text-secondary">
              Cycle de vie des envois, reçus PDF et support en direct
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/track" className="btn-secondary">
              Suivi
            </Link>
            <Link href="/create" className="btn-primary">
              Créer un envoi
            </Link>
            <button onClick={logout} className="btn-secondary">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            ["Total", stats.total, "text-primary"],
            ["En transit", stats.inTransit, "text-accent"],
            ["Livrés", stats.delivered, "text-success"],
            ["En attente", stats.pending, "text-text-secondary"],
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-2xl bg-panel p-4 shadow-soft sm:p-5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">
                {label}
              </p>
              <p className={`mt-1 text-2xl font-bold sm:text-3xl ${color}`}>{value as number}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {(
            [
              ["shipments", "Envois"],
              ["chat", `Chat (${chats.filter((c) => c.status !== "closed").length})`],
              ["receipts", `Reçus (${receipts.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 ${tab === key ? "btn-primary" : "btn-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-error-50 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {loading && <p className="mt-4 text-sm text-text-muted">Chargement…</p>}

        {tab === "shipments" && !loading && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-text-secondary">
              Création → <strong>En attente</strong>. Cliquez <strong>Démarrer</strong> : le colis
              avance tout seul jusqu’à <strong>Livré</strong>. Utilisez{" "}
              <strong>Mettre en pause</strong> pour geler le trajet, puis{" "}
              <strong>Reprendre</strong> pour continuer.
            </p>
            <div className="overflow-x-auto rounded-2xl bg-panel shadow-large">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-border bg-surface text-xs uppercase text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Suivi</th>
                    <th className="px-4 py-3">Cycle</th>
                    <th className="px-4 py-3">Trajet</th>
                    <th className="px-4 py-3">Auto</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => {
                    const busy = statusBusy === s.trackingId;
                    const currentIdx = STATUS_FLOW.indexOf(s.status as ShipmentStatus);
                    const live = isLiveJourney(s);
                    return (
                      <tr key={s.id} className="border-b border-border/60 align-top">
                        <td className="px-4 py-3">
                          <Link
                            href={`/track?id=${encodeURIComponent(s.trackingId)}&from=admin`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {s.trackingId}
                          </Link>
                          <p className="mt-1">
                            <Link
                              href={`/track?id=${encodeURIComponent(s.trackingId)}&from=admin`}
                              className="text-xs font-semibold text-accent hover:underline"
                            >
                              Voir le suivi
                            </Link>
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(s.status)}`}
                          >
                            {STATUS_META[s.status as ShipmentStatus]?.label || s.status}
                          </span>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {STATUS_FLOW.map((st, idx) => {
                              const active = s.status === st;
                              const done = currentIdx >= 0 && idx < currentIdx;
                              return (
                                <span
                                  key={st}
                                  title={STATUS_META[st].label}
                                  className={`h-2 w-8 rounded-full ${
                                    active
                                      ? "bg-primary"
                                      : done
                                        ? "bg-primary/40"
                                        : "bg-border"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {[s.sender.address?.zip, s.sender.address?.city].filter(Boolean).join(" ") || "?"}
                          {" → "}
                          {[s.recipient.address?.zip, s.recipient.address?.city].filter(Boolean).join(" ") || "?"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              s.autoProgress?.paused
                                ? "font-medium text-amber-700"
                                : live
                                  ? "font-medium text-success"
                                  : "text-text-secondary"
                            }
                          >
                            {autoLabel(s)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/track?id=${encodeURIComponent(s.trackingId)}&from=admin`}
                              className="btn-secondary px-3 py-1 text-xs"
                            >
                              Suivi
                            </Link>
                            {s.status === "pending" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => startJourney(s)}
                                className="btn-primary px-3 py-1 text-xs disabled:opacity-60"
                              >
                                {busy ? "…" : "Démarrer"}
                              </button>
                            )}
                            {live && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => togglePause(s)}
                                className="btn-secondary px-3 py-1 text-xs disabled:opacity-60"
                              >
                                {busy
                                  ? "…"
                                  : s.autoProgress?.paused
                                    ? "Reprendre"
                                    : "Mettre en pause"}
                              </button>
                            )}
                            {s.status !== "exception" && s.status !== "delivered" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStatus(s.trackingId, "exception")}
                                className="btn-secondary px-3 py-1 text-xs text-error disabled:opacity-60"
                              >
                                Incident
                              </button>
                            )}
                            {s.status === "exception" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  setStatus(s.trackingId, "in_transit", { force: true })
                                }
                                className="btn-primary px-3 py-1 text-xs disabled:opacity-60"
                              >
                                {busy ? "…" : "Reprendre le transit"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => generateReceipt(s.trackingId)}
                              disabled={busyId === s.trackingId}
                              className="btn-secondary px-3 py-1 text-xs disabled:opacity-60"
                            >
                              {busyId === s.trackingId ? "PDF…" : s.receipt ? "Régénérer PDF" : "PDF"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                        Aucun envoi pour le moment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "chat" && !loading && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl bg-panel p-3 shadow-large">
              <ul className="max-h-[40vh] space-y-2 overflow-y-auto lg:max-h-none">
                {chats.map((c) => (
                  <li key={c.id} className="rounded-xl hover:bg-surface">
                    <button
                      onClick={() => setActiveChatId(c.id)}
                      className={`w-full px-3 pt-2 text-left text-sm ${
                        activeChatId === c.id ? "text-primary" : ""
                      }`}
                    >
                      <p className="font-medium text-text-primary">{c.clientName}</p>
                      <p className="truncate text-xs text-text-muted">{c.subject || c.status}</p>
                    </button>
                    {c.trackingId && (
                      <Link
                        href={`/track?id=${encodeURIComponent(c.trackingId)}&from=admin`}
                        className="mb-2 ml-3 inline-block pb-2 text-xs font-semibold text-primary hover:underline"
                      >
                        {c.trackingId}
                      </Link>
                    )}
                  </li>
                ))}
                {chats.length === 0 && (
                  <li className="px-2 py-6 text-center text-sm text-text-muted">Aucune discussion</li>
                )}
              </ul>
            </div>
            <div className="min-h-[420px] rounded-2xl bg-panel p-4 shadow-large">
              {activeChat ? (
                <ChatPanel
                  conversationId={activeChat.id}
                  initialMessages={activeChat.messages}
                  senderType="admin"
                  senderName="Agent"
                  onClose={async () => {
                    await fetch(`/api/chat/${activeChat.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "closed" }),
                    });
                    load();
                    setActiveChatId(null);
                  }}
                />
              ) : (
                <p className="text-sm text-text-muted">Sélectionnez une conversation</p>
              )}
            </div>
          </div>
        )}

        {tab === "receipts" && !loading && (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-panel shadow-large">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="border-b border-border bg-surface text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Suivi</th>
                  <th className="px-4 py-3">Parties</th>
                  <th className="px-4 py-3">Généré le</th>
                  <th className="px-4 py-3">Fichier</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.trackingId} className="border-b border-border/60">
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/track?id=${encodeURIComponent(r.trackingId)}&from=admin`}
                        className="text-primary hover:underline"
                      >
                        {r.trackingId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {r.sender || "?"} → {r.recipient || "?"}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {r.receiptUploadedAt
                        ? new Date(r.receiptUploadedAt).toLocaleString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.receipt && !r.receipt.startsWith("data:") ? (
                        <a
                          href={r.receipt}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ouvrir le PDF
                        </a>
                      ) : r.receipt ? (
                        <a
                          href={r.receipt}
                          download={`${r.trackingId}.pdf`}
                          className="text-primary hover:underline"
                        >
                          Télécharger le PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                      Aucun reçu pour le moment. Générez-en un depuis l’onglet Envois
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
