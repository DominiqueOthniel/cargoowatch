"use client";

import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useI18n } from "@/lib/i18n/context";

export default function ServicesClient() {
  const { t } = useI18n();

  const services = [
    {
      slug: "road",
      title: t("services.roadTitle"),
      lead: t("services.roadLead"),
      points: [t("services.roadP1"), t("services.roadP2"), t("services.roadP3")],
      img: "/images/brand-highway-night.webp",
    },
    {
      slug: "air",
      title: t("services.airTitle"),
      lead: t("services.airLead"),
      points: [t("services.airP1"), t("services.airP2"), t("services.airP3")],
      img: "/images/brand-air-cargo.webp",
    },
    {
      slug: "sea",
      title: t("services.seaTitle"),
      lead: t("services.seaLead"),
      points: [t("services.seaP1"), t("services.seaP2"), t("services.seaP3")],
      img: "/images/brand-port.webp",
    },
    {
      slug: "vehicle",
      title: t("services.vehicleTitle"),
      lead: t("services.vehicleLead"),
      points: [t("services.vehicleP1"), t("services.vehicleP2"), t("services.vehicleP3")],
      img: "/images/brand-vehicle-carrier.webp",
    },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t("services.eyebrow")}
        title={t("services.heroTitle")}
        subtitle={t("services.heroSub")}
        image="/images/brand-port.webp"
        imageAlt="Port containers and cargo ship"
        actions={
          <>
            <Link href="/estimate" className="btn-primary">
              {t("services.ctaEstimate")}
            </Link>
            <Link href="/track" className="btn-on-dark">
              {t("services.ctaTrack")}
            </Link>
          </>
        }
      />

      <section className="bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          {services.map((s, i) => (
            <Reveal key={s.slug} delayMs={i * 60}>
              <article
                id={s.slug}
                className={`grid items-center gap-6 overflow-hidden rounded-3xl bg-panel shadow-soft lg:grid-cols-2 ${
                  i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="relative min-h-[240px] sm:min-h-[320px]">
                  <Image src={s.img} alt={s.title} fill className="object-cover" />
                </div>
                <div className="p-6 sm:p-8 lg:p-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">{s.title}</h2>
                  <p className="mt-3 text-text-secondary">{s.lead}</p>
                  <ul className="mt-5 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary">
                          ✓
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href="/estimate" className="btn-primary">
                      {t("services.estimateMode")}
                    </Link>
                    <Link href="/support" className="btn-ghost">
                      {t("services.askOps")}
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-panel py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-text-primary">
            {t("services.unsureTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t("services.unsureSub")}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/estimate" className="btn-primary">
              {t("services.openEstimator")}
            </Link>
            <Link href="/coverage" className="btn-ghost">
              {t("services.seeCoverage")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
