import { getPropertyCategory, isResidentialCategory, properties, type Property } from '@/data/properties';
import type { Player } from '@/game/types';
import { getNextHomePlan } from './nextHomePlan';

export interface OwnershipTargetRaceTarget {
  propertyId: string;
  name: string;
  route: string;
  type: Property['type'];
  price: number;
  districtLabel: string;
  readinessPct: number;
  urgencyLabel: 'Window Open' | 'Watch Closely' | 'Stretch' | 'Drifting';
  fitLabel: string;
}

export interface OwnershipTargetRace {
  active: boolean;
  lead: OwnershipTargetRaceTarget | null;
  challenger: OwnershipTargetRaceTarget | null;
  summary: string | null;
  notableKey: string | null;
}

const MIN_RACE_SHORTLIST = 2;

export function getOwnershipTargetRace(player: Player): OwnershipTargetRace {
  const nextHomePlan = getNextHomePlan(player);
  if (player.properties.length === 0 || nextHomePlan.phase === 'pre-owner') {
    return {
      active: false,
      lead: null,
      challenger: null,
      summary: null,
      notableKey: null,
    };
  }

  const currentPropertyIds = new Set(player.properties.map((property) => property.propertyId));
  const shortlisted = (player.nextHomeShortlistIds ?? [])
    .map((propertyId) => properties.find((property) => property.id === propertyId) ?? null)
    .filter((property): property is Property => Boolean(property && isResidentialCategory(property.type) && !currentPropertyIds.has(property.id)));

  const leadListing = shortlisted[0] ?? nextHomePlan.target;
  const challengerListing = shortlisted[1]
    ?? getFallbackChallenger(leadListing, currentPropertyIds, player);

  const lead = toTargetRaceTarget(leadListing, nextHomePlan, player);
  const challenger = challengerListing ? toTargetRaceTarget(challengerListing, nextHomePlan, player) : null;
  const summary = buildTargetRaceSummary(lead, challenger, player.nextHomeShortlistIds?.length ?? 0);

  return {
    active: true,
    lead,
    challenger,
    summary,
    notableKey: [
      lead.propertyId,
      lead.urgencyLabel,
      lead.fitLabel,
      challenger?.propertyId ?? 'none',
      challenger?.urgencyLabel ?? 'none',
    ].join('|'),
  };
}

function toTargetRaceTarget(target: Property, nextHomePlan: ReturnType<typeof getNextHomePlan>, player: Player): OwnershipTargetRaceTarget {
  const requiredResources = estimateRequiredCashAndCpf(target);
  const readinessPct = Math.min(100, Math.round((nextHomePlan.usableCashAndCpf / Math.max(1, requiredResources)) * 100));

  return {
    propertyId: target.id,
    name: target.name,
    route: `/property/${target.id}`,
    type: target.type,
    price: target.price,
    districtLabel: `D${target.districtId}`,
    readinessPct,
    urgencyLabel: getUrgencyLabel(nextHomePlan.phase, nextHomePlan.mopMonthsRemaining, readinessPct),
    fitLabel: getFitLabel(player, target),
  };
}

function estimateRequiredCashAndCpf(target: Property): number {
  const category = getPropertyCategory(target.type);
  const downPaymentPct = category === 'commercial' ? 0.35 : 0.25;
  const dutyAndFeesPct = category === 'commercial' ? 0.04 : 0.05;
  return Math.round(target.price * (downPaymentPct + dutyAndFeesPct) + 20_000);
}

function getUrgencyLabel(
  phase: ReturnType<typeof getNextHomePlan>['phase'],
  mopMonthsRemaining: number,
  readinessPct: number,
): OwnershipTargetRaceTarget['urgencyLabel'] {
  if ((phase !== 'active-mop' || mopMonthsRemaining <= 6) && readinessPct >= 95) return 'Window Open';
  if (phase === 'active-mop' && mopMonthsRemaining <= 12 && readinessPct >= 70) return 'Watch Closely';
  if (readinessPct >= 60) return 'Stretch';
  return 'Drifting';
}

function getFitLabel(player: Player, target: Property): string {
  const category = getPropertyCategory(target.type);
  const household = player.buyerProfile?.householdProfile;

  if (player.runRouteId === 'senior-rightsizer') return 'Lower-friction rightsize';
  if (player.children > 0 || household === 'multi-gen-family') {
    return category === 'hdb' ? 'Budget family fit' : 'Space + commute fit';
  }
  if (household === 'single-under-35' || household === 'single-35-plus') {
    return category === 'hdb' ? 'Solo affordability fit' : 'Upgrade independence fit';
  }
  if (category === 'ec' || target.type === 'Private Condo') return 'Upgrade comfort fit';
  if (category === 'hdb') return 'Cashflow-safe fit';
  return 'Yield and flexibility fit';
}

function buildTargetRaceSummary(
  lead: OwnershipTargetRaceTarget,
  challenger: OwnershipTargetRaceTarget | null,
  shortlistCount: number,
): string {
  if (!challenger) {
    return shortlistCount >= MIN_RACE_SHORTLIST
      ? `${lead.name} is the current lead target. The rest of the shortlist still needs a stronger challenger.`
      : `${lead.name} is the current lead target. Pin one more realistic rival so the next-home plan becomes a real race.`;
  }

  return `${lead.name} is the lead because of its ${lead.fitLabel.toLowerCase()}, while ${challenger.name} stays alive if your timing or budget shifts.`;
}

function getFallbackChallenger(
  leadTarget: Property,
  currentPropertyIds: Set<string>,
  player: Player,
): Property | null {
  const household = player.buyerProfile?.householdProfile;
  const candidates = properties
    .filter((property) => (
      property.id !== leadTarget.id
      && !currentPropertyIds.has(property.id)
      && isResidentialCategory(property.type)
    ))
    .filter((property) => {
      if (household === 'multi-gen-family' || player.children > 0) {
        return property.price <= leadTarget.price * 1.18;
      }
      return property.price <= leadTarget.price * 1.12 || property.price >= leadTarget.price * 0.9;
    })
    .sort((left, right) => {
      const priceDelta = Math.abs(left.price - leadTarget.price) - Math.abs(right.price - leadTarget.price);
      if (priceDelta !== 0) return priceDelta;

      const sameCategoryLeft = Number(getPropertyCategory(left.type) === getPropertyCategory(leadTarget.type));
      const sameCategoryRight = Number(getPropertyCategory(right.type) === getPropertyCategory(leadTarget.type));
      return sameCategoryRight - sameCategoryLeft;
    });

  return candidates[0] ?? null;
}
