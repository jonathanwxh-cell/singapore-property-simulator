import { districts } from '@/data/districts';
import { listingChannelInfo, listingRarityInfo, type ListingChannel, type ListingRarity } from '@/data/listingChannels';
import { propertyArchetypes } from '@/data/propertyArchetypes';
import { properties, type Property } from '@/data/properties';

export interface ListingProperty extends Property {
  listingChannel: ListingChannel;
  listingRarity: ListingRarity;
  archetypeId: string;
  archetypeLabel: string;
  strategyTag: string;
  districtTheme: string;
}

function inferArchetype(property: Property): string {
  if (property.archetypeId) return property.archetypeId;

  if (property.type === 'HDB BTO') return 'bto-family-flat';
  if (property.type === 'HDB Resale') return 'mature-estate-resale-flat';
  if (property.type === 'Executive Condo') return 'executive-condo-upgrader';
  if (property.type === 'Private Condo') {
    if (property.districtId === 4) return 'waterfront-luxury-condo';
    if (property.price >= 2500000 || property.districtId <= 10) return 'prime-urban-condo';
    if (property.districtId <= 15) return 'city-fringe-condo';
    return 'mass-market-condo';
  }
  if (property.type === 'Landed Bungalow' || property.price >= 7000000) return 'prestige-landed-estate';
  if (property.type === 'Landed Terrace' || property.type === 'Landed Semi-D') return 'family-landed-home';
  if (property.type === 'Commercial Shop') return 'heritage-retail-shophouse';
  return 'urban-office-suite';
}

function inferChannel(property: Property, archetypeId: string): ListingChannel {
  if (property.listingChannel) return property.listingChannel;

  if (property.type === 'HDB BTO') return 'New Launch';
  if (property.yearBuilt >= 2024 && (property.type === 'Executive Condo' || property.type === 'Private Condo')) {
    return 'New Launch';
  }
  if (property.type === 'Landed Bungalow' || archetypeId === 'prestige-landed-estate' || property.price >= 10000000) {
    return 'Signature';
  }

  const archetype = propertyArchetypes.find((entry) => entry.id === archetypeId);
  return archetype?.defaultChannel ?? 'Resale';
}

function inferRarity(property: Property, channel: ListingChannel): ListingRarity {
  if (property.listingRarity) return property.listingRarity;
  if (channel === 'Signature') return 'signature';
  if (property.price >= 2000000 || property.districtId <= 11) return 'premium';
  return 'common';
}

function inferDistrictTheme(property: Property): string {
  const district = districts.find((entry) => entry.id === property.districtId);
  if (!district) return 'General market activity';

  if (district.region === 'CCR') return 'Prestige pricing and capital preservation';
  if (district.region === 'RCR') return 'City-fringe convenience with re-rating potential';
  if (district.rentalYield >= 4.3) return 'Yield-driven heartland demand';
  return 'Family upgrader value with steady owner-occupier depth';
}

export function enrichListing(property: Property): ListingProperty {
  const archetypeId = inferArchetype(property);
  const channel = inferChannel(property, archetypeId);
  const rarity = inferRarity(property, channel);
  const archetype = propertyArchetypes.find((entry) => entry.id === archetypeId);

  return {
    ...property,
    archetypeId,
    listingChannel: channel,
    listingRarity: rarity,
    archetypeLabel: archetype?.label ?? 'General Listing',
    strategyTag: archetype?.strategyTag ?? 'Balanced market play',
    districtTheme: inferDistrictTheme(property),
  };
}

export function getListingCatalog(): ListingProperty[] {
  return properties.map(enrichListing);
}

export function getListingsByDistrict(districtId: number): ListingProperty[] {
  return getListingCatalog().filter((property) => property.districtId === districtId);
}

export function buildListingSummary() {
  const catalog = getListingCatalog();
  const uncoveredDistrictIds = districts
    .filter((district) => !catalog.some((property) => property.districtId === district.id))
    .map((district) => district.id);

  const districtsWithSingleListing = districts
    .filter((district) => catalog.filter((property) => property.districtId === district.id).length === 1)
    .map((district) => district.id);

  const byChannel = Object.fromEntries(
    Object.keys(listingChannelInfo).map((channel) => [
      channel,
      catalog.filter((property) => property.listingChannel === channel).length,
    ])
  );

  const byRarity = Object.fromEntries(
    Object.keys(listingRarityInfo).map((rarity) => [
      rarity,
      catalog.filter((property) => property.listingRarity === rarity).length,
    ])
  );

  return {
    totalListings: catalog.length,
    coveredDistrictCount: districts.length - uncoveredDistrictIds.length,
    uncoveredDistrictIds,
    districtsWithSingleListing,
    byChannel,
    byRarity,
  };
}

export function buildDistrictOpportunityCards() {
  const catalog = getListingCatalog();

  return districts.map((district) => {
    const listings = catalog.filter((property) => property.districtId === district.id);
    const listingCount = listings.length;
    const averagePrice = listingCount === 0 ? 0 : Math.round(listings.reduce((sum, property) => sum + property.price, 0) / listingCount);
    const averageYield = listingCount === 0 ? 0 : Number((listings.reduce((sum, property) => sum + property.rentalYield, 0) / listingCount).toFixed(1));
    const opportunity =
      district.region === 'CCR'
        ? 'Prestige-led capital hold'
        : averageYield >= 4.3
          ? 'Yield-heavy heartland momentum'
          : 'Balanced upgrader demand';

    return {
      districtId: district.id,
      districtName: district.name,
      region: district.region,
      listingCount,
      averagePrice,
      averageYield,
      opportunity,
    };
  });
}

export function getMarketMovers() {
  const cards = buildDistrictOpportunityCards().filter((card) => card.listingCount > 0);
  const byYield = [...cards].sort((a, b) => b.averageYield - a.averageYield)[0];
  const byDepth = [...cards].sort((a, b) => b.listingCount - a.listingCount)[0];
  const byPrestige = [...cards].sort((a, b) => b.averagePrice - a.averagePrice)[0];

  return [
    {
      title: 'Yield Leader',
      districtId: byYield?.districtId ?? 0,
      districtName: byYield?.districtName ?? 'N/A',
      detail: byYield ? `${byYield.averageYield}% average yield` : 'No data',
    },
    {
      title: 'Deepest Inventory',
      districtId: byDepth?.districtId ?? 0,
      districtName: byDepth?.districtName ?? 'N/A',
      detail: byDepth ? `${byDepth.listingCount} live listings` : 'No data',
    },
    {
      title: 'Prestige Leader',
      districtId: byPrestige?.districtId ?? 0,
      districtName: byPrestige?.districtName ?? 'N/A',
      detail: byPrestige ? `Avg. ${byPrestige.averagePrice.toLocaleString('en-SG')} price point` : 'No data',
    },
  ];
}
