"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ShipmentProgress from "@/components/ShipmentProgress";
import { useAdminSession } from "@/lib/use-admin-session";
import {
  computeProgressFraction,
  interpolatePosition,
  resolveProgressStart,
} from "@/lib/auto-progress";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { localizedEventCopy, STATUS_META } from "@/lib/shipment-status";
import { useI18n } from "@/lib/i18n/context";

const TrackMap = dynamic(() => import("@/components/TrackMap"), {
  ssr: false,
  loading: () => <TrackMapLoading />,
});

function TrackMapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-[min(58vh,420px)] items-center justify-center rounded-xl bg-surface text-sm text-text-muted sm:h-80">
      {t("track.loadingMap")}
    </div>
  );
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TrackClient() {
  const { t } = useI18n();
  const isAdmin = useAdminSession();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin" || isAdmin;
  const [trackingId, setTrackingId] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeProgress, setRouteProgress] = useState<number | null>(null);
  const [livePoint, setLivePoint] = useState<{ lat: number; lng: number; label?: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (id: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/shipments/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi introuvable");
      setShipment(data.shipment);
      if (Array.isArray(data.routeGeometry) && data.routeGeometry.length >= 2) {
        setRouteGeometry(data.routeGeometry);
      } else if (!silent) {
        setRouteGeometry(null);
      }
      if (typeof data.routeProgress === "number") {
        setRouteProgress(data.routeProgress);
      }
    } catch (err) {
      if (!silent) {
        setShipment(null);
        setError(err instanceof Error ? err.message : "Erreur");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setTrackingId(id);
      lookup(id);
    }
  }, [searchParams, lookup]);

  useEffect(() => {
    if (!shipment) return;
    if (routeGeometry && routeGeometry.length >= 2) return;

    const originLat = Number(shipment.sender?.address?.lat);
    const originLng = Number(shipment.sender?.address?.lng);
    const destLat = Number(shipment.recipient?.address?.lat);
    const destLng = Number(shipment.recipient?.address?.lng);
    if (![originLat, originLng, destLat, destLng].every((n) => Number.isFinite(n))) return;

    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({
          oLat: String(originLat),
          oLng: String(originLng),
          dLat: String(destLat),
          dLng: String(destLng),
        });
        const res = await fetch(`/api/route/driving?${qs.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (
          !cancelled &&
          Array.isArray(data.geometry) &&
          data.geometry.length >= 2
        ) {
          setRouteGeometry(data.geometry);
          setShipment((prev) =>
            prev
              ? {
                  ...prev,
                  routeGeometry: data.geometry,
                  routeDistanceMiles: data.distanceMiles ?? prev.routeDistanceMiles,
                }
              : prev
          );
        }
      } catch {
        // Keep map usable even if routing fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shipment, routeGeometry]);

  useEffect(() => {
    if (!shipment?.trackingId) return;
    if (shipment.status === "delivered") return;

    const timer = setInterval(() => lookup(shipment.trackingId, true), 3000);
    return () => clearInterval(timer);
  }, [shipment?.trackingId, shipment?.status, lookup]);

  useEffect(() => {
    if (!shipment) {
      setLivePoint(null);
      return;
    }

    const originLat = Number(shipment.sender?.address?.lat);
    const originLng = Number(shipment.sender?.address?.lng);
    const destLat = Number(shipment.recipient?.address?.lat);
    const destLng = Number(shipment.recipient?.address?.lng);
    if (![originLat, originLng, destLat, destLng].every((n) => Number.isFinite(n))) {
      setLivePoint(null);
      return;
    }

    const tick = () => {
      if (shipment.status === "pending") {
        setLivePoint({
          lat: originLat,
          lng: originLng,
          label: shipment.sender?.address?.city || "En attente de ramassage",
        });
        setRouteProgress(0.05);
        return;
      }

      if (shipment.status === "delivered") {
        setLivePoint({
          lat: destLat,
          lng: destLng,
          label: shipment.recipient?.address?.city || "Livré",
        });
        setRouteProgress(1);
        return;
      }

      const startedAt = resolveProgressStart(shipment);
      if (!startedAt) {
        setLivePoint({
          lat: originLat,
          lng: originLng,
          label: shipment.currentLocation?.city || "Origine",
        });
        return;
      }

      const distance =
        shipment.routeDistanceMiles ||
        haversineMiles(originLat, originLng, destLat, destLng);
      const progress = computeProgressFraction(
        startedAt,
        distance,
        shipment.autoProgress?.pausedDuration || 0,
        shipment.autoProgress?.paused ? shipment.autoProgress.pausedAt : null
      );
      const pos = interpolatePosition(
        progress,
        originLat,
        originLng,
        destLat,
        destLng,
        routeGeometry
      );
      setRouteProgress(progress);
      setLivePoint({
        lat: pos.lat,
        lng: pos.lng,
        label:
          progress < 0.05
            ? shipment.sender?.address?.city || "Origine"
            : progress >= 1
              ? shipment.recipient?.address?.city || "Destination"
              : "En transit",
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [shipment, routeGeometry]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await lookup(trackingId);
  }

  const origin = useMemo(() => {
    if (shipment?.sender?.address?.lat == null || shipment?.sender?.address?.lng == null) {
      return undefined;
    }
    return {
      lat: Number(shipment.sender.address.lat),
      lng: Number(shipment.sender.address.lng),
      label: shipment.sender.address.city || "Origine",
    };
  }, [shipment]);

  const destination = useMemo(() => {
    if (shipment?.recipient?.address?.lat == null || shipment?.recipient?.address?.lng == null) {
      return undefined;
    }
    return {
      lat: Number(shipment.recipient.address.lat),
      lng: Number(shipment.recipient.address.lng),
      label: shipment.recipient.address.city || "Destination",
    };
  }, [shipment]);

  const events = [...(shipment?.events || [])].reverse();
  const hasResult = Boolean(shipment);

  return (
    <div className="pb-24 sm:pb-10">
      {fromAdmin && (
        <div className="border-b border-border bg-secondary text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Admin</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-secondary">
                {t("admin.back")}
              </Link>
              <Link href="/create" className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white">
                {t("admin.create")}
              </Link>
            </div>
          </div>
        </div>
      )}
      <section
        className={`bg-gradient-to-br from-primary-50 to-secondary-50 ${
          hasResult ? "py-6 sm:py-10" : "py-12 sm:py-16"
        }`}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          {!hasResult && (
            <>
              <h1 className="mb-3 text-3xl font-bold text-text-primary sm:mb-4 sm:text-4xl lg:text-5xl">
                {t("track.title")}
              </h1>
              <p className="mb-6 text-base text-text-secondary sm:mb-8 sm:text-lg">
                {t("track.sub")}
              </p>
            </>
          )}
          {hasResult && (
            <h1 className="mb-4 text-xl font-bold text-text-primary sm:text-2xl">
              {t("track.live")}
            </h1>
          )}
          <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder={t("track.placeholder")}
              className="input-field min-w-0 flex-1 px-4 py-3 text-base sm:text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary shrink-0 px-8 py-3 text-base disabled:opacity-60 sm:text-lg"
            >
              {loading ? t("track.searching") : t("track.btn")}
            </button>
          </form>
          {error && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-red-200 bg-error-50 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>
      </section>

      {shipment && (
        <section className="mx-auto max-w-5xl space-y-4 px-3 py-6 sm:space-y-6 sm:px-6 sm:py-12">
          <div className="rounded-2xl bg-panel p-4 shadow-large sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-text-muted">{t("track.id")}</p>
                <p className="break-all text-xl font-bold text-text-primary sm:text-2xl">
                  {shipment.trackingId}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  shipment.status === "delivered"
                    ? "bg-success-50 text-success"
                    : shipment.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : shipment.status === "exception"
                        ? "bg-error-50 text-error"
                        : "bg-primary-50 text-primary"
                }`}
              >
                {shipment.status === "in_transit" || shipment.status === "out_for_delivery" ? (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                ) : null}
                {STATUS_META[shipment.status as ShipmentStatus]?.label || shipment.status}
              </span>
            </div>

            <div className="mt-5 sm:mt-6">
              <ShipmentProgress status={shipment.status} routeProgress={routeProgress} />
            </div>

            <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("track.from")}
                </p>
                <p className="font-semibold text-text-primary">{shipment.sender.name}</p>
                <p className="text-sm text-text-secondary">
                  {[
                    shipment.sender.address?.street,
                    [shipment.sender.address?.zip, shipment.sender.address?.city].filter(Boolean).join(" "),
                    shipment.sender.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("track.to")}
                </p>
                <p className="font-semibold text-text-primary">{shipment.recipient.name}</p>
                <p className="text-sm text-text-secondary">
                  {[
                    shipment.recipient.address?.street,
                    [shipment.recipient.address?.zip, shipment.recipient.address?.city]
                      .filter(Boolean)
                      .join(" "),
                    shipment.recipient.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
            {livePoint?.label && (
              <p className="mt-4 text-sm text-text-secondary">
                {t("track.current")}{" "}
                <strong className="text-text-primary">{livePoint.label}</strong>
                {shipment.autoProgress?.paused ? (
                  <span className="ml-2 text-xs font-semibold text-amber-700">● en pause</span>
                ) : shipment.status !== "pending" && shipment.status !== "delivered" ? (
                  <span className="ml-2 text-xs text-primary">● en direct</span>
                ) : null}
              </p>
            )}
            {shipment.autoProgress?.paused && shipment.status !== "delivered" && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Progression mise en pause par l’équipe. Le trajet reprendra dès la reprise.
              </p>
            )}
            {shipment.status === "pending" && (
              <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-secondary">
                Envoi enregistré. Le suivi live démarre dès que l’expédition est lancée.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-panel p-1.5 shadow-large sm:p-2">
            <TrackMap
              key={shipment.trackingId}
              origin={origin}
              destination={destination}
              current={livePoint || undefined}
              routeGeometry={routeGeometry}
              showLiveMarker={shipment.status !== "delivered" && shipment.status !== "pending"}
            />
            <div className="flex flex-wrap items-center gap-3 px-2 py-2 text-[11px] text-text-muted sm:gap-4 sm:text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {t("track.origin")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> {t("track.destination")}
              </span>
              {shipment.status !== "delivered" && shipment.status !== "pending" && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> {t("track.livePackage")}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-panel p-4 shadow-large sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary sm:mb-5">
              {t("track.timeline")}
            </h2>
            <div className="relative space-y-0">
              {events.length === 0 && (
                <p className="text-sm text-text-muted">Aucun événement pour le moment.</p>
              )}
              {events.map((ev, i) => {
                const copy = localizedEventCopy(ev);
                return (
                <div
                  key={`${ev.timestamp}-${i}`}
                  className="timeline-item relative flex gap-3 pb-5 last:pb-0 sm:gap-4 sm:pb-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {i < events.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-0.5 bg-border" />
                  )}
                  <div
                    className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${
                      i === 0 ? "step-pulse bg-primary" : "bg-success"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {copy.title}
                    </div>
                    {copy.description && (
                      <div className="break-words text-sm text-text-secondary">
                        {copy.description}
                      </div>
                    )}
                    <div className="text-xs text-text-muted">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString("fr-FR") : ""}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
