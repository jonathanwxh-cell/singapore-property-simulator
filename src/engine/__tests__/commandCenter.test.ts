import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getCommandCenterState } from '../commandCenter';

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

describe('getCommandCenterState', () => {
  it('treats active scenarios as the top blocker before advancing the month', () => {
    const state = getCommandCenterState(makePlayer(), 'first-home-window');

    expect(state.advance).toMatchObject({
      label: 'Resolve First',
      route: '/scenarios',
      tone: 'blocked',
    });
    expect(state.objective).toMatchObject({
      id: 'resolve-scenario',
      urgency: 'critical',
      primaryRoute: '/scenarios',
    });
  });

  it('gives a new player a first-home command and a ready next-month action', () => {
    const state = getCommandCenterState(makePlayer());

    expect(state.advance).toMatchObject({
      label: 'Next Month',
      tone: 'ready',
    });
    expect(state.objective.title.toLowerCase()).toMatch(/starter|home|buy|readiness/);
    expect(state.vitalMetrics.map((metric) => metric.id)).toEqual(['available-cash', 'monthly-surplus', 'readiness']);
  });

  it('prioritizes urgent maintenance before route milestone guidance', () => {
    const state = getCommandCenterState(makePlayer({
      firstHomePurchased: true,
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 265_000,
        isRented: true,
        monthlyRental: 1_300,
        renovationLevel: 0,
        occupancyStatus: 'tenanted',
        openMaintenanceIssues: [{
          id: 'pipe-1',
          propertyId: 'hdb-bto-0',
          category: 'plumbing',
          severity: 'urgent',
          estimatedCost: 4_000,
          satisfactionImpact: -12,
          valueImpactPct: -1,
          recurrenceRiskPct: 10,
          status: 'open',
        }],
      }],
    }));

    expect(state.objective).toMatchObject({
      id: 'repair-open-issue',
      urgency: 'warn',
      primaryRoute: '/property/hdb-bto-0',
    });
  });

  it('opens cashflow detail by default when monthly surplus is negative', () => {
    const state = getCommandCenterState(makePlayer({
      cash: 8_000,
      life: {
        ...createInitialLifeState(),
        householdLoad: 7_500,
      },
    }));

    expect(state.panelDefaults.cashflow).toBe('open');
    expect(state.objective.id).toBe('stabilize-cashflow');
  });
});
