import { describe, expect, it } from 'vitest';
import { applyLoanPure, buyPropertyPure, payLoanPure, renovatePropertyPure, sellPropertyPure } from '../actions';
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
    // hdb-bto-1 costs $380k. Stamp duty on first property = BSD only = $5,400
    // Down payment of $100k + $5,400 stamp duty = $105,400 needed
    const result = buyPropertyPure(makePlayer({ cash: 1000 }), 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('rejects when TDSR would exceed 55%', () => {
    // hdb-bto-1 costs $380k. LTV cap on first property = 75% = $285k max loan.
    // Down payment must be >= $95k. Use $100k down → loan = $280k (within LTV).
    // With $1500 existing debt + new mortgage, TDSR exceeds 55% on $3000 salary.
    const player = makePlayer({
      salary: 3000,
      cash: 1_000_000,
      loans: [{ id: 'old', type: 'personal', principal: 0, remainingBalance: 100_000, interestRate: 5, monthlyPayment: 1500, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
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

  it('uses CPF OA for eligible residential upfront costs', () => {
    const player = makePlayer({ cash: 60_000, cpfOrdinary: 40_000 });
    const result = buyPropertyPure(player, 'hdb-bto-0', 70_000, 20_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.cash).toBeLessThan(player.cash);
      expect(result.value.player.cpfOrdinary).toBe(20_000);
    }
  });

  it('rejects CPF OA usage on commercial purchases', () => {
    const player = makePlayer({ cash: 5_000_000, cpfOrdinary: 200_000 });
    const result = buyPropertyPure(player, 'commercial-5', 1_000_000, 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('cpf_not_allowed');
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

  it('rejects zero amount', () => {
    const result = applyLoanPure(makePlayer(), 0, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative amount', () => {
    const result = applyLoanPure(makePlayer(), -1000, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects zero termYears (would otherwise produce NaN monthlyPayment)', () => {
    const result = applyLoanPure(makePlayer(), 50_000, 5, 0, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative termYears', () => {
    const result = applyLoanPure(makePlayer(), 50_000, 5, -5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });
});

describe('renovatePropertyPure', () => {
  const playerWithProperty = () => makePlayer({
    properties: [{ propertyId: 'p1', purchasePrice: 500_000, purchaseDate: '', currentValue: 500_000, isRented: false, monthlyRental: 2000, renovationLevel: 0 }],
  });

  it('rejects zero cost', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative cost (would otherwise be a money printer)', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, -1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects invalid property index', () => {
    const result = renovatePropertyPure(playerWithProperty(), 5, 10_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_index');
  });

  it('rejects insufficient cash', () => {
    const player = { ...playerWithProperty(), cash: 100 };
    const result = renovatePropertyPure(player, 0, 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('increments renovation level and boosts value/rental on success', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, 20_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.properties[0].renovationLevel).toBe(1);
      expect(result.value.player.properties[0].currentValue).toBe(530_000);
      expect(result.value.player.properties[0].monthlyRental).toBe(2300);
      expect(result.value.player.cash).toBe(980_000);
    }
  });
});

describe('loanId uniqueness across buy → sell → buy in same turn', () => {
  it('does not collide when re-buying after sell', () => {
    let player = makePlayer({ cash: 1_000_000 });

    const r1 = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    player = r1.value.player;
    const firstLoanId = player.loans[0].id;

    const r2 = sellPropertyPure(player, 0);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    player = r2.value.player;

    const r3 = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    player = r3.value.player;
    const secondLoanId = player.loans[player.loans.length - 1].id;

    expect(secondLoanId).not.toBe(firstLoanId);
  });
});

describe('buyPropertyPure stamp duty + LTV + MSR', () => {
  it('rejects when cash insufficient for downpayment + BSD + ABSD', () => {
    const player = makePlayer({
      cash: 200_000,
      properties: [{ propertyId: 'existing', purchasePrice: 0, purchaseDate: '', currentValue: 0, isRented: false, monthlyRental: 0, renovationLevel: 0 }],
    });
    // hdb-bto-1 at $380K. As 2nd property: BSD ~6000 + ABSD 76000 = ~82000 stamp.
    // Down 200K + ~82K stamp = 282K. Player has 200K → reject.
    const result = buyPropertyPure(player, 'hdb-bto-1', 200_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('deducts stamp duty from cash on success', () => {
    const player = makePlayer({ cash: 1_000_000 });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // BSD on 380K = 6000. ABSD (1st property) = 0.
      // Cash = 1M - 100K downpayment - 6K BSD = 894K.
      expect(result.value.player.cash).toBe(894_000);
    }
  });

  it('rejects with ltv_exceeded reason when loan exceeds LTV cap on second property', () => {
    const player = makePlayer({
      cash: 5_000_000,
      loans: [{ id: 'm1', type: 'mortgage', principal: 0, remainingBalance: 100_000, interestRate: 2.5, monthlyPayment: 500, termYears: 30, startDate: '', isPaid: false }],
    });
    // hdb-bto-1 at 380K. With 50K downpayment, loan = 330K → 86.8% LTV.
    // Second housing loan capped at 45% → max loan 171K → reject.
    const result = buyPropertyPure(player, 'hdb-bto-1', 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ltv_exceeded');
  });
});
