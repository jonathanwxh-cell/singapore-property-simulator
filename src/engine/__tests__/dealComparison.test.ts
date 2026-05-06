import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { buildDealComparisons } from '../dealComparison';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 30,
    careerId: 'graduate',
    salary: 5_500,
    cash: 160_000,
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

describe('buildDealComparisons', () => {
  it('deduplicates selections, ignores unknown ids, and caps the comparison at three listings', () => {
    const result = buildDealComparisons({
      player: makePlayer(),
      propertyIds: ['hdb-bto-0', 'hdb-bto-0', 'condo-4', 'missing', 'commercial-3'],
    });

    expect(result.items.map((item) => item.id)).toEqual(['hdb-bto-0', 'condo-4', 'commercial-3']);
    expect(result.items).toHaveLength(3);
  });

  it('surfaces the safer first-home pick with cash, duty, surplus, and route-fit context', () => {
    const result = buildDealComparisons({
      player: makePlayer(),
      propertyIds: ['condo-4', 'hdb-bto-0'],
    });

    const hdb = result.items.find((item) => item.id === 'hdb-bto-0');
    const condo = result.items.find((item) => item.id === 'condo-4');

    expect(hdb).toBeDefined();
    expect(condo).toBeDefined();
    expect(result.summary.bestId).toBe('hdb-bto-0');
    expect(hdb?.verdict).toBe('ready');
    expect(hdb?.routeFitLabel).toContain('Route fit');
    expect(hdb?.cashRequired).toBeGreaterThanOrEqual(0);
    expect(hdb?.upfrontDuties).toBeGreaterThan(0);
    expect(hdb?.monthlySurplusAfterPurchase).toBeGreaterThan(condo?.monthlySurplusAfterPurchase ?? 0);
    expect(result.summary.headline).toContain('Northstar Grove');
  });
});
