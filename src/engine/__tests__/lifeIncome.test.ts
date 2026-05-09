import { describe, expect, it } from 'vitest';
import type { Career } from '@/data/careers';
import {
  applyIncomeTrackGain,
  estimateIncomeTrackPayout,
  getIncomeProgressHeadline,
  getIncomeTrackDisplay,
  getIncomeTrackLevel,
  getIncomeTrackMultiplier,
} from '@/engine/lifeIncome';
import { createInitialLifeState, type IncomeTrackState } from '@/game/types';

function makeCareer(overrides: Partial<Career['actionModifiers']> = {}): Career {
  return {
    id: 'graduate',
    name: 'Fresh Graduate',
    startingSalary: 3500,
    growthRate: 0.04,
    riskFactor: 0.1,
    description: 'Test career',
    icon: 'GraduationCap',
    color: '#000000',
    actionModifiers: {
      focusAtWork: 1,
      sideGig: 1,
      propertyHustle: 1,
      upskill: 1,
      supportHousehold: 1,
      schemePlanning: 1,
      stressSensitivity: 1,
      promotionQuality: 1,
      ...overrides,
    },
  };
}

function makeTrackState(overrides: Partial<IncomeTrackState> = {}): IncomeTrackState {
  return {
    xp: 0,
    totalEarned: 0,
    bestMonth: 0,
    ...overrides,
  };
}

describe('getIncomeTrackLevel', () => {
  it('returns level 0 below the first non-zero threshold', () => {
    expect(getIncomeTrackLevel('sideGig', 0)).toBe(0);
    expect(getIncomeTrackLevel('sideGig', 2)).toBe(0);
    expect(getIncomeTrackLevel('propertyHustle', 2)).toBe(0);
  });

  it('promotes exactly at each threshold', () => {
    expect(getIncomeTrackLevel('sideGig', 3)).toBe(1);
    expect(getIncomeTrackLevel('sideGig', 7)).toBe(2);
    expect(getIncomeTrackLevel('sideGig', 12)).toBe(3);
    expect(getIncomeTrackLevel('propertyHustle', 3)).toBe(1);
    expect(getIncomeTrackLevel('propertyHustle', 6)).toBe(2);
    expect(getIncomeTrackLevel('propertyHustle', 10)).toBe(3);
  });

  it('clamps to the top level for xp far above the cap', () => {
    expect(getIncomeTrackLevel('sideGig', 999)).toBe(3);
    expect(getIncomeTrackLevel('propertyHustle', 999)).toBe(3);
  });
});

describe('getIncomeTrackMultiplier', () => {
  it('starts at 1.0 and rises by the per-level step', () => {
    expect(getIncomeTrackMultiplier('sideGig', 0)).toBeCloseTo(1, 5);
    expect(getIncomeTrackMultiplier('sideGig', 3)).toBeCloseTo(1.16, 5);
    expect(getIncomeTrackMultiplier('sideGig', 12)).toBeCloseTo(1.48, 5);
    expect(getIncomeTrackMultiplier('propertyHustle', 0)).toBeCloseTo(1, 5);
    expect(getIncomeTrackMultiplier('propertyHustle', 10)).toBeCloseTo(1.54, 5);
  });
});

describe('getIncomeTrackDisplay', () => {
  it('reports floor / next-threshold / progress for an early state', () => {
    const display = getIncomeTrackDisplay('sideGig', 1);
    expect(display.level).toBe(0);
    expect(display.label).toBe('Starter Gigs');
    expect(display.currentFloorXp).toBe(0);
    expect(display.nextThresholdXp).toBe(3);
    expect(display.progressPct).toBe(33);
  });

  it('caps the progress bar at 100 once the top tier is reached', () => {
    const display = getIncomeTrackDisplay('propertyHustle', 25);
    expect(display.level).toBe(3);
    expect(display.nextThresholdXp).toBeNull();
    expect(display.progressPct).toBe(100);
  });
});

