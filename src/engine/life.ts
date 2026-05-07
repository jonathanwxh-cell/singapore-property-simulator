import type { Career } from '@/data/careers';
import type { IncomeTrackId, LifeActionId, LifeIncomeBreakdown, LifeMonthSummary, LivingArrangement, Player, PlayerLifeState } from '@/game/types';
import { createInitialIncomeProgressState, createInitialLifeIncomeBreakdown, createInitialLifeState } from '@/game/types';
import type { Rng } from './rng';
import { applyIncomeTrackGain, getIncomeTrackMultiplier } from './lifeIncome';

export interface LifeMonthResolution {
  cashDelta: number;
  householdCost: number;
  nextLife: PlayerLifeState;
}

interface LifeActionResolution {
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  careerMomentumDelta: number;
  householdSupportDelta: number;
  schemeSkillsFutureDelta: number;
  schemeFirstTimerGrantDelta: number;
  schemeHouseholdSupportDelta: number;
  startTraining: boolean;
  incomeBreakdownKey: keyof LifeIncomeBreakdown | null;
  incomeTrackId: IncomeTrackId | null;
  incomeXpGain: number;
  note: string;
}

const SECONDARY_ACTION_SCALE = 0.6;

export function normalizeLifeState(life: Partial<PlayerLifeState> | undefined): PlayerLifeState {
  const initial = createInitialLifeState();
  return {
    ...initial,
    ...life,
    schemeProgress: {
      ...initial.schemeProgress,
      ...life?.schemeProgress,
    },
    incomeProgress: {
      sideGig: {
        ...createInitialIncomeProgressState().sideGig,
        ...life?.incomeProgress?.sideGig,
      },
      propertyHustle: {
        ...createInitialIncomeProgressState().propertyHustle,
        ...life?.incomeProgress?.propertyHustle,
      },
    },
    lastMonthSummary: life?.lastMonthSummary
      ? {
          ...life.lastMonthSummary,
          monthlyIntentId: life.lastMonthSummary.monthlyIntentId ?? null,
          monthlyIntentLabel: life.lastMonthSummary.monthlyIntentLabel ?? null,
          monthlyIntentTrack: life.lastMonthSummary.monthlyIntentTrack ?? null,
          incomeBreakdown: {
            ...createInitialLifeIncomeBreakdown(),
            ...(life.lastMonthSummary.incomeBreakdown ?? {}),
          },
        }
      : null,
  };
}

export function getBaseHouseholdLoad(arrangement: LivingArrangement): number {
  switch (arrangement) {
    case 'renting-room':
      return 1700;
    case 'renting-flat':
      return 3200;
    default:
      return 650;
  }
}

export function canTakeSecondaryAction(life: PlayerLifeState): boolean {
  return life.energy >= 70 && life.stress <= 30;
}

export function resolveLifeMonth(player: Player, career: Career, rng: Pick<Rng, 'next'>): LifeMonthResolution {
  const startingLife = normalizeLifeState(player.life);
  const nextLife = normalizeLifeState(startingLife);
  const notes: string[] = [];
  const householdCost = calculateHouseholdLoad(startingLife);

  const summary: LifeMonthSummary = {
    monthlyIntentId: startingLife.selectedMonthlyIntentId,
    monthlyIntentLabel: startingLife.selectedMonthlyIntentLabel,
    monthlyIntentTrack: startingLife.selectedMonthlyIntentTrack,
    primaryActionId: startingLife.selectedPrimaryActionId ?? 'focus-at-work',
    secondaryActionId: canTakeSecondaryAction(startingLife) ? startingLife.selectedSecondaryActionId : null,
    cashDelta: 0,
    energyDelta: 0,
    stressDelta: 0,
    reputationDelta: 0,
    careerMomentumDelta: 0,
    householdSupportDelta: 0,
    incomeBreakdown: createInitialLifeIncomeBreakdown(),
    notes,
  };

  applyTrainingProgress(nextLife, summary, notes);

  const primaryActionId = startingLife.selectedPrimaryActionId ?? 'focus-at-work';
  const primaryResolution = resolveAction(primaryActionId, nextLife, career, rng, 1);
  applyActionResolution(nextLife, summary, primaryResolution, notes);

  if (summary.secondaryActionId) {
    const secondaryResolution = resolveAction(summary.secondaryActionId, nextLife, career, rng, SECONDARY_ACTION_SCALE);
    applyActionResolution(nextLife, summary, secondaryResolution, notes);
  }

  nextLife.energy = clamp(nextLife.energy, 0, 100);
  nextLife.stress = clamp(nextLife.stress, 0, 100);
  nextLife.reputation = clamp(nextLife.reputation, 0, 100);
  nextLife.careerMomentum = clamp(nextLife.careerMomentum, -100, 100);
  nextLife.householdSupport = clamp(nextLife.householdSupport, 0, 100);
  nextLife.householdLoad = calculateHouseholdLoad(nextLife);
  nextLife.selectedPrimaryActionId = null;
  nextLife.selectedSecondaryActionId = null;
  nextLife.selectedMonthlyIntentId = null;
  nextLife.selectedMonthlyIntentLabel = null;
  nextLife.selectedMonthlyIntentTrack = null;
  nextLife.lastMonthSummary = summary;

  return {
    cashDelta: summary.cashDelta,
    householdCost,
    nextLife,
  };
}

