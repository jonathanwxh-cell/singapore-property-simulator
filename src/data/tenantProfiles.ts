import type { RentalMode, RentStrategy, TenantProfileId } from '@/game/types';

export interface TenantProfile {
  id: TenantProfileId;
  label: string;
  description: string;
  rentMultiplier: number;
  baseSatisfaction: number;
  baseDefaultRiskPct: number;
  wearFactor: number;
  allowedModes: RentalMode[];
}

export interface RentStrategyDefinition {
  id: RentStrategy;
  label: string;
  rentMultiplier: number;
  satisfactionDelta: number;
  defaultRiskDelta: number;
  vacancyRiskDelta: number;
}

export interface RentalModeDefinition {
  id: RentalMode;
  label: string;
  rentMultiplier: number;
  description: string;
}

export const tenantProfiles: TenantProfile[] = [
  {
    id: 'local-family',
    label: 'Local Family',
    description: 'Stable and practical. Sensitive to rent jumps, but low-drama if the home is well maintained.',
    rentMultiplier: 1,
    baseSatisfaction: 74,
    baseDefaultRiskPct: 1.5,
    wearFactor: 0.8,
    allowedModes: ['room-rental', 'whole-unit'],
  },
  {
    id: 'expat-pmet',
    label: 'Expat PMET',
    description: 'Pays more for convenience and finish, especially in condo and central districts.',
    rentMultiplier: 1.08,
    baseSatisfaction: 70,
    baseDefaultRiskPct: 2.5,
    wearFactor: 1,
    allowedModes: ['whole-unit', 'corporate-lease'],
  },
  {
    id: 'student-tenants',
    label: 'Student / Shared Tenants',
    description: 'Useful for fringe and education nodes. Good occupancy, more wear and management noise.',
    rentMultiplier: 0.96,
    baseSatisfaction: 66,
    baseDefaultRiskPct: 3.8,
    wearFactor: 1.25,
    allowedModes: ['room-rental', 'student-shared'],
  },
  {
    id: 'sme-commercial',
    label: 'SME Commercial Tenant',
    description: 'Higher variance but stronger yield potential for shop and office assets.',
    rentMultiplier: 1.1,
    baseSatisfaction: 68,
    baseDefaultRiskPct: 4,
    wearFactor: 1.15,
    allowedModes: ['commercial-lease', 'corporate-lease'],
  },
];

export const rentStrategies: Record<RentStrategy, RentStrategyDefinition> = {
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    rentMultiplier: 0.92,
    satisfactionDelta: 8,
    defaultRiskDelta: -0.5,
    vacancyRiskDelta: -5,
  },
  market: {
    id: 'market',
    label: 'Market',
    rentMultiplier: 1,
    satisfactionDelta: 0,
    defaultRiskDelta: 0,
    vacancyRiskDelta: 0,
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    rentMultiplier: 1.12,
    satisfactionDelta: -8,
    defaultRiskDelta: 2,
    vacancyRiskDelta: 8,
  },
};

export const rentalModes: Record<RentalMode, RentalModeDefinition> = {
  'room-rental': {
    id: 'room-rental',
    label: 'Owner-Occupied Room Rental',
    rentMultiplier: 0.45,
    description: 'Lower income, but it keeps HDB MOP gameplay active through room rental.',
  },
  'whole-unit': {
    id: 'whole-unit',
    label: 'Whole Unit',
    rentMultiplier: 1,
    description: 'The standard landlord route once rules and strategy permit it.',
  },
  'corporate-lease': {
    id: 'corporate-lease',
    label: 'Corporate Lease',
    rentMultiplier: 1.12,
    description: 'Higher rent, higher expectations, strongest for prime condos and offices.',
  },
  'student-shared': {
    id: 'student-shared',
    label: 'Student / Shared Rental',
    rentMultiplier: 0.95,
    description: 'More wear, but useful where affordability and access matter.',
  },
  'commercial-lease': {
    id: 'commercial-lease',
    label: 'Commercial Lease',
    rentMultiplier: 1.08,
    description: 'Business tenant model for shops and offices.',
  },
};

export function getTenantProfile(profileId: TenantProfileId): TenantProfile | undefined {
  return tenantProfiles.find((profile) => profile.id === profileId);
}
