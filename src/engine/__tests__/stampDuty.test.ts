import { describe, it, expect } from 'vitest';
import { calculateBSD, calculateABSD, calculateTotalStampDuty } from '../stampDuty';

describe('Stamp Duty', () => {
  describe('BSD', () => {
    it('calculates BSD for $300k property', () => {
      // $180k @ 1% = $1,800; $120k @ 2% = $2,400; Total = $4,200
      expect(calculateBSD(300000)).toBe(4200);
    });

    it('calculates BSD for $500k property', () => {
      // $180k @ 1% + $180k @ 2% + $140k @ 3% = $9,600
      expect(calculateBSD(500000)).toBe(9600);
    });

    it('calculates BSD for $1M property', () => {
      // $180k@1% + $180k@2% + $640k@3% = $24,600
      expect(calculateBSD(1000000)).toBe(24600);
    });

    it('calculates BSD for $1.5M property', () => {
      // $180k@1% + $180k@2% + $640k@3% + $500k@4% = $44,600
      expect(calculateBSD(1500000)).toBe(44600);
    });

    it('calculates BSD for $3M property', () => {
      // $180k@1% + $180k@2% + $640k@3% + $500k@4% + $1.5M@5% = $119,600
      expect(calculateBSD(3000000)).toBe(119600);
    });

    it('calculates BSD for $5M property', () => {
      // $180k@1% + $180k@2% + $640k@3% + $500k@4% + $1.5M@5% + $2M@6% = $239,600
      expect(calculateBSD(5000000)).toBe(239600);
    });

    it('returns 0 for $0 property', () => {
      expect(calculateBSD(0)).toBe(0);
    });
  });

  describe('ABSD', () => {
    it('citizen first property: 0% ABSD', () => {
      expect(calculateABSD(500000, 0)).toBe(0);
    });

    it('citizen second property: 20% ABSD', () => {
      expect(calculateABSD(500000, 1)).toBe(100000);
    });

    it('citizen third+ property: 30% ABSD', () => {
      expect(calculateABSD(500000, 2)).toBe(150000);
      expect(calculateABSD(500000, 5)).toBe(150000);
    });

    it('foreigner: 60% ABSD regardless of count', () => {
      expect(calculateABSD(500000, 0, false, false)).toBe(300000);
      expect(calculateABSD(500000, 1, false, false)).toBe(300000);
    });

    it('PR first property: 0% ABSD', () => {
      expect(calculateABSD(500000, 0, false, true)).toBe(0);
    });

    it('PR second property: 20% ABSD', () => {
      expect(calculateABSD(500000, 1, false, true)).toBe(100000);
    });
  });

  describe('calculateTotalStampDuty', () => {
    it('sums BSD + ABSD for citizen second property', () => {
      // BSD on $500k = $9,600; ABSD = 20% * $500k = $100k
      expect(calculateTotalStampDuty(500000, 1)).toBe(109600);
    });

    it('returns BSD only for citizen first property', () => {
      expect(calculateTotalStampDuty(500000, 0)).toBe(9600);
    });
  });
});
