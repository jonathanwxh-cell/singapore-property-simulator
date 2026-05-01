import { describe, expect, it } from 'vitest';
import { amortizeOneMonth, calcMonthlyPayment, calcTDSR } from '../finance';

describe('calcMonthlyPayment', () => {
  it('matches the standard amortization formula', () => {
    expect(calcMonthlyPayment(500_000, 2.5, 30)).toBe(1976);
  });

  it('returns 0 for zero or negative principal', () => {
    expect(calcMonthlyPayment(0, 2.5, 30)).toBe(0);
    expect(calcMonthlyPayment(-1000, 2.5, 30)).toBe(0);
  });

  it('handles 0% interest as straight-line division', () => {
    expect(calcMonthlyPayment(36_000, 0, 1)).toBe(3000);
  });
});

describe('amortizeOneMonth', () => {
  it('splits payment into interest and principal correctly', () => {
    const step = amortizeOneMonth(500_000, 1976, 2.5);
    expect(step.interestPaid).toBeCloseTo(1041.67, 2);
    expect(step.principalPaid).toBeCloseTo(934.33, 2);
    expect(step.newBalance).toBeCloseTo(499_065.67, 2);
    expect(step.isPaidOff).toBe(false);
    expect(step.actualPayment).toBe(1976);
  });

  it('fully amortizes a 30yr 500K @ 2.5% loan in 358-362 months', () => {
    const principal = 500_000;
    const rate = 2.5;
    const payment = calcMonthlyPayment(principal, rate, 30);
    let balance = principal;
    let months = 0;
    while (balance > 0 && months < 1000) {
      const step = amortizeOneMonth(balance, payment, rate);
      balance = step.newBalance;
      months++;
    }
    expect(months).toBeGreaterThanOrEqual(358);
    expect(months).toBeLessThanOrEqual(362);
  });

  it('final-month true-up does not over-pay', () => {
    const step = amortizeOneMonth(100, 1976, 2.5);
    expect(step.isPaidOff).toBe(true);
    expect(step.newBalance).toBe(0);
    expect(step.actualPayment).toBeLessThan(1976);
    expect(step.actualPayment).toBeCloseTo(100 + (100 * 2.5 / 100 / 12), 2);
  });
});

describe('calcTDSR', () => {
  it('returns the correct ratio', () => {
    expect(calcTDSR(2000, 1500, 5000)).toBeCloseTo(0.7, 5);
  });

  it('returns Infinity for zero income', () => {
    expect(calcTDSR(2000, 1500, 0)).toBe(Infinity);
  });
});
