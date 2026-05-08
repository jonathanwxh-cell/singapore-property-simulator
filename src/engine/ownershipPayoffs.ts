import type { Player } from '@/game/types';
import { getNextHomePlan } from './nextHomePlan';
import { selectMonthlyOwnershipCosts, selectReservedCash } from './selectors';
import { getOwnershipTargetRace } from './ownershipTargets';

export type OwnershipPayoffId =
  | 'reserve-secured'
  | 'rental-loop-stable'
  | 'shortlist-locked'
  | 'exit-on-pace'
  | 'lead-target-reachable';

export interface OwnershipPayoff {
  id: OwnershipPayoffId;
  label: string;
  detail: string;
}

export interface OwnershipPayoffState {
  active: boolean;
  activePayoffs: OwnershipPayoff[];
  nextPayoff: OwnershipPayoff | null;
  notableKey: string | null;
}

const PAYOFF_ORDER: OwnershipPayoffId[] = [
  'reserve-secured',
  'rental-loop-stable',
  'shortlist-locked',
  'exit-on-pace',
  'lead-target-reachable',
];

const PAYOFFS: Record<OwnershipPayoffId, OwnershipPayoff> = {
  'reserve-secured': {
    id: 'reserve-secured',
    label: 'Reserve secured',
    detail: 'The home can absorb small shocks more safely now.',
  },
  'rental-loop-stable': {
    id: 'rental-loop-stable',
    label: 'Rental loop stable',
    detail: 'Tenant operations are calm enough to fund the next move instead of distracting from it.',
  },
  'shortlist-locked': {
    id: 'shortlist-locked',
    label: 'Shortlist locked',
    detail: 'You now have a real next-home race instead of open-ended browsing.',
  },
  'exit-on-pace': {
    id: 'exit-on-pace',
    label: 'Exit route on pace',
    detail: 'At the current pace, the move can line up with the MOP timeline instead of trailing it.',
  },
  'lead-target-reachable': {
    id: 'lead-target-reachable',
    label: 'Lead target reachable',
    detail: 'The numbers now support a serious move soon if timing and life conditions hold.',
  },
};

export function getOwnershipPayoffState(player: Player): OwnershipPayoffState {
  const nextHomePlan = getNextHomePlan(player);
  if (player.properties.length === 0 || nextHomePlan.phase === 'pre-owner') {
    return {
      active: false,
      activePayoffs: [],
      nextPayoff: null,
      notableKey: null,
    };
  }

  const targetRace = getOwnershipTargetRace(player);
  const activeIds = new Set<OwnershipPayoffId>();
  const ownershipCostBuffer = Math.max(5_000, Math.round(selectMonthlyOwnershipCosts(player) * 3));
  const residentialHolding = player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0)
    ?? player.properties.find((property) => Boolean(property.tenant || property.occupancyStatus));

  if (selectReservedCash(player) >= ownershipCostBuffer) activeIds.add('reserve-secured');
  if (
    residentialHolding?.tenant
    && residentialHolding.tenant.satisfaction >= 70
    && (residentialHolding.openMaintenanceIssues?.length ?? 0) === 0
  ) {
    activeIds.add('rental-loop-stable');
  }
  if ((player.nextHomeShortlistIds ?? []).length >= 2) activeIds.add('shortlist-locked');
  if (
    nextHomePlan.phase === 'active-mop'
    && nextHomePlan.projectedReadyInMonths !== null
    && nextHomePlan.projectedReadyInMonths <= nextHomePlan.mopMonthsRemaining
  ) {
    activeIds.add('exit-on-pace');
  }
  if (targetRace.lead?.readinessPct !== undefined && targetRace.lead.readinessPct >= 95) {
    activeIds.add('lead-target-reachable');
  }

  const activePayoffs = PAYOFF_ORDER.filter((id) => activeIds.has(id)).map((id) => PAYOFFS[id]);
  const nextPayoff = PAYOFF_ORDER.map((id) => PAYOFFS[id]).find((payoff) => !activeIds.has(payoff.id)) ?? null;

  return {
    active: true,
    activePayoffs,
    nextPayoff,
    notableKey: `${activePayoffs.map((payoff) => payoff.id).join('|')}>${nextPayoff?.id ?? 'complete'}`,
  };
}

export function getOwnershipPayoffTransitions(before: Player, after: Player): OwnershipPayoff[] {
  const beforeState = getOwnershipPayoffState(before);
  const afterState = getOwnershipPayoffState(after);
  const beforeIds = new Set(beforeState.activePayoffs.map((payoff) => payoff.id));

  return afterState.activePayoffs.filter((payoff) => !beforeIds.has(payoff.id));
}
