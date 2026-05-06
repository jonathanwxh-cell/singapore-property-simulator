import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getLifeCampaign } from '../lifeCampaign';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Campaign Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5_000,
    cash: 50_000,
    cpfOrdinary: 40_000,
    cpfSpecial: 15_000,
    cpfMedisave: 12_000,
    creditScore: 650,
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
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

describe('life campaign director', () => {
  it('frames the default BTO run as a foundation chapter with one next action', () => {
    const campaign = getLifeCampaign(makePlayer(), null);

    expect(campaign.title).toContain('BTO');
    expect(campaign.chapter.id).toBe('foundation');
    expect(campaign.activeMission.route).toBe('/life');
    expect(campaign.score.stability).toBeGreaterThan(0);
  });

  it('turns active scenarios into the campaign priority', () => {
    const campaign = getLifeCampaign(makePlayer(), 'first-home-window');

    expect(campaign.activeMission.route).toBe('/scenarios');
    expect(campaign.activeMission.label).toContain('scenario');
    expect(campaign.activeMission.tone).toBe('warn');
  });

  it('uses profile-specific story framing for single parents and multi-gen families', () => {
    const singleParent = getLifeCampaign(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-parent', age: 35 },
      runRouteId: 'bto-upgrader',
      children: 1,
    }), null);
    const multiGen = getLifeCampaign(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'multi-gen-family', age: 40 },
      runRouteId: 'heartland-landlord',
      children: 2,
      life: createInitialLifeState({ householdLoad: 2_650, stress: 32 }),
    }), null);

    expect(singleParent.storyBeat.title).toContain('Shelter');
    expect(multiGen.storyBeat.detail).toContain('family');
  });

  it('moves owned homes into an ownership chapter with operating guidance', () => {
    const campaign = getLifeCampaign(makePlayer({
      firstHomePurchased: true,
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-03',
        currentValue: 270_000,
        isRented: false,
        monthlyRental: 1_300,
        renovationLevel: 0,
        mopRemainingMonths: 58,
      }],
    }), null);

    expect(campaign.chapter.id).toBe('ownership');
    expect(campaign.activeMission.route).toMatch(/portfolio|property|dashboard/);
    expect(campaign.storyBeat.detail).toContain('MOP');
  });
});
