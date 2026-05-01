import { describe, expect, it } from 'vitest';
import { buyPropertyPure, sellPropertyPure, payLoanPure, applyLoanPure } from '../actions';
import type { Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test', age: 27, careerId: 'graduate', salary: 5000,
    cash: 1_000_000, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 0,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('buyPropertyPure', () => {
  it('rejects unknown property IDs', () => {
    const result = buyPropertyPure(makePlayer(), 'does-not-exist', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('property_not_found');
  });

  it('rejects insufficient cash', () => {
    const result = buyPropertyPure(makePlayer({ cash: 1000 }), 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('rejects when TDSR would exceed 55%', () => {
    const player = makePlayer({
      salary: 3000,
      loans: [{ id: 'old', type: 'personal', principal: 0, remainingBalance: 100_000, interestRate: 5, monthlyPayment: 1500, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('tdsr_exceeded');
  });

  it('rejects duplicate purchases', () => {
    const player = makePlayer({
      properties: [{ propertyId: 'hdb-bto-1', purchasePrice: 380_000, purchaseDate: '', currentValue: 380_000, isRented: false, monthlyRental: 0, renovationLevel: 0 }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('already_owned');
  });
});

describe('payLoanPure', () => {
  it('caps payment at remaining balance and returns excess to cash', () => {
    const player = makePlayer({
      cash: 500_000,
      loans: [{ id: 'L1', type: 'personal', principal: 80_000, remainingBalance: 80_000, interestRate: 5, monthlyPayment: 850, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = payLoanPure(player, 'L1', 200_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.cash).toBe(420_000);
      expect(result.value.player.loans[0].remainingBalance).toBe(0);
      expect(result.value.player.loans[0].isPaid).toBe(true);
    }
  });

  it('rejects when cash is insufficient', () => {
    const player = makePlayer({
      cash: 1000,
      loans: [{ id: 'L1', type: 'personal', principal: 80_000, remainingBalance: 80_000, interestRate: 5, monthlyPayment: 850, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = payLoanPure(player, 'L1', 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });
});

describe('sellPropertyPure', () => {
  it('records capital gain (saleValue - purchasePrice), independent of outstanding loan', () => {
    const player = makePlayer({
      cash: 0,
      properties: [{ propertyId: 'p1', purchasePrice: 800_000, purchaseDate: '', currentValue: 1_200_000, isRented: false, monthlyRental: 0, renovationLevel: 0, loanId: 'L1' }],
      loans: [{ id: 'L1', type: 'mortgage', principal: 600_000, remainingBalance: 600_000, interestRate: 2.5, monthlyPayment: 2371, termYears: 30, startDate: '', isPaid: false }],
    });
    const result = sellPropertyPure(player, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.totalPropertySalesProfit).toBe(400_000);
      expect(result.value.player.cash).toBe(600_000);
      expect(result.value.player.properties).toHaveLength(0);
      expect(result.value.player.loans[0].isPaid).toBe(true);
    }
  });
});

describe('applyLoanPure', () => {
  it('rejects when credit score is below floor', () => {
    const result = applyLoanPure(makePlayer({ creditScore: 350 }), 50_000, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('credit_too_low');
  });
});
