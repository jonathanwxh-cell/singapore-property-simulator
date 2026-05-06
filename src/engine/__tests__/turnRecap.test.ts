import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type MarketState, type Player } from '@/game/types';
import { getLastTurnRecap } from '../turnRecap';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 30,
    careerId: 'graduate',
    salary: 5_500,
    cash: 120_000,
    cpfOrdinary: 40_000,
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
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

function makeMarket(overrides: Partial<MarketState> = {}): MarketState {
  return {
    interestRate: 2.5,
    priceIndex: 100,
    rentalIndex: 100,
    volatility: 0.12,
    lastEvent: null,
    ...overrides,
  };
}

describe('getLastTurnRecap', () => {
  it('stays quiet before the first month is resolved', () => {
    expect(getLastTurnRecap({
      player: makePlayer(),
      market: makeMarket(),
      currentScenario: null,
    })).toBeNull();
  });

  it('summarizes the last life plan, market movement, and next hint', () => {
    const recap = getLastTurnRecap({
      player: makePlayer({
        turnCount: 1,
        life: createInitialLifeState({
          lastMonthSummary: {
            primaryActionId: 'take-side-gig',
            secondaryActionId: 'plan-schemes',
            cashDelta: 850,
            energyDelta: -9,
            stressDelta: 6,
            reputationDelta: 1,
            careerMomentumDelta: 0,
            householdSupportDelta: 1,
            notes: ['You picked up extra side income this month.'],
          },
        }),
      }),
      market: makeMarket({
        monthlyPriceChangePct: 1.2,
        lastHeadline: 'Demand improves near transport nodes',
      }),
      currentScenario: 'first-home-window',
    });

    expect(recap).not.toBeNull();
    expect(recap?.title).toContain('Side Gig');
    expect(recap?.nextHint).toContain('scenario');
    expect(recap?.facts.map((fact) => fact.label)).toEqual([
      'Life action cash',
      'Energy / stress',
      'Market move',
      'Current surplus',
    ]);
  });
});
