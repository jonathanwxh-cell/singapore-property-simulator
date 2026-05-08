import { getPropertyCategory, isResidentialCategory, properties, type Property } from '@/data/properties';
import type { OwnershipCampaignTrackId, OwnedProperty, Player } from '@/game/types';
import { getListingCatalog } from './listings';
import type { MonthlyIntentId } from './monthlyIntents';
import { getOwnershipBeatState } from './ownershipMoments';
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
  | 'rate-check-window'
  | 'reserve-gap'
  | 'setup-fatigue'
  | 'renewal-cliff'
  | 'burnout-squeeze'
  | 'shortlist-blur'
  | 'space-pressure'
  | 'school-deadline'
  | 'timing-nerve'
  | 'referral-tailwind'
  | 'works-slot'
  | 'bonus-tailwind'
  | 'district-preview'
  | 'valuation-tailwind'
  | 'rate-window';

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

  const beatState = getOwnershipBeatState(player);
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
      return dedupeForks([
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
        createSignalFork(beatState.signals[0]?.id, currentRoute, targetRoute, targetPropertyId, currentHome?.propertyId ?? null),
      ]);
    case 'stabilise-income':
      return dedupeForks([
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
        createSignalFork(beatState.signals[0]?.id, currentRoute, targetRoute, targetPropertyId, currentHome?.propertyId ?? null),
      ]);
    case 'prepare-upgrade':
      return dedupeForks([
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
        createSignalFork(beatState.signals[0]?.id, currentRoute, targetRoute, targetPropertyId, currentHome?.propertyId ?? null),
      ]);
    case 'line-up-exit':
      return dedupeForks([
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
        createSignalFork(beatState.signals[0]?.id, currentRoute, targetRoute, targetPropertyId, currentHome?.propertyId ?? null),
      ]);
  }
}

export function getOwnershipForkEffect(player: Player, forkId: string | null | undefined): OwnershipForkEffect | null {
  if (!forkId) return null;
  const template = FORK_EFFECT_TEMPLATES[forkId as OwnershipForkId];
  if (!template) return null;

  const currentHome = getPrimaryOwnedHome(player);
  const leadTarget = getNextHomeShortlist(player)[0];
  const targetName = leadTarget?.name ?? getNextHomePlan(player).target.name;

  const note = typeof template.note === 'string' ? template.note : template.note({ targetName });
  const effect: OwnershipForkEffect = {
    cashDelta: template.cashDelta,
    energyDelta: template.energyDelta,
    stressDelta: template.stressDelta,
    reputationDelta: template.reputationDelta,
    householdSupportDelta: template.householdSupportDelta,
    note,
  };
  if (template.campaignXp) effect.campaignXp = template.campaignXp;
  if (template.propertyEffectFromHome) {
    effect.propertyEffects = currentHome
      ? [{ propertyId: currentHome.propertyId, ...template.propertyEffectFromHome }]
      : [];
  }
  return effect;
}

interface ForkEffectTemplate {
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  householdSupportDelta: number;
  note: string | ((ctx: { targetName: string }) => string);
  campaignXp?: Partial<Record<OwnershipCampaignTrackId, number>>;
  // Per-fork: when the player has a primary home, apply this delta to it.
  // Stored without `propertyId` so the table doesn't need access to player state.
  propertyEffectFromHome?: Omit<OwnershipForkPropertyEffect, 'propertyId'>;
}