function resolveAction(
  actionId: LifeActionId,
  life: PlayerLifeState,
  career: Career,
  rng: Pick<Rng, 'next'>,
  scale: number,
): LifeActionResolution {
  const actionFactor = (0.8 + rng.next() * 0.4) * scale;
  const modifiers = career.actionModifiers;

  switch (actionId) {
    case 'take-side-gig':
      return {
        cashDelta: Math.max(200, Math.round(600 * modifiers.sideGig * getIncomeTrackMultiplier('sideGig', life.incomeProgress.sideGig.xp) * actionFactor)),
        energyDelta: -Math.max(1, Math.round(9 * scale)),
        stressDelta: Math.max(1, Math.round(6 * modifiers.stressSensitivity * scale)),
        reputationDelta: Math.round(1 * scale),
        careerMomentumDelta: 0,
        householdSupportDelta: 0,
        schemeSkillsFutureDelta: 0,
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: 0,
        startTraining: false,
        incomeBreakdownKey: 'sideGig',
        incomeTrackId: 'sideGig',
        incomeXpGain: scale >= 1 ? 2 : 1,
        note: 'You picked up extra side income this month.',
      };
    case 'property-hustle':
      return {
        cashDelta: Math.max(150, Math.round((450 + life.reputation * 4) * modifiers.propertyHustle * getIncomeTrackMultiplier('propertyHustle', life.incomeProgress.propertyHustle.xp) * actionFactor)),
        energyDelta: -Math.max(1, Math.round(8 * scale)),
        stressDelta: Math.max(1, Math.round(5 * modifiers.stressSensitivity * scale)),
        reputationDelta: Math.max(1, Math.round(4 * scale)),
        careerMomentumDelta: Math.round(1 * scale),
        householdSupportDelta: 0,
        schemeSkillsFutureDelta: 0,
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: 0,
        startTraining: false,
        incomeBreakdownKey: 'propertyHustle',
        incomeTrackId: 'propertyHustle',
        incomeXpGain: scale >= 1 ? 2 : 1,
        note: 'Property referrals and viewings gave you a stronger market month.',
      };
    case 'upskill': {
      const effectiveCourseCost = Math.max(220, 450 - life.schemeProgress.skillsFuture * 5);
      return {
        cashDelta: -Math.round(effectiveCourseCost * scale),
        energyDelta: -Math.max(1, Math.round(10 * scale)),
        stressDelta: Math.max(1, Math.round(4 * modifiers.stressSensitivity * scale)),
        reputationDelta: 0,
        careerMomentumDelta: Math.max(1, Math.round(4 * modifiers.upskill * scale)),
        householdSupportDelta: 0,
        schemeSkillsFutureDelta: Math.max(1, Math.round(12 * scale)),
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: 0,
        startTraining: life.trainingTrackId === null,
        incomeBreakdownKey: 'upskillCost',
        incomeTrackId: null,
        incomeXpGain: 0,
        note: 'You invested in training that should pay off over future months.',
      };
    }
    case 'support-household':
      return {
        cashDelta: -Math.round((250 + getBaseHouseholdLoad(life.livingArrangement) / 8) * scale),
        energyDelta: -Math.max(1, Math.round(3 * scale)),
        stressDelta: -Math.max(1, Math.round(8 * scale)),
        reputationDelta: Math.round(1 * scale),
        careerMomentumDelta: 0,
        householdSupportDelta: Math.max(1, Math.round(10 * scale)),
        schemeSkillsFutureDelta: 0,
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: Math.max(1, Math.round(6 * scale)),
        startTraining: false,
        incomeBreakdownKey: 'householdSupportCost',
        incomeTrackId: null,
        incomeXpGain: 0,
        note: 'Showing up for your household made life feel more stable.',
      };
    case 'plan-schemes':
      return {
        cashDelta: Math.max(0, Math.round((120 + life.householdSupport / 4 + rng.next() * 60) * scale)),
        energyDelta: -Math.max(1, Math.round(4 * scale)),
        stressDelta: -Math.max(1, Math.round(2 * scale)),
        reputationDelta: 0,
        careerMomentumDelta: 0,
        householdSupportDelta: Math.max(1, Math.round(3 * scale)),
        schemeSkillsFutureDelta: Math.max(1, Math.round(6 * scale)),
        schemeFirstTimerGrantDelta: Math.max(1, Math.round(14 * scale)),
        schemeHouseholdSupportDelta: Math.max(1, Math.round(8 * scale)),
        startTraining: false,
        incomeBreakdownKey: 'schemes',
        incomeTrackId: null,
        incomeXpGain: 0,
        note: 'Administrative effort unlocked modest household relief and longer-term support.',
      };
    case 'recover':
      return {
        cashDelta: 0,
        energyDelta: Math.max(1, Math.round(14 * scale)),
        stressDelta: -Math.max(1, Math.round(10 * scale)),
        reputationDelta: 0,
        careerMomentumDelta: -Math.round(1 * scale),
        householdSupportDelta: 0,
        schemeSkillsFutureDelta: 0,
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: 0,
        startTraining: false,
        incomeBreakdownKey: null,
        incomeTrackId: null,
        incomeXpGain: 0,
        note: 'You took recovery time and came back with more energy.',
      };
    case 'focus-at-work':
    default:
      return {
        cashDelta: Math.max(0, Math.round(200 * modifiers.focusAtWork * actionFactor)),
        energyDelta: -Math.max(1, Math.round(4 * scale)),
        stressDelta: Math.max(1, Math.round(3 * modifiers.stressSensitivity * scale)),
        reputationDelta: Math.max(1, Math.round(2 * scale)),
        careerMomentumDelta: Math.max(1, Math.round(4 * modifiers.focusAtWork * scale)),
        householdSupportDelta: 0,
        schemeSkillsFutureDelta: 0,
        schemeFirstTimerGrantDelta: 0,
        schemeHouseholdSupportDelta: 0,
        startTraining: false,
        incomeBreakdownKey: 'focusAtWork',
        incomeTrackId: null,
        incomeXpGain: 0,
        note: 'A focused work month kept your career moving in the right direction.',
      };
  }
}

