import { describe, expect, it } from 'vitest';
import { properties } from '../properties';

const blockedRealAddressMarkers = [
  /\bAve\b/i,
  /\bAvenue\b/i,
  /\bRd\b/i,
  /\bRoad\b/i,
  /\bLor\b/i,
  /\bStreet\b/i,
  /\bSt\b/i,
  /\bRaffles Place\b/i,
  /\bOrchard Road\b/i,
  /\bAmoy Street\b/i,
  /\bPagoda Street\b/i,
  /\bClarke Quay\b/i,
  /\bTekka Arcade\b/i,
  /\bBugis Junction\b/i,
  /\bSentosa Cove\b/i,
  /\bNamly Estate\b/i,
  /\bCluny Park\b/i,
  /\bOpera Estate\b/i,
  /\bSerangoon Gardens\b/i,
  /\bone-north\b/i,
];

describe('fictional property listing names', () => {
  it('keeps public-facing listing names fictional rather than exact real addresses or developments', () => {
    const offenders = properties
      .map((property) => property.name)
      .filter((name) => blockedRealAddressMarkers.some((marker) => marker.test(name)));

    expect(offenders).toEqual([]);
  });
});
