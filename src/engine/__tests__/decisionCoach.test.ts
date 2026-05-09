import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import { scenarios } from '@/data/scenarios';
import { createInitialLifeState, type Player } from '@/game/types';
import { validatePurchase } from '../purchase';
import {
  assessDealReadiness,
  assessScenarioOption,
  getDealNextFix,
  getLifeActionFeedback,
  getNextBestMoves,
  selectBestNextBuyForPlayer,
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

  it('prioritizes MOP-safe room rental after buying an owner-occupied HDB', () => {
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
          occupancyStatus: 'owner-occupied',
          mopRemainingMonths: 60,
        }],
      }),
    });

    expect(moves[0]).toMatchObject({
      id: 'start-room-rental',
      route: '/property/hdb-bto-0',
      actionLabel: 'Start Room Rental',
    });
  });

  it('adds route milestone guidance when no critical blocker is present', () => {
    const moves = getNextBestMoves({
      player: makePlayer({
        runRouteId: 'fire-homeowner',
        cash: 120_000,
      }),
    });

    const routeMove = moves.find((move) => move.id.startsWith('route-'));
    expect(routeMove).toBeDefined();
    expect(routeMove?.detail).toContain('Life Arc');
  });
});

describe('selectBestNextBuyForPlayer', () => {
  it('does not recommend public-housing listings to foreigner profiles', () => {
    const best = selectBestNextBuyForPlayer(makePlayer({
      salary: 20_000,
      cash: 600_000,
      cpfOrdinary: 0,
      buyerProfile: {
        residencyStatus: 'foreigner',
        householdProfile: 'foreigner-investor',
        age: 40,
      },
      runRouteId: 'foreign-investor',
    }));

    expect(best).not.toBeNull();
    expect(best?.property.isHdb).toBe(false);
    expect(best?.property.type).not.toBe('Executive Condo');
    expect(best?.readiness.primaryBlocker?.message ?? '').not.toContain('Foreigners cannot buy HDB');
  });

  it('recommends a private starter for single-under-35 profiles', () => {
    const best = selectBestNextBuyForPlayer(makePlayer({
      buyerProfile: {
        residencyStatus: 'sc',
        householdProfile: 'single-under-35',
        age: 28,
      },
      salary: 7_200,
      cash: 500_000,
      cpfOrdinary: 150_000,
    }));

    expect(best).not.toBeNull();
    expect(best?.property.id).not.toContain('hdb');
    expect(best?.property.isHdb).toBe(false);
    expect(best?.readiness.verdict).not.toBe('blocked');
  });
});

describe('assessDealReadiness', () => {
  it('returns a ready verdict with CPF-adjusted upfront cash when the deal can be bought', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');
    const player = makePlayer({ cash: 120_000, cpfOrdinary: 40_000 });

    const readiness = assessDealReadiness({
      player,
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: true,
    });
    const validation = validatePurchase(player, property, property.price * 0.25);

    expect(readiness.verdict).toBe('ready');
    expect(readiness.ctaLabel).toBe('Buy Property');
    expect(readiness.cashRequired).toBeLessThan(readiness.totalUpfront);
    expect(readiness.cpfApplied).toBe(Math.min(player.cpfOrdinary, validation.downPayment));
    expect(readiness.primaryBlocker).toBe(null);
  });

  it('caps CPF readiness support at the down payment instead of covering duties', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');
    const player = makePlayer({ cash: 120_000, cpfOrdinary: 150_000 });

    const readiness = assessDealReadiness({
      player,
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: true,
    });
    const validation = validatePurchase(player, property, property.price * 0.25);

    expect(readiness.cpfApplied).toBe(validation.downPayment);
    expect(readiness.cashRequired).toBe(readiness.totalUpfront - validation.downPayment);
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

  it('treats ownership eligibility blockers as blocked deals', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-resale-0');
    if (!property) throw new Error('Expected resale property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({
        cash: 500_000,
        cpfOrdinary: 100_000,
        firstHomePurchased: true,
        properties: [{
          propertyId: 'hdb-bto-0',
          purchasePrice: 265_000,
          purchaseDate: '2024-01',
          currentValue: 265_000,
          isRented: false,
          monthlyRental: 1_300,
          renovationLevel: 0,
          occupancyStatus: 'owner-occupied',
          mopRemainingMonths: 60,
        }],
      }),
      property,
      downPaymentPercent: 55,
      useCpfOrdinary: true,
    });

    expect(readiness.verdict).toBe('blocked');
    expect(readiness.primaryBlocker?.code).toBe('mop_restricted');
    expect(readiness.headline).toContain('MOP');
    expect(readiness.ctaLabel).toBe('Blocked: MOP');
  });

  it('uses commercial purchase wording instead of CPF wording for commercial deals', () => {
    const property = properties.find((candidate) => candidate.type === 'Commercial Shop');
    if (!property) throw new Error('Expected commercial property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({ cash: 1_000, cpfOrdinary: 200_000 }),
      property,
      downPaymentPercent: 100,
      useCpfOrdinary: true,
    });

    expect(readiness.cpfApplied).toBe(0);
    expect(readiness.primaryBlocker?.message ?? '').toContain('upfront costs');
    expect(readiness.facts).toContain('CPF OA not usable for commercial property');
    expect(readiness.facts.some((fact) => fact.includes('Cash needed after CPF'))).toBe(false);
  });
});

describe('getDealNextFix', () => {
  it('turns a cash blocker into a concrete next step', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({ cash: 1_000, cpfOrdinary: 0 }),
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: false,
    });

    expect(getDealNextFix(readiness)).toContain('Build spendable cash');
  });

  it('keeps stretch deals playable but warns about reserve planning', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-0');
    if (!property) throw new Error('Expected starter property fixture.');

    const readiness = assessDealReadiness({
      player: makePlayer({ cash: 160_000, cpfOrdinary: 40_000, life: createInitialLifeState({ householdLoad: 3_700 }) }),
      property,
      downPaymentPercent: 25,
      useCpfOrdinary: true,
    });

    expect(['ready', 'stretch']).toContain(readiness.verdict);
    expect(getDealNextFix(readiness)).toMatch(/Ready|reserve/);
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

  it('marks CPF grant windfalls as upside without presenting them as spendable cash', () => {
    const firstHome = scenarios.find((scenario) => scenario.id === 'first-home-window');
    const grant = firstHome?.options.find((option) => option.label === 'Claim the grant');
    if (!grant) throw new Error('Expected first-home grant fixture.');

    const assessment = assessScenarioOption(makePlayer(), grant);

    expect(assessment.canChoose).toBe(true);
    expect(assessment.tone).toBe('upside');
    expect(assessment.summary).toContain('CPF OA');
    expect(assessment.facts).toContain('CPF OA +S$40,000');
  });

  it('keeps a no-cash tycoon player from being soft-locked by the marriage event', () => {
    const marriage = scenarios.find((scenario) => scenario.id === 'marriage');
    if (!marriage) throw new Error('Expected marriage scenario fixture.');

    const assessments = marriage.options.map((option) => assessScenarioOption(makePlayer({
      cash: 0,
      difficulty: 'tycoon',
    }), option));

    expect(assessments.some((assessment) => assessment.canChoose)).toBe(true);
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
