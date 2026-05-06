import { describe, expect, it } from 'vitest';
import { properties, getPropertyCategory } from '@/data/properties';
import { createInitialLifeState, type Player } from '@/game/types';
import { getFirstHomeMissions } from '../firstHomeMissions';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Mission Runner',
    age: 30,
    careerId: 'civil',
    salary: 6_000,
    cash: 80_000,
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
    totalNetWorth: 147_000,
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
    buyerProfile: {
      residencyStatus: 'sc',
      householdProfile: 'couple-family',
      age: 30,
    },
    ...overrides,
  };
}

describe('getFirstHomeMissions', () => {
  it('shows a readable first-home mission rail for new players', () => {
    const missions = getFirstHomeMissions(makePlayer());

    expect(missions[0]).toMatchObject({
      id: 'profile-ready',
      completed: true,
    });
    expect(missions.some((mission) => mission.id === 'buy-first-home' && !mission.completed)).toBe(true);
    expect(missions.find((mission) => mission.id === 'review-starter-home')?.route).toBe('/properties');
  });

  it('starts profile-driven users on private-first missions for single-under-35', () => {
    const privateStarter = properties.find((property) => getPropertyCategory(property.type) === 'private-residential');
    expect(privateStarter).toBeDefined();

    const missions = getFirstHomeMissions(makePlayer({
      buyerProfile: {
        residencyStatus: 'sc',
        householdProfile: 'single-under-35',
        age: 28,
      },
      cash: 500_000,
      cpfOrdinary: 150_000,
    }));

    const reviewMission = missions.find((mission) => mission.id === 'review-starter-home');
    const buyMission = missions.find((mission) => mission.id === 'buy-first-home');
    expect(reviewMission?.detail).toBeTruthy();
    expect(buyMission?.route).toBe('/properties');
  });

  it('marks post-purchase room-rental and reserve missions as complete', () => {
    const missions = getFirstHomeMissions(makePlayer({
      firstHomePurchased: true,
      reserve: { targetMonths: 3, allocatedCash: 12_000, autoTopUpPct: 0 },
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 265_000,
        isRented: true,
        monthlyRental: 1_300,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 55,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 2,
          leaseEndTurn: 14,
          satisfaction: 76,
          rentStrategy: 'market',
          askingRent: 1_040,
          contractedRent: 1_040,
          defaultRiskPct: 2,
          renewalIntent: 74,
        },
      }],
    }));

    expect(missions.find((mission) => mission.id === 'buy-first-home')?.completed).toBe(true);
    expect(missions.find((mission) => mission.id === 'mop-safe-room-rental')?.completed).toBe(true);
    expect(missions.find((mission) => mission.id === 'protect-reserve')?.completed).toBe(true);
  });
});
