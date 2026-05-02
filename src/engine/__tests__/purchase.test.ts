import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import type { Player } from '@/game/types';
import { buyPropertyPure } from '../actions';
import { getDownPaymentAmount, validatePurchase } from '../purchase';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 27,
    careerId: 'tech',
    salary: 5_500,
    cash: 50_000,
    cpfOrdinary: 31_600,
    cpfSpecial: 8_300,
    cpfMedisave: 11_000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 100_900,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    ...overrides,
  };
}

const tampines = properties.find((property) => property.id === 'hdb-bto-1');
const punggol = properties.find((property) => property.id === 'hdb-bto-2');

if (!tampines || !punggol) {
  throw new Error('Expected fixture properties to exist.');
}

describe('validatePurchase', () => {
  it('calculates the exact Tampines 25% shortfall from cash only', () => {
    const downPayment = getDownPaymentAmount(tampines.price, 25);
    const validation = validatePurchase(makePlayer(), tampines, downPayment);

    expect(validation.downPayment).toBe(95_000);
    expect(validation.bsd).toBe(6_000);
    expect(validation.absd).toBe(0);
    expect(validation.totalUpfront).toBe(101_000);
    expect(validation.shortfall).toBe(51_000);
    expect(validation.canBuy).toBe(false);
  });

  it('allows the Tampines 5% purchase path with zero shortfall and a S$361,000 mortgage', () => {
    const downPayment = getDownPaymentAmount(tampines.price, 5);
    const validation = validatePurchase(makePlayer(), tampines, downPayment);

    expect(validation.downPayment).toBe(19_000);
    expect(validation.totalUpfront).toBe(25_000);
    expect(validation.shortfall).toBe(0);
    expect(validation.mortgageAmount).toBe(361_000);
    expect(validation.canBuy).toBe(true);

    const result = buyPropertyPure(makePlayer(), tampines.id, downPayment);
    expect(result.ok).toBe(true);
  });

  it('calculates the exact Punggol 25% shortfall at S$50,000 cash', () => {
    const downPayment = getDownPaymentAmount(punggol.price, 25);
    const validation = validatePurchase(makePlayer(), punggol, downPayment);

    expect(validation.downPayment).toBe(130_000);
    expect(validation.bsd).toBe(10_200);
    expect(validation.totalUpfront).toBe(140_200);
    expect(validation.shortfall).toBe(90_200);
  });

  it('calculates the exact Punggol 25% shortfall at S$100,000 cash', () => {
    const downPayment = getDownPaymentAmount(punggol.price, 25);
    const validation = validatePurchase(makePlayer({ cash: 100_000 }), punggol, downPayment);

    expect(validation.totalUpfront).toBe(140_200);
    expect(validation.shortfall).toBe(40_200);
  });

  it('clamps the Punggol 7% shortfall at zero and exposes the financing blocker', () => {
    const downPayment = getDownPaymentAmount(punggol.price, 7);
    const validation = validatePurchase(makePlayer({ cash: 100_000 }), punggol, downPayment);

    expect(validation.downPayment).toBe(36_400);
    expect(validation.totalUpfront).toBe(46_600);
    expect(validation.shortfall).toBe(0);
    expect(validation.canBuy).toBe(false);
    expect(validation.reasons.map((reason) => reason.code)).toContain('msr_exceeded');

    const result = buyPropertyPure(makePlayer({ cash: 100_000 }), punggol.id, downPayment);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('msr_exceeded');
    }
  });

  it('blocks already-owned properties with the same validation the reducer returns', () => {
    const downPayment = getDownPaymentAmount(tampines.price, 25);
    const player = makePlayer({
      properties: [{
        propertyId: tampines.id,
        purchasePrice: tampines.price,
        purchaseDate: '2024-01',
        currentValue: tampines.price,
        isRented: false,
        monthlyRental: 0,
        renovationLevel: 0,
      }],
    });

    const validation = validatePurchase(player, tampines, downPayment);
    expect(validation.canBuy).toBe(false);
    expect(validation.reasons[0]?.code).toBe('already_owned');

    const result = buyPropertyPure(player, tampines.id, downPayment);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('already_owned');
    }
  });
});
