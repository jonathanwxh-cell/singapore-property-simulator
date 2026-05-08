import { describe, expect, it } from 'vitest';
import { careers } from '@/data/careers';
import type { Player } from '@/game/types';
import { createInitialLifeState } from '@/game/types';
import { canTakeSecondaryAction, getBaseHouseholdLoad, resolveLifeMonth } from '../life';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 27,
    careerId: 'tech',
    salary: 5_500,
    cash: 50_000,
    cpfOrdinary: 20_000,
    cpfSpecial: 5_000,
    cpfMedisave: 20_000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 95_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    ...overrides,
  };
}

describe('life engine', () => {
  it('returns the correct base household load for each living arrangement', () => {
    expect(getBaseHouseholdLoad('with-parents')).toBe(650);
    expect(getBaseHouseholdLoad('renting-room')).toBe(1700);
    expect(getBaseHouseholdLoad('renting-flat')).toBe(3200);
  });

  it('unlocks the secondary action only when energy and stress thresholds are met', () => {
    expect(canTakeSecondaryAction(createInitialLifeState({ energy: 70, stress: 30 }))).toBe(true);
    expect(canTakeSecondaryAction(createInitialLifeState({ energy: 69, stress: 30 }))).toBe(false);
    expect(canTakeSecondaryAction(createInitialLifeState({ energy: 70, stress: 31 }))).toBe(false);
  });

  it('resolves a side gig into cash with energy and stress tradeoffs', () => {
    const result = resolveLifeMonth(
      makePlayer({
        careerId: 'tech',
        life: createInitialLifeState({ selectedPrimaryActionId: 'take-side-gig' }),
      }),
      careers.find((career) => career.id === 'tech')!,
      { next: () => 0.5 } as never,
    );

    expect(result.householdCost).toBe(650);
    expect(result.cashDelta).toBe(690);
    expect(result.nextLife.energy).toBe(61);
    expect(result.nextLife.stress).toBe(26);
    expect(result.nextLife.lastMonthSummary?.primaryActionId).toBe('take-side-gig');
    expect(result.nextLife.lastMonthSummary?.incomeBreakdown.sideGig).toBe(690);
    expect(result.nextLife.incomeProgress.sideGig.totalEarned).toBe(690);
    expect(result.nextLife.incomeProgress.sideGig.xp).toBe(2);
  });

  it('levels up the side-gig engine after consistent use', () => {
    const result = resolveLifeMonth(
      makePlayer({
        careerId: 'tech',
        life: createInitialLifeState({
          selectedPrimaryActionId: 'take-side-gig',
          incomeProgress: {
            sideGig: { xp: 2, totalEarned: 1_200, bestMonth: 620 },
            propertyHustle: { xp: 0, totalEarned: 0, bestMonth: 0 },
          },
        }),
      }),
      careers.find((career) => career.id === 'tech')!,
      { next: () => 0.5 } as never,
    );

    expect(result.nextLife.incomeProgress.sideGig.xp).toBe(4);
    expect(result.nextLife.lastMonthSummary?.notes.some((note) => note.includes('Repeatable Gig'))).toBe(true);
  });

  it('adds ownership campaign progress notes for active-MOP planning months', () => {
    const result = resolveLifeMonth(
      makePlayer({
        properties: [{
          propertyId: 'hdb-bto-0',
          purchasePrice: 265_000,
          purchaseDate: '2024-01',
          currentValue: 265_000,
          isRented: false,
          monthlyRental: 1_300,
          renovationLevel: 0,
          occupancyStatus: 'owner-occupied',
          mopRemainingMonths: 58,
        }],
        life: createInitialLifeState({
          selectedPrimaryActionId: 'property-hustle',
          selectedMonthlyIntentId: 'mop-market-intel',
          selectedMonthlyIntentLabel: 'Study Exit Market',
          selectedMonthlyIntentTrack: 'market',
        }),
      }),
      careers.find((career) => career.id === 'tech')!,
      { next: () => 0.5 } as never,
    );

    expect(result.nextLife.lastMonthSummary?.notes.some((note) => note.includes('Exit intel'))).toBe(true);
  });
});
