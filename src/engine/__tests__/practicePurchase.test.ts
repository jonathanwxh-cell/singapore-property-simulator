import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getListingCatalog } from '../listings';
import { assessDealReadiness } from '../decisionCoach';
import {
  buildBtoReadinessPlan,
  buildPracticePurchasePlan,
  buildSeniorRightsizingPlan,
} from '../practicePurchase';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
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
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    operationHistory: [],
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

describe('practice purchase planning', () => {
  it('projects the purchase consequences without changing the player save', () => {
    const player = makePlayer();
    const property = getListingCatalog().find((candidate) => candidate.id === 'hdb-bto-0');
    expect(property).toBeDefined();

    const readiness = assessDealReadiness({
      player,
      property: property!,
      downPaymentPercent: 10,
      useCpfOrdinary: true,
      financingMode: 'hdb-concessionary',
    });
    const plan = buildPracticePurchasePlan({ player, property: property!, readiness });

    expect(plan.title).toContain('Practice');
    expect(plan.projectedCashAfterUpfront).toBe(player.cash - plan.cashRequired);
    expect(plan.projectedMonthlySurplusAfterPurchase).toBe(readiness.monthlySurplusAfterDebt);
    expect(plan.nextSteps[0]).toContain('Simulate only');
    expect(player.properties).toHaveLength(0);
  });

  it('shows HFE and BTO timeline stages for a new flat', () => {
    const player = makePlayer();
    const property = getListingCatalog().find((candidate) => candidate.id === 'hdb-bto-0');
    expect(property).toBeDefined();

    const plan = buildBtoReadinessPlan(player, property!);

    expect(plan).not.toBeNull();
    expect(plan?.headline).toContain('HFE');
    expect(plan?.stages.map((stage) => stage.label)).toEqual([
      'HFE letter',
      'Sales launch and ballot',
      'Book flat',
      'Sign lease',
      'Construction wait',
      'Key collection',
    ]);
    expect(plan?.estimatedMonthsToKeys).toBeGreaterThanOrEqual(9);
  });

  it('adds a CPF-aware 55+ rightsizing route for senior playthroughs', () => {
    const plan = buildSeniorRightsizingPlan(makePlayer({
      age: 58,
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 58 },
      runRouteId: 'senior-rightsizer',
      cpfOrdinary: 85_000,
      cpfSpecial: 95_000,
    }));

    expect(plan).not.toBeNull();
    expect(plan?.headline).toContain('55+');
    expect(plan?.cpfRetirementReference).toBe(220_400);
    expect(plan?.options.some((option) => option.label.includes('right-size'))).toBe(true);
    expect(plan?.warnings.join(' ')).toContain('Retirement Account');
  });
});
