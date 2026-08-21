"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function SiteFooter() {
  const { t } = useI18n();

  const footerLinks = [
    {
      title: t("footer.navigate"),
      links: [
        { href: "/", label: t("nav.home") },
        { href: "/services", label: t("nav.services") },
        { href: "/coverage", label: t("nav.coverage") },
        { href: "/track", label: t("footer.trackShipment") },
      ],
    },
    {
      title: t("footer.plan"),
      links: [
        { href: "/estimate", label: t("footer.getEstimate") },
        { href: "/services#vehicle", label: t("footer.vehicle") },
        { href: "/services#air", label: t("footer.air") },
        { href: "/support", label: t("footer.liveChat") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/about", label: t("footer.about") },
        { href: "/support", label: t("footer.contact") },
        { href: "/#faq", label: t("footer.faq") },
      ],
    },
  ];

  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center">
              <span className="relative block h-12 w-44 overflow-hidden sm:h-14 sm:w-52">
                <Image
                  src="/aurex-logo-light.png"
                  alt="Aurex Logistics"
                  fill
                  sizes="208px"
                  className="object-contain object-left"
                />
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">{t("footer.blurb")}</p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href="tel:+33644684920"
                className="inline-flex break-all text-sm font-semibold text-accent hover:underline"
              >
                +33 6 44 68 49 20
              </a>
              <a
                href="mailto:logisticsaurex@gmail.com"
                className="inline-flex break-all text-sm font-semibold text-white/75 hover:text-white hover:underline"
              >
                logisticsaurex@gmail.com
              </a>
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Aurex Logistics. {t("footer.tagline")}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-white/45">
            <span>{t("footer.modes")}</span>
            <span>{t("footer.liveTracking")}</span>
            <span>{t("footer.insured")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
