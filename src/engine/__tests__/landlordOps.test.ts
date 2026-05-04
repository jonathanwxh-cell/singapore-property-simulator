import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type MaintenanceIssue, type Player } from '@/game/types';
import {
  applyTenantLeaseDecisionPure,
  advancePropertyOperationsMonth,
  getLandlordOpsSummary,
  getTenantLeaseOptions,
} from '../propertyOperations';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Landlord',
    age: 34,
    careerId: 'tech',
    salary: 9_000,
    cash: 180_000,
    cpfOrdinary: 70_000,
    cpfSpecial: 30_000,
    cpfMedisave: 20_000,
    creditScore: 730,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2029,
    month: 6,
    turnCount: 65,
    totalNetWorth: 650_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 36_000,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 60,
    nextJobSwitchTurn: 72,
    firstHomePurchased: true,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 5, lastOutcome: 'steady', lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

describe('Landlord Ops 2.0', () => {
  it('offers lease decisions with explicit rent, satisfaction, and vacancy tradeoffs', () => {
    const property = {
      propertyId: 'condo-10',
      purchasePrice: 1_150_000,
      purchaseDate: '2028-01',
      currentValue: 1_180_000,
      isRented: true,
      monthlyRental: 3_700,
      renovationLevel: 0,
      tenant: {
        profileId: 'expat-pmet',
        rentalMode: 'whole-unit',
        leaseStartTurn: 54,
        leaseEndTurn: 66,
        satisfaction: 62,
        rentStrategy: 'market',
        askingRent: 3_700,
        contractedRent: 3_700,
        defaultRiskPct: 2.5,
        renewalIntent: 58,
      },
    };

    const options = getTenantLeaseOptions(property, 65);

    expect(options.map((option) => option.id)).toEqual(['renew', 'raise-rent', 'reset-market', 'end-lease']);
    expect(options.find((option) => option.id === 'raise-rent')).toMatchObject({
      rentDelta: expect.any(Number),
      satisfactionDelta: -8,
      vacancyRiskDelta: 14,
    });
    expect(options.find((option) => option.id === 'renew')?.projectedRent).toBe(3_700);
  });

  it('renews a good tenant while improving satisfaction and extending the lease', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'condo-10',
        purchasePrice: 1_150_000,
        purchaseDate: '2028-01',
        currentValue: 1_180_000,
        isRented: true,
        monthlyRental: 3_700,
        renovationLevel: 0,
        tenant: {
          profileId: 'expat-pmet',
          rentalMode: 'whole-unit',
          leaseStartTurn: 54,
          leaseEndTurn: 66,
          satisfaction: 72,
          rentStrategy: 'market',
          askingRent: 3_700,
          contractedRent: 3_700,
          defaultRiskPct: 2.5,
          renewalIntent: 70,
        },
      }],
    });

    const result = applyTenantLeaseDecisionPure(player, 0, 'renew');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tenant = result.value.player.properties[0].tenant;
    expect(tenant?.contractedRent).toBe(3_700);
    expect(tenant?.satisfaction).toBeGreaterThan(72);
    expect(tenant?.leaseEndTurn).toBe(77);
    expect(result.value.player.operationHistory?.[0].title).toContain('Lease renewed');
  });

  it('turns an over-pushed rent raise into vacancy when renewal intent is weak', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-resale-5',
        purchasePrice: 520_000,
        purchaseDate: '2027-01',
        currentValue: 540_000,
        isRented: true,
        monthlyRental: 2_000,
        renovationLevel: 0,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'whole-unit',
          leaseStartTurn: 52,
          leaseEndTurn: 65,
          satisfaction: 44,
          rentStrategy: 'aggressive',
          askingRent: 2_240,
          contractedRent: 2_240,
          defaultRiskPct: 4,
          renewalIntent: 28,
        },
      }],
    });

    const result = applyTenantLeaseDecisionPure(player, 0, 'raise-rent');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.properties[0].tenant).toBeUndefined();
    expect(result.value.player.properties[0].isRented).toBe(false);
    expect(result.value.player.properties[0].occupancyStatus).toBe('vacant');
    expect(result.value.player.properties[0].vacancyMonths).toBe(1);
    expect(result.value.player.operationHistory?.[0].tone).toBe('warn');
  });

  it('keeps reset-to-market rent scoped to the current room-rental mode', () => {
    const property = {
      propertyId: 'hdb-bto-3',
      purchasePrice: 380_000,
      purchaseDate: '2024-01',
      currentValue: 390_000,
      isRented: true,
      monthlyRental: 1_300,
      renovationLevel: 0,
      mopRemainingMonths: 55,
      tenant: {
        profileId: 'local-family',
        rentalMode: 'room-rental',
        leaseStartTurn: 7,
        leaseEndTurn: 19,
        satisfaction: 78,
        rentStrategy: 'conservative',
        askingRent: 538,
        contractedRent: 538,
        defaultRiskPct: 1.5,
        renewalIntent: 82,
      },
    };

    const resetOption = getTenantLeaseOptions(property, 8).find((option) => option.id === 'reset-market');

    expect(resetOption?.projectedRent).toBe(585);
    expect(resetOption?.rentDelta).toBe(47);
  });

  it('summarizes reserve exposure, lease pressure, and landlord milestones', () => {
    const issue: MaintenanceIssue = {
      id: 'issue-1',
      propertyId: 'condo-10',
      category: 'plumbing',
      severity: 'urgent',
      label: 'Burst Pipe',
      estimatedCost: 6_500,
      satisfactionImpact: -8,
      valueImpactPct: -0.4,
      recurrenceRiskPct: 18,
      status: 'open',
    };
    const player = makePlayer({
      reserve: { targetMonths: 4, allocatedCash: 4_000, autoTopUpPct: 10 },
      properties: [{
        propertyId: 'condo-10',
        purchasePrice: 1_150_000,
        purchaseDate: '2028-01',
        currentValue: 1_180_000,
        isRented: true,
        monthlyRental: 3_700,
        renovationLevel: 0,
        tenant: {
          profileId: 'expat-pmet',
          rentalMode: 'whole-unit',
          leaseStartTurn: 54,
          leaseEndTurn: 66,
          satisfaction: 54,
          rentStrategy: 'market',
          askingRent: 3_700,
          contractedRent: 3_700,
          defaultRiskPct: 2.5,
          renewalIntent: 48,
        },
        openMaintenanceIssues: [issue],
      }],
    });

    const summary = getLandlordOpsSummary(player);

    expect(summary.openIssueCount).toBe(1);
    expect(summary.unprotectedRisk).toBe(2_500);
    expect(summary.expiringLeaseCount).toBe(1);
    expect(summary.averageTenantSatisfaction).toBe(54);
    expect(summary.milestones.map((milestone) => milestone.id)).toContain('first-tenant');
    expect(summary.milestones.map((milestone) => milestone.id)).toContain('reserve-gap');
  });

  it('keeps HDB room rental MOP-safe as owner-occupied after a month advances', () => {
    const player = makePlayer({
      turnCount: 8,
      properties: [{
        propertyId: 'hdb-bto-3',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 390_000,
        isRented: true,
        monthlyRental: 1_050,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 55,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 7,
          leaseEndTurn: 19,
          satisfaction: 78,
          rentStrategy: 'market',
          askingRent: 1_050,
          contractedRent: 1_050,
          defaultRiskPct: 1.5,
          renewalIntent: 74,
        },
      }],
    });

    const result = advancePropertyOperationsMonth(player);

    expect(result.updatedProperties[0].occupancyStatus).toBe('owner-occupied');
    expect(result.updatedProperties[0].mopRemainingMonths).toBe(54);
    expect(result.updatedProperties[0].tenant?.rentalMode).toBe('room-rental');
  });
});
