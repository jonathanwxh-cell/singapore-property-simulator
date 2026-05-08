import { getPropertyCategory, isResidentialCategory, properties, type Property } from '@/data/properties';
import type { OwnershipCampaignTrackId, OwnedProperty, Player } from '@/game/types';
import { getListingCatalog } from './listings';
import type { MonthlyIntentId } from './monthlyIntents';
import { getNextHomePlan } from './nextHomePlan';
import { getOwnershipCampaign } from './ownershipCampaign';

export type OwnershipForkId =
  | 'neighbour-referral'
  | 'starter-works-window'
  | 'bonus-season'
  | 'household-budget-talk'
  | 'launch-preview-weekend'
  | 'space-planning-talk'
  | 'valuation-window'
  | 'school-radius-pressure'
  | 'rate-check-window';

export interface OwnershipForkOption {
  id: OwnershipForkId;
  title: string;
  detail: string;
  payoff: string;
  tone: 'good' | 'warn' | 'neutral';
  intentId: Extract<MonthlyIntentId, 'landlord-ops' | 'mop-home-project' | 'mop-income-runway' | 'mop-market-intel'>;
  route: string;
  targetPropertyId: string | null;
}

export interface OwnershipForkPropertyEffect {
  propertyId: string;
  conditionDelta?: number;
  valueDeltaPct?: number;
  tenantSatisfactionDelta?: number;
}

export interface OwnershipForkEffect {
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  householdSupportDelta: number;
  note: string;
  campaignXp?: Partial<Record<OwnershipCampaignTrackId, number>>;
  propertyEffects?: OwnershipForkPropertyEffect[];
}

export interface NextHomeShortlistItem {
  propertyId: string;
  name: string;
  route: string;
  price: number;
  type: Property['type'];
  districtLabel: string;
  readinessPct: number;
  readinessLabel: 'Reachable' | 'Stretch' | 'Later';
}

const SHORTLIST_LIMIT = 3;
const NEXT_HOME_BUFFER = 20_000;

export function getOwnershipForkOptions(player: Player): OwnershipForkOption[] {
  const campaign = getOwnershipCampaign(player);
  if (!campaign.active || !campaign.activeChapter) return [];

  const currentHome = getPrimaryOwnedHome(player);
  const currentRoute = currentHome ? `/property/${currentHome.propertyId}` : '/portfolio';
  const shortlist = getNextHomeShortlist(player);
  const leadTarget = shortlist[0];
  const nextHomePlan = getNextHomePlan(player);
  const targetRoute = leadTarget?.route ?? nextHomePlan.targetRoute;
  const targetPropertyId = leadTarget?.propertyId ?? nextHomePlan.target.id;
  const targetName = leadTarget?.name ?? nextHomePlan.target.name;

  switch (campaign.activeChapter.id) {
    case 'settle-in':
      return [
        {
          id: 'neighbour-referral',
          title: 'Neighbour Referral',
          detail: 'A neighbour asks whether you would take a spare-room tenant. It is the fastest MOP-safe way to make the home start working.',
          payoff: 'Start the landlord loop with cleaner momentum and a small reputation lift.',
          tone: 'good',
          intentId: 'landlord-ops',
          route: currentRoute,
          targetPropertyId: currentHome?.propertyId ?? null,
        },
        {
          id: 'starter-works-window',
          title: 'Starter Works Window',
          detail: 'A short contractor slot opens up for touch-up works before the home starts showing more wear.',
          payoff: 'Trade a small cash cost for condition and exit-readiness improvement.',
          tone: 'neutral',
          intentId: 'mop-home-project',
          route: currentRoute,
          targetPropertyId: currentHome?.propertyId ?? null,
        },
      ];
    case 'stabilise-income':
      return [
        {
          id: 'bonus-season',
          title: 'Bonus Season',
          detail: 'A busier month at work could convert into extra runway if you lean into it instead of coasting.',
          payoff: 'Boost cash this month and bank stronger upgrade momentum.',
          tone: 'good',
          intentId: 'mop-income-runway',
          route: '/life',
          targetPropertyId: null,
        },
        {
          id: 'household-budget-talk',
          title: 'Household Budget Talk',
          detail: 'A frank money conversation could tighten recurring spending and free up more runway for the next home.',
          payoff: 'Stabilize stress while improving monthly savings discipline.',
          tone: 'neutral',
          intentId: 'mop-income-runway',
          route: '/life',
          targetPropertyId: null,
        },
      ];
    case 'prepare-upgrade':
      return [
        {
          id: 'launch-preview-weekend',
          title: 'Launch Preview Weekend',
          detail: `A preview weekend puts ${targetName} into focus so your next move stops feeling theoretical.`,
          payoff: 'Spend a little now to sharpen shortlist confidence and timing.',
          tone: 'good',
          intentId: 'mop-market-intel',
          route: targetRoute,
          targetPropertyId,
        },
        {
          id: 'space-planning-talk',
          title: 'Space Planning Talk',
          detail: 'The household starts talking about layout, commute, and the kind of next-home tradeoffs that matter most.',
          payoff: 'Translate vague upgrade desire into a clearer shortlist and home brief.',
          tone: 'neutral',
          intentId: 'mop-home-project',
          route: currentRoute,
          targetPropertyId: currentHome?.propertyId ?? null,
        },
      ];
    case 'line-up-exit':
      return [
        {
          id: 'valuation-window',
          title: 'Valuation Window',
          detail: 'Comparable sales and sentiment briefly line up, giving you a cleaner read on what the current home could unlock.',
          payoff: 'Improve exit confidence and nudge the home toward a stronger handoff.',
          tone: 'good',
          intentId: 'mop-market-intel',
          route: targetRoute,
          targetPropertyId,
        },
        player.children > 0 || player.buyerProfile?.householdProfile === 'multi-gen-family'
          ? {
              id: 'school-radius-pressure',
              title: 'School Radius Pressure',
              detail: 'School and caregiving distance suddenly matter more, forcing the shortlist to become practical rather than aspirational.',
              payoff: 'Adds urgency, but turns a fuzzy upgrade plan into a specific target zone.',
              tone: 'warn',
              intentId: 'mop-market-intel',
              route: targetRoute,
              targetPropertyId,
            }
          : {
              id: 'rate-check-window',
              title: 'Rate Check Window',
              detail: 'Lenders start hinting at a better borrowing window, making this a good month to pressure-test the move.',
              payoff: 'Lower noise around the exit plan and better confidence in timing.',
              tone: 'neutral',
              intentId: 'mop-market-intel',
              route: targetRoute,
              targetPropertyId,
            },
      ];
  }
}

