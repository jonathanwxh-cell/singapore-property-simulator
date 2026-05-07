import type { Career } from '@/data/careers';
import type { IncomeProgressState, IncomeTrackId, IncomeTrackState, PlayerLifeState } from '@/game/types';

interface IncomeTrackConfig {
  labels: string[];
  thresholds: number[];
  multiplierPerLevel: number;
}

const incomeTrackConfigs: Record<IncomeTrackId, IncomeTrackConfig> = {
  sideGig: {
    labels: ['Starter Gigs', 'Repeatable Gig', 'Established Sideline', 'Delegated Side Business'],
    thresholds: [0, 3, 7, 12],
    multiplierPerLevel: 0.16,
  },
  propertyHustle: {
    labels: ['Scout Network', 'Closer Route', 'Operator Circuit', 'Connector Engine'],
    thresholds: [0, 3, 6, 10],
    multiplierPerLevel: 0.18,
  },
};

export interface IncomeTrackDisplay {
  level: number;
  label: string;
  xp: number;
  currentFloorXp: number;
  nextThresholdXp: number | null;
  progressPct: number;
}

export function getIncomeTrackDisplay(trackId: IncomeTrackId, xp: number): IncomeTrackDisplay {
  const config = incomeTrackConfigs[trackId];
  const level = getIncomeTrackLevel(trackId, xp);
  const currentFloorXp = config.thresholds[level];
  const nextThresholdXp = config.thresholds[level + 1] ?? null;
  const progressPct = nextThresholdXp === null
    ? 100
    : Math.round(((xp - currentFloorXp) / Math.max(1, nextThresholdXp - currentFloorXp)) * 100);

  return {
    level,
    label: config.labels[level],
    xp,
    currentFloorXp,
    nextThresholdXp,
    progressPct: Math.max(0, Math.min(100, progressPct)),
  };
}

export function getIncomeTrackLevel(trackId: IncomeTrackId, xp: number): number {
  const config = incomeTrackConfigs[trackId];
  for (let index = config.thresholds.length - 1; index >= 0; index -= 1) {
    if (xp >= config.thresholds[index]) return index;
  }
  return 0;
}

export function getIncomeTrackMultiplier(trackId: IncomeTrackId, xp: number): number {
  const config = incomeTrackConfigs[trackId];
  const level = getIncomeTrackLevel(trackId, xp);
  return 1 + level * config.multiplierPerLevel;
}

export function applyIncomeTrackGain(
  current: IncomeTrackState,
  trackId: IncomeTrackId,
  cashGain: number,
  xpGain: number,
): {
  nextState: IncomeTrackState;
  leveledUp: boolean;
  nextDisplay: IncomeTrackDisplay;
} {
  const previousLevel = getIncomeTrackLevel(trackId, current.xp);
  const nextXp = current.xp + xpGain;
  const nextState: IncomeTrackState = {
    xp: nextXp,
    totalEarned: current.totalEarned + Math.max(0, cashGain),
    bestMonth: Math.max(current.bestMonth, Math.max(0, cashGain)),
  };
  const nextDisplay = getIncomeTrackDisplay(trackId, nextXp);

  return {
    nextState,
    leveledUp: nextDisplay.level > previousLevel,
    nextDisplay,
  };
}

export function estimateIncomeTrackPayout(
  trackId: IncomeTrackId,
  life: PlayerLifeState,
  career: Career,
): number {
  const actionFactor = 1;

  if (trackId === 'sideGig') {
    return Math.max(
      200,
      Math.round(600 * career.actionModifiers.sideGig * getIncomeTrackMultiplier('sideGig', life.incomeProgress.sideGig.xp) * actionFactor),
    );
  }

  return Math.max(
    150,
    Math.round((450 + life.reputation * 4) * career.actionModifiers.propertyHustle * getIncomeTrackMultiplier('propertyHustle', life.incomeProgress.propertyHustle.xp) * actionFactor),
  );
}

export function getIncomeProgressHeadline(progress: IncomeProgressState): string {
  const sideGig = getIncomeTrackDisplay('sideGig', progress.sideGig.xp);
  const propertyHustle = getIncomeTrackDisplay('propertyHustle', progress.propertyHustle.xp);

  if (propertyHustle.level > sideGig.level) {
    return `${propertyHustle.label} is your strongest waiting-game income engine right now.`;
  }
  if (sideGig.level > propertyHustle.level) {
    return `${sideGig.label} is carrying the current cash-building plan.`;
  }
  return 'Both income engines are still early. Consistent monthly use matters more than chasing one huge month.';
}
