import { BSD_TIERS, ABSD_RATES } from './constants';

export function calculateBSD(price: number): number {
  let duty = 0;
  let prevThreshold = 0;

  for (const tier of BSD_TIERS) {
    if (price <= prevThreshold) break;
    const taxableInTier = Math.min(price, prevThreshold + tier.threshold) - prevThreshold;
    duty += taxableInTier * tier.rate;
    prevThreshold += tier.threshold;
  }

  return round2(duty);
}

export function calculateABSD(price: number, propertyCount: number, isCitizen: boolean = true, isPr: boolean = false): number {
  if (!isCitizen && !isPr) return round2(price * ABSD_RATES.foreigner);
  if (isPr) {
    if (propertyCount === 0) return 0;
    if (propertyCount === 1) return round2(price * ABSD_RATES.pr_second);
    return round2(price * ABSD_RATES.pr_third_plus);
  }
  if (propertyCount === 0) return 0;
  if (propertyCount === 1) return round2(price * ABSD_RATES.citizen_second);
  return round2(price * ABSD_RATES.citizen_third_plus);
}

export function calculateTotalStampDuty(
  price: number,
  propertyCount: number,
  options?: { isCitizen?: boolean; isPr?: boolean },
): number {
  const bsd = calculateBSD(price);
  const absd = calculateABSD(price, propertyCount, options?.isCitizen, options?.isPr);
  return round2(bsd + absd);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
