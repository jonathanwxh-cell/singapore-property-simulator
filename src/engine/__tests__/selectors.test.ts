import { describe, expect, it } from 'vitest';
import { createInitialLifeState } from '@/game/types';
import { selectAffordabilityReport, selectAvailableCash, selectMonthlyExpenses, selectMonthlyNetCashflow, selectMonthlyRentalIncome, selectMonthlyTakeHome, selectNetWorth, selectReservedCash } from '../selectors';
import { TAKE_HOME_RATIO } from '../constants';
import type { Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test', age: 27, careerId: 'graduate', salary: 5000,
    cash: 100_000, cpfOrdinary: 20_000, cpfSpecial: 5_000, cpfMedisave: 20_000,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 0,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0, life: createInitialLifeState(),
    ...overrides,
  };
}

describe('selectNetWorth', () => {
  it('subtracts outstanding loan balances from assets', () => {
    const player = makePlayer({
      cash: 50_000, cpfOrdinary: 30_000, cpfSpecial: 10_000, cpfMedisave: 15_000,
      properties: [
        { propertyId: 'a', purchasePrice: 0, purchaseDate: '', currentValue: 800_000, isRented: false, monthlyRental: 0, renovationLevel: 0 },
        { propertyId: 'b', purchasePrice: 0, purchaseDate: '', currentValue: 1_200_000, isRented: false, monthlyRental: 0, renovationLevel: 0 },
      ],
      loans: [
        { id: 'loan-a', type: 'mortgage', principal: 0, remainingBalance: 600_000, interestRate: 2.5, monthlyPayment: 2500, termYears: 30, startDate: '', isPaid: false },
        { id: 'loan-b', type: 'personal', principal: 0, remainingBalance: 50_000, interestRate: 5, monthlyPayment: 900, termYears: 5, startDate: '', isPaid: false },
      ],
    });
    expect(selectNetWorth(player)).toBe(50_000 + 800_000 + 1_200_000 + 30_000 + 10_000 + 15_000 - 600_000 - 50_000);
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

describe('reserve-aware cash selectors', () => {
  it('separates spendable cash from earmarked reserve without changing net worth', () => {
    const player = makePlayer({
      cash: 100_000,
      reserve: {
        targetMonths: 3,
        allocatedCash: 15_000,
        autoTopUpPct: 0,
      },
    });

    expect(selectReservedCash(player)).toBe(15_000);
    expect(selectAvailableCash(player)).toBe(85_000);
    expect(selectNetWorth(player)).toBe(100_000 + 20_000 + 5_000 + 20_000);
  });

  it('caps visible reserved cash to current cash to keep imported saves readable', () => {
    const player = makePlayer({
      cash: 4_000,
      reserve: {
        targetMonths: 3,
        allocatedCash: 10_000,
        autoTopUpPct: 0,
      },
    });

    expect(selectReservedCash(player)).toBe(4_000);
    expect(selectAvailableCash(player)).toBe(0);
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
    expect(selectMonthlyNetCashflow(player, TAKE_HOME_RATIO)).toBe(3850);
  });

  it('includes household load in monthly net cashflow', () => {
    const player = makePlayer({
      salary: 5000,
      life: createInitialLifeState({ householdLoad: 650 }),
    });

    expect(selectMonthlyNetCashflow(player, TAKE_HOME_RATIO)).toBe(3350);
  });
});

describe('selectAffordabilityReport', () => {
  it('estimates months to afford from monthly surplus', () => {
    const player = makePlayer({ cash: 50_000 });
    const report = selectAffordabilityReport(player, 81_900, 6_000);

    expect(report.shortfall).toBe(31_900);
    expect(report.monthsAtCurrentPace).toBe(6);
    expect(report.blockers).toContain('cash');
  });

  it('returns null months-to-buy when monthly surplus is non-positive', () => {
    const player = makePlayer({
      cash: 50_000,
      life: createInitialLifeState({ householdLoad: 4500 }),
    });

    const report = selectAffordabilityReport(player, 81_900, selectMonthlyNetCashflow(player, TAKE_HOME_RATIO));
    expect(report.monthsAtCurrentPace).toBe(null);
  });
});
