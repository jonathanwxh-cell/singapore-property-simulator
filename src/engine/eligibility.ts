import {
  properties,
  getPropertyCategory,
  isPrivateResidentialCategory,
  isResidentialCategory,
} from '@/data/properties';
import { normalizeBuyerProfile, type BuyerProfile } from '@/game/types';
import type { ActionFailReason } from './results';

export const EC_MAX_MONTHLY_INCOME = 16000;

export interface EligibilityInput {
  salary: number;
  properties: Array<{ propertyId: string; mopRemainingMonths?: number }>;
  firstHomePurchased: boolean;
  ownedPrivateHome: boolean;
  buyerProfile?: BuyerProfile;
}

export interface PropertyEligibilityInput extends EligibilityInput {
  propertyType: string;
}

export interface EligibilityFlags {
  firstTimer: boolean;
  homeowner: boolean;
  upgrader: boolean;
  ecEligible: boolean;
  salaryCeilingExceeded: boolean;
}

export interface PropertyEligibilityStatus {
  firstTimerFriendly: boolean;
  upgraderTier: boolean;
  ecEligible: boolean;
  salaryCeiling: number | null;
  salaryCeilingExceeded: boolean;
  blockedCode: ActionFailReason | null;
  blockedReason: string | null;
}

export function deriveEligibilityFlags(input: EligibilityInput): EligibilityFlags {
  const buyerProfile = normalizeBuyerProfile(input.buyerProfile);
  const firstTimer = !input.firstHomePurchased;
  const homeowner = input.properties.some((property) => isResidentialPropertyId(property.propertyId));
  const upgrader = input.firstHomePurchased;
  const ownsPublicHousing = input.properties.some((property) => isPublicHousingPropertyId(property.propertyId));
  const ecEligible = buyerProfile.residencyStatus !== 'foreigner'
    && input.salary <= EC_MAX_MONTHLY_INCOME
    && !input.ownedPrivateHome
    && !ownsPublicHousing;

  return {
    firstTimer,
    homeowner,
    upgrader,
    ecEligible,
    salaryCeilingExceeded: false,
  };
}

export function getSalaryCeilingForProperty(propertyType: string): number | null {
  if (propertyType === 'Executive Condo') {
    return EC_MAX_MONTHLY_INCOME;
  }

  return null;
}

export function evaluatePropertyEligibility(input: PropertyEligibilityInput): PropertyEligibilityStatus {
  const flags = deriveEligibilityFlags(input);
  const buyerProfile = normalizeBuyerProfile(input.buyerProfile);
  const salaryCeiling = getSalaryCeilingForProperty(input.propertyType);
  const salaryCeilingExceeded = salaryCeiling !== null && input.salary > salaryCeiling;
  const ecBlockedByPrivateOwnership = input.propertyType === 'Executive Condo' && input.ownedPrivateHome;
  const profileBlockedReason = getBuyerProfileBlocker(input.propertyType, buyerProfile);
  const ownershipBlocker = getCurrentOwnershipBlocker(input);
  const blockedReason = profileBlockedReason
    ?? ownershipBlocker?.message
    ?? (salaryCeilingExceeded
      ? `Monthly salary exceeds the S$${salaryCeiling?.toLocaleString()} ceiling for this property type.`
      : ecBlockedByPrivateOwnership
        ? 'This executive condo is no longer available after private-home ownership in this run.'
        : null);
  const blockedCode: ActionFailReason | null = profileBlockedReason
    ? 'eligibility_blocked'
    : ownershipBlocker?.code
      ?? (salaryCeilingExceeded || ecBlockedByPrivateOwnership ? 'eligibility_blocked' : null);

  return {
    firstTimerFriendly: !blockedReason && flags.firstTimer && (input.propertyType === 'HDB BTO' || input.propertyType === 'HDB Resale'),
    upgraderTier: isPrivateResidentialPropertyType(input.propertyType),
    ecEligible: input.propertyType === 'Executive Condo' ? flags.ecEligible && !salaryCeilingExceeded && !blockedReason : false,
    salaryCeiling,
    salaryCeilingExceeded,
    blockedCode,
    blockedReason,
  };
}

// Thin wrappers preserved for backward compat with consumers that pass a
// string-typed propertyType. New callers should prefer the category
// helpers from `data/properties.ts` directly.
export function isResidentialPropertyType(propertyType: string): boolean {
  return isResidentialCategory(propertyType);
}

export function isPrivateResidentialPropertyType(propertyType: string): boolean {
  return isPrivateResidentialCategory(propertyType);
}

function isResidentialPropertyId(propertyId: string): boolean {
  const property = properties.find((candidate) => candidate.id === propertyId);
  return Boolean(property && isResidentialPropertyType(property.type));
}

function isPublicHousingType(propertyType: string): boolean {
  const category = getPropertyCategory(propertyType);
  return category === 'hdb' || category === 'ec';
}

function isPublicHousingPropertyId(propertyId: string): boolean {
  const property = properties.find((candidate) => candidate.id === propertyId);
  return Boolean(property && isPublicHousingType(property.type));
}

function getCurrentOwnershipBlocker(input: PropertyEligibilityInput): { code: ActionFailReason; message: string } | null {
  const isResidentialPurchase = isResidentialPropertyType(input.propertyType);
  const isPublicHousingPurchase = isPublicHousingType(input.propertyType);
  const activeMopHome = input.properties.find((property) =>
    isPublicHousingPropertyId(property.propertyId) && (property.mopRemainingMonths ?? 0) > 0
  );

  if (isResidentialPurchase && activeMopHome) {
    return {
      code: 'mop_restricted',
      message: `MOP still has ${activeMopHome.mopRemainingMonths} month(s) remaining before another residential purchase is allowed in this simplified model.`,
    };
  }

  if (isPublicHousingPurchase && input.properties.some((property) => isPublicHousingPropertyId(property.propertyId))) {
    return {
      code: 'eligibility_blocked',
      message: 'Sell your current public-housing home before buying another public-housing home in this simplified model.',
    };
  }

  return null;
}

function getBuyerProfileBlocker(propertyType: string, buyerProfile: BuyerProfile): string | null {
  const category = getPropertyCategory(propertyType);
  const isHdb = category === 'hdb';
  // BTO and EC are the two subsidised paths; HDB Resale is not.
  const isSubsidized = propertyType === 'HDB BTO' || category === 'ec';

  if (buyerProfile.residencyStatus === 'foreigner' && (isHdb || propertyType === 'Executive Condo')) {
    return 'Foreigners cannot buy HDB flats or executive condos in this simplified Singapore profile model.';
  }

  if (buyerProfile.residencyStatus === 'spr' && propertyType === 'HDB BTO') {
    return 'SPR households cannot buy new HDB BTO flats in this simplified model; use resale or private paths.';
  }

  if (isHdb && buyerProfile.householdProfile === 'single-under-35') {
    return 'Single buyers under 35 need a family nucleus or a later-life single-buyer path before buying HDB in this simplified model.';
  }

  if (isSubsidized && buyerProfile.householdProfile === 'foreigner-investor') {
    return 'Investor-style foreigner profiles are routed toward private and commercial property paths.';
  }

  return null;
}