const FORK_EFFECT_TEMPLATES: Record<OwnershipForkId, ForkEffectTemplate> = {
  'neighbour-referral': {
    cashDelta: 250, energyDelta: -1, stressDelta: 0, reputationDelta: 2, householdSupportDelta: 0,
    note: 'A neighbour referral gave your landlord month a warmer starting point.',
    campaignXp: { 'home-readiness': 1 },
    propertyEffectFromHome: { tenantSatisfactionDelta: 4 },
  },
  'starter-works-window': {
    cashDelta: -450, energyDelta: -1, stressDelta: 1, reputationDelta: 0, householdSupportDelta: 0,
    note: 'You used a short works window to tidy the home before bigger moves.',
    campaignXp: { 'home-readiness': 1 },
    propertyEffectFromHome: { conditionDelta: 4, valueDeltaPct: 0.6 },
  },
  'bonus-season': {
    cashDelta: 900, energyDelta: -2, stressDelta: 2, reputationDelta: 1, householdSupportDelta: 0,
    note: 'A higher-intensity month converted into extra runway cash.',
    campaignXp: { 'income-runway': 1 },
  },
  'household-budget-talk': {
    cashDelta: 400, energyDelta: 0, stressDelta: -4, reputationDelta: 0, householdSupportDelta: 4,
    note: 'A household budget reset freed up a bit more runway without adding risk.',
    campaignXp: { 'income-runway': 1 },
  },
  'launch-preview-weekend': {
    cashDelta: -180, energyDelta: -2, stressDelta: 1, reputationDelta: 0, householdSupportDelta: 0,
    note: ({ targetName }) => `A preview weekend sharpened your feel for ${targetName} and the timing around it.`,
    campaignXp: { 'exit-intel': 2 },
  },
  'space-planning-talk': {
    cashDelta: 0, energyDelta: 0, stressDelta: -1, reputationDelta: 0, householdSupportDelta: 5,
    note: 'The household became more aligned on what the next home actually needs to solve.',
    campaignXp: { 'home-readiness': 1, 'exit-intel': 1 },
  },
  'valuation-window': {
    cashDelta: 0, energyDelta: 0, stressDelta: -1, reputationDelta: 0, householdSupportDelta: 0,
    note: 'A cleaner valuation window improved your exit maths before the final stretch.',
    campaignXp: { 'exit-intel': 2 },
    propertyEffectFromHome: { valueDeltaPct: 1.25 },
  },
  'school-radius-pressure': {
    cashDelta: -120, energyDelta: -1, stressDelta: 3, reputationDelta: 0, householdSupportDelta: 2,
    note: 'School and commute pressure forced the shortlist to become more practical.',
    campaignXp: { 'exit-intel': 1, 'home-readiness': 1 },
  },
  'rate-check-window': {
    cashDelta: 0, energyDelta: 0, stressDelta: -2, reputationDelta: 0, householdSupportDelta: 0,
    note: 'A calmer rate window made the exit plan feel more executable.',
    campaignXp: { 'exit-intel': 1 },
  },
  'reserve-gap': {
    cashDelta: 320, energyDelta: -1, stressDelta: -2, reputationDelta: 0, householdSupportDelta: 1,
    note: 'You treated the month like a reserve catch-up push, which made the home feel safer to carry.',
    campaignXp: { 'income-runway': 1, 'home-readiness': 1 },
  },
  'setup-fatigue': {
    cashDelta: -120, energyDelta: 2, stressDelta: -3, reputationDelta: 0, householdSupportDelta: 2,
    note: 'You used the month to make ownership routines calmer instead of chasing more noise.',
    campaignXp: { 'home-readiness': 2 },
  },
  'renewal-cliff': {
    cashDelta: 280, energyDelta: -1, stressDelta: 1, reputationDelta: 1, householdSupportDelta: 0,
    note: 'You got ahead of the next lease conversation before it became a last-minute problem.',
    campaignXp: { 'home-readiness': 1, 'income-runway': 1 },
  },
  'burnout-squeeze': {
    cashDelta: 180, energyDelta: 4, stressDelta: -6, reputationDelta: 0, householdSupportDelta: 3,
    note: 'You reset the pace of the month so the runway kept growing without grinding yourself down.',
    campaignXp: { 'income-runway': 2 },
  },
  'shortlist-blur': {
    cashDelta: -90, energyDelta: -1, stressDelta: -1, reputationDelta: 0, householdSupportDelta: 1,
    note: 'You forced the market month to become a real shortlist decision instead of open-ended browsing.',
    campaignXp: { 'exit-intel': 2 },
  },
  'space-pressure': {
    cashDelta: -160, energyDelta: -1, stressDelta: 1, reputationDelta: 0, householdSupportDelta: 4,
    note: 'The household got more concrete about space needs, which made the upgrade plan sharper and more useful.',
    campaignXp: { 'home-readiness': 1, 'exit-intel': 1 },
  },
  'school-deadline': {
    cashDelta: -140, energyDelta: -1, stressDelta: 2, reputationDelta: 0, householdSupportDelta: 3,
    note: 'You turned school and commute pressure into a clearer target-zone decision rather than vague anxiety.',
    campaignXp: { 'exit-intel': 2 },
  },
  'timing-nerve': {
    cashDelta: 0, energyDelta: 1, stressDelta: -3, reputationDelta: 0, householdSupportDelta: 0,
    note: 'You used the month to pressure-test the move calmly, which made the exit plan feel less shaky.',
    campaignXp: { 'exit-intel': 2 },
  },
  'referral-tailwind': {
    cashDelta: 220, energyDelta: -1, stressDelta: -1, reputationDelta: 2, householdSupportDelta: 1,
    note: 'Warm local momentum made the month feel friendlier and easier to convert into ownership progress.',
    campaignXp: { 'home-readiness': 1 },
  },
  'works-slot': {
    cashDelta: -240, energyDelta: -1, stressDelta: 0, reputationDelta: 0, householdSupportDelta: 0,
    note: 'You used a rare contractor gap to improve the home before the next bigger decision window.',
    campaignXp: { 'home-readiness': 1, 'exit-intel': 1 },
    propertyEffectFromHome: { conditionDelta: 3, valueDeltaPct: 0.5 },
  },
  'bonus-tailwind': {
    cashDelta: 640, energyDelta: -2, stressDelta: 1, reputationDelta: 1, householdSupportDelta: 0,
    note: 'A stronger-than-usual month at work and on the side gave your runway a satisfying bump.',
    campaignXp: { 'income-runway': 2 },
  },
  'district-preview': {
    cashDelta: -150, energyDelta: -1, stressDelta: 0, reputationDelta: 0, householdSupportDelta: 2,
    note: ({ targetName }) => `You spent the month turning district vibes into a more believable next-home plan around ${targetName}.`,
    campaignXp: { 'exit-intel': 2 },
  },
  'valuation-tailwind': {
    cashDelta: 0, energyDelta: 0, stressDelta: -2, reputationDelta: 0, householdSupportDelta: 0,
    note: 'A friendlier valuation read made the final MOP stretch feel more like execution than hope.',
    campaignXp: { 'exit-intel': 2 },
    propertyEffectFromHome: { valueDeltaPct: 0.9 },
  },
  'rate-window': {
    cashDelta: 0, energyDelta: 1, stressDelta: -2, reputationDelta: 0, householdSupportDelta: 0,
    note: 'A calmer financing window gave you space to think more clearly about the move.',
    campaignXp: { 'income-runway': 1, 'exit-intel': 1 },
  },
};

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

