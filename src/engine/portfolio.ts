import type { OwnedProperty, Player } from '@/game/types';
import { properties } from '@/data/properties';
import { advancePropertyOperationsMonth, normalizeOperationProperty } from './propertyOperations';

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
  const operational = normalizeOperationProperty(property);
  return {
    ...operational,
    occupancyStatus: operational.occupancyStatus ?? (operational.isRented ? 'tenanted' : 'vacant'),
    tenantQuality: operational.tenantQuality ?? 50,
    vacancyMonths: operational.vacancyMonths ?? 0,
    maintenanceCost: operational.maintenanceCost ?? deriveMaintenanceCost(operational),
    propertyTax: operational.propertyTax ?? derivePropertyTax(operational),
  };
}

export interface PortfolioHoldingOperationsSummary {
  statusLabel: string;
  tenantLabel: string;
  attentionTags: string[];
}

export function describePortfolioHoldingOperations(property: OwnedProperty): PortfolioHoldingOperationsSummary {
  const tenant = property.tenant;
  const vacancyMonths = property.vacancyMonths ?? 0;
  const openRepairCount = property.openMaintenanceIssues?.length ?? 0;
  const attentionTags: string[] = [];

  if (openRepairCount > 0) {
    attentionTags.push(`Repairs ${openRepairCount}`);
  }
  if (property.activeRenovation) {
    attentionTags.push(`Upgrade ${property.activeRenovation.remainingMonths} mo`);
  }
  if (!property.isRented && vacancyMonths > 0) {
    attentionTags.push(`Vacancy ${vacancyMonths} mo`);
  }

  if (tenant) {
    return {
      statusLabel: `Lease S$${tenant.contractedRent.toLocaleString()}/mo`,
      tenantLabel: `Tenant ${tenant.satisfaction}/100`,
      attentionTags,
    };
  }

  if (property.isRented) {
    return {
      statusLabel: `Rented S$${property.monthlyRental.toLocaleString()}/mo`,
      tenantLabel: 'Legacy rental',
      attentionTags,
    };
  }

  if (property.occupancyStatus === 'owner-occupied') {
    return {
      statusLabel: 'Owner-occupied',
      tenantLabel: 'No tenant',
      attentionTags,
    };
  }

  if (property.occupancyStatus === 'renovating') {
    return {
      statusLabel: 'Renovating',
      tenantLabel: 'No tenant',
      attentionTags,
    };
  }

  if (property.occupancyStatus === 'listed') {
    return {
      statusLabel: 'Listed',
      tenantLabel: 'No tenant',
      attentionTags,
    };
  }

  return {
    statusLabel: vacancyMonths > 0 ? `Vacant ${vacancyMonths} mo` : 'Vacant',
    tenantLabel: 'No tenant',
    attentionTags,
  };
}

export function advancePortfolioMonth(player: Player) {
  const operationsStep = advancePropertyOperationsMonth({
    ...player,
    properties: player.properties.map(normalizeOwnedProperty),
  });
  const updatedProperties = operationsStep.updatedProperties.map(normalizeOwnedProperty);

  const monthlyCosts = {
    maintenance: updatedProperties.reduce((sum, property) => sum + (property.maintenanceCost ?? 0), 0),
    propertyTax: updatedProperties.reduce((sum, property) => sum + (property.propertyTax ?? 0), 0),
  };

  return {
    updatedProperties,
    monthlyCosts,
    operationHistory: operationsStep.operationHistory,
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
