import { describe, expect, it } from 'vitest';
import { buildDistrictOpportunityCards, buildListingSummary, getListingsByDistrict, getListingCatalog, getMarketMovers } from '../listings';

describe('listing catalog', () => {
  it('covers every defined district with at least two listings', () => {
    const coverage = buildListingSummary();

    expect(coverage.totalListings).toBeGreaterThanOrEqual(120);
    expect(coverage.coveredDistrictCount).toBe(28);
    expect(coverage.uncoveredDistrictIds).toEqual([]);
    expect(coverage.districtsWithSingleListing).toEqual([]);
  });

  it('keeps listing IDs unique for routing and ownership lookups', () => {
    const ids = getListingCatalog().map((property) => property.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses fictional listing names instead of known real development names', () => {
    const knownRealDevelopmentNames = [
      'Parc Canberra',
      'North Gaia',
      'Piermont Grand',
      'The Orchard Residences',
      'Marina One Residences',
      'Leedon Green',
      'The M',
      'One Pearl Bank',
      "D'Leedon",
      'Commonwealth Towers',
      'Avenue South Residence',
      'Normanton Park',
      'Treasure at Tampines',
      'Corals at Sentosa Cove',
      'Sky Vue',
      'J Gateway',
      'Pasir Ris 8',
      'Sengkang Grand',
      'The Clement Canopy',
      'one-north Eden',
      'Capitol Suites',
      'Midtown Bay',
      'Velocity Medical',
      'The Arcady',
    ];
    const catalogNames = getListingCatalog().map((property) => property.name);

    for (const bannedName of knownRealDevelopmentNames) {
      expect(catalogNames.some((name) => name.includes(bannedName))).toBe(false);
    }
  });

  it('returns multiple listings for district 22 after expansion', () => {
    const listings = getListingsByDistrict(22);

    expect(listings.length).toBeGreaterThanOrEqual(2);
  });

  it('enriches base properties with channel and rarity metadata', () => {
    const tampines = getListingCatalog().find((property) => property.id === 'hdb-bto-1');

    expect(tampines).toBeDefined();
    expect(tampines?.listingChannel).toBe('New Launch');
    expect(tampines?.listingRarity).toBe('common');
    expect(tampines?.districtTheme.length).toBeGreaterThan(0);
  });

  it('has a visible mix of non-resale inventory channels', () => {
    const summary = buildListingSummary();

    expect(summary.byChannel['New Launch']).toBeGreaterThanOrEqual(12);
    expect(summary.byChannel['Auction'] + summary.byChannel['Distressed'] + summary.byChannel['Off-Market'] + summary.byChannel['Signature']).toBeGreaterThanOrEqual(12);
  });

  it('builds market movers and district opportunity cards', () => {
    const movers = getMarketMovers();
    const cards = buildDistrictOpportunityCards();

    expect(movers).toHaveLength(3);
    expect(movers.every((mover) => mover.title.length > 0)).toBe(true);
    expect(cards.find((card) => card.districtId === 22)?.listingCount).toBeGreaterThanOrEqual(4);
  });
});
