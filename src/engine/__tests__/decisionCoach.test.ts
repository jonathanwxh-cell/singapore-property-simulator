import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import { scenarios } from '@/data/scenarios';
import { createInitialLifeState, type Player } from '@/game/types';
import {
  assessDealReadiness,
  assessScenarioOption,
  getLifeActionFeedback,
  getNextBestMoves,
} from '../decisionCoach';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 27,
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

describe('getNextBestMoves', () => {
  it('prioritizes resolving an active scenario before advancing turns', () => {
    const moves = getNextBestMoves({
      player: makePlayer(),
      currentScenario: 'first-home-window',
    });

    expect(moves[0]).toMatchObject({
      id: 'resolve-scenario',
      route: '/scenarios',
      urgency: 'critical',
    });
    expect(moves[0].title).toContain('First-Home Window');
  });

  it('points first-time players toward starter homes when they are purchase-ready', () => {
    const moves = getNextBestMoves({ player: makePlayer({ cash: 160_000 }) });

    expect(moves.some((move) => move.id === 'buy-first-home')).toBe(true);
    expect(moves.find((move) => move.id === 'buy-first-home')).toMatchObject({
      route: '/properties',
      urgency: 'good',
    });
  });

  it('surfaces tenant setup before browsing more properties after a purchase', () => {
    const moves = getNextBestMoves({
      player: makePlayer({
        properties: [{
          propertyId: 'hdb-bto-0',
          purchasePrice: 265_000,
          purchaseDate: '2024-01',
          currentValue: 265_000,
          isRented: false,
          monthlyRental: 1300,
          renovationLevel: 0,
          occupancyStatus: 'vacant',
        }],
      }),
    });

    expect(moves[0]).toMatchObject({
      id: 'activate-rental',
      route: '/property/hdb-bto-0',
    });
  });
});

describe('assessDealReadiness', () => {
  it('returns a ready verdict with CPF-adjusted upfront cash when the deal can be bought', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({ cash: 120_000, cpfOrdinary: 40_000 }),
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: true,
    });

    expect(readiness.verdict).toBe('ready');
    expect(readiness.ctaLabel).toBe('Buy Property');
    expect(readiness.cashRequired).toBeLessThan(readiness.totalUpfront);
    expect(readiness.primaryBlocker).toBe(null);
  });

  it('names TDSR as the blocker instead of a vague insufficient-funds label', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({ cash: 500_000, cpfOrdinary: 0, salary: 1_200 }),
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: false,
    });

    expect(readiness.verdict).toBe('blocked');
    expect(readiness.ctaLabel).toContain('TDSR');
    expect(readiness.primaryBlocker?.code).toBe('tdsr_exceeded');
  });
});

describe('assessScenarioOption', () => {
  it('blocks cash-negative options that would overdraw a no-buffer player', () => {
    const recession = scenarios.find((scenario) => scenario.id === 'economic-recession');
    const valueInvesting = recession?.options.find((option) => option.label === 'Value Investing');
    if (!valueInvesting) throw new Error('Expected recession value-investing fixture.');

    const assessment = assessScenarioOption(makePlayer({ cash: 10_000 }), valueInvesting);

    expect(assessment.canChoose).toBe(false);
    expect(assessment.tone).toBe('danger');
    expect(assessment.warning).toContain('overdraw');
  });

  it('marks windfalls as upside so players can distinguish shocks from opportunities', () => {
    const firstHome = scenarios.find((scenario) => scenario.id === 'first-home-window');
    const grant = firstHome?.options.find((option) => option.label === 'Claim the grant');
    if (!grant) throw new Error('Expected first-home grant fixture.');

    const assessment = assessScenarioOption(makePlayer(), grant);

    expect(assessment.canChoose).toBe(true);
    expect(assessment.tone).toBe('upside');
    expect(assessment.summary).toContain('+S$40,000');
  });
});

describe('getLifeActionFeedback', () => {
  it('explains that selecting a life action plans the month rather than resolving immediately', () => {
    const feedback = getLifeActionFeedback(makePlayer({
      life: createInitialLifeState({ selectedPrimaryActionId: 'take-side-gig' }),
    }), 'take-side-gig');

    expect(feedback.title).toContain('planned');
    expect(feedback.detail).toContain('Advance Month');
    expect(feedback.expectedEffects.some((effect) => effect.includes('cash'))).toBe(true);
  });
});
