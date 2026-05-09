import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type OwnedProperty, type Player } from '@/game/types';
import { getLifeBoardVisualState, getPrimaryLivingHomeVisual } from '../visuals';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5000,
    cash: 50000,
    cpfOrdinary: 30000,
    cpfSpecial: 10000,
    cpfMedisave: 10000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'married',
    children: 0,
    year: 2026,
    month: 5,
    turnCount: 4,
    totalNetWorth: 100000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 1,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

function makeOwnedProperty(overrides: Partial<OwnedProperty> = {}): OwnedProperty {
  return {
    propertyId: 'hdb-bto-0',
    purchasePrice: 420000,
    purchaseDate: '2026-05',
    currentValue: 420000,
    isRented: false,
    monthlyRental: 0,
    renovationLevel: 0,
    occupancyStatus: 'owner-occupied',
    mopRemainingMonths: 59,
    conditionScore: 72,
    ...overrides,
  };
}

describe('visual state helpers', () => {
  it('keeps pre-owner players on the first-home board without a fake home', () => {
    const player = makePlayer();

    expect(getPrimaryLivingHomeVisual(player)).toBeNull();
    expect(getLifeBoardVisualState(player)).toMatchObject({
      chapterLabel: 'First-home search',
      avatarStageIndex: 1,
    });
  });

  it('summarizes active MOP ownership as a home season with room rental detail', () => {
    const player = makePlayer({
      firstHomePurchased: true,
      properties: [
        makeOwnedProperty({
          tenant: {
            profileId: 'young-professional',
            rentalMode: 'room-rental',
            rentStrategy: 'market',
            satisfaction: 82,
            renewalIntent: 78,
            askingRent: 650,
            contractedRent: 650,
            defaultRiskPct: 4,
            leaseStartTurn: 4,
            leaseEndTurn: 16,
          },
        }),
      ],
      reserve: { targetMonths: 3, allocatedCash: 5000, autoTopUpPct: 0 },
    });

    const home = getPrimaryLivingHomeVisual(player);
    const board = getLifeBoardVisualState(player);

    expect(home).toMatchObject({
      name: 'Northstar Grove 3-Room',
      statusLabel: 'Room tenant active',
      monthlyRent: 650,
      tenantSatisfaction: 82,
      reserveProtected: true,
      mood: 'earning',
    });
    expect(board.chapterLabel).toBe('Home season');
    expect(board.stages.find((stage) => stage.id === 'home-season')?.status).toBe('current');
  });
});
