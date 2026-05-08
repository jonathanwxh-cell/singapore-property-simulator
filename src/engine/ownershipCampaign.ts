import type {
  MonthlyIntentTrack,
  OwnershipCampaignProgressState,
  OwnershipCampaignTrackId,
  OwnershipChapterId,
  OwnedProperty,
  Player,
  PlayerLifeState,
} from '@/game/types';
import { createInitialOwnershipCampaignProgressState } from '@/game/types';
import { TAKE_HOME_RATIO } from './constants';
import { getNextHomePlan } from './nextHomePlan';
import { selectMonthlyNetCashflow, selectReservedCash } from './selectors';

export interface OwnershipCampaignTrack {
  id: OwnershipCampaignTrackId;
  label: string;
  detail: string;
  progressPct: number;
  tier: number;
  xp: number;
}

export interface OwnershipCampaignChapter {
  id: OwnershipChapterId;
  label: string;
  objective: string;
  milestoneLabel: string;
  progressPct: number;
  completed: boolean;
  activeTrackIds: OwnershipCampaignTrackId[];
}

export interface OwnershipCampaign {
  active: boolean;
  title: string | null;
  summary: string | null;
  activeChapter: OwnershipCampaignChapter | null;
  chapters: OwnershipCampaignChapter[];
  tracks: OwnershipCampaignTrack[];
}

const TRACK_XP_GOAL = 8;

const CHAPTER_LABELS: Record<OwnershipChapterId, string> = {
  'settle-in': 'Settle In',
  'stabilise-income': 'Stabilise Income',
  'prepare-upgrade': 'Prepare Upgrade',
  'line-up-exit': 'Line Up Exit',
};

const CHAPTER_OBJECTIVES: Record<OwnershipChapterId, string> = {
  'settle-in': 'Get the home operational with reserve cover, livable condition, and a productive occupancy plan.',
  'stabilise-income': 'Turn ownership into reliable runway so the next-home plan is funded instead of hoped for.',
  'prepare-upgrade': 'Improve the current home and sharpen the shortlist before the MOP exit sneaks up on you.',
  'line-up-exit': 'Treat each month like an execution window and tighten timing, condition, and upgrade confidence.',
};

const CHAPTER_MILESTONES: Record<OwnershipChapterId, string> = {
  'settle-in': 'Reserve and room-rental basics online',
  'stabilise-income': 'Monthly runway strong enough to compound',
  'prepare-upgrade': 'Upgrade shortlist and home-readiness aligned',
  'line-up-exit': 'Exit route pressure-tested before MOP unlock',
};

const TRACK_LABELS: Record<OwnershipCampaignTrackId, string> = {
  'income-runway': 'Income Runway',
  'home-readiness': 'Home Readiness',
  'exit-intel': 'Exit Intel',
};

const TRACK_DETAILS: Record<OwnershipCampaignTrackId, string> = {
  'income-runway': 'Monthly buffer, reserve depth, and buying-power momentum',
  'home-readiness': 'Tenant setup, reserve protection, condition, and basic ops stability',
  'exit-intel': 'Upgrade timing, shortlist confidence, and late-MOP execution readiness',
};

