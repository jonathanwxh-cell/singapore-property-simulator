import { describe, expect, it } from 'vitest';
import type { Player } from '@/game/types';
import { getEligibleScenarios } from '../scenarioContext';
import { getRouteWeightedScenarios } from '../scenarioContext';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Scenario Tester',
    age: 27,
    careerId: 'tech',
    salary: 5_500,
    cash: 80_000,
    cpfOrdinary: 20_000,
    cpfSpecial: 5_000,
    cpfMedisave: 10_000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 6,
    totalNetWorth: 115_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('getEligibleScenarios', () => {
  it('filters tenant issues when the player has no rented assets', () => {
    const eligible = getEligibleScenarios(makePlayer());

    expect(eligible.some((scenario) => scenario.id === 'tenant-default')).toBe(false);
    expect(eligible.some((scenario) => scenario.id === 'good-tenant')).toBe(false);
  });

  it('allows tenant scenarios when the player has a rented property', () => {
    const eligible = getEligibleScenarios(makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: true,
        monthlyRental: 1647,
        renovationLevel: 0,
      }],
    }));

    expect(eligible.some((scenario) => scenario.id === 'tenant-default')).toBe(true);
    expect(eligible.some((scenario) => scenario.id === 'good-tenant')).toBe(true);
  });

  it('surfaces lease-top-up only for aging leasehold stock', () => {
    const eligibleWithoutLeasehold = getEligibleScenarios(makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: false,
        monthlyRental: 1647,
        renovationLevel: 0,
      }],
    }));

    const eligibleWithLeasehold = getEligibleScenarios(makePlayer({
      properties: [{
        propertyId: 'hdb-resale-2',
        purchasePrice: 680_000,
        purchaseDate: '2024-01',
        currentValue: 680_000,
        isRented: false,
        monthlyRental: 2720,
        renovationLevel: 0,
      }],
    }));

    expect(eligibleWithoutLeasehold.some((scenario) => scenario.id === 'lease-top-up')).toBe(false);
    expect(eligibleWithLeasehold.some((scenario) => scenario.id === 'lease-top-up')).toBe(true);
  });

  it('weights route-matched scenarios without removing eligible variety', () => {
    const weighted = getRouteWeightedScenarios(makePlayer({
      runRouteId: 'heartland-landlord',
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: true,
        monthlyRental: 1647,
        renovationLevel: 0,
      }],
    }));

    const tenantDefaultCount = weighted.filter((scenario) => scenario.id === 'tenant-default').length;
    expect(tenantDefaultCount).toBeGreaterThan(1);
    expect(weighted.some((scenario) => scenario.id === 'market-crash')).toBe(true);
  });
});
