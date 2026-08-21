"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export default function FaqAccordion() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  return (
    <div className="divide-y divide-border border-y border-border">
      {faqs.map((item, i) => {
        const active = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-4 text-left sm:py-5"
              onClick={() => setOpen(active ? null : i)}
              aria-expanded={active}
            >
              <span className="font-display text-base font-semibold text-text-primary sm:text-lg">
                {item.q}
              </span>
              <span className="shrink-0 text-lg font-medium text-text-muted" aria-hidden>
                {active ? "−" : "+"}
              </span>
            </button>
            {active && (
              <div className="pb-5 text-sm leading-relaxed text-text-secondary sm:text-base">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