export function getOwnershipCampaign(player: Player): OwnershipCampaign {
  const nextHomePlan = getNextHomePlan(player);
  if (nextHomePlan.phase !== 'active-mop') {
    return {
      active: false,
      title: null,
      summary: null,
      activeChapter: null,
      chapters: [],
      tracks: [],
    };
  }

  const holding = getPrimaryMopHolding(player);
  const progress = normalizeOwnershipCampaignProgress(player.life.ownershipCampaign);
  const monthlySavingsRate = Math.max(0, selectMonthlyNetCashflow(player, TAKE_HOME_RATIO) + Math.max(0, player.life.lastMonthSummary?.cashDelta ?? 0));
  const reserveCash = selectReservedCash(player);
  const homeReadinessPct = getHomeReadinessPct(holding, reserveCash, progress);
  const incomeRunwayPct = getIncomeRunwayPct(player, nextHomePlan.readinessPct, reserveCash, monthlySavingsRate, progress);
  const exitIntelPct = getExitIntelPct(nextHomePlan.readinessPct, nextHomePlan.mopProgressPct, reserveCash, progress);
  const hasTenant = Boolean(holding?.tenant);
  const chapterId = resolveActiveChapter({
    hasTenant,
    reserveCash,
    homeReadinessPct,
    incomeRunwayPct,
    exitIntelPct,
    monthlySavingsRate,
    mopMonthsRemaining: nextHomePlan.mopMonthsRemaining,
    readinessPct: nextHomePlan.readinessPct,
  });
  const orderedTrackIds = getOrderedTrackIds(chapterId);
  const chapterProgressPct = getChapterProgressPct({
    chapterId,
    hasTenant,
    reserveCash,
    homeReadinessPct,
    incomeRunwayPct,
    exitIntelPct,
    readinessPct: nextHomePlan.readinessPct,
    mopMonthsRemaining: nextHomePlan.mopMonthsRemaining,
    monthlySavingsRate,
  });

  const tracks = orderedTrackIds.map((trackId) => {
    const xp = getTrackXp(progress, trackId);
    const progressPct = trackId === 'income-runway'
      ? incomeRunwayPct
      : trackId === 'home-readiness'
        ? homeReadinessPct
        : exitIntelPct;
    return {
      id: trackId,
      label: TRACK_LABELS[trackId],
      detail: TRACK_DETAILS[trackId],
      progressPct,
      tier: getTrackTier(progressPct),
      xp,
    };
  });

  const chapterOrder: OwnershipChapterId[] = ['settle-in', 'stabilise-income', 'prepare-upgrade', 'line-up-exit'];
  const activeIndex = chapterOrder.indexOf(chapterId);
  const chapters = chapterOrder.map((id, index) => ({
    id,
    label: CHAPTER_LABELS[id],
    objective: CHAPTER_OBJECTIVES[id],
    milestoneLabel: CHAPTER_MILESTONES[id],
    progressPct: index < activeIndex ? 100 : index === activeIndex ? chapterProgressPct : 0,
    completed: index < activeIndex,
    activeTrackIds: getOrderedTrackIds(id),
  }));

  return {
    active: true,
    title: CHAPTER_LABELS[chapterId],
    summary: CHAPTER_OBJECTIVES[chapterId],
    activeChapter: chapters[activeIndex] ?? null,
    chapters,
    tracks,
  };
}

export function applyOwnershipCampaignProgress(
  player: Player,
  nextLife: PlayerLifeState,
  notes: string[],
) {
  const beforeCampaign = getOwnershipCampaign(player);
  if (!beforeCampaign.active) return;

  const targetTrackId = mapIntentTrackToCampaignTrack(player.life.selectedMonthlyIntentTrack);
  if (!targetTrackId) return;

  const gain = 2;
  const beforeTrack = beforeCampaign.tracks.find((track) => track.id === targetTrackId);
  if (!beforeTrack) return;

  const current = normalizeOwnershipCampaignProgress(nextLife.ownershipCampaign);
  nextLife.ownershipCampaign = {
    ...current,
    [getProgressField(targetTrackId)]: current[getProgressField(targetTrackId)] + gain,
  };

  const afterCampaign = getOwnershipCampaign({
    ...player,
    life: {
      ...nextLife,
      selectedMonthlyIntentId: player.life.selectedMonthlyIntentId,
      selectedMonthlyIntentLabel: player.life.selectedMonthlyIntentLabel,
      selectedMonthlyIntentTrack: player.life.selectedMonthlyIntentTrack,
    },
  });
  const afterTrack = afterCampaign.tracks.find((track) => track.id === targetTrackId);
  if (!afterTrack) return;

  notes.push(getProgressNote(targetTrackId, gain));
  if (afterCampaign.activeChapter?.id !== beforeCampaign.activeChapter?.id && afterCampaign.activeChapter) {
    notes.push(`${afterCampaign.activeChapter.label} chapter is now live.`);
    return;
  }

  if (afterTrack.tier > beforeTrack.tier) {
    notes.push(`${afterTrack.label} reached ${getTierLabel(afterTrack.tier)}.`);
  }
}

