import type { OwnedProperty, Player } from '@/game/types';
import { properties } from '@/data/properties';

function roundCost(value: number): number {
  return Math.max(0, Math.round(value));
}

export function deriveMaintenanceCost(property: OwnedProperty): number {
  const baseValue = property.currentValue || property.purchasePrice;
  return roundCost(baseValue * 0.0008);
}

export function derivePropertyTax(property: OwnedProperty): number {
  const baseValue = property.currentValue || property.purchasePrice;
  return roundCost(baseValue * 0.0006);
}

export function normalizeOwnedProperty(property: OwnedProperty): OwnedProperty {
  return {
    ...property,
    occupancyStatus: property.occupancyStatus ?? (property.isRented ? 'tenanted' : 'vacant'),
    tenantQuality: property.tenantQuality ?? 50,
    vacancyMonths: property.vacancyMonths ?? 0,
    maintenanceCost: property.maintenanceCost ?? deriveMaintenanceCost(property),
    propertyTax: property.propertyTax ?? derivePropertyTax(property),
  };
}

export function advancePortfolioMonth(player: Player) {
  const updatedProperties = player.properties.map((property) => {
    const normalized = normalizeOwnedProperty(property);

    if (normalized.isRented) {
      return {
        ...normalized,
        occupancyStatus: 'tenanted' as const,
        vacancyMonths: 0,
      };
    }

    return {
      ...normalized,
      occupancyStatus: normalized.occupancyStatus === 'renovating' ? 'renovating' as const : 'vacant' as const,
      vacancyMonths: (normalized.vacancyMonths ?? 0) + 1,
    };
  });

  const monthlyCosts = {
    maintenance: updatedProperties.reduce((sum, property) => sum + (property.maintenanceCost ?? 0), 0),
    propertyTax: updatedProperties.reduce((sum, property) => sum + (property.propertyTax ?? 0), 0),
  };

  return {
    updatedProperties,
    monthlyCosts,
  };
}

export function describeInvestorRoute(player: Player): {
  label: string;
  summary: string;
  accentColor: string;
} {
  const ownedCatalog = player.properties
    .map((owned) => properties.find((property) => property.id === owned.propertyId))
    .filter((property): property is NonNullable<typeof property> => property !== undefined);

  const commercialCount = ownedCatalog.filter((property) =>
    property.type === 'Commercial Shop' || property.type === 'Commercial Office'
  ).length;
  const heartlandHdbCount = ownedCatalog.filter((property) => property.isHdb && property.districtId >= 16).length;
  const premiumCount = ownedCatalog.filter((property) => property.districtId <= 10).length;
  const rentedCount = player.properties.filter((property) => property.isRented).length;

  if (commercialCount >= 3) {
    return {
      label: 'Commercial Cashflow Operator',
      summary: 'Your portfolio leans into business-space tenants, yield discipline, and income durability.',
      accentColor: '#FF9100',
    };
  }

  if (heartlandHdbCount >= 3) {
    return {
      label: 'Heartland Landlord',
      summary: 'You are building a broad-based OCR public-housing empire around dependable family demand.',
      accentColor: '#00E676',
    };
  }

  if (premiumCount >= 2) {
    return {
      label: 'Prime District Collector',
      summary: 'Your strategy is centered on scarce addresses, prestige demand, and long-term capital preservation.',
      accentColor: '#FF4081',
    };
  }

  if (rentedCount >= 2) {
    return {
      label: 'Yield Builder',
      summary: 'You are optimizing for occupied units, cashflow, and compounding rental income.',
      accentColor: '#00F0FF',
    };
  }

  if (player.properties.length >= 1) {
    return {
      label: 'Emerging Portfolio Builder',
      summary: 'You have started assembling assets and are still shaping your long-term market identity.',
      accentColor: '#FFD740',
    };
  }

  return {
    label: 'Aspiring Investor',
    summary: 'You are still gathering capital and waiting for the right first move.',
    accentColor: '#7C4DFF',
  };
}
