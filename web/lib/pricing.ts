export const INSURANCE_RATE = 0.5;

export function roundMoney(n: number) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

export function insuranceFromPackageValue(packageValue?: number | null, insured = false) {
  if (!insured) return 0;
  const value = Number(packageValue) || 0;
  if (value <= 0) return 0;
  return roundMoney(value * INSURANCE_RATE);
}

export function shipmentCostFromPackage(opts: {
  packageValue?: number | null;
  currency?: string | null;
  insured?: boolean;
  shipping?: number | null;
  base?: number | null;
}) {
  const base = roundMoney(Number(opts.base) || 0);
  const shipping = roundMoney(Number(opts.shipping) || 0);
  const insurance = insuranceFromPackageValue(opts.packageValue, Boolean(opts.insured));
  return {
    base,
    shipping,
    insurance,
    total: roundMoney(base + shipping + insurance),
    currency: opts.currency || "EUR",
  };
}