describe('applyIncomeTrackGain', () => {
  it('does not flag a level-up when xp stays below the next threshold', () => {
    const result = applyIncomeTrackGain(makeTrackState({ xp: 0, totalEarned: 100, bestMonth: 100 }), 'sideGig', 200, 1);
    expect(result.leveledUp).toBe(false);
    expect(result.nextState.xp).toBe(1);
    expect(result.nextState.totalEarned).toBe(300);
    expect(result.nextState.bestMonth).toBe(200);
  });

  it('flags a level-up exactly when crossing a threshold', () => {
    const result = applyIncomeTrackGain(makeTrackState({ xp: 2 }), 'sideGig', 0, 1);
    expect(result.leveledUp).toBe(true);
    expect(result.nextDisplay.level).toBe(1);
  });

  it('flags a single level-up event even when xp jumps past two thresholds', () => {
    const result = applyIncomeTrackGain(makeTrackState({ xp: 0 }), 'sideGig', 0, 8);
    expect(result.leveledUp).toBe(true);
    expect(result.nextDisplay.level).toBe(2);
  });

  it('clamps negative cash gains out of totalEarned and bestMonth', () => {
    const result = applyIncomeTrackGain(makeTrackState({ xp: 0, totalEarned: 50, bestMonth: 0 }), 'sideGig', -100, 0);
    expect(result.nextState.totalEarned).toBe(50);
    expect(result.nextState.bestMonth).toBe(0);
  });
});

describe('estimateIncomeTrackPayout', () => {
  it('respects the sideGig minimum floor', () => {
    const stingyCareer = makeCareer({ sideGig: 0.0001 });
    const payout = estimateIncomeTrackPayout('sideGig', createInitialLifeState(), stingyCareer);
    expect(payout).toBe(200);
  });

  it('respects the propertyHustle minimum floor', () => {
    const stingyCareer = makeCareer({ propertyHustle: 0.0001 });
    const payout = estimateIncomeTrackPayout('propertyHustle', createInitialLifeState(), stingyCareer);
    expect(payout).toBe(150);
  });

  it('scales sideGig payout with career modifier and track xp', () => {
    const career = makeCareer({ sideGig: 1.5 });
    const baseLife = createInitialLifeState();
    const leveledLife = createInitialLifeState({
      incomeProgress: {
        sideGig: makeTrackState({ xp: 12 }),
        propertyHustle: makeTrackState(),
      },
    });

    const basePayout = estimateIncomeTrackPayout('sideGig', baseLife, career);
    const leveledPayout = estimateIncomeTrackPayout('sideGig', leveledLife, career);

    // 600 * 1.5 * 1.0 = 900 at level 0; 600 * 1.5 * 1.48 = 1332 at level 3.
    expect(basePayout).toBe(900);
    expect(leveledPayout).toBe(1332);
  });

  it('scales propertyHustle payout with reputation', () => {
    const career = makeCareer();
    const calmLife = createInitialLifeState({ reputation: 0 });
    const reputableLife = createInitialLifeState({ reputation: 50 });

    const calmPayout = estimateIncomeTrackPayout('propertyHustle', calmLife, career);
    const reputablePayout = estimateIncomeTrackPayout('propertyHustle', reputableLife, career);

    expect(calmPayout).toBe(450);
    expect(reputablePayout).toBe(650);
  });
});

describe('getIncomeProgressHeadline', () => {
  it('calls out the side gig when its level leads', () => {
    const headline = getIncomeProgressHeadline({
      sideGig: makeTrackState({ xp: 7 }),
      propertyHustle: makeTrackState({ xp: 0 }),
    });
    expect(headline).toContain('Established Sideline');
  });

  it('calls out the property hustle when its level leads', () => {
    const headline = getIncomeProgressHeadline({
      sideGig: makeTrackState({ xp: 0 }),
      propertyHustle: makeTrackState({ xp: 6 }),
    });
    expect(headline).toContain('Operator Circuit');
  });

  it('falls back to the early-game framing when both are tied', () => {
    const headline = getIncomeProgressHeadline({
      sideGig: makeTrackState({ xp: 0 }),
      propertyHustle: makeTrackState({ xp: 0 }),
    });
    expect(headline).toContain('Both income engines');
  });
});
