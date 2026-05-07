import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type MaintenanceIssue, type Player } from '@/game/types';
import { advancePortfolioMonth } from '../portfolio';
import { selectMonthlyRentalIncome } from '../selectors';
import {
  resolveMaintenanceIssuePure,
  setReservePlanPure,
  setTenantStrategyPure,
  startRenovationPure,
} from '../propertyOperations';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Operator',
    age: 32,
    careerId: 'tech',
    salary: 8_000,
    cash: 250_000,
    cpfOrdinary: 60_000,
    cpfSpecial: 20_000,
    cpfMedisave: 20_000,
    creditScore: 720,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2028,
    month: 1,
    turnCount: 48,
    totalNetWorth: 350_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 36,
    nextJobSwitchTurn: 60,
    firstHomePurchased: true,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 3, lastOutcome: 'steady', lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

describe('property operations', () => {
  it('starts a renovation project and applies rent/value uplift when it completes', () => {
    const player = makePlayer({
      cash: 100_000,
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 400_000,
        isRented: false,
        monthlyRental: 1_700,
        renovationLevel: 0,
        conditionScore: 62,
      }],
    });

    const started = startRenovationPure(player, 0, 'kitchen-refresh');
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.player.cash).toBe(82_000);
    expect(started.value.player.properties[0].occupancyStatus).toBe('renovating');
    expect(started.value.player.properties[0].activeRenovation?.remainingMonths).toBe(2);

    const monthOne = advancePortfolioMonth(started.value.player);
    expect(monthOne.updatedProperties[0].activeRenovation?.remainingMonths).toBe(1);

    const monthTwo = advancePortfolioMonth({ ...started.value.player, properties: monthOne.updatedProperties });
    const completed = monthTwo.updatedProperties[0];
    expect(completed.activeRenovation).toBeUndefined();
    expect(completed.completedRenovations).toContain('kitchen');
    expect(completed.renovationLevel).toBe(1);
    expect(completed.currentValue).toBeGreaterThan(400_000);
    expect(completed.monthlyRental).toBeGreaterThan(1_700);
    expect(completed.conditionScore).toBeGreaterThan(62);
  });

  it('lets premium contractors trade more cash for faster renovation completion', () => {
    const player = makePlayer({
      cash: 100_000,
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 400_000,
        isRented: false,
        monthlyRental: 1_700,
        renovationLevel: 0,
        conditionScore: 62,
      }],
    });

    const result = startRenovationPure(player, 0, 'kitchen-refresh', 'premium');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const active = result.value.player.properties[0].activeRenovation;
    expect(result.value.player.cash).toBeLessThan(82_000);
    expect(active?.contractorTier).toBe('premium');
    expect(active?.durationMonths).toBe(1);
    expect(active?.projectedPaybackMonths).not.toBeNull();
  });

  it('returns HDB homes under MOP to owner-occupied after disruptive renovations complete', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: true,
        monthlyRental: 1_700,
        renovationLevel: 0,
        occupancyStatus: 'owner-occupied',
        mopRemainingMonths: 48,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 46,
          leaseEndTurn: 58,
          satisfaction: 76,
          rentStrategy: 'market',
          askingRent: 765,
          contractedRent: 765,
          defaultRiskPct: 1.5,
          renewalIntent: 72,
        },
      }],
    });

    const started = startRenovationPure(player, 0, 'kitchen-refresh');
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const monthOne = advancePortfolioMonth(started.value.player);
    const monthTwo = advancePortfolioMonth({ ...started.value.player, properties: monthOne.updatedProperties });
    const completed = monthTwo.updatedProperties[0];

    expect(completed.activeRenovation).toBeUndefined();
    expect(completed.tenant).toBeUndefined();
    expect(completed.isRented).toBe(false);
    expect(completed.mopRemainingMonths).toBe(46);
    expect(completed.occupancyStatus).toBe('owner-occupied');
    expect(completed.vacancyMonths).toBe(0);
  });

  it('blocks HDB whole-unit rental during MOP but allows owner-occupied room rental', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: false,
        monthlyRental: 1_700,
        renovationLevel: 0,
        mopRemainingMonths: 36,
      }],
    });

    const wholeUnit = setTenantStrategyPure(player, 0, {
      mode: 'whole-unit',
      profileId: 'local-family',
      rentStrategy: 'market',
    });
    expect(wholeUnit.ok).toBe(false);
    if (!wholeUnit.ok) expect(wholeUnit.reason).toBe('mop_restricted');

    const roomRental = setTenantStrategyPure(player, 0, {
      mode: 'room-rental',
      profileId: 'local-family',
      rentStrategy: 'conservative',
    });
    expect(roomRental.ok).toBe(true);
    if (!roomRental.ok) return;
    expect(roomRental.value.player.properties[0].tenant?.rentalMode).toBe('room-rental');
    expect(roomRental.value.player.properties[0].isRented).toBe(true);
    expect(roomRental.value.player.properties[0].occupancyStatus).toBe('owner-occupied');
    expect(selectMonthlyRentalIncome(roomRental.value.player)).toBeLessThan(1_700);
    expect(selectMonthlyRentalIncome(roomRental.value.player)).toBeGreaterThan(600);
  });

  it('unlocks whole-unit HDB rental after MOP reaches zero', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: false,
        monthlyRental: 1_700,
        renovationLevel: 0,
        mopRemainingMonths: 0,
      }],
    });

    const result = setTenantStrategyPure(player, 0, {
      mode: 'whole-unit',
      profileId: 'local-family',
      rentStrategy: 'market',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.properties[0].occupancyStatus).toBe('tenanted');
    expect(result.value.player.properties[0].tenant?.rentalMode).toBe('whole-unit');
  });

  it('sets aggressive corporate leases above base rent with higher satisfaction risk', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'condo-10',
        purchasePrice: 1_150_000,
        purchaseDate: '2027-01',
        currentValue: 1_150_000,
        isRented: false,
        monthlyRental: 3_700,
        renovationLevel: 0,
        mopRemainingMonths: 0,
      }],
    });

    const result = setTenantStrategyPure(player, 0, {
      mode: 'corporate-lease',
      profileId: 'expat-pmet',
      rentStrategy: 'aggressive',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tenant = result.value.player.properties[0].tenant;
    expect(tenant?.contractedRent).toBeGreaterThan(3_700);
    expect(tenant?.defaultRiskPct).toBeGreaterThan(4);
    expect(tenant?.satisfaction).toBeLessThan(75);
    expect(selectMonthlyRentalIncome(result.value.player)).toBe(tenant?.contractedRent);
  });

  it('uses emergency reserve bookkeeping when resolving maintenance', () => {
    const issue: MaintenanceIssue = {
      id: 'issue-1',
      propertyId: 'hdb-bto-1',
      category: 'plumbing',
      severity: 'urgent',
      estimatedCost: 2_400,
      satisfactionImpact: -8,
      valueImpactPct: -0.4,
      recurrenceRiskPct: 18,
      status: 'open',
    };
    const player = makePlayer({
      cash: 20_000,
      reserve: { targetMonths: 4, allocatedCash: 8_000, autoTopUpPct: 20 },
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: true,
        monthlyRental: 1_700,
        renovationLevel: 0,
        conditionScore: 55,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'whole-unit',
          leaseStartTurn: 48,
          leaseEndTurn: 60,
          satisfaction: 68,
          rentStrategy: 'market',
          askingRent: 1_700,
          contractedRent: 1_700,
          defaultRiskPct: 2,
          renewalIntent: 68,
        },
        openMaintenanceIssues: [issue],
      }],
    });

    const result = resolveMaintenanceIssuePure(player, 0, 'issue-1', 'proper-repair');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.cash).toBe(17_600);
    expect(result.value.player.reserve?.allocatedCash).toBe(5_600);
    expect(result.value.player.properties[0].openMaintenanceIssues).toHaveLength(0);
    expect(result.value.player.properties[0].conditionScore).toBeGreaterThan(55);
    expect(result.value.player.properties[0].tenant?.satisfaction).toBeGreaterThan(68);
  });

  it('allocates an emergency reserve without changing total cash', () => {
    const player = makePlayer({ cash: 30_000 });

    const result = setReservePlanPure(player, {
      targetMonths: 4,
      allocatedCash: 12_000,
      autoTopUpPct: 15,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.cash).toBe(30_000);
    expect(result.value.player.reserve).toMatchObject({
      targetMonths: 4,
      allocatedCash: 12_000,
      autoTopUpPct: 15,
    });
  });
});
