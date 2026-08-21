"use client";

import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import EstimateCalculator from "@/components/EstimateCalculator";
import { useI18n } from "@/lib/i18n/context";

export default function EstimateClient() {
  const { t } = useI18n();

  const cards = [
    { title: t("estPage.card1Title"), text: t("estPage.card1Text") },
    { title: t("estPage.card2Title"), text: t("estPage.card2Text") },
    { title: t("estPage.card3Title"), text: t("estPage.card3Text") },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t("estPage.eyebrow")}
        title={t("estPage.heroTitle")}
        subtitle={t("estPage.heroSub")}
        image="/images/brand-highway-night.webp"
        imageAlt="Night highway freight truck"
        actions={
          <>
            <Link href="/support" className="btn-primary">
              {t("estPage.ctaQuote")}
            </Link>
            <Link href="/services" className="btn-on-dark">
              {t("estPage.ctaServices")}
            </Link>
          </>
        }
      />

      <section className="bg-background py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <EstimateCalculator />
          </Reveal>

          <div className="mt-12 grid gap-8 border-t border-border pt-10 md:grid-cols-3">
            {cards.map((item, i) => (
              <Reveal key={item.title} delayMs={i * 60}>
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold">{t("estPage.finalTitle")}</h2>
          <p className="mt-3 text-white/70">{t("estPage.finalSub")}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/support" className="btn-primary">
              {t("estPage.ctaSupport")}
            </Link>
            <Link href="/track" className="btn-on-dark">
              {t("estPage.ctaTrack")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
