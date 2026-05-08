import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getOwnershipCampaign } from '../ownershipCampaign';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Owner',
    age: 30,
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
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    ...overrides,
  };
}

describe('getOwnershipCampaign', () => {
  it('starts active-MOP owners in the settle-in chapter when the home is not operational yet', () => {
    const campaign = getOwnershipCampaign(makePlayer({
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

    expect(campaign.active).toBe(true);
    expect(campaign.activeChapter?.id).toBe('settle-in');
    expect(campaign.tracks[0]?.id).toBe('home-readiness');
  });

  it('moves late-MOP owners into line-up-exit with exit intel on top', () => {
    const campaign = getOwnershipCampaign(makePlayer({
      cash: 180_000,
      cpfOrdinary: 85_000,
      reserve: { targetMonths: 3, allocatedCash: 12_000, autoTopUpPct: 0 },
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
        conditionScore: 82,
        completedRenovations: ['flooring'],
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 14,
          satisfaction: 83,
          rentStrategy: 'market',
          askingRent: 1_600,
          contractedRent: 1_600,
          defaultRiskPct: 4,
          renewalIntent: 80,
        },
      }],
      life: createInitialLifeState({
        ownershipCampaign: {
          incomeRunwayXp: 4,
          homeReadinessXp: 5,
          exitIntelXp: 6,
        },
      }),
    }));

    expect(campaign.activeChapter?.id).toBe('line-up-exit');
    expect(campaign.tracks[0]?.id).toBe('exit-intel');
    expect(campaign.tracks[0]?.progressPct).toBeGreaterThan(60);
  });
});