export function getOwnershipTrackTierKey(player: Player): string {
  const campaign = getOwnershipCampaign(player);
  if (!campaign.active) return 'inactive';
  return campaign.tracks.map((track) => `${track.id}:${track.tier}`).join('|');
}

function normalizeOwnershipCampaignProgress(progress: OwnershipCampaignProgressState | undefined): OwnershipCampaignProgressState {
  return {
    ...createInitialOwnershipCampaignProgressState(),
    ...progress,
  };
}

function getPrimaryMopHolding(player: Player): OwnedProperty | null {
  return player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0) ?? null;
}

function getHomeReadinessPct(
  holding: OwnedProperty | null,
  reserveCash: number,
  progress: OwnershipCampaignProgressState,
): number {
  const xpPct = Math.min(100, Math.round((progress.homeReadinessXp / TRACK_XP_GOAL) * 100));
  const reservePct = Math.min(18, Math.round((reserveCash / 5_000) * 18));
  const tenantPct = holding?.tenant ? 28 : 0;
  const maintenancePct = (holding?.openMaintenanceIssues?.length ?? 0) > 0 ? 6 : 14;
  const conditionPct = Math.round(((holding?.conditionScore ?? 70) / 100) * 24);
  const upgradePct = holding?.activeRenovation || (holding?.completedRenovations?.length ?? 0) > 0 ? 16 : 0;
  return clampPct(Math.max(xpPct, reservePct + tenantPct + maintenancePct + conditionPct + upgradePct));
}

function getIncomeRunwayPct(
  player: Player,
  readinessPct: number,
  reserveCash: number,
  monthlySavingsRate: number,
  progress: OwnershipCampaignProgressState,
): number {
  const xpPct = Math.min(100, Math.round((progress.incomeRunwayXp / TRACK_XP_GOAL) * 100));
  const reservePct = Math.min(20, Math.round((reserveCash / 10_000) * 20));
  const savingsPct = Math.min(45, Math.round((Math.max(0, monthlySavingsRate) / 3_500) * 45));
  const readinessAssist = Math.round(readinessPct * 0.25);
  const cpfAssist = Math.min(10, Math.round((player.cpfOrdinary / 80_000) * 10));
  return clampPct(Math.max(xpPct, reservePct + savingsPct + readinessAssist + cpfAssist));
}

function getExitIntelPct(
  readinessPct: number,
  mopProgressPct: number,
  reserveCash: number,
  progress: OwnershipCampaignProgressState,
): number {
  const xpPct = Math.min(100, Math.round((progress.exitIntelXp / TRACK_XP_GOAL) * 100));
  const readinessAssist = Math.round(readinessPct * 0.35);
  const timelineAssist = Math.round(mopProgressPct * 0.25);
  const reserveAssist = reserveCash >= 10_000 ? 10 : 4;
  return clampPct(Math.max(xpPct, readinessAssist + timelineAssist + reserveAssist));
}

function resolveActiveChapter({
  hasTenant,
  reserveCash,
  homeReadinessPct,
  incomeRunwayPct,
  exitIntelPct,
  monthlySavingsRate,
  mopMonthsRemaining,
  readinessPct,
}: {
  hasTenant: boolean;
  reserveCash: number;
  homeReadinessPct: number;
  incomeRunwayPct: number;
  exitIntelPct: number;
  monthlySavingsRate: number;
  mopMonthsRemaining: number;
  readinessPct: number;
}): OwnershipChapterId {
  if (!hasTenant || reserveCash < 5_000 || homeReadinessPct < 55) return 'settle-in';
  if (mopMonthsRemaining <= 12 || (readinessPct >= 65 && exitIntelPct >= 70)) return 'line-up-exit';
  if (incomeRunwayPct < 60 || monthlySavingsRate < 2_000) return 'stabilise-income';
  return 'prepare-upgrade';
}