export function getOwnershipForkEffect(player: Player, forkId: string | null | undefined): OwnershipForkEffect | null {
  if (!forkId) return null;

  const currentHome = getPrimaryOwnedHome(player);
  const leadTarget = getNextHomeShortlist(player)[0];
  const targetName = leadTarget?.name ?? getNextHomePlan(player).target.name;

  switch (forkId as OwnershipForkId) {
    case 'neighbour-referral':
      return {
        cashDelta: 250,
        energyDelta: -1,
        stressDelta: 0,
        reputationDelta: 2,
        householdSupportDelta: 0,
        note: 'A neighbour referral gave your landlord month a warmer starting point.',
        campaignXp: { 'home-readiness': 1 },
        propertyEffects: currentHome ? [{ propertyId: currentHome.propertyId, tenantSatisfactionDelta: 4 }] : [],
      };
    case 'starter-works-window':
      return {
        cashDelta: -450,
        energyDelta: -1,
        stressDelta: 1,
        reputationDelta: 0,
        householdSupportDelta: 0,
        note: 'You used a short works window to tidy the home before bigger moves.',
        campaignXp: { 'home-readiness': 1 },
        propertyEffects: currentHome ? [{ propertyId: currentHome.propertyId, conditionDelta: 4, valueDeltaPct: 0.6 }] : [],
      };
    case 'bonus-season':
      return {
        cashDelta: 900,
        energyDelta: -2,
        stressDelta: 2,
        reputationDelta: 1,
        householdSupportDelta: 0,
        note: 'A higher-intensity month converted into extra runway cash.',
        campaignXp: { 'income-runway': 1 },
      };
    case 'household-budget-talk':
      return {
        cashDelta: 400,
        energyDelta: 0,
        stressDelta: -4,
        reputationDelta: 0,
        householdSupportDelta: 4,
        note: 'A household budget reset freed up a bit more runway without adding risk.',
        campaignXp: { 'income-runway': 1 },
      };
    case 'launch-preview-weekend':
      return {
        cashDelta: -180,
        energyDelta: -2,
        stressDelta: 1,
        reputationDelta: 0,
        householdSupportDelta: 0,
        note: `A preview weekend sharpened your feel for ${targetName} and the timing around it.`,
        campaignXp: { 'exit-intel': 2 },
      };
    case 'space-planning-talk':
      return {
        cashDelta: 0,
        energyDelta: 0,
        stressDelta: -1,
        reputationDelta: 0,
        householdSupportDelta: 5,
        note: 'The household became more aligned on what the next home actually needs to solve.',
        campaignXp: { 'home-readiness': 1, 'exit-intel': 1 },
      };
    case 'valuation-window':
      return {
        cashDelta: 0,
        energyDelta: 0,
        stressDelta: -1,
        reputationDelta: 0,
        householdSupportDelta: 0,
        note: 'A cleaner valuation window improved your exit maths before the final stretch.',
        campaignXp: { 'exit-intel': 2 },
        propertyEffects: currentHome ? [{ propertyId: currentHome.propertyId, valueDeltaPct: 1.25 }] : [],
      };
    case 'school-radius-pressure':
      return {
        cashDelta: -120,
        energyDelta: -1,
        stressDelta: 3,
        reputationDelta: 0,
        householdSupportDelta: 2,
        note: 'School and commute pressure forced the shortlist to become more practical.',
        campaignXp: { 'exit-intel': 1, 'home-readiness': 1 },
      };
    case 'rate-check-window':
      return {
        cashDelta: 0,
        energyDelta: 0,
        stressDelta: -2,
        reputationDelta: 0,
        householdSupportDelta: 0,
        note: 'A calmer rate window made the exit plan feel more executable.',
        campaignXp: { 'exit-intel': 1 },
      };
    default:
      return null;
  }
}