function createSignalFork(
  signalId: OwnershipForkId | undefined,
  currentRoute: string,
  targetRoute: string,
  targetPropertyId: string | null,
  currentPropertyId: string | null,
): OwnershipForkOption | null {
  switch (signalId) {
    case 'reserve-gap':
      return {
        id: signalId,
        title: 'Reserve Catch-Up',
        detail: 'Use this month to rebuild the first emergency buffer instead of letting the home sit one repair away from stress.',
        payoff: 'More stable runway and less chance that a small issue derails the chapter.',
        tone: 'warn',
        intentId: 'mop-income-runway',
        route: '/life',
        targetPropertyId: null,
      };
    case 'setup-fatigue':
      return {
        id: signalId,
        title: 'Ownership Reset',
        detail: 'Keep the month lighter and tidy the home-life routine so ownership feels manageable instead of noisy.',
        payoff: 'Better home-readiness without needing a dramatic move.',
        tone: 'neutral',
        intentId: 'mop-home-project',
        route: currentRoute,
        targetPropertyId: currentPropertyId,
      };
    case 'renewal-cliff':
      return {
        id: signalId,
        title: 'Lease Terms Window',
        detail: 'Get ahead of the next lease conversation before timing pressure makes the decision worse.',
        payoff: 'Protect rental continuity and reduce landlord friction.',
        tone: 'warn',
        intentId: 'landlord-ops',
        route: currentRoute,
        targetPropertyId: currentPropertyId,
      };
    case 'burnout-squeeze':
      return {
        id: signalId,
        title: 'Runway Without Burnout',
        detail: 'Rebalance the month so the cash plan still grows without pushing energy into the floor.',
        payoff: 'A safer surplus month with less emotional drag.',
        tone: 'neutral',
        intentId: 'mop-income-runway',
        route: '/life',
        targetPropertyId: null,
      };
    case 'shortlist-blur':
      return {
        id: signalId,
        title: 'Shortlist Sprint',
        detail: 'Turn vague browsing into a real shortlist so MOP prep has somewhere concrete to point.',
        payoff: 'Sharper exit-intel and better target confidence.',
        tone: 'warn',
        intentId: 'mop-market-intel',
        route: '/properties',
        targetPropertyId: null,
      };
    case 'space-pressure':
      return {
        id: signalId,
        title: 'Space Rehearsal',
        detail: 'Use the month to pressure-test whether the current home is still solving the household the right way.',
        payoff: 'Clearer upgrade brief and less fuzzy family pressure later.',
        tone: 'neutral',
        intentId: 'mop-home-project',
        route: currentRoute,
        targetPropertyId: currentPropertyId,
      };
    case 'school-deadline':
      return {
        id: signalId,
        title: 'School Zone Commit',
        detail: 'Treat school and commute needs as a design constraint now, not a panic closer to exit.',
        payoff: 'A narrower but much more realistic target zone.',
        tone: 'warn',
        intentId: 'mop-market-intel',
        route: targetRoute,
        targetPropertyId,
      };
    case 'timing-nerve':
      return {
        id: signalId,
        title: 'Exit Dry Run',
        detail: 'Run the move like a rehearsal so you know what still feels fragile before MOP unlocks.',
        payoff: 'Lower stress and stronger exit confidence.',
        tone: 'neutral',
        intentId: 'mop-market-intel',
        route: targetRoute,
        targetPropertyId,
      };
    default:
      return null;
  }
}

function dedupeForks(options: Array<OwnershipForkOption | null>): OwnershipForkOption[] {
  const next: OwnershipForkOption[] = [];
  for (const option of options) {
    if (!option) continue;
    if (next.some((candidate) => candidate.id === option.id)) continue;
    next.push(option);
  }
  return next.slice(0, 3);
}
