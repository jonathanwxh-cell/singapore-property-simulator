import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getOwnershipBeatState } from '../ownershipMoments';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Moment Tester',
    age: 33,
    careerId: 'graduate',
    salary: 6_200,
    cash: 95_000,
    cpfOrdinary: 48_000,
    cpfSpecial: 11_000,
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
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 33 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    nextHomeShortlistIds: [],
    ...overrides,
  };
}

describe('getOwnershipBeatState', () => {
  it('creates an active settle-in beat with a reserve warning early in MOP', () => {
    const beat = getOwnershipBeatState(makePlayer({
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

    expect(beat.active).toBe(true);
    expect(beat.chapterId).toBe('settle-in');
    expect(beat.cadenceMonths).toBe(2);
    expect(beat.monthsUntilNextBeat).toBe(2);
    expect(beat.signals[0]?.id).toBe('reserve-gap');
    expect(beat.notableKey).toContain('settle-in');
  });

  it('surfaces shortlist pressure during prepare-upgrade when no target is pinned', () => {
    const beat = getOwnershipBeatState(makePlayer({
      cash: 150_000,
      cpfOrdinary: 75_000,
      reserve: { targetMonths: 3, allocatedCash: 11_000, autoTopUpPct: 0 },
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 318_000,
        isRented: true,
        monthlyRental: 1_600,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 22,
        conditionScore: 82,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 4,
          leaseEndTurn: 16,
          satisfaction: 82,
          rentStrategy: 'market',
          askingRent: 1_600,
          contractedRent: 1_600,
          defaultRiskPct: 4,
          renewalIntent: 78,
        },
        completedRenovations: ['flooring'],
      }],
      life: createInitialLifeState({
        ownershipCampaign: {
          incomeRunwayXp: 4,
          homeReadinessXp: 5,
          exitIntelXp: 2,
        },
      }),
    }));

    expect(beat.chapterId).toBe('prepare-upgrade');
    expect(beat.signals.some((signal) => signal.id === 'shortlist-blur')).toBe(true);
    expect(beat.signals.some((signal) => signal.id === 'district-preview')).toBe(true);
  });

  it('switches to school pressure in the final chapter for family-heavy runs', () => {
    const beat = getOwnershipBeatState(makePlayer({
      children: 1,
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'multi-gen-family', age: 36 },
      cash: 210_000,
      cpfOrdinary: 95_000,
      reserve: { targetMonths: 3, allocatedCash: 14_000, autoTopUpPct: 0 },
      nextHomeShortlistIds: ['ec-1'],
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 336_000,
        isRented: true,
        monthlyRental: 1_750,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 8,
        conditionScore: 84,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 4,
          leaseEndTurn: 20,
          satisfaction: 84,
          rentStrategy: 'market',
          askingRent: 1_750,
          contractedRent: 1_750,
          defaultRiskPct: 4,
          renewalIntent: 82,
        },
        completedRenovations: ['flooring'],
      }],
      life: createInitialLifeState({
        ownershipCampaign: {
          incomeRunwayXp: 7,
          homeReadinessXp: 7,
          exitIntelXp: 7,
        },
      }),
    }));

    expect(beat.chapterId).toBe('line-up-exit');
    expect(beat.signals[0]?.id).toBe('school-deadline');
    expect(beat.signals[1]?.id).toBe('valuation-tailwind');
  });
});