export function getNextHomeShortlist(player: Player): NextHomeShortlistItem[] {
  const listingCatalog = getListingCatalog();
  const totalResources = getNextHomePlan(player).usableCashAndCpf;
  const shortlist: NextHomeShortlistItem[] = [];

  for (const propertyId of (player.nextHomeShortlistIds ?? []).slice(0, SHORTLIST_LIMIT)) {
    const listing = listingCatalog.find((candidate) => candidate.id === propertyId);
    if (!listing) continue;

    const required = estimateRequiredCashAndCpf(listing);
    const readinessPct = Math.min(100, Math.round((totalResources / Math.max(1, required)) * 100));
    shortlist.push({
      propertyId: listing.id,
      name: listing.name,
      route: `/property/${listing.id}`,
      price: listing.price,
      type: listing.type,
      districtLabel: `D${listing.districtId}`,
      readinessPct,
      readinessLabel: getReadinessLabel(readinessPct),
    });
  }

  return shortlist;
}

export function canToggleNextHomeShortlist(player: Player, propertyId: string): {
  allowed: boolean;
  reason?: string;
} {
  const listing = properties.find((candidate) => candidate.id === propertyId);
  if (!listing) return { allowed: false, reason: 'Property not found.' };
  if (!isResidentialCategory(listing.type)) return { allowed: false, reason: 'Use the shortlist for future homes, not commercial inventory.' };
  if (player.properties.some((ownedProperty) => ownedProperty.propertyId === propertyId)) {
    return { allowed: false, reason: 'Current holdings do not belong in the next-home shortlist.' };
  }

  const shortlist = player.nextHomeShortlistIds ?? [];
  if (shortlist.includes(propertyId)) return { allowed: true };
  if (shortlist.length >= SHORTLIST_LIMIT) {
    return { allowed: false, reason: 'Next-home shortlist is full.' };
  }

  return { allowed: true };
}

export function toggleShortlistIds(currentIds: string[] | undefined, propertyId: string): string[] {
  const shortlist = (currentIds ?? []).slice(0, SHORTLIST_LIMIT);
  if (shortlist.includes(propertyId)) {
    return shortlist.filter((id) => id !== propertyId);
  }
  if (shortlist.length >= SHORTLIST_LIMIT) {
    return shortlist;
  }
  return [...shortlist, propertyId];
}

function getPrimaryOwnedHome(player: Player): OwnedProperty | null {
  return player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0)
    ?? player.properties.find((property) => {
      const listing = properties.find((candidate) => candidate.id === property.propertyId);
      return Boolean(listing && isResidentialCategory(listing.type));
    })
    ?? null;
}

function estimateRequiredCashAndCpf(target: Property): number {
  const category = getPropertyCategory(target.type);
  const downPaymentPct = category === 'commercial' ? 0.35 : 0.25;
  const dutyAndFeesPct = category === 'commercial' ? 0.04 : 0.05;
  return Math.round(target.price * (downPaymentPct + dutyAndFeesPct) + NEXT_HOME_BUFFER);
}

function getReadinessLabel(readinessPct: number): NextHomeShortlistItem['readinessLabel'] {
  if (readinessPct >= 95) return 'Reachable';
  if (readinessPct >= 70) return 'Stretch';
  return 'Later';
}
