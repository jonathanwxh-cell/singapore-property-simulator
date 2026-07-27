import { BSD_TIERS, ABSD_RATES } from './constants';
import type { PropertyCategory } from '@/data/properties';
import type {
  BuyerResidencyStatus,
  MaritalStatus,
  PendingTaxRelief,
} from '@/game/types';

const COMMERCIAL_BSD_TIERS = [
  { threshold: 180000, rate: 0.01 },
  { threshold: 180000, rate: 0.02 },
  { threshold: 640000, rate: 0.03 },
  { threshold: 500000, rate: 0.04 },
  { threshold: Infinity, rate: 0.05 },
] as const;

interface SSDTier {
  maxMonthsInclusive: number;
  rate: number;
}

const RESIDENTIAL_SSD_POST_2025: readonly SSDTier[] = [
  { maxMonthsInclusive: 12, rate: 0.16 },
  { maxMonthsInclusive: 24, rate: 0.12 },
  { maxMonthsInclusive: 36, rate: 0.08 },
  { maxMonthsInclusive: 48, rate: 0.04 },
] as const;

const RESIDENTIAL_SSD_2017_TO_2025: readonly SSDTier[] = [
  { maxMonthsInclusive: 12, rate: 0.12 },
  { maxMonthsInclusive: 24, rate: 0.08 },
  { maxMonthsInclusive: 36, rate: 0.04 },
] as const;

const SSD_POST_2025_EFFECTIVE_YEAR = 2025;
const SSD_POST_2025_EFFECTIVE_MONTH = 7;

export interface SSDInput {
  salePrice: number;
  acquisitionYear: number;
  acquisitionMonth: number;
  saleYear: number;
  saleMonth: number;
  category: PropertyCategory;
}

export interface PendingTaxReliefDraftInput {
  maritalStatus: MaritalStatus;
  residencyStatus: BuyerResidencyStatus;
  buyerAge: number;
  propertyCategory: PropertyCategory;
  propertyCountBeforePurchase: number;
  purchasePropertyId: string;
  purchaseTurn: number;
  expectedRefundAmount: number;
  replacementPurchasePrice: number;
  existingResidentialProperties: Array<{ propertyId: string; currentValue: number }>;
}

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

export function calculateSSD(input: SSDInput): number {
  if (input.category === 'commercial') return 0;

  const holdingMonths = Math.max(0, monthsBetween(
    input.acquisitionYear,
    input.acquisitionMonth,
    input.saleYear,
    input.saleMonth,
  ));

  const schedule = isOnOrAfter(input.acquisitionYear, input.acquisitionMonth, SSD_POST_2025_EFFECTIVE_YEAR, SSD_POST_2025_EFFECTIVE_MONTH)
    ? RESIDENTIAL_SSD_POST_2025
    : RESIDENTIAL_SSD_2017_TO_2025;
  const tier = schedule.find((candidate) => holdingMonths <= candidate.maxMonthsInclusive);

  return round2(input.salePrice * (tier?.rate ?? 0));
}

export function buildPendingTaxReliefDraft(input: PendingTaxReliefDraftInput): PendingTaxRelief | null {
  if (input.propertyCategory === 'commercial') return null;
  if (input.expectedRefundAmount <= 0) return null;
  if (input.propertyCountBeforePurchase !== 1) return null;
  if (input.existingResidentialProperties.length !== 1) return null;

  const qualifyingSoldPropertyIds = input.existingResidentialProperties.map((property) => property.propertyId);
  const deadlineTurn = input.purchaseTurn + 6;

  if (input.maritalStatus === 'married' && input.residencyStatus === 'sc') {
    return {
      type: 'absd-spouse-refund',
      purchasePropertyId: input.purchasePropertyId,
      purchaseTurn: input.purchaseTurn,
      deadlineTurn,
      expectedRefundAmount: input.expectedRefundAmount,
      qualifyingSoldPropertyIds,
      status: 'pending',
    };
  }

  const existingProperty = input.existingResidentialProperties[0];
  if (
    input.maritalStatus === 'single'
    && input.residencyStatus === 'sc'
    && input.buyerAge >= 55
    && input.replacementPurchasePrice < existingProperty.currentValue
  ) {
    return {
      type: 'absd-single-senior-refund',
      purchasePropertyId: input.purchasePropertyId,
      purchaseTurn: input.purchaseTurn,
      deadlineTurn,
      expectedRefundAmount: input.expectedRefundAmount,
      qualifyingSoldPropertyIds,
      status: 'pending',
      replacementPurchasePrice: input.replacementPurchasePrice,
    };
  }

  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function monthsBetween(
  acquisitionYear: number,
  acquisitionMonth: number,
  saleYear: number,
  saleMonth: number,
): number {
  return (saleYear - acquisitionYear) * 12 + (saleMonth - acquisitionMonth);
}

function isOnOrAfter(year: number, month: number, boundaryYear: number, boundaryMonth: number): boolean {
  return year > boundaryYear || (year === boundaryYear && month >= boundaryMonth);
}
