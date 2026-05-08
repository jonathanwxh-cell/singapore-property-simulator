import { HDB_MOP_MONTHS, TAKE_HOME_RATIO } from './constants';
import { getNextHomePlan } from './nextHomePlan';
import { getOwnershipCampaign } from './ownershipCampaign';
import { selectMonthlyNetCashflow, selectReservedCash } from './selectors';
import type {
  OwnershipCampaignTrackId,
  OwnershipChapterId,
  OwnedProperty,
  Player,
} from '@/game/types';

export type OwnershipMomentId =
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

export interface OwnershipMomentSignal {
  id: OwnershipMomentId;
  kind: 'pressure' | 'upside';
  title: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
  trackId: OwnershipCampaignTrackId;
}

export interface OwnershipBeatState {
  active: boolean;
  chapterId: OwnershipChapterId | null;
  cadenceMonths: number;
  beatIndex: number;
  monthsUntilNextBeat: number;
  headline: string | null;
  summary: string | null;
  signals: OwnershipMomentSignal[];
  notableKey: string | null;
}

export function getOwnershipBeatState(player: Player): OwnershipBeatState {
  const campaign = getOwnershipCampaign(player);
  if (!campaign.active || !campaign.activeChapter) {
    return {
      active: false,
      chapterId: null,
      cadenceMonths: 0,
      beatIndex: 0,
      monthsUntilNextBeat: 0,
      headline: null,
      summary: null,
      signals: [],
      notableKey: null,
    };
  }

  const chapterId = campaign.activeChapter.id;
  const holding = getPrimaryMopHolding(player);
  const mopRemainingMonths = holding?.mopRemainingMonths ?? 0;
  const elapsedMopMonths = Math.max(0, HDB_MOP_MONTHS - mopRemainingMonths);
  const cadenceMonths = getBeatCadenceMonths(chapterId);
  const beatIndex = Math.floor(elapsedMopMonths / cadenceMonths);
  const beatRemainder = elapsedMopMonths % cadenceMonths;
  const monthsUntilNextBeat = beatRemainder === 0 ? cadenceMonths : cadenceMonths - beatRemainder;
  const signals = getSignalsForChapter(player, chapterId, holding, beatIndex);

  return {
    active: true,
    chapterId,
    cadenceMonths,
    beatIndex,
    monthsUntilNextBeat,
    headline: `${campaign.activeChapter.label}: ${signals[0]?.title ?? 'Stay on plan'}`,
    summary: buildBeatSummary(campaign.activeChapter.label, signals),
    signals,
    notableKey: `${chapterId}:${beatIndex}:${signals.map((signal) => signal.id).join('|')}`,
  };
}

function getSignalsForChapter(
  player: Player,
  chapterId: OwnershipChapterId,
  holding: OwnedProperty | null,
  beatIndex: number,
): OwnershipMomentSignal[] {
  const pressure = getPressureSignal(player, chapterId, holding);
  const upside = getUpsideSignal(player, chapterId, holding, beatIndex);
  return [pressure, upside];
}

function getPressureSignal(
  player: Player,
  chapterId: OwnershipChapterId,
  holding: OwnedProperty | null,
): OwnershipMomentSignal {
  const reserveCash = selectReservedCash(player);
  const monthlyNetCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const hasShortlist = (player.nextHomeShortlistIds ?? []).length > 0;
  const isFamilyWeighted = player.children > 0 || player.buyerProfile?.householdProfile === 'multi-gen-family';
  const leaseEndingSoon = typeof holding?.tenant?.leaseEndTurn === 'number'
    && holding.tenant.leaseEndTurn - player.turnCount <= 2;

  switch (chapterId) {
    case 'settle-in':
      if (reserveCash < 5_000) {
        return {
          id: 'reserve-gap',
          kind: 'pressure',
          title: 'Reserve gap',
          detail: 'Your repair buffer is still thin, so one plumbing or vacancy surprise can stall the run.',
          tone: 'warn',
          trackId: 'income-runway',
        };
      }
      return {
        id: 'setup-fatigue',
        kind: 'pressure',
        title: 'Setup fatigue',
        detail: 'The home is stable, but the ownership loop still needs cleaner routines before it compounds well.',
        tone: 'neutral',
        trackId: 'home-readiness',
      };
    case 'stabilise-income':
      if (leaseEndingSoon) {
        return {
          id: 'renewal-cliff',
          kind: 'pressure',
          title: 'Renewal cliff',
          detail: 'A lease decision is getting close, so this chapter can become noisy if the tenant experience drifts.',
          tone: 'warn',
          trackId: 'home-readiness',
        };
      }
      return {
        id: 'burnout-squeeze',
        kind: 'pressure',
        title: player.life.stress >= 55 ? 'Burnout squeeze' : 'Savings squeeze',
        detail: player.life.stress >= 55
          ? 'You can keep pushing income, but stress is starting to eat into the quality of each month.'
          : monthlyNetCashflow < 1_800
            ? 'Monthly surplus still feels thin, so lifestyle creep can slow the next-home runway.'
            : 'The runway is growing, but it still needs discipline to become dependable.',
        tone: player.life.stress >= 55 ? 'warn' : 'neutral',
        trackId: 'income-runway',
      };
    case 'prepare-upgrade':
      if (!hasShortlist) {
        return {
          id: 'shortlist-blur',
          kind: 'pressure',
          title: 'Shortlist blur',
          detail: 'The upgrade dream is still too fuzzy. Without pinned targets, market study becomes easier to ignore.',
          tone: 'warn',
          trackId: 'exit-intel',
        };
      }
      return {
        id: 'space-pressure',
        kind: 'pressure',
        title: isFamilyWeighted ? 'Family space pressure' : 'Trade-off pressure',
        detail: isFamilyWeighted
          ? 'Space, commute, and caregiving constraints are turning the next-home choice into a practical decision.'
          : 'The next-home trade-offs are getting real, so layout and budget preferences need firmer edges.',
        tone: isFamilyWeighted ? 'warn' : 'neutral',
        trackId: 'exit-intel',
      };
    case 'line-up-exit':
      if (isFamilyWeighted) {
        return {
          id: 'school-deadline',
          kind: 'pressure',
          title: 'School-zone deadline',
          detail: 'School, family, and commuting needs are tightening the shortlist into a narrower timing window.',
          tone: 'warn',
          trackId: 'exit-intel',
        };
      }
      return {
        id: 'timing-nerve',
        kind: 'pressure',
        title: 'Timing nerves',
        detail: 'The final stretch is less about theory now and more about staying calm while the exit maths sharpen.',
        tone: 'neutral',
        trackId: 'exit-intel',
      };
  }
}

