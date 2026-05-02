import { describe, expect, it } from 'vitest';
import { formatCompactCurrency, formatCurrency, formatPercent } from '../format';

describe('format helpers', () => {
  it('formats money with clean separators', () => {
    expect(formatCurrency(50_000)).toBe('S$50,000');
    expect(formatCurrency(49_828.166666666664, { decimals: 2 })).toBe('S$49,828.17');
  });

  it('formats compact money consistently for dashboard-style displays', () => {
    expect(formatCompactCurrency(101_000)).toBe('S$101K');
    expect(formatCompactCurrency(380_000)).toBe('S$380K');
  });

  it('strips floating point artifacts from percent displays', () => {
    expect(formatPercent(55.00000000000001)).toBe('55%');
    expect(formatPercent(8.1, 1)).toBe('8.1%');
  });
});
