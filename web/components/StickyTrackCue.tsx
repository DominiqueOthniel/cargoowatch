"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function StickyTrackCue() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[40] w-[min(92vw,420px)] -translate-x-1/2 sm:bottom-6">
      <div className="flex items-center justify-between gap-3 rounded-full border border-border bg-panel/95 px-3 py-2 shadow-large backdrop-blur">
        <p className="pl-2 text-xs text-text-secondary sm:text-sm">{t("home.stickyHint")}</p>
        <Link
          href="/track"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white sm:text-sm"
        >
          {t("home.stickyCta")}
        </Link>
      </div>
    </div>
  );
}
