import { describe, expect, it } from 'vitest';
import { selectMonthlyExpenses, selectMonthlyNetCashflow, selectMonthlyRentalIncome, selectMonthlyTakeHome, selectNetWorth } from '../selectors';
import { TAKE_HOME_RATIO } from '../constants';
import type { Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test', age: 27, careerId: 'graduate', salary: 5000,
    cash: 100_000, cpfOrdinary: 20_000, cpfSpecial: 5_000, cpfMedisave: 20_000,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 0,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('selectNetWorth', () => {
  it('sums cash, property values, and all CPF buckets when debt-free', () => {
    const player = makePlayer({
      cash: 50_000, cpfOrdinary: 30_000, cpfSpecial: 10_000, cpfMedisave: 15_000,
      properties: [
        { propertyId: 'a', purchasePrice: 0, purchaseDate: '', currentValue: 800_000, isRented: false, monthlyRental: 0, renovationLevel: 0 },
        { propertyId: 'b', purchasePrice: 0, purchaseDate: '', currentValue: 1_200_000, isRented: false, monthlyRental: 0, renovationLevel: 0 },
      ],
    });
    expect(selectNetWorth(player)).toBe(50_000 + 800_000 + 1_200_000 + 30_000 + 10_000 + 15_000);
  });

  it('subtracts unpaid loan balances from property-backed net worth', () => {
    const player = makePlayer({
      cash: 25_000,
      cpfOrdinary: 31_600,
      cpfSpecial: 8_300,
      cpfMedisave: 11_000,
      properties: [
        { propertyId: 'hdb-bto-1', purchasePrice: 380_000, purchaseDate: '', currentValue: 380_000, isRented: false, monthlyRental: 0, renovationLevel: 0, loanId: 'mortgage-1' },
      ],
      loans: [
        { id: 'mortgage-1', type: 'mortgage', principal: 361_000, remainingBalance: 361_000, interestRate: 2.5, monthlyPayment: 1426, termYears: 30, startDate: '', isPaid: false },
      ],
    });

    expect(selectNetWorth(player)).toBe(94_900);
  });
});

describe('selectMonthlyRentalIncome', () => {
  it('sums only rented properties', () => {
    const player = makePlayer({
      properties: [
        { propertyId: 'a', purchasePrice: 0, purchaseDate: '', currentValue: 0, isRented: true, monthlyRental: 3000, renovationLevel: 0 },
        { propertyId: 'b', purchasePrice: 0, purchaseDate: '', currentValue: 0, isRented: false, monthlyRental: 5000, renovationLevel: 0 },
      ],
    });
    expect(selectMonthlyRentalIncome(player)).toBe(3000);
  });
});

describe('selectMonthlyExpenses', () => {
  it('sums monthly payments of unpaid loans only', () => {
    const player = makePlayer({
      loans: [
        { id: 'a', type: 'mortgage', principal: 0, remainingBalance: 100, interestRate: 2.5, monthlyPayment: 500, termYears: 30, startDate: '', isPaid: false },
        { id: 'b', type: 'personal', principal: 0, remainingBalance: 0, interestRate: 5, monthlyPayment: 200, termYears: 5, startDate: '', isPaid: true },
      ],
    });
    expect(selectMonthlyExpenses(player)).toBe(500);
  });
});

describe('selectMonthlyTakeHome', () => {
  it('applies the take-home ratio', () => {
    expect(selectMonthlyTakeHome(makePlayer({ salary: 5000 }), TAKE_HOME_RATIO)).toBe(4000);
  });
});

describe('selectMonthlyNetCashflow', () => {
  it('returns income minus expenses', () => {
    const player = makePlayer({
      salary: 5000,
      properties: [{ propertyId: 'a', purchasePrice: 0, purchaseDate: '', currentValue: 0, isRented: true, monthlyRental: 2000, renovationLevel: 0 }],
      loans: [{ id: 'a', type: 'mortgage', principal: 0, remainingBalance: 100, interestRate: 2.5, monthlyPayment: 1500, termYears: 30, startDate: '', isPaid: false }],
    });
    expect(selectMonthlyNetCashflow(player, TAKE_HOME_RATIO)).toBe(4500);
  });
});
