import { describe, it, expect } from 'vitest';
import * as stampDuty from '../stampDuty';
import { calculateBSD, calculateABSD, calculateBSDForCategory, calculateTotalStampDuty } from '../stampDuty';

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

    it('uses non-residential BSD tiers for commercial property', () => {
      expect(calculateBSDForCategory(1_000_000, 'commercial')).toBe(24_600);
      expect(calculateBSDForCategory(5_000_000, 'commercial')).toBe(144_600);
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

    it('PR first property: 5% ABSD', () => {
      expect(calculateABSD(500000, 0, false, true)).toBe(25000);
    });

    it('PR second property: 30% ABSD', () => {
      expect(calculateABSD(500000, 1, false, true)).toBe(150000);
    });

    it('PR third+ property: 35% ABSD', () => {
      expect(calculateABSD(500000, 2, false, true)).toBe(175000);
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

  describe('SSD', () => {
    it('uses the post-4 Jul 2025 residential SSD schedule for short holds', () => {
      const calculateSSD = (stampDuty as Record<string, unknown>).calculateSSD;
      expect(typeof calculateSSD).toBe('function');
      if (typeof calculateSSD !== 'function') return;

      expect(calculateSSD({
        salePrice: 1_200_000,
        acquisitionYear: 2025,
        acquisitionMonth: 8,
        saleYear: 2026,
        saleMonth: 4,
        category: 'private-residential',
      })).toBe(192_000);
    });

    it('uses the pre-4 Jul 2025 residential SSD schedule for legacy purchases', () => {
      const calculateSSD = (stampDuty as Record<string, unknown>).calculateSSD;
      expect(typeof calculateSSD).toBe('function');
      if (typeof calculateSSD !== 'function') return;

      expect(calculateSSD({
        salePrice: 1_000_000,
        acquisitionYear: 2025,
        acquisitionMonth: 6,
        saleYear: 2026,
        saleMonth: 5,
        category: 'private-residential',
      })).toBe(120_000);
    });

    it('does not apply SSD to commercial sales', () => {
      const calculateSSD = (stampDuty as Record<string, unknown>).calculateSSD;
      expect(typeof calculateSSD).toBe('function');
      if (typeof calculateSSD !== 'function') return;

      expect(calculateSSD({
        salePrice: 2_000_000,
        acquisitionYear: 2025,
        acquisitionMonth: 8,
        saleYear: 2026,
        saleMonth: 4,
        category: 'commercial',
      })).toBe(0);
    });
  });
});
