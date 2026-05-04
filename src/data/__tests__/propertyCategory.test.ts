import { describe, expect, it } from 'vitest';
import {
  getPropertyCategory,
  isHdbCategory,
  isResidentialCategory,
  isPrivateResidentialCategory,
  isCommercialCategory,
  type PropertyType,
} from '../properties';

const ALL_TYPES: PropertyType[] = [
  'HDB BTO',
  'HDB Resale',
  'Executive Condo',
  'Private Condo',
  'Landed Terrace',
  'Landed Semi-D',
  'Landed Bungalow',
  'Commercial Shop',
  'Commercial Office',
];

describe('getPropertyCategory', () => {
  it('maps HDB types to "hdb"', () => {
    expect(getPropertyCategory('HDB BTO')).toBe('hdb');
    expect(getPropertyCategory('HDB Resale')).toBe('hdb');
  });

  it('maps Executive Condo to "ec"', () => {
    expect(getPropertyCategory('Executive Condo')).toBe('ec');
  });

  it('maps Private Condo and all Landed types to "private-residential"', () => {
    expect(getPropertyCategory('Private Condo')).toBe('private-residential');
    expect(getPropertyCategory('Landed Terrace')).toBe('private-residential');
    expect(getPropertyCategory('Landed Semi-D')).toBe('private-residential');
    expect(getPropertyCategory('Landed Bungalow')).toBe('private-residential');
  });

  it('maps Commercial types to "commercial"', () => {
    expect(getPropertyCategory('Commercial Shop')).toBe('commercial');
    expect(getPropertyCategory('Commercial Office')).toBe('commercial');
  });

  it('falls back to "commercial" for unknown strings (safest default)', () => {
    expect(getPropertyCategory('Bogus Type')).toBe('commercial');
  });

  it('every PropertyType resolves to one of the four valid categories', () => {
    const valid = new Set(['hdb', 'ec', 'private-residential', 'commercial']);
    for (const t of ALL_TYPES) {
      expect(valid.has(getPropertyCategory(t))).toBe(true);
    }
  });
});

describe('category predicates', () => {
  it('isHdbCategory matches HDB BTO and HDB Resale only', () => {
    const matches = ALL_TYPES.filter(isHdbCategory);
    expect(matches).toEqual(['HDB BTO', 'HDB Resale']);
  });

  it('isResidentialCategory matches everything except commercial', () => {
    expect(ALL_TYPES.filter(isResidentialCategory)).toEqual([
      'HDB BTO',
      'HDB Resale',
      'Executive Condo',
      'Private Condo',
      'Landed Terrace',
      'Landed Semi-D',
      'Landed Bungalow',
    ]);
  });

  it('isPrivateResidentialCategory matches Private Condo and Landed only (not EC, not HDB)', () => {
    expect(ALL_TYPES.filter(isPrivateResidentialCategory)).toEqual([
      'Private Condo',
      'Landed Terrace',
      'Landed Semi-D',
      'Landed Bungalow',
    ]);
  });

  it('isCommercialCategory matches Commercial Shop and Commercial Office only', () => {
    expect(ALL_TYPES.filter(isCommercialCategory)).toEqual([
      'Commercial Shop',
      'Commercial Office',
    ]);
  });
});
