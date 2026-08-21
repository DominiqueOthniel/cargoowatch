"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { insuranceFromPackageValue } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n/context";

const MODE_IDS = ["road", "air", "sea", "vehicle"] as const;
const SPEED_IDS = ["standard", "express", "same"] as const;

const MODE_RATES: Record<(typeof MODE_IDS)[number], { base: number; perKg: number }> = {
  road: { base: 180, perKg: 1.8 },
  air: { base: 320, perKg: 4.2 },
  sea: { base: 140, perKg: 0.9 },
  vehicle: { base: 650, perKg: 0 },
};

const SPEED_MULT: Record<(typeof SPEED_IDS)[number], number> = {
  standard: 1,
  express: 1.35,
  same: 1.9,
};

export default function EstimateCalculator() {
  const { t } = useI18n();
  const [mode, setMode] = useState<(typeof MODE_IDS)[number]>("road");
  const [speed, setSpeed] = useState<(typeof SPEED_IDS)[number]>("standard");
  const [weight, setWeight] = useState(25);
  const [distance, setDistance] = useState(800);
  const [packageValue, setPackageValue] = useState(400);
  const [insured, setInsured] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const modeLabels: Record<(typeof MODE_IDS)[number], string> = {
    road: t("est.road"),
    air: t("est.air"),
    sea: t("est.sea"),
    vehicle: t("est.vehicle"),
  };

  const speedLabels: Record<(typeof SPEED_IDS)[number], string> = {
    standard: t("est.standard"),
    express: t("est.express"),
    same: t("est.same"),
  };

  const estimate = useMemo(() => {
    const m = MODE_RATES[mode];
    const mult = SPEED_MULT[speed];
    const distanceFee = distance * 0.42;
    const weightFee = weight * m.perKg;
    const sub = (m.base + distanceFee + weightFee) * mult;
    const insurance = insuranceFromPackageValue(packageValue, insured);
    const total = Math.round(sub + insurance);
    return {
      total,
      insurance: Math.round(insurance),
      days: speed === "same" ? 1 : speed === "express" ? 2 : 4,
    };
  }, [mode, speed, weight, distance, packageValue, insured]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setRevealed(true);
  }

  return (
    <div className="overflow-hidden border border-border bg-secondary shadow-soft">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={onSubmit} className="space-y-5 p-4 text-white sm:p-8 lg:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              {t("est.title1")}{" "}
              <span className="text-accent">{t("est.title2")}</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{t("est.sub")}</p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-white/85">{t("est.mode")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMode(id);
                    setRevealed(false);
                  }}
                  className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
                    mode === id
                      ? "border-accent bg-accent text-white"
                      : "border-white/15 bg-white/5 text-white/75 hover:border-white/35"
                  }`}
                >
                  {modeLabels[id]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/85">{t("est.weight")}</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={weight}
              onChange={(e) => {
                const next = Number(e.target.value);
                setWeight(Number.isFinite(next) && next >= 0 ? next : 0);
                setRevealed(false);
              }}
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-accent"
            />
            <span className="mt-1 block text-sm font-semibold tabular-nums text-accent">{weight} kg</span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/85">{t("est.distance")}</span>
            <input
              type="range"
              min={50}
              max={3000}
              step={10}
              value={distance}
              onChange={(e) => {
                setDistance(Number(e.target.value));
                setRevealed(false);
              }}
              className="w-full accent-accent"
            />
            <span className="mt-1 block text-sm font-semibold tabular-nums text-accent">{distance} mi</span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/85">{t("est.value")}</span>
            <input
              type="number"
              min={0}
              step={1}
              value={packageValue}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPackageValue(Number.isFinite(next) && next >= 0 ? next : 0);
                setRevealed(false);
              }}
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-accent"
            />
            <span className="mt-1 block text-sm font-semibold tabular-nums text-accent">
              {packageValue} €
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/85">{t("est.speed")}</span>
            <select
              value={speed}
              onChange={(e) => {
                setSpeed(e.target.value as typeof speed);
                setRevealed(false);
              }}
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2.5 text-base text-white outline-none focus:border-accent"
            >
              {SPEED_IDS.map((id) => (
                <option key={id} value={id} className="text-text-primary">
                  {speedLabels[id]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={insured}
              onChange={(e) => {
                setInsured(e.target.checked);
                setRevealed(false);
              }}
              className="h-4 w-4 accent-accent"
            />
            {t("est.insurance")}
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-accent py-3.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            {t("est.calculate")}
          </button>

          <div className="rounded-md border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/50">{t("est.cost")}</p>
            {!revealed ? (
              <p className="mt-1 font-display text-2xl font-bold text-white/35">—</p>
            ) : (
              <div className="mt-1">
                <p className="font-display text-3xl font-extrabold tabular-nums text-white">
                  ${estimate.total}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {t("est.aboutDays")
                    .replace("{days}", String(estimate.days))
                    .replace("{ins}", String(estimate.insurance))}
                </p>
              </div>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">{t("est.disclaimer")}</p>
          </div>
        </form>

        <div className="relative min-h-[280px] overflow-hidden bg-[#0a1628] sm:min-h-[360px] lg:min-h-full">
          <Image
            src="/images/brand-courier-avatar.webp"
            alt="Aurex Logistics courier"
            fill
            className="object-cover object-[center_18%]"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 pt-20 sm:p-8 sm:pt-24">
            <p className="font-display text-base font-bold text-white sm:text-lg">{t("est.courierTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{t("est.courierSub")}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/track" className="btn-primary text-center text-sm">
                {t("est.track")}
              </Link>
              <Link href="/support" className="btn-on-dark text-center text-sm">
                {t("est.quote")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
