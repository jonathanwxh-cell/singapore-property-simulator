import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getOwnershipPayoffState, getOwnershipPayoffTransitions } from '../ownershipPayoffs';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Payoff Tester',
    age: 33,
    careerId: 'graduate',
    salary: 7_200,
    cash: 180_000,
    cpfOrdinary: 82_000,
    cpfSpecial: 12_000,
    cpfMedisave: 14_000,
    creditScore: 720,
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
    firstHomePurchased: true,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 33 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    nextHomeShortlistIds: [],
    ...overrides,
  };
}

describe('ownership payoffs', () => {
  it('detects reserve, rental, and shortlist milestones from player state', () => {
    const state = getOwnershipPayoffState(makePlayer({
      reserve: { targetMonths: 3, allocatedCash: 8_000, autoTopUpPct: 0 },
      nextHomeShortlistIds: ['ec-1', 'condo-4'],
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 325_000,
        isRented: true,
        monthlyRental: 1_500,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 10,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 16,
          satisfaction: 82,
          rentStrategy: 'market',
          askingRent: 1_500,
          contractedRent: 1_500,
          defaultRiskPct: 4,
          renewalIntent: 78,
        },
      }],
    }));

    expect(state.activePayoffs.map((payoff) => payoff.id)).toEqual(expect.arrayContaining([
      'reserve-secured',
      'rental-loop-stable',
      'shortlist-locked',
    ]));
    expect(state.activePayoffs.length).toBeGreaterThanOrEqual(3);
  });

  it('detects newly earned payoff transitions between months', () => {
    const before = makePlayer({
      reserve: { targetMonths: 3, allocatedCash: 4_000, autoTopUpPct: 0 },
      nextHomeShortlistIds: ['ec-1'],
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 325_000,
        isRented: false,
        monthlyRental: 1_500,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 10,
      }],
    });
    const after = makePlayer({
      reserve: { targetMonths: 3, allocatedCash: 8_000, autoTopUpPct: 0 },
      nextHomeShortlistIds: ['ec-1', 'condo-4'],
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 325_000,
        isRented: true,
        monthlyRental: 1_500,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 9,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 16,
          satisfaction: 82,
          rentStrategy: 'market',
          askingRent: 1_500,
          contractedRent: 1_500,
          defaultRiskPct: 4,
          renewalIntent: 78,
        },
      }],
    });

    const payoffs = getOwnershipPayoffTransitions(before, after);
    expect(payoffs.map((payoff) => payoff.id)).toEqual(expect.arrayContaining([
      'reserve-secured',
      'rental-loop-stable',
      'shortlist-locked',
    ]));
  });
});
