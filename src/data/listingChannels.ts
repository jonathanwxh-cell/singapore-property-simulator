export type ListingChannel =
  | 'New Launch'
  | 'Resale'
  | 'Auction'
  | 'Distressed'
  | 'Off-Market'
  | 'Signature';

export type ListingRarity = 'common' | 'premium' | 'signature';

export const listingChannelInfo: Record<ListingChannel, { label: string; description: string }> = {
  'New Launch': {
    label: 'New Launch',
    description: 'Fresh supply with launch-style pricing and stronger aspirational appeal.',
  },
  Resale: {
    label: 'Resale',
    description: 'Established stock with more transparent pricing and neighborhood history.',
  },
  Auction: {
    label: 'Auction',
    description: 'Price-led opportunities with urgency and sharper downside protection.',
  },
  Distressed: {
    label: 'Distressed',
    description: 'Motivated sellers and turnaround potential if you can absorb the risk.',
  },
  'Off-Market': {
    label: 'Off-Market',
    description: 'Quiet inventory for higher-conviction buyers with relationship access.',
  },
  Signature: {
    label: 'Signature',
    description: 'Trophy or iconic assets that define the top end of the market.',
  },
};

export const listingRarityInfo: Record<ListingRarity, { label: string; accent: string }> = {
  common: { label: 'Common', accent: '#00E676' },
  premium: { label: 'Premium', accent: '#FFD740' },
  signature: { label: 'Signature', accent: '#FF4081' },
};
