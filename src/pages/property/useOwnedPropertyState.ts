import { useMemo } from 'react';
import type { Player, OwnedProperty } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';
import { getRenovationTemplatesForType } from '@/data/renovations';
import { getTenantLeaseOptions } from '@/engine/propertyOperations';
import { getFloorPlanSrc, getTenantPlans } from './propertyDetailFormatters';
import { selectReservedCash } from '@/engine/selectors';

export interface OwnedPropertyState {
  gain: number;
  gainPercent: number;
  renovationOptions: ReturnType<typeof getRenovationTemplatesForType>;
  tenantPlans: ReturnType<typeof getTenantPlans>;
  leaseOptions: ReturnType<typeof getTenantLeaseOptions>;
  leaseDecisionMadeThisTurn: boolean;
  propertyRepairExposure: number;
  reservedCash: number;
  propertyUnprotectedRisk: number;
  floorPlanSrc: string;
  quickRentalBlockedByMop: boolean;
}

export function useOwnedPropertyState(
  player: Player,
  property: ListingProperty | null | undefined,
  ownedProperty: OwnedProperty | null,
): OwnedPropertyState {
  return useMemo(() => {
    const gain = ownedProperty ? ownedProperty.currentValue - ownedProperty.purchasePrice : 0;
    const gainPercent = ownedProperty && ownedProperty.purchasePrice > 0
      ? (gain / ownedProperty.purchasePrice) * 100
      : 0;
    const renovationOptions = property ? getRenovationTemplatesForType(property.type) : [];
    const tenantPlans = property ? getTenantPlans({
      isHdb: property.isHdb,
      isCommercial: property.type.startsWith('Commercial'),
      mopRemainingMonths: ownedProperty?.mopRemainingMonths ?? 0,
    }) : [];
    const leaseOptions = ownedProperty ? getTenantLeaseOptions(ownedProperty, player.turnCount) : [];
    const leaseDecisionMadeThisTurn = ownedProperty?.tenant?.lastLeaseDecisionTurn === player.turnCount;
    const propertyRepairExposure = ownedProperty?.openMaintenanceIssues?.reduce((sum, issue) => sum + issue.estimatedCost, 0) ?? 0;
    const reservedCash = selectReservedCash(player);
    const propertyUnprotectedRisk = Math.max(0, propertyRepairExposure - reservedCash);
    const floorPlanSrc = getFloorPlanSrc(ownedProperty?.floorPlanId);
    const quickRentalBlockedByMop = Boolean(
      ownedProperty
        && property?.isHdb
        && !ownedProperty.isRented
        && (ownedProperty.mopRemainingMonths ?? 0) > 0
    );

    return {
      gain,
      gainPercent,
      renovationOptions,
      tenantPlans,
      leaseOptions,
      leaseDecisionMadeThisTurn,
      propertyRepairExposure,
      reservedCash,
      propertyUnprotectedRisk,
      floorPlanSrc,
      quickRentalBlockedByMop,
    };
  }, [player, property, ownedProperty]);
}
