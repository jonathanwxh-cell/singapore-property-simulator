import { properties } from '@/data/properties';
import { normalizeBuyerProfile, type BuyerProfile } from '@/game/types';

export const EC_MAX_MONTHLY_INCOME = 16000;

export interface EligibilityInput {
  salary: number;
  properties: Array<{ propertyId: string }>;
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
  blockedReason: string | null;
}

export function deriveEligibilityFlags(input: EligibilityInput): EligibilityFlags {
  const buyerProfile = normalizeBuyerProfile(input.buyerProfile);
  const firstTimer = !input.firstHomePurchased;
  const homeowner = input.properties.some((property) => isResidentialPropertyId(property.propertyId));
  const upgrader = input.firstHomePurchased;
  const ecEligible = buyerProfile.residencyStatus !== 'foreigner'
    && input.salary <= EC_MAX_MONTHLY_INCOME
    && !input.ownedPrivateHome;

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
  const blockedReason = profileBlockedReason
    ?? (salaryCeilingExceeded
      ? `Monthly salary exceeds the S$${salaryCeiling?.toLocaleString()} ceiling for this property type.`
      : ecBlockedByPrivateOwnership
        ? 'This executive condo is no longer available after private-home ownership in this run.'
        : null);

  return {
    firstTimerFriendly: !blockedReason && flags.firstTimer && (input.propertyType === 'HDB BTO' || input.propertyType === 'HDB Resale'),
    upgraderTier: isPrivateResidentialPropertyType(input.propertyType),
    ecEligible: input.propertyType === 'Executive Condo' ? flags.ecEligible && !salaryCeilingExceeded && !profileBlockedReason : false,
    salaryCeiling,
    salaryCeilingExceeded,
    blockedReason,
  };
}

export function isResidentialPropertyType(propertyType: string): boolean {
  return propertyType !== 'Commercial Shop' && propertyType !== 'Commercial Office';
}

export function isPrivateResidentialPropertyType(propertyType: string): boolean {
  return propertyType === 'Private Condo'
    || propertyType === 'Landed Terrace'
    || propertyType === 'Landed Semi-D'
    || propertyType === 'Landed Bungalow';
}

function isResidentialPropertyId(propertyId: string): boolean {
  const property = properties.find((candidate) => candidate.id === propertyId);
  return Boolean(property && isResidentialPropertyType(property.type));
}

function getBuyerProfileBlocker(propertyType: string, buyerProfile: BuyerProfile): string | null {
  const isHdb = propertyType === 'HDB BTO' || propertyType === 'HDB Resale';
  const isSubsidized = propertyType === 'HDB BTO' || propertyType === 'Executive Condo';

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
