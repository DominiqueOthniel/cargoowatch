"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import { useAdminSession } from "@/lib/use-admin-session";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const isAdmin = useAdminSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const links = useMemo(
    () => [
      { href: "/services", label: t("nav.services") },
      { href: "/coverage", label: t("nav.coverage") },
      { href: "/track", label: t("nav.track") },
      { href: "/support", label: t("nav.support") },
    ],
    [t]
  );

  function onTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackingId.trim()) {
      router.push("/track");
      setMobileOpen(false);
      return;
    }
    setMobileOpen(false);
    router.push(`/track?id=${encodeURIComponent(trackingId.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-secondary/97 text-white backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
          <Link href="/" className="relative block h-9 w-[7.5rem] shrink-0 overflow-hidden sm:h-10 sm:w-[9rem]">
            <Image
              src="/aurex-logo-light.png"
              alt="Aurex Logistics"
              fill
              sizes="144px"
              className="object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "text-sm font-semibold text-white"
                      : "text-sm font-medium text-white/65 transition hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className={`hidden rounded-md px-3 py-2 text-xs font-semibold transition sm:inline-flex sm:px-4 sm:text-sm ${
                  pathname?.startsWith("/admin")
                    ? "bg-white text-secondary"
                    : "border border-white/25 text-white hover:bg-white/10"
                }`}
              >
                {t("nav.admin")}
              </Link>
            )}
            <Link
              href="/track"
              className="hidden rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 sm:inline-flex sm:px-4 sm:text-sm"
            >
              {t("nav.trackBtn")}
            </Link>
            <button
              type="button"
              className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white xl:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 pb-4 xl:hidden">
            <nav className="flex flex-col gap-1 py-3">
              <div className="mb-2 px-3 sm:hidden">
                <LanguageSwitcher />
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10 hover:text-white"
                >
                  {t("nav.admin")}
                </Link>
              )}
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/estimate"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10 hover:text-white"
              >
                {t("nav.estimate")}
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/10 hover:text-white"
              >
                {t("nav.about")}
              </Link>
              <form onSubmit={onTrack} className="mt-3 space-y-2 px-3">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={t("nav.trackingPlaceholder")}
                  className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-3 text-base text-white placeholder:text-white/45 outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-white"
                >
                  {t("nav.trackBtn")}
                </button>
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
