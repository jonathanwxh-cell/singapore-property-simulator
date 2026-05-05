import { BSD_TIERS, ABSD_RATES } from './constants';
import type { PropertyCategory } from '@/data/properties';
import type { BuyerResidencyStatus } from '@/game/types';

const COMMERCIAL_BSD_TIERS = [
  { threshold: 180000, rate: 0.01 },
  { threshold: 180000, rate: 0.02 },
  { threshold: Infinity, rate: 0.03 },
] as const;

export function calculateBSD(price: number): number {
  return calculateDutyFromTiers(price, BSD_TIERS);
}

export function calculateBSDForCategory(price: number, category: PropertyCategory): number {
  return calculateDutyFromTiers(price, category === 'commercial' ? COMMERCIAL_BSD_TIERS : BSD_TIERS);
}

function calculateDutyFromTiers(
  price: number,
  tiers: ReadonlyArray<{ threshold: number; rate: number }>,
): number {
  let duty = 0;
  let prevThreshold = 0;

  for (const tier of tiers) {
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
    if (propertyCount === 0) return round2(price * ABSD_RATES.pr_first);
    if (propertyCount === 1) return round2(price * ABSD_RATES.pr_second);
    return round2(price * ABSD_RATES.pr_third_plus);
  }
  if (propertyCount === 0) return 0;
  if (propertyCount === 1) return round2(price * ABSD_RATES.citizen_second);
  return round2(price * ABSD_RATES.citizen_third_plus);
}

export function calculateABSDForProfile(
  price: number,
  propertyCount: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
): number {
  return round2(price * calculateABSDRateForProfile(propertyCount, residencyStatus));
}

export function calculateABSDRateForProfile(
  propertyCount: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
): number {
  if (residencyStatus === 'foreigner') return ABSD_RATES.foreigner;
  if (residencyStatus === 'spr') {
    if (propertyCount === 0) return ABSD_RATES.pr_first;
    if (propertyCount === 1) return ABSD_RATES.pr_second;
    return ABSD_RATES.pr_third_plus;
  }
  if (propertyCount === 0) return 0;
  if (propertyCount === 1) return ABSD_RATES.citizen_second;
  return ABSD_RATES.citizen_third_plus;
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
