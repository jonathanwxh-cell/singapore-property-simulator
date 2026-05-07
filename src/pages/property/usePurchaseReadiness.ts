import { useMemo } from 'react';
import type { Player, MortgageFinancingMode } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';
import { computePurchaseReadiness, type PurchaseReadinessResult } from './purchaseReadiness';

export function usePurchaseReadiness(
  player: Player,
  property: ListingProperty | null | undefined,
  financingMode: MortgageFinancingMode,
  downPaymentPercent: number,
  useCpfOrdinary: boolean,
  isOwned: boolean,
  actionError: string | null,
): PurchaseReadinessResult | null {
  return useMemo(() => {
    if (!property) return null;
    return computePurchaseReadiness({ player, property, financingMode, downPaymentPercent, useCpfOrdinary, isOwned, actionError });
  }, [player, property, financingMode, downPaymentPercent, useCpfOrdinary, isOwned, actionError]);
}