function getOrderedTrackIds(chapterId: OwnershipChapterId): OwnershipCampaignTrackId[] {
  switch (chapterId) {
    case 'settle-in':
      return ['home-readiness', 'income-runway', 'exit-intel'];
    case 'stabilise-income':
      return ['income-runway', 'home-readiness', 'exit-intel'];
    case 'prepare-upgrade':
      return ['home-readiness', 'exit-intel', 'income-runway'];
    case 'line-up-exit':
      return ['exit-intel', 'home-readiness', 'income-runway'];
  }
}

function getChapterProgressPct({
  chapterId,
  hasTenant,
  reserveCash,
  homeReadinessPct,
  incomeRunwayPct,
  exitIntelPct,
  readinessPct,
  mopMonthsRemaining,
  monthlySavingsRate,
}: {
  chapterId: OwnershipChapterId;
  hasTenant: boolean;
  reserveCash: number;
  homeReadinessPct: number;
  incomeRunwayPct: number;
  exitIntelPct: number;
  readinessPct: number;
  mopMonthsRemaining: number;
  monthlySavingsRate: number;
}): number {
  switch (chapterId) {
    case 'settle-in':
      return clampPct(Math.round(((hasTenant ? 100 : 0) + Math.min(100, (reserveCash / 5_000) * 100) + homeReadinessPct) / 3));
    case 'stabilise-income':
      return clampPct(Math.round((incomeRunwayPct + Math.min(100, (monthlySavingsRate / 3_000) * 100) + readinessPct) / 3));
    case 'prepare-upgrade':
      return clampPct(Math.round((homeReadinessPct + exitIntelPct + readinessPct) / 3));
    case 'line-up-exit': {
      const timelinePct = clampPct(Math.round(((12 - mopMonthsRemaining) / 12) * 100));
      return clampPct(Math.round((exitIntelPct + readinessPct + timelinePct) / 3));
    }
  }
}

function getTrackXp(progress: OwnershipCampaignProgressState, trackId: OwnershipCampaignTrackId): number {
  return progress[getProgressField(trackId)];
}

function getProgressField(trackId: OwnershipCampaignTrackId): keyof OwnershipCampaignProgressState {
  switch (trackId) {
    case 'income-runway':
      return 'incomeRunwayXp';
    case 'home-readiness':
      return 'homeReadinessXp';
    case 'exit-intel':
      return 'exitIntelXp';
  }
}

function mapIntentTrackToCampaignTrack(track: MonthlyIntentTrack | null): OwnershipCampaignTrackId | null {
  switch (track) {
    case 'income':
    case 'career':
      return 'income-runway';
    case 'tenant':
    case 'home-project':
      return 'home-readiness';
    case 'market':
      return 'exit-intel';
    default:
      return null;
  }
}

function getTrackTier(progressPct: number): number {
  if (progressPct >= 75) return 3;
  if (progressPct >= 50) return 2;
  if (progressPct >= 25) return 1;
  return 0;
}

function getTierLabel(tier: number): string {
  switch (tier) {
    case 3:
      return 'late-stage readiness';
    case 2:
      return 'strong momentum';
    case 1:
      return 'early momentum';
    default:
      return 'baseline';
  }
}

function getProgressNote(trackId: OwnershipCampaignTrackId, gain: number): string {
  switch (trackId) {
    case 'income-runway':
      return `Income runway +${gain}: the month strengthened your upgrade war chest.`;
    case 'home-readiness':
      return `Home readiness +${gain}: the home is becoming more stable and operational.`;
    case 'exit-intel':
      return `Exit intel +${gain}: you spent the month sharpening upgrade timing and shortlist confidence.`;
  }
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
