import type { ListingChannel } from './listingChannels';

export interface PropertyArchetype {
  id: string;
  label: string;
  summary: string;
  defaultChannel: ListingChannel;
  strategyTag: string;
}

export const propertyArchetypes: PropertyArchetype[] = [
  {
    id: 'bto-family-flat',
    label: 'BTO Family Flat',
    summary: 'Entry-friendly public housing with strong upgrader potential and efficient financing.',
    defaultChannel: 'New Launch',
    strategyTag: 'Entry / family growth',
  },
  {
    id: 'mature-estate-resale-flat',
    label: 'Mature Estate Resale Flat',
    summary: 'Older but proven heartland stock with livability, familiarity, and resilient demand.',
    defaultChannel: 'Resale',
    strategyTag: 'Yield / stability',
  },
  {
    id: 'executive-condo-upgrader',
    label: 'Executive Condo Upgrader',
    summary: 'Hybrid public-private assets that sit in the path of household upgrading demand.',
    defaultChannel: 'New Launch',
    strategyTag: 'Upgrader leverage',
  },
  {
    id: 'mass-market-condo',
    label: 'Mass-Market Condo',
    summary: 'Liquid suburban condo stock where affordability, facilities, and rental demand intersect.',
    defaultChannel: 'Resale',
    strategyTag: 'Balanced growth',
  },
  {
    id: 'city-fringe-condo',
    label: 'City-Fringe Condo',
    summary: 'RCR assets that trade on accessibility, tenant demand, and re-rating potential.',
    defaultChannel: 'Resale',
    strategyTag: 'City-fringe re-rating',
  },
  {
    id: 'prime-urban-condo',
    label: 'Prime Urban Condo',
    summary: 'Core central homes that skew toward prestige and capital preservation over yield.',
    defaultChannel: 'Off-Market',
    strategyTag: 'Prestige / appreciation',
  },
  {
    id: 'waterfront-luxury-condo',
    label: 'Waterfront Luxury Condo',
    summary: 'High-end lifestyle holdings where scarcity, views, and status drive the story.',
    defaultChannel: 'Signature',
    strategyTag: 'Trophy hold',
  },
  {
    id: 'family-landed-home',
    label: 'Family Landed Home',
    summary: 'Landed properties that attract multi-generation buyers and private-space premiums.',
    defaultChannel: 'Off-Market',
    strategyTag: 'Space / legacy',
  },
  {
    id: 'prestige-landed-estate',
    label: 'Prestige Landed Estate',
    summary: 'Ultra-prime landed stock that functions as a legacy asset and status signal.',
    defaultChannel: 'Signature',
    strategyTag: 'Prestige / rarity',
  },
  {
    id: 'heritage-retail-shophouse',
    label: 'Heritage Retail Shophouse',
    summary: 'Conservation shophouses with brandable frontage and long-hold identity value.',
    defaultChannel: 'Signature',
    strategyTag: 'Heritage cashflow',
  },
  {
    id: 'urban-office-suite',
    label: 'Urban Office Suite',
    summary: 'Commercial workspace tied to business districts, knowledge nodes, and tenant cycles.',
    defaultChannel: 'Resale',
    strategyTag: 'Commercial income',
  },
];
