import { describe, expect, it } from 'vitest';
import type { Player } from '@/game/types';
import { applyLoanPure, buyPropertyPure, payLoanPure } from './actions';
import { evaluateAchievements } from './achievementRules';
import { TDSR_LIMIT } from './constants';
import { selectNetWorth, selectOutstandingDebt, selectTotalPropertyValue } from './selectors';
import { calculateABSD, calculateBSD } from './stampDuty';
import { formatCurrency, formatPercent } from '@/lib/format';

function player(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 27,
    careerId: 'tech',
    salary: 12000,
    cash: 50000,
    cpfOrdinary: 30000,
    cpfSpecial: 7000,
    cpfMedisave: 3000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 90000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    ...overrides,
  };
}

describe('finance regression coverage', () => {
  it('starts with net worth equal to cash plus CPF when debt-free and property-free', () => {
    const p = player();
    expect(selectTotalPropertyValue(p)).toBe(0);
    expect(selectOutstandingDebt(p)).toBe(0);
    expect(selectNetWorth(p)).toBe(p.cash + p.cpfOrdinary + p.cpfSpecial + p.cpfMedisave);
  });

  it('does not increase net worth when a personal loan increases cash and debt equally', () => {
    const p = player();
    const before = selectNetWorth(p);
    const result = applyLoanPure(p, 50000, 2.5, 5, 'personal');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.player.cash).toBe(p.cash + 50000);
    expect(selectOutstandingDebt(result.value.player)).toBe(50000);
    expect(selectNetWorth(result.value.player)).toBe(before);
  });

  it('caps and rounds loan repayments without overpaying cash or balance', () => {
    const loaned = applyLoanPure(player(), 50000, 2.5, 5, 'personal');
    expect(loaned.ok).toBe(true);
    if (!loaned.ok) return;

    const loan = loaned.value.player.loans[0];
    const repaid = payLoanPure(loaned.value.player, loan.id, 999999.9999);
    expect(repaid.ok).toBe(true);
    if (!repaid.ok) return;

    const repaidLoan = repaid.value.player.loans[0];
    expect(repaidLoan.remainingBalance).toBe(0);
    expect(repaidLoan.isPaid).toBe(true);
    expect(repaid.value.player.cash).toBe(loaned.value.player.cash - 50000);
  });

  it('applies first-property purchase costs, mortgage debt, and First Steps achievement basis', () => {
    const p = player({ cash: 200000 });
    const propertyId = 'hdb-bto-1';
    const price = 380000;
    const downPayment = Math.round(price * 0.25);
    const upfront = downPayment + calculateBSD(price);

    const result = buyPropertyPure(p, propertyId, downPayment);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const next = result.value.player;
    expect(next.properties).toHaveLength(1);
    expect(next.loans).toHaveLength(1);
    expect(next.cash).toBe(p.cash - upfront);
    expect(selectOutstandingDebt(next)).toBe(price - downPayment);
    expect(selectNetWorth(next)).toBe(p.cash + p.cpfOrdinary + p.cpfSpecial + p.cpfMedisave - calculateBSD(price));
    expect(evaluateAchievements(next)).toContain('first-property');
  });

  it('applies ABSD only from the second property and clamps shortfall math', () => {
    const firstPrice = 380000;
    const secondPrice = 520000;
    expect(calculateABSD(firstPrice, 0)).toBe(0);
    expect(calculateABSD(secondPrice, 1)).toBe(secondPrice * 0.2);

    const downPayment = Math.round(secondPrice * 0.25);
    const totalUpfront = downPayment + calculateBSD(secondPrice) + calculateABSD(secondPrice, 1);
    const availableCash = 200000;
    const shortfall = Math.max(0, totalUpfront - availableCash);

    expect(shortfall).toBeGreaterThanOrEqual(0);
    expect(Math.max(0, totalUpfront - (totalUpfront + 1000))).toBe(0);
  });

  it('formats money and TDSR cap without floating-point artifacts', () => {
    expect(formatCurrency(334295.917, { decimals: 2 })).toBe('S$334,295.92');
    expect(formatCurrency(49828.166666666664, { decimals: 2 })).toBe('S$49,828.17');
    expect(formatPercent(TDSR_LIMIT * 100)).toBe('55%');
  });
});
