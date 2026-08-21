"use client";

import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useI18n } from "@/lib/i18n/context";

export default function AboutClient() {
  const { t } = useI18n();

  const timeline = [
    { year: "01", title: t("about.t1Title"), text: t("about.t1Text") },
    { year: "02", title: t("about.t2Title"), text: t("about.t2Text") },
    { year: "03", title: t("about.t3Title"), text: t("about.t3Text") },
    { year: "04", title: t("about.t4Title"), text: t("about.t4Text") },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={t("about.heroTitle")}
        subtitle={t("about.heroSub")}
        image="/images/brand-air-cargo.webp"
        imageAlt="Air cargo operations at dusk"
        actions={
          <>
            <Link href="/services" className="btn-primary">
              {t("about.ctaServices")}
            </Link>
            <Link href="/support" className="btn-on-dark">
              {t("about.ctaSupport")}
            </Link>
          </>
        }
      />

      <section className="bg-panel py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("about.promise")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">
                {t("about.promiseTitle")}
              </h2>
              <p className="mt-4 text-text-secondary">{t("about.promiseText")}</p>
              <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                {[t("about.bullet1"), t("about.bullet2"), t("about.bullet3")].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="relative min-h-[300px] overflow-hidden rounded-3xl sm:min-h-[380px]">
              <Image
                src="/images/brand-warehouse.webp"
                alt="Aurex Logistics warehouse operations"
                fill
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-text-primary">
              {t("about.timelineTitle")}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((item, i) => (
              <Reveal key={item.year} delayMs={i * 80}>
                <div className="border-t-2 border-primary bg-panel p-5 shadow-soft">
                  <p className="font-display text-sm font-bold text-primary">{item.year}</p>
                  <h3 className="mt-2 font-display text-xl font-bold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 text-white">
        <Image src="/images/brand-highway-night.webp" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-secondary/85" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-4xl font-extrabold">Aurex Logistics</p>
          <h2 className="mt-3 font-display text-2xl font-bold">{t("about.finalTitle")}</h2>
          <p className="mt-3 text-white/75">{t("about.finalSub")}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/track" className="btn-primary">
              {t("about.ctaTrack")}
            </Link>
            <Link href="/estimate" className="btn-on-dark">
              {t("about.ctaEstimate")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
