"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";

export default function LanguageSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale, setLocale, resetToRegion, t } = useI18n();

  const selectClass =
    variant === "dark"
      ? "rounded-md border border-white/15 bg-white/10 py-1.5 pl-2 pr-7 text-xs font-medium text-white outline-none focus:border-accent"
      : "rounded-md border border-border bg-panel py-1.5 pl-2 pr-7 text-xs font-medium text-text-primary outline-none focus:border-primary";

  return (
    <div className="flex items-center gap-1.5" title={t("nav.language")}>
      <label className="sr-only" htmlFor="cw-lang">
        {t("nav.language")}
      </label>
      <select
        id="cw-lang"
        value={locale}
        onChange={(e) => {
          const v = e.target.value as Locale | "auto";
          if (v === "auto") {
            resetToRegion();
            return;
          }
          setLocale(v);
        }}
        className={selectClass}
        aria-label={t("nav.language")}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} className="text-text-primary">
            {LOCALE_LABELS[code]}
          </option>
        ))}
        <option value="auto" className="text-text-primary">
          {t("lang.auto")}
        </option>
      </select>
    </div>
  );
}
