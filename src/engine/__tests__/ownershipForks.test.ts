import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getOwnershipForkOptions } from '../ownershipForks';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Fork Tester',
    age: 32,
    careerId: 'graduate',
    salary: 6_500,
    cash: 90_000,
    cpfOrdinary: 45_000,
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
    firstHomePurchased: true,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 32 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    nextHomeShortlistIds: [],
    ...overrides,
  };
}

describe('getOwnershipForkOptions', () => {
  it('offers settle-in forks that match early ownership needs', () => {
    const forks = getOwnershipForkOptions(makePlayer({
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 265_000,
        isRented: false,
        monthlyRental: 1_300,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 58,
      }],
    }));

    expect(forks).toHaveLength(2);
    expect(forks[0]).toMatchObject({
      id: 'neighbour-referral',
      intentId: 'landlord-ops',
      route: '/property/hdb-bto-0',
    });
  });

  it('uses the pinned shortlist target for late-stage market forks', () => {
    const forks = getOwnershipForkOptions(makePlayer({
      cash: 180_000,
      cpfOrdinary: 80_000,
      reserve: { targetMonths: 3, allocatedCash: 12_000, autoTopUpPct: 0 },
      nextHomeShortlistIds: ['ec-1'],
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 320_000,
        isRented: true,
        monthlyRental: 1_600,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 9,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 14,
          satisfaction: 82,
          rentStrategy: 'market',
          askingRent: 1_600,
          contractedRent: 1_600,
          defaultRiskPct: 4,
          renewalIntent: 78,
        },
        conditionScore: 82,
        completedRenovations: ['flooring'],
      }],
      life: createInitialLifeState({
        ownershipCampaign: {
          incomeRunwayXp: 4,
          homeReadinessXp: 5,
          exitIntelXp: 6,
        },
      }),
    }));

    expect(forks.some((fork) => fork.intentId === 'mop-market-intel' && fork.route === '/property/ec-1')).toBe(true);
  });
});
