import { describe, it, expect } from 'vitest';
import { computePurchaseReadiness } from '../purchaseReadiness';
import { createInitialLifeState, type Player } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 27,
    careerId: 'graduate',
    salary: 12_000,
    cash: 1_000_000,
    cpfOrdinary: 0,
    cpfSpecial: 0,
    cpfMedisave: 0,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 1_000_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

function makeProperty(overrides: Partial<ListingProperty> = {}): ListingProperty {
  return {
    id: 'test-hdb',
    name: 'Test HDB',
    districtId: 1,
    type: 'HDB BTO',
    price: 300_000,
    psf: 400,
    size: 90,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2024,
    leaseYears: 99,
    rentalYield: 5,
    image: '',
    description: '',
    amenities: [],
    nearestMrt: '',
    isAvailable: true,
    isHdb: true,
    listingChannel: 'New Launch',
    listingRarity: 'common',
    archetypeId: 'bto-family-flat',
    archetypeLabel: 'BTO Family Flat',
    strategyTag: 'starter',
    districtTheme: '',
    ...overrides,
  };
}

const defaultInput = {
  financingMode: 'hdb-concessionary' as const,
  downPaymentPercent: 25,
  useCpfOrdinary: false,
  isOwned: false,
  actionError: null,
};

describe('computePurchaseReadiness', () => {
  it('canAfford is true when player has ample cash', () => {
    const player = makePlayer({ cash: 1_000_000, salary: 8_000 });
    const property = makeProperty();
    const result = computePurchaseReadiness({ player, property, ...defaultInput });
    expect(result.canAfford).toBe(true);
    expect(result.cashShortfall).toBe(0);
  });

  it('canAfford is false when cash is insufficient', () => {
    const player = makePlayer({ cash: 10_000, salary: 3_000 });
    const property = makeProperty();
    const result = computePurchaseReadiness({ player, property, ...defaultInput });
    expect(result.canAfford).toBe(false);
    expect(result.cashShortfall).toBeGreaterThan(0);
  });

  it('isOwned flag blocks canAfford', () => {
    const player = makePlayer({ cash: 1_000_000 });
    const property = makeProperty();
    const result = computePurchaseReadiness({ player, property, ...defaultInput, isOwned: true });
    expect(result.canAfford).toBe(false);
  });

  it('commercial property is not CPF eligible', () => {
    const player = makePlayer({ cash: 1_000_000 });
    const property = makeProperty({ type: 'Commercial Shop', isHdb: false, price: 500_000 });
    const result = computePurchaseReadiness({ player, property, ...defaultInput });
    expect(result.cpfEligible).toBe(false);
  });

  it('uses upfront-cost wording for commercial cash shortfalls', () => {
    const player = makePlayer({ cash: 10_000, cpfOrdinary: 300_000 });
    const property = makeProperty({ type: 'Commercial Shop', isHdb: false, price: 500_000 });
    const result = computePurchaseReadiness({ player, property, ...defaultInput });

    expect(result.visibleMessages.some((message) => message.includes('upfront costs'))).toBe(true);
    expect(result.visibleMessages.some((message) => message.includes('after CPF OA'))).toBe(false);
  });
});
