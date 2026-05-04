// Pure formatters and data shapers for PropertyDetail. No React, no JSX.
// Component exports live in PropertyDetailComponents.tsx alongside this file
// — the split exists to satisfy react-refresh/only-export-components, which
// requires .tsx files to export only components.
import { formatCurrency } from '@/lib/format';
import type {
  OwnedProperty,
  RentalMode,
  RentStrategy,
  TenantProfileId,
} from '@/game/types';
import type { TenantLeaseOption } from '@/engine/propertyOperations';

export function leaseOptionToneClass(tone: TenantLeaseOption['tone']): string {
  if (tone === 'good') return 'border-success/30 bg-success/10';
  if (tone === 'warn') return 'border-warning/30 bg-warning/10';
  if (tone === 'bad') return 'border-danger/30 bg-danger/10';
  return 'border-glass-border bg-white/[0.03]';
}

export function formatSignedNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}`;
}

export function formatSignedCurrency(value: number): string {
  if (value === 0) return 'S$0';
  return `${value > 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`;
}

export function getFloorPlanSrc(floorPlanId?: string): string {
  const id = floorPlanId ?? 'floorplan-hdb-4-room';
  return `/floorplans/${id}.svg`;
}

export function formatOwnershipStatus(ownedProperty: OwnedProperty): string {
  if (ownedProperty.tenant) {
    return `${formatRentalMode(ownedProperty.tenant.rentalMode)} (${formatCurrency(ownedProperty.tenant.contractedRent)}/mo)`;
  }

  if (ownedProperty.isRented) return `Rented (${formatCurrency(ownedProperty.monthlyRental)}/mo)`;
  if (ownedProperty.occupancyStatus === 'owner-occupied') return 'Owner-occupied';
  if (ownedProperty.occupancyStatus === 'renovating') return 'Renovating';
  if (ownedProperty.occupancyStatus === 'listed') return 'Listed';
  if (ownedProperty.occupancyStatus === 'tenanted') return 'Tenanted';
  return 'Vacant';
}

export function formatRentalMode(mode: RentalMode): string {
  if (mode === 'room-rental') return 'owner-occupied room lease';
  if (mode === 'whole-unit') return 'whole-flat lease';
  if (mode === 'corporate-lease') return 'corporate lease';
  if (mode === 'student-shared') return 'student shared lease';
  return 'commercial lease';
}

export function getTenantPlans({
  isHdb,
  isCommercial,
  mopRemainingMonths,
}: {
  isHdb: boolean;
  isCommercial: boolean;
  mopRemainingMonths: number;
}): Array<{
  label: string;
  description: string;
  mode: RentalMode;
  profileId: TenantProfileId;
  strategy: RentStrategy;
}> {
  if (isCommercial) {
    return [
      {
        label: 'SME Market Lease',
        description: 'Balanced commercial yield with manageable default risk.',
        mode: 'commercial-lease',
        profileId: 'sme-commercial',
        strategy: 'market',
      },
      {
        label: 'Corporate Upside',
        description: 'Push rent harder, but expect more vacancy and fit-out expectations.',
        mode: 'corporate-lease',
        profileId: 'sme-commercial',
        strategy: 'aggressive',
      },
      {
        label: 'Defensive Renewal',
        description: 'Lower rent to protect occupancy through soft business cycles.',
        mode: 'commercial-lease',
        profileId: 'sme-commercial',
        strategy: 'conservative',
      },
    ];
  }

  if (isHdb && mopRemainingMonths > 0) {
    return [
      {
        label: 'Owner-Occupied Room',
        description: 'MOP-safe income while keeping the flat owner-occupied in simplified rules.',
        mode: 'room-rental',
        profileId: 'local-family',
        strategy: 'market',
      },
      {
        label: 'Conservative Owner Room',
        description: 'Lower rent, better satisfaction, and less vacancy pressure while you still live there.',
        mode: 'room-rental',
        profileId: 'local-family',
        strategy: 'conservative',
      },
      {
        label: 'Student Room (Owner-Stay)',
        description: 'Useful near education nodes. More wear, but keeps early gameplay active without whole-flat rental.',
        mode: 'room-rental',
        profileId: 'student-tenants',
        strategy: 'market',
      },
    ];
  }

  return [
    {
      label: 'Whole-Flat Family Lease',
      description: 'Balanced whole-unit lease with stable demand and moderate wear.',
      mode: 'whole-unit',
      profileId: 'local-family',
      strategy: 'market',
    },
    {
      label: 'Expat Whole-Unit Premium',
      description: 'Higher rent for better-located or better-finished homes.',
      mode: 'corporate-lease',
      profileId: 'expat-pmet',
      strategy: 'aggressive',
    },
    {
      label: 'Defensive Whole-Flat Lease',
      description: 'Trade some rent for occupancy and tenant happiness.',
      mode: 'whole-unit',
      profileId: 'local-family',
      strategy: 'conservative',
    },
  ];
}
