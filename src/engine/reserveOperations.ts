import type { Player, ReserveState } from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import { roundMoney } from '@/lib/format';
import { withOperationLog } from './operationsShared';
import { appendLifeMemory } from './lifetime/memories';

export interface ReservePlanInput {
  targetMonths: number;
  allocatedCash: number;
  autoTopUpPct: number;
}

export function createDefaultReserve(): ReserveState {
  return {
    targetMonths: 3,
    allocatedCash: 0,
    autoTopUpPct: 0,
  };
}

export function setReservePlanPure(
  player: Player,
  input: ReservePlanInput,
): ActionResult<{ player: Player }> {
  const targetMonths = Math.round(input.targetMonths);
  const allocatedCash = roundMoney(input.allocatedCash);
  const autoTopUpPct = Math.round(input.autoTopUpPct);

  if (targetMonths < 0 || allocatedCash < 0 || autoTopUpPct < 0 || autoTopUpPct > 100) {
    return fail('invalid_amount', 'Reserve target, allocation, and auto top-up must be valid positive values.');
  }
  if (allocatedCash > player.cash) {
    return fail('insufficient_cash', 'Reserve allocation cannot exceed available cash.');
  }

  let updatedPlayer = withOperationLog({
    ...player,
    reserve: {
      targetMonths,
      allocatedCash,
      autoTopUpPct,
      lastCoveredCost: player.reserve?.lastCoveredCost,
    },
  }, {
    title: 'Emergency reserve updated',
    detail: `S$${allocatedCash.toLocaleString()} marked as protected runway for property surprises.`,
    tone: allocatedCash > 0 ? 'good' : 'warn',
  });
  updatedPlayer = appendLifeMemory(updatedPlayer, {
    category: 'money',
    title: 'Emergency reserve updated',
    detail: `S$${allocatedCash.toLocaleString()} is now earmarked as protected runway for property surprises.`,
    tags: ['reserve-plan', allocatedCash > 0 ? 'protected-cash' : 'reserve-empty'],
    scoreImpact: allocatedCash > 0 ? 4 : -2,
  });

  return ok({ player: updatedPlayer });
}
