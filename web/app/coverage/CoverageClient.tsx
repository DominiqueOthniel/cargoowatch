"use client";

import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useI18n } from "@/lib/i18n/context";

export default function CoverageClient() {
  const { t } = useI18n();

  const corridors = [
    {
      region: t("coverage.americas"),
      hubs: ["Los Angeles", "New York", "São Paulo", "Mexico City"],
      focus: t("coverage.americasFocus"),
      img: "/images/brand-highway-night.webp",
    },
    {
      region: t("coverage.europe"),
      hubs: ["Paris", "Lyon", "Marseille", "Le Havre"],
      focus: t("coverage.europeFocus"),
      img: "/images/brand-warehouse.webp",
    },
    {
      region: t("coverage.apac"),
      hubs: ["Singapore", "Shanghai", "Tokyo", "Sydney"],
      focus: t("coverage.apacFocus"),
      img: "/images/brand-air-cargo.webp",
    },
    {
      region: t("coverage.ocean"),
      hubs: ["Dubai", "Lagos", "Cape Town", "Long Beach"],
      focus: t("coverage.oceanFocus"),
      img: "/images/brand-port.webp",
    },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t("coverage.eyebrow")}
        title={t("coverage.heroTitle")}
        subtitle={t("coverage.heroSub")}
        image="/images/brand-warehouse.webp"
        imageAlt="Distribution warehouse network"
        actions={
          <>
            <Link href="/track" className="btn-primary">
              {t("coverage.ctaTrack")}
            </Link>
            <Link href="/estimate" className="btn-on-dark">
              {t("coverage.ctaEstimate")}
            </Link>
          </>
        }
      />

      <section className="bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold text-text-primary">
                {t("coverage.opsTitle")}
              </h2>
              <p className="mt-3 text-text-secondary">{t("coverage.opsSub")}</p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {corridors.map((c, i) => (
              <Reveal key={c.region} delayMs={i * 70}>
                <article className="group overflow-hidden border border-border bg-panel">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={c.img}
                      alt={c.region}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <p className="absolute bottom-4 left-4 font-display text-2xl font-bold text-white">
                      {c.region}
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-sm font-semibold text-accent">{c.focus}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.hubs.map((h) => (
                        <span
                          key={h}
                          className="border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold">{t("coverage.statusTitle")}</h2>
              <p className="mt-3 text-white/70">{t("coverage.statusSub")}</p>
              <Link href="/track" className="btn-primary mt-7 inline-flex">
                {t("coverage.openTrack")}
              </Link>
            </div>
            <div className="relative min-h-[260px] overflow-hidden">
              <Image
                src="/images/brand-vehicle-carrier.webp"
                alt="Vehicle carrier on freight corridor"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
