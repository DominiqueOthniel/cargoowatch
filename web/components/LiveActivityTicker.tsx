"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const EVENTS = [
  { id: "CW8F2A", route: "Lyon → Paris", status: "En transit" },
  { id: "CW3K91", route: "Marseille → Lille", status: "Ramassé" },
  { id: "CW7B44", route: "Toulouse → Nantes", status: "En livraison" },
  { id: "CW1Q28", route: "Bordeaux → Strasbourg", status: "En transit" },
  { id: "CW9M55", route: "Nice → Rennes", status: "Livré" },
  { id: "CW2T70", route: "Montpellier → Rouen", status: "En transit" },
];

export default function LiveActivityTicker() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % EVENTS.length);
        setPulse(true);
      }, 160);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const item = EVENTS[index];

  return (
    <div className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <p
            className="truncate text-sm text-text-secondary transition-opacity duration-200"
            style={{ opacity: pulse ? 1 : 0.35 }}
          >
            <span className="font-semibold text-text-primary">{item.id}</span>
            <span className="mx-2 text-text-muted">·</span>
            {item.route}
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-medium text-primary">{item.status}</span>
          </p>
        </div>
        <Link href="/track" className="shrink-0 text-sm font-semibold text-accent hover:underline">
          {t("home.liveWatch")}
        </Link>
      </div>
    </div>
  );
}
