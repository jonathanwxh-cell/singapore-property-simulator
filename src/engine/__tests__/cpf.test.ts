import { describe, expect, it } from 'vitest';
import {
  applyCpfInterest,
  contributeCpf,
  estimateInitialCpf,
  getCpfAllocation,
  getCpfEmployeeContribution,
} from '../cpf';

describe('CPF', () => {
  describe('contribution rates and allocation', () => {
    it('uses the 2026 full-rate allocation at age 35', () => {
      const allocation = getCpfAllocation(35);
      expect(allocation.oa).toBeCloseTo(0.23, 4);
      expect(allocation.sa).toBeCloseTo(0.06, 4);
      expect(allocation.ma).toBeCloseTo(0.08, 4);
      expect(getCpfEmployeeContribution(5_000, 35)).toBe(1_000);
    });

    it('uses the 2026 age 56-60 full rates', () => {
      const allocation = getCpfAllocation(58);
      expect(allocation.oa).toBeCloseTo(0.12002, 4);
      expect(allocation.sa).toBeCloseTo(0.114988, 4);
      expect(allocation.ma).toBeCloseTo(0.104992, 4);
      expect(getCpfEmployeeContribution(5_000, 58)).toBe(900);
    });

    it('uses the age-over-70 full rates', () => {
      const allocation = getCpfAllocation(75);
      expect(allocation.oa).toBeCloseTo(0.01, 4);
      expect(allocation.sa).toBeCloseTo(0.01, 4);
      expect(allocation.ma).toBeCloseTo(0.105, 4);
      expect(getCpfEmployeeContribution(5_000, 75)).toBe(250);
    });

    it('does not contribute CPF for foreigners', () => {
      expect(getCpfAllocation(30, 'foreigner')).toEqual({ oa: 0, sa: 0, ma: 0 });
      expect(getCpfEmployeeContribution(5_000, 30, 'foreigner')).toBe(0);
      expect(contributeCpf({ oa: 100, sa: 200, ma: 300 }, 5_000, 30, 'foreigner'))
        .toEqual({ oa: 100, sa: 200, ma: 300 });
    });

    it('uses graduated PR rates in years one and two', () => {
      const yearOne = getCpfAllocation(30, 'spr', 1);
      const yearTwo = getCpfAllocation(30, 'spr', 2);
      const yearThree = getCpfAllocation(30, 'spr', 3);
      expect(yearOne.oa + yearOne.sa + yearOne.ma).toBeCloseTo(0.09, 4);
      expect(yearTwo.oa + yearTwo.sa + yearTwo.ma).toBeCloseTo(0.24, 4);
      expect(yearThree.oa + yearThree.sa + yearThree.ma).toBeCloseTo(0.37, 4);
      expect(getCpfEmployeeContribution(5_000, 30, 'spr', 1)).toBe(250);
      expect(getCpfEmployeeContribution(5_000, 30, 'spr', 2)).toBe(750);
    });

    it('caps contributions at the wage ceiling', () => {
      const result = contributeCpf({ oa: 0, sa: 0, ma: 0 }, 10_000, 30);
      expect(result.oa + result.sa + result.ma).toBeCloseTo(8_000 * 0.37, 1);
      expect(getCpfEmployeeContribution(10_000, 30)).toBe(1_600);
    });
  });

  describe('monthly interest', () => {
    it('applies base interest to all accounts', () => {
      const result = applyCpfInterest({ oa: 20_000, sa: 10_000, ma: 5_000 });
      expect(result.oa).toBeGreaterThan(20_000);
      expect(result.sa).toBeGreaterThan(10_000);
      expect(result.ma).toBeGreaterThan(5_000);
    });

    it('credits extra interest to the retirement bucket', () => {
      const result = applyCpfInterest({ oa: 20_000, sa: 10_000, ma: 0 });
      const baseOa = 20_000 * 0.025 / 12;
      const baseSa = 10_000 * 0.04 / 12;
      const combinedExtra = 30_000 * 0.01 / 12;
      expect(result.oa - 20_000).toBeCloseTo(baseOa, 1);
      expect(result.sa - 10_000).toBeCloseTo(baseSa + combinedExtra, 1);
    });

    it('includes Medisave before eligible OA and caps eligible OA at $20k', () => {
      const result = applyCpfInterest({ oa: 100_000, sa: 30_000, ma: 30_000 });
      const baseOa = 100_000 * 0.025 / 12;
      const baseSa = 30_000 * 0.04 / 12;
      expect(result.oa - 100_000).toBeCloseTo(baseOa, 1);
      expect(result.sa - 30_000).toBeCloseTo(baseSa + 50, 1);
    });

    it('uses the higher first-$30k extra interest after age 55', () => {
      const result = applyCpfInterest({ oa: 5_000, sa: 100_000, ma: 0 }, 58);
      const baseSa = 100_000 * 0.04 / 12;
      const seniorExtra = (30_000 * 0.02 + 30_000 * 0.01) / 12;
      expect(result.sa - 100_000).toBeCloseTo(baseSa + seniorExtra, 1);
    });
  });

  describe('initial estimate', () => {
    it('returns zero at age 25', () => {
      expect(estimateInitialCpf(25, 5_000)).toEqual({ oa: 0, sa: 0, ma: 0 });
    });

    it('accumulates no opening CPF for a foreigner', () => {
      expect(estimateInitialCpf(30, 5_000, 'foreigner')).toEqual({ oa: 0, sa: 0, ma: 0 });
    });

    it('caps history at five years but respects age-band changes', () => {
      const at35 = estimateInitialCpf(35, 5_000);
      const at40 = estimateInitialCpf(40, 5_000);
      expect(at35.oa).toBeGreaterThan(0);
      expect(at40.oa).toBeGreaterThan(0);
      expect(at40.oa).toBeLessThan(at35.oa);
    });
  });
});
