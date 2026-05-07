// Shared internals for the propertyOperations / tenantOperations /
// maintenanceOperations / reserveOperations cluster. Anything in here is
// implementation detail of those modules — external callers should keep
// importing from `propertyOperations.ts`, which re-exports the public
// surface.
import type { OwnedProperty, Player, PropertyOperationLogEntry } from '@/game/types';
import { getListingCatalog } from './listings';

export const OPERATION_HISTORY_LIMIT = 12;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getListing(propertyId: string) {
  return getListingCatalog().find((listing) => listing.id === propertyId);
}

export function deriveFloorPlanId(property: OwnedProperty): string {
  const listing = getListing(property.propertyId);
  if (!listing) return 'floorplan-generic';
  if (listing.type === 'Commercial Shop') return 'floorplan-commercial-shop';
  if (listing.type === 'Commercial Office') return 'floorplan-commercial-office';
  if (listing.type.startsWith('Landed')) return 'floorplan-landed';
  if (listing.type === 'Private Condo' || listing.type === 'Executive Condo') {
    return listing.bedrooms <= 2 ? 'floorplan-condo-2-bed' : 'floorplan-condo-3-bed';
  }
  if (listing.bedrooms <= 2) return 'floorplan-hdb-3-room';
  if (listing.bedrooms === 3) return 'floorplan-hdb-4-room';
  return 'floorplan-hdb-5-room';
}

export function normalizeOperationProperty(property: OwnedProperty): OwnedProperty {
  const listing = getListing(property.propertyId);
  return {
    ...property,
    occupancyStatus: property.occupancyStatus ?? (listing?.isHdb ? 'owner-occupied' : 'vacant'),
    conditionScore: property.conditionScore ?? 70,
    mopRemainingMonths: property.mopRemainingMonths ?? 0,
    completedRenovations: property.completedRenovations ?? [],
    openMaintenanceIssues: property.openMaintenanceIssues ?? [],
    rentStrategy: property.rentStrategy ?? property.tenant?.rentStrategy ?? 'market',
    floorPlanId: property.floorPlanId ?? deriveFloorPlanId(property),
    activeRenovation: property.activeRenovation
      ? {
          ...property.activeRenovation,
          contractorTier: property.activeRenovation.contractorTier ?? 'standard',
          projectedPaybackMonths: property.activeRenovation.projectedPaybackMonths ?? null,
        }
      : undefined,
  };
}

export function withOperationLog(
  player: Player,
  entry: Omit<PropertyOperationLogEntry, 'id' | 'turn'>,
): Player {
  const nextEntry: PropertyOperationLogEntry = {
    id: `op_${player.turnCount}_${(player.operationHistory ?? []).length}_${entry.propertyId ?? 'general'}`,
    turn: player.turnCount,
    ...entry,
  };

  return {
    ...player,
    operationHistory: [nextEntry, ...(player.operationHistory ?? [])].slice(0, OPERATION_HISTORY_LIMIT),
  };
}
