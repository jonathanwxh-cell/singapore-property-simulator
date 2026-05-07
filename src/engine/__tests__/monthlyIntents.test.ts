import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getMonthlyIntentOptions } from '../monthlyIntents';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 30,
    careerId: 'graduate',
    salary: 5_500,
    cash: 80_000,
    cpfOrdinary: 35_000,
    cpfSpecial: 10_000,
    cpfMedisave: 12_000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 0,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

describe('getMonthlyIntentOptions', () => {
  it('offers distinct monthly plans that map to life actions', () => {
    const options = getMonthlyIntentOptions(makePlayer());

    expect(options).toHaveLength(3);
    expect(new Set(options.map((option) => option.primaryActionId)).size).toBeGreaterThan(1);
    expect(options.every((option) => option.track)).toBe(true);
    expect(options.some((option) => option.id === 'build-cash')).toBe(true);
    expect(options.some((option) => option.id === 'hunt-deal')).toBe(true);
  });

  it('recommends recovery when stress is high', () => {
    const options = getMonthlyIntentOptions(makePlayer({
      life: createInitialLifeState({ stress: 82, energy: 28 }),
    }));

    expect(options[0]).toMatchObject({
      id: 'recover',
      primaryActionId: 'recover',
      recommended: true,
    });
  });

  it('surfaces landlord ops after buying an MOP-active HDB', () => {
    const options = getMonthlyIntentOptions(makePlayer({
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 265_000,
        isRented: false,
        monthlyRental: 1300,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 60,
      }],
    }));

    expect(options[0]).toMatchObject({
      id: 'landlord-ops',
      route: '/property/hdb-bto-0',
      recommended: true,
      track: 'tenant',
      autoActionId: 'start-room-rental',
    });
    expect(options.some((option) => option.id === 'mop-income-runway')).toBe(true);
  });
});