function getUpsideSignal(
  player: Player,
  chapterId: OwnershipChapterId,
  holding: OwnedProperty | null,
  beatIndex: number,
): OwnershipMomentSignal {
  const nextHomePlan = getNextHomePlan(player);
  const tenantHealthy = (holding?.tenant?.satisfaction ?? 0) >= 70;
  const shortlistCount = (player.nextHomeShortlistIds ?? []).length;

  switch (chapterId) {
    case 'settle-in':
      return beatIndex % 2 === 0
        ? {
            id: 'referral-tailwind',
            kind: 'upside',
            title: 'Referral tailwind',
            detail: 'Small social momentum around the home can make your first landlord-style decisions feel easier.',
            tone: 'good',
            trackId: 'home-readiness',
          }
        : {
            id: 'works-slot',
            kind: 'upside',
            title: 'Works slot',
            detail: 'A short contractor opening gives you a low-drama chance to improve condition before bigger wear sets in.',
            tone: 'good',
            trackId: 'home-readiness',
          };
    case 'stabilise-income':
      return tenantHealthy && beatIndex % 2 === 1
        ? {
            id: 'bonus-tailwind',
            kind: 'upside',
            title: 'Reliable month',
            detail: 'A steadier tenant and calmer life month give you a rare chance to bank clean runway progress.',
            tone: 'good',
            trackId: 'income-runway',
          }
        : {
            id: 'bonus-tailwind',
            kind: 'upside',
            title: 'Bonus tailwind',
            detail: 'Work and side income both have a higher-than-usual chance to convert effort into visible cash progress.',
            tone: 'good',
            trackId: 'income-runway',
          };
    case 'prepare-upgrade':
      return {
        id: 'district-preview',
        kind: 'upside',
        title: shortlistCount > 0 ? 'Target preview' : 'District preview',
        detail: shortlistCount > 0
          ? `One of your pinned targets is starting to feel like a real future move instead of a mood board.`
          : 'A few districts are giving cleaner signals, which makes this a good time to turn browsing into a shortlist.',
        tone: 'good',
        trackId: 'exit-intel',
      };
    case 'line-up-exit':
      if (nextHomePlan.readinessPct >= 75) {
        return {
          id: 'valuation-tailwind',
          kind: 'upside',
          title: 'Valuation tailwind',
          detail: 'Recent comps and a stronger current-home setup make the exit pathway look more executable.',
          tone: 'good',
          trackId: 'exit-intel',
        };
      }
      return {
        id: 'rate-window',
        kind: 'upside',
        title: 'Rate window',
        detail: 'Financing sentiment is briefly calmer, so pressure-testing the move now gives you cleaner decision signal.',
        tone: 'good',
        trackId: 'income-runway',
      };
  }
}

function getBeatCadenceMonths(chapterId: OwnershipChapterId): number {
  switch (chapterId) {
    case 'settle-in':
      return 2;
    case 'stabilise-income':
      return 3;
    case 'prepare-upgrade':
      return 4;
    case 'line-up-exit':
      return 2;
  }
}

function buildBeatSummary(chapterLabel: string, signals: OwnershipMomentSignal[]): string {
  if (signals.length === 0) return `${chapterLabel} still has room to compound.`;
  const pressure = signals.find((signal) => signal.kind === 'pressure');
  const upside = signals.find((signal) => signal.kind === 'upside');
  if (!pressure || !upside) return signals[0].detail;
  return `${pressure.title} is the friction. ${upside.title} is the upside if you lean into the month well.`;
}

function getPrimaryMopHolding(player: Player): OwnedProperty | null {
  return player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0) ?? null;
}
