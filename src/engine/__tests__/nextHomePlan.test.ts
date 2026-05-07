import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getNextHomePlan } from '../nextHomePlan';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Planner',
    age: 30,
    careerId: 'graduate',
    salary: 6_000,
    cash: 80_000,
    cpfOrdinary: 40_000,
    cpfSpecial: 10_000,
    cpfMedisave: 12_000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'married',
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

describe('getNextHomePlan', () => {
  it('frames pre-owner runs as a first-home runway', () => {
    const plan = getNextHomePlan(makePlayer());

    expect(plan.phase).toBe('pre-owner');
    expect(plan.bottleneck).toBe('first-home');
    expect(plan.target.id).toBe('hdb-bto-0');
    expect(plan.summary).toContain('first-home runway');
  });

  it('turns an active MOP holding into a next-home progress plan', () => {
    const plan = getNextHomePlan(makePlayer({
      cash: 90_000,
      cpfOrdinary: 55_000,
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 285_000,
        isRented: false,
        monthlyRental: 1300,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 42,
      }],
      loans: [{
        id: 'loan-1',
        type: 'mortgage',
        principal: 210_000,
        remainingBalance: 195_000,
        interestRate: 2.6,
        monthlyPayment: 950,
        termYears: 25,
        startDate: '2024-01',
        propertyId: 'hdb-bto-0',
        isPaid: false,
      }],
      reserve: { targetMonths: 3, allocatedCash: 30_000, autoTopUpPct: 0 },
    }));

    expect(plan.phase).toBe('active-mop');
    expect(plan.mopMonthsRemaining).toBe(42);
    expect(plan.target.type).toBe('Executive Condo');
    expect(plan.usableCashAndCpf).toBeGreaterThan(140_000);
    expect(plan.readinessPct).toBeGreaterThan(30);
  });

  it('recommends recovery before MOP grinding when life state is strained', () => {
    const plan = getNextHomePlan(makePlayer({
      life: createInitialLifeState({ stress: 90, energy: 20 }),
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 265_000,
        isRented: false,
        monthlyRental: 1300,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 50,
      }],
    }));

    expect(plan.recommendedFocusId).toBe('recovery');
  });
});
