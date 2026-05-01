import { describe, it, expect } from 'vitest';
import { getCpfAllocation, contributeCpf, applyCpfInterest, estimateInitialCpf } from '../cpf';

describe('CPF', () => {
  describe('getCpfAllocation', () => {
    it('returns correct rates for age ≤55', () => {
      const alloc = getCpfAllocation(35);
      expect(alloc.oa).toBeCloseTo(0.23, 4);
      expect(alloc.sa).toBeCloseTo(0.06, 4);
      expect(alloc.ma).toBeCloseTo(0.08, 4);
    });

    it('returns reduced rates for age 56–60', () => {
      const alloc = getCpfAllocation(58);
      expect(alloc.oa).toBeCloseTo(0.16, 4);
      expect(alloc.sa).toBeCloseTo(0.105, 4);
      expect(alloc.ma).toBeCloseTo(0.105, 4);
    });

    it('returns lowest rates for age 70+', () => {
      const alloc = getCpfAllocation(75);
      expect(alloc.oa).toBeCloseTo(0.05, 4);
      expect(alloc.sa).toBeCloseTo(0.025, 4);
      expect(alloc.ma).toBeCloseTo(0.075, 4);
    });
  });

  describe('contributeCpf', () => {
    it('caps salary at wage ceiling', () => {
      const result = contributeCpf({ oa: 0, sa: 0, ma: 0 }, 10000, 30);
      const alloc = getCpfAllocation(30);
      const total = alloc.oa + alloc.sa + alloc.ma;
      const expectedMax = 6800 * total;
      expect(result.oa + result.sa + result.ma).toBeCloseTo(expectedMax, 1);
    });

    it('contributes correctly for salary below ceiling', () => {
      const result = contributeCpf({ oa: 0, sa: 0, ma: 0 }, 5000, 30);
      const alloc = getCpfAllocation(30);
      expect(result.oa).toBeCloseTo(5000 * alloc.oa, 1);
      expect(result.sa).toBeCloseTo(5000 * alloc.sa, 1);
      expect(result.ma).toBeCloseTo(5000 * alloc.ma, 1);
    });
  });

  describe('applyCpfInterest', () => {
    it('applies monthly interest to all accounts', () => {
      const result = applyCpfInterest({ oa: 20000, sa: 10000, ma: 5000 });
      expect(result.oa).toBeGreaterThan(20000);
      expect(result.sa).toBeGreaterThan(10000);
      expect(result.ma).toBeGreaterThan(5000);
    });

    it('gives extra 1% interest on first $60k OA+SA', () => {
      const balances = { oa: 20000, sa: 10000, ma: 5000 };
      const result = applyCpfInterest(balances);
      const baseOaInterest = 20000 * 0.025 / 12;
      const expectedExtra = 30000 * 0.01 / 12;
      const oaIncrease = result.oa - 20000;
      expect(oaIncrease).toBeCloseTo(baseOaInterest + expectedExtra, 1);
    });

    it('caps extra interest at $60k threshold', () => {
      const balances = { oa: 100000, sa: 50000, ma: 10000 };
      const result = applyCpfInterest(balances);
      const expectedExtra = 60000 * 0.01 / 12;
      const baseOaInterest = 100000 * 0.025 / 12;
      const oaIncrease = result.oa - 100000;
      expect(oaIncrease).toBeCloseTo(baseOaInterest + expectedExtra, 1);
    });
  });

  describe('estimateInitialCpf', () => {
    it('returns zero for a 25-year-old (no work history)', () => {
      const result = estimateInitialCpf(25, 5000);
      expect(result.oa).toBe(0);
      expect(result.sa).toBe(0);
      expect(result.ma).toBe(0);
    });

    it('accumulates CPF for a 30-year-old', () => {
      const result = estimateInitialCpf(30, 5000);
      expect(result.oa).toBeGreaterThan(0);
      expect(result.sa).toBeGreaterThan(0);
      expect(result.ma).toBeGreaterThan(0);
    });

    it('caps simulation at 60 months (5 years)', () => {
      const result10 = estimateInitialCpf(35, 5000);
      const result15 = estimateInitialCpf(40, 5000);
      expect(result10.oa).toBeGreaterThan(0);
      expect(result15.oa).toBe(result10.oa);
    });
  });
});
