import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getFirstRunQuest } from '../runQuest';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
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
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    operationHistory: [],
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

describe('getFirstRunQuest', () => {
  it('starts a new player on a three-move tutorial instead of exposing every system equally', () => {
    const quest = getFirstRunQuest(makePlayer(), null);

    expect(quest.title).toContain('First 3 Moves');
    expect(quest.activeStep?.id).toBe('choose-monthly-intent');
    expect(quest.steps).toHaveLength(4);
    expect(quest.progressPct).toBe(0);
    expect(quest.steps.map((step) => step.route)).toEqual(['/dashboard', '/properties', '/property/hdb-bto-0', '/portfolio']);
  });

  it('moves the player toward comparison and practice purchase after the first month', () => {
    const quest = getFirstRunQuest(makePlayer({ turnCount: 1 }), null);

    expect(quest.progressPct).toBeGreaterThan(0);
    expect(quest.activeStep?.id).toBe('compare-starter-home');
    expect(quest.beginnerHint).toContain('one next action');
  });

  it('celebrates ownership operations once the player has a tenant online', () => {
    const quest = getFirstRunQuest(makePlayer({
      firstHomePurchased: true,
      turnCount: 3,
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: 'Jan 2024',
        currentValue: 265_000,
        isRented: true,
        monthlyRental: 1_250,
        renovationLevel: 0,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 14,
          satisfaction: 78,
          rentStrategy: 'market',
          askingRent: 1_250,
          contractedRent: 1_250,
          defaultRiskPct: 4,
          renewalIntent: 76,
        },
      }],
    }), null);

    expect(quest.progressPct).toBe(100);
    expect(quest.activeStep).toBeNull();
    expect(quest.rewardBeat?.title).toContain('tenant');
    expect(quest.rewardBeat?.tone).toBe('good');
  });
});
