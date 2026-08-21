"use client";

import { useI18n } from "@/lib/i18n/context";

const AGENCIES = [
  { name: "DHL", className: "text-[#D40511] font-extrabold tracking-tight" },
  { name: "FedEx", className: "font-extrabold tracking-tight" },
  { name: "UPS", className: "text-[#351C15] font-extrabold tracking-wider" },
  { name: "USPS", className: "text-[#004B87] font-bold tracking-wide" },
  { name: "Maersk", className: "text-[#42B0D5] font-bold tracking-tight" },
  { name: "DB Schenker", className: "text-[#E4032E] font-bold" },
  { name: "DSV", className: "text-[#003366] font-extrabold tracking-widest" },
  { name: "Geodis", className: "text-[#E30613] font-bold tracking-tight" },
];

export default function AgencyLogos() {
  const { t } = useI18n();

  return (
    <section className="border-b border-border bg-panel py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          {t("home.agenciesEyebrow")}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-text-secondary">
          {t("home.agenciesSub")}
        </p>

        <div className="mt-8 grid grid-cols-2 items-center gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
          {AGENCIES.map((agency) => (
            <div
              key={agency.name}
              className="flex h-12 items-center justify-center border border-border/70 bg-panel px-2 transition hover:border-primary/25 sm:h-14 sm:px-3"
              title={agency.name}
            >
              <span
                className={`select-none truncate text-center text-[13px] sm:text-base ${agency.className}`}
              >
                {agency.name === "FedEx" ? (
                  <>
                    <span className="text-[#4D148C]">Fed</span>
                    <span className="text-[#FF6600]">Ex</span>
                  </>
                ) : (
                  agency.name
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
