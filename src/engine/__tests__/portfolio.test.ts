import { describe, expect, it } from 'vitest';
import type { Player } from '@/game/types';
import { advancePortfolioMonth, describeInvestorRoute } from '../portfolio';
import { selectMonthlyOwnershipCosts } from '../selectors';
import { withEvaluatedAchievements } from '../achievementRules';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Owner',
    age: 27,
    careerId: 'tech',
    salary: 5_500,
    cash: 120_000,
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
    turnCount: 0,
    totalNetWorth: 155_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('advancePortfolioMonth', () => {
  it('applies maintenance, tax, and vacancy drag to vacant properties', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: false,
        monthlyRental: 1647,
        renovationLevel: 0,
      }],
    });

    const result = advancePortfolioMonth(player);

    expect(result.updatedProperties[0].vacancyMonths).toBe(1);
    expect(result.updatedProperties[0].occupancyStatus).toBe('vacant');
    expect(result.monthlyCosts.propertyTax).toBeGreaterThan(0);
    expect(result.monthlyCosts.maintenance).toBeGreaterThan(0);
  });

  it('resets vacancy and keeps rented units tenanted', () => {
    const player = makePlayer({
      properties: [{
        propertyId: 'hdb-bto-1',
        purchasePrice: 380_000,
        purchaseDate: '2024-01',
        currentValue: 380_000,
        isRented: true,
        monthlyRental: 1647,
        renovationLevel: 0,
        vacancyMonths: 3,
        occupancyStatus: 'vacant',
        maintenanceCost: 304,
        propertyTax: 228,
      }],
    });

    const result = advancePortfolioMonth(player);

    expect(result.updatedProperties[0].vacancyMonths).toBe(0);
    expect(result.updatedProperties[0].occupancyStatus).toBe('tenanted');
    expect(selectMonthlyOwnershipCosts({ ...player, properties: result.updatedProperties })).toBe(532);
  });

  it('describes heartland and commercial portfolio routes', () => {
    const heartlandRoute = describeInvestorRoute(makePlayer({
      properties: [
        { propertyId: 'hdb-bto-1', purchasePrice: 380_000, purchaseDate: '2024-01', currentValue: 380_000, isRented: false, monthlyRental: 1647, renovationLevel: 0 },
        { propertyId: 'hdb-bto-2', purchasePrice: 520_000, purchaseDate: '2024-01', currentValue: 520_000, isRented: true, monthlyRental: 2080, renovationLevel: 0 },
        { propertyId: 'hdb-resale-5', purchasePrice: 520_000, purchaseDate: '2024-01', currentValue: 520_000, isRented: true, monthlyRental: 1993, renovationLevel: 0 },
      ],
    }));
    const commercialRoute = describeInvestorRoute(makePlayer({
      properties: [
        { propertyId: 'commercial-1', purchasePrice: 12000000, purchaseDate: '2024-01', currentValue: 12000000, isRented: true, monthlyRental: 28000, renovationLevel: 0 },
        { propertyId: 'commercial-3', purchasePrice: 5500000, purchaseDate: '2024-01', currentValue: 5500000, isRented: true, monthlyRental: 16000, renovationLevel: 0 },
        { propertyId: 'commercial-5', purchasePrice: 2800000, purchaseDate: '2024-01', currentValue: 2800000, isRented: true, monthlyRental: 9800, renovationLevel: 0 },
      ],
    }));

    expect(heartlandRoute.label).toBe('Heartland Landlord');
    expect(commercialRoute.label).toBe('Commercial Cashflow Operator');
  });

  it('unlocks the commercial operator achievement for three commercial assets', () => {
    const evaluated = withEvaluatedAchievements(makePlayer({
      properties: [
        { propertyId: 'commercial-1', purchasePrice: 12000000, purchaseDate: '2024-01', currentValue: 12000000, isRented: true, monthlyRental: 28000, renovationLevel: 0 },
        { propertyId: 'commercial-3', purchasePrice: 5500000, purchaseDate: '2024-01', currentValue: 5500000, isRented: true, monthlyRental: 16000, renovationLevel: 0 },
        { propertyId: 'commercial-5', purchasePrice: 2800000, purchaseDate: '2024-01', currentValue: 2800000, isRented: true, monthlyRental: 9800, renovationLevel: 0 },
      ],
    }));

    expect(evaluated.achievements).toContain('commercial-operator');
  });
});
