import { describe, expect, it } from 'vitest';
import { selectNetWorth, selectOutstandingDebt } from '../selectors';
import { buyPropertyPure, applyLoanPure, payLoanPure } from '../actions';
import { advanceTurn } from '../turn';
import type { Player } from '@/game/types';
import { createRng } from '../rng';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester', age: 27, careerId: 'tech', salary: 8000,
    cash: 50_000, cpfOrdinary: 20_000, cpfSpecial: 5_000, cpfMedisave: 15_000,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 0,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('Regression: Net Worth Formula', () => {
  it('starting net worth = cash + all CPF balances', () => {
    const player = makePlayer();
    const nw = selectNetWorth(player);
    expect(nw).toBe(50_000 + 20_000 + 5_000 + 15_000);
  });

  it('taking a loan does not change net worth', () => {
    const player = makePlayer({ cash: 50_000 });
    const nwBefore = selectNetWorth(player);
    const result = applyLoanPure(player, 50_000, 5, 5, 'personal');
    expect(result.ok).toBe(true);
    const nwAfter = selectNetWorth(result.value.player);
    expect(nwAfter).toBe(nwBefore);
  });

  it('repaying a loan does not materially change net worth', () => {
    const player = makePlayer({ cash: 100_000 });
    const loanResult = applyLoanPure(player, 50_000, 5, 5, 'personal');
    const playerWithLoan = loanResult.value.player;
    const nwBeforeRepay = selectNetWorth(playerWithLoan);
    const loan = playerWithLoan.loans[0];
    const repayResult = payLoanPure(playerWithLoan, loan.id, 50_000);
    expect(repayResult.ok).toBe(true);
    const nwAfterRepay = selectNetWorth(repayResult.value.player);
    expect(Math.abs(nwAfterRepay - nwBeforeRepay)).toBeLessThan(2);
  });

  it('net worth subtracts outstanding mortgage debt', () => {
    const player = makePlayer({ cash: 200_000 });
    const result = buyPropertyPure(player, 'tampines-greenverde-4rm', 95_000);
    if (result.ok) {
      const nw = selectNetWorth(result.value.player);
      const p = result.value.player;
      const expectedNw = p.cash + p.cpfOrdinary + p.cpfSpecial + p.cpfMedisave
        + p.properties.reduce((s, prop) => s + prop.currentValue, 0)
        - p.loans.filter(l => !l.isPaid).reduce((s, l) => s + l.remainingBalance, 0);
      expect(nw).toBe(expectedNw);
      expect(nw).toBeLessThan(200_000 + 20_000 + 5_000 + 15_000);
    }
  });

  it('net worth with multiple loans and properties', () => {
    const player = makePlayer({ cash: 500_000 });
    const result = buyPropertyPure(player, 'tampines-greenverde-4rm', 95_000);
    if (result.ok) {
      const p1 = result.value.player;
      const loanResult = applyLoanPure(p1, 30_000, 5, 3, 'personal');
      if (loanResult.ok) {
        const p2 = loanResult.value.player;
        const nw = selectNetWorth(p2);
        const totalDebt = selectOutstandingDebt(p2);
        expect(totalDebt).toBeGreaterThan(0);
        expect(nw).toBe(p2.cash + p2.cpfOrdinary + p2.cpfSpecial + p2.cpfMedisave
          + p2.properties.reduce((s, prop) => s + prop.currentValue, 0) - totalDebt);
      }
    }
  });
});

describe('Regression: Loan Amortization', () => {
  it('loan balance decreases monotonically across turns', () => {
    let player = makePlayer({ cash: 200_000 });
    const loanResult = applyLoanPure(player, 50_000, 5, 5, 'personal');
    if (!loanResult.ok) return;
    player = loanResult.value.player;

    const rng = createRng(42);
    const market = { interestRate: 2.5, priceIndex: 100, rentalIndex: 100, volatility: 0.1, lastEvent: null };
    const settings = { soundEnabled: true, musicEnabled: false, animationSpeed: 'normal' as const, autoSave: true, difficulty: 'normal' as const };

    let prevBalance = player.loans[0].remainingBalance;
    for (let i = 0; i < 10; i++) {
      const turnResult = advanceTurn({ player, market, settings, rng });
      player = turnResult.player;
      const loan = player.loans[0];
      if (!loan.isPaid) {
        expect(loan.remainingBalance).toBeLessThanOrEqual(prevBalance);
        expect(loan.remainingBalance).toBe(Math.round(loan.remainingBalance));
        prevBalance = loan.remainingBalance;
      }
    }
  });

  it('paid-off loans have zero balance', () => {
    const player = makePlayer({ cash: 200_000 });
    const loanResult = applyLoanPure(player, 1_000, 5, 1, 'personal');
    if (!loanResult.ok) return;
    const p = loanResult.value.player;
    const loan = p.loans[0];
    const repayResult = payLoanPure(p, loan.id, 1_000);
    expect(repayResult.ok).toBe(true);
    expect(repayResult.value.player.loans[0].isPaid).toBe(true);
    expect(repayResult.value.player.loans[0].remainingBalance).toBe(0);
  });
});

describe('Regression: Achievement Unlock', () => {
  it('first-property achievement unlocks after purchase', () => {
    const player = makePlayer({ cash: 200_000 });
    const result = buyPropertyPure(player, 'tampines-greenverde-4rm', 95_000);
    if (result.ok) {
      const p = result.value.player;
      expect(p.achievements).toContain('first-property');
    }
  });
});

describe('Regression: Formatting', () => {
  it('formatPercent handles floating point artifacts', async () => {
    const { formatPercent } = await import('@/lib/format');
    expect(formatPercent(55.00000000000001)).toBe('55%');
    expect(formatPercent(0.55 * 100)).toBe('55%');
    expect(formatPercent(0.55 * 100, 1)).toBe('55.0%');
  });

  it('formatCurrency rounds to whole dollars', async () => {
    const { formatCurrency } = await import('@/lib/format');
    expect(formatCurrency(489031.833)).toBe('S$489,032');
    expect(formatCurrency(49760.084)).toBe('S$49,760');
  });

  it('roundMoney rounds to whole dollars', async () => {
    const { roundMoney } = await import('@/lib/format');
    expect(roundMoney(489031.833)).toBe(489032);
    expect(roundMoney(49760.084)).toBe(49760);
    expect(roundMoney(49760.5)).toBe(49761);
  });
});
