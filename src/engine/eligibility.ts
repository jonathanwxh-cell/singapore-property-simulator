import { properties } from '@/data/properties';

export const EC_MAX_MONTHLY_INCOME = 16000;

export interface EligibilityInput {
  salary: number;
  properties: Array<{ propertyId: string }>;
  firstHomePurchased: boolean;
  ownedPrivateHome: boolean;
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
  const firstTimer = !input.firstHomePurchased;
  const homeowner = input.properties.some((property) => isResidentialPropertyId(property.propertyId));
  const upgrader = input.firstHomePurchased;
  const ecEligible = input.salary <= EC_MAX_MONTHLY_INCOME && !input.ownedPrivateHome;

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
  const salaryCeiling = getSalaryCeilingForProperty(input.propertyType);
  const salaryCeilingExceeded = salaryCeiling !== null && input.salary > salaryCeiling;
  const ecBlockedByPrivateOwnership = input.propertyType === 'Executive Condo' && input.ownedPrivateHome;

  return {
    firstTimerFriendly: flags.firstTimer && (input.propertyType === 'HDB BTO' || input.propertyType === 'HDB Resale'),
    upgraderTier: isPrivateResidentialPropertyType(input.propertyType),
    ecEligible: input.propertyType === 'Executive Condo' ? flags.ecEligible && !salaryCeilingExceeded : false,
    salaryCeiling,
    salaryCeilingExceeded,
    blockedReason: salaryCeilingExceeded
      ? `Monthly salary exceeds the S$${salaryCeiling?.toLocaleString()} ceiling for this property type.`
      : ecBlockedByPrivateOwnership
        ? 'This executive condo is no longer available after private-home ownership in this run.'
        : null,
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