function applyTrainingProgress(life: PlayerLifeState, summary: LifeMonthSummary, notes: string[]) {
  if (life.trainingMonthsRemaining <= 0) {
    return;
  }

  life.trainingMonthsRemaining -= 1;
  if (life.trainingMonthsRemaining > 0) {
    return;
  }

  life.trainingTrackId = null;
  life.reputation += 3;
  life.careerMomentum += 3;
  summary.reputationDelta += 3;
  summary.careerMomentumDelta += 3;
  notes.push('A training track completed and improved your professional standing.');
}

function applyActionResolution(
  life: PlayerLifeState,
  summary: LifeMonthSummary,
  resolution: LifeActionResolution,
  notes: string[],
) {
  summary.cashDelta += resolution.cashDelta;
  summary.energyDelta += resolution.energyDelta;
  summary.stressDelta += resolution.stressDelta;
  summary.reputationDelta += resolution.reputationDelta;
  summary.careerMomentumDelta += resolution.careerMomentumDelta;
  summary.householdSupportDelta += resolution.householdSupportDelta;
  if (resolution.incomeBreakdownKey) {
    summary.incomeBreakdown[resolution.incomeBreakdownKey] += resolution.cashDelta;
  }

  life.energy += resolution.energyDelta;
  life.stress += resolution.stressDelta;
  life.reputation += resolution.reputationDelta;
  life.careerMomentum += resolution.careerMomentumDelta;
  life.householdSupport += resolution.householdSupportDelta;
  life.schemeProgress.skillsFuture += resolution.schemeSkillsFutureDelta;
  life.schemeProgress.firstTimerGrant += resolution.schemeFirstTimerGrantDelta;
  life.schemeProgress.householdSupport += resolution.schemeHouseholdSupportDelta;

  if (resolution.startTraining) {
    life.trainingTrackId = 'skillsfuture-track';
    life.trainingMonthsRemaining = 2;
  }

  if (resolution.incomeTrackId && resolution.cashDelta > 0 && resolution.incomeXpGain > 0) {
    const currentTrack = life.incomeProgress[resolution.incomeTrackId];
    const gain = applyIncomeTrackGain(currentTrack, resolution.incomeTrackId, resolution.cashDelta, resolution.incomeXpGain);
    life.incomeProgress = {
      ...life.incomeProgress,
      [resolution.incomeTrackId]: gain.nextState,
    };
    if (gain.leveledUp) {
      notes.push(`${gain.nextDisplay.label} unlocked. Your ${resolution.incomeTrackId === 'sideGig' ? 'side gig' : 'property hustle'} now compounds faster.`);
    }
  }

  notes.push(resolution.note);
}

export function calculateHouseholdLoad(life: PlayerLifeState): number {
  const baseLoad = getBaseHouseholdLoad(life.livingArrangement);
  const supportDiscount = Math.max(0, Math.round((life.householdSupport - 50) * 6));
  const stressSurcharge = life.stress > 60 ? Math.round((life.stress - 60) * 4) : 0;
  return Math.max(250, baseLoad - supportDiscount + stressSurcharge);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
