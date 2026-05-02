import { describe, it, expect } from 'vitest';
import { getLtvCap, checkMsr, maxBorrowable, minCashRequired } from '../ltv';

describe('LTV / MSR', () => {
  describe('getLtvCap', () => {
    it('95% LTV on first housing loan', () => {
      expect(getLtvCap(0)).toBe(0.95);
    });

    it('45% LTV on second housing loan', () => {
      expect(getLtvCap(1)).toBe(0.45);
    });

    it('35% LTV on third+ housing loan', () => {
      expect(getLtvCap(2)).toBe(0.35);
      expect(getLtvCap(10)).toBe(0.35);
    });
  });

  describe('checkMsr', () => {
    it('MSR passes for HDB within 30% limit', () => {
      const result = checkMsr(10000, 2500, true);
      expect(result.passes).toBe(true);
      expect(result.maxMonthlyPayment).toBe(3000);
    });

    it('MSR fails for HDB exceeding 30% limit', () => {
      const result = checkMsr(5000, 2000, true);
      expect(result.passes).toBe(false);
      expect(result.maxMonthlyPayment).toBe(1500);
    });

    it('MSR always passes for non-HDB', () => {
      expect(checkMsr(1000, 5000, false).passes).toBe(true);
    });
  });

  describe('maxBorrowable', () => {
    it('first loan: 95% of property price', () => {
      expect(maxBorrowable(1000000, 0)).toBe(950000);
    });

    it('second loan: 45% of property price', () => {
      expect(maxBorrowable(1000000, 1)).toBe(450000);
    });

    it('third loan: 35% of property price', () => {
      expect(maxBorrowable(1000000, 2)).toBe(350000);
    });
  });

  describe('minCashRequired', () => {
    it('first loan: 5% down', () => {
      expect(minCashRequired(1000000, 0)).toBe(50000);
    });

    it('second loan: 55% down', () => {
      expect(minCashRequired(1000000, 1)).toBe(550000);
    });

    it('third loan: 65% down', () => {
      expect(minCashRequired(1000000, 2)).toBe(650000);
    });
  });
});
