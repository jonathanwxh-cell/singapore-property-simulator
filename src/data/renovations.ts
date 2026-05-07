import type { PropertyType } from './properties';
import type { RenovationCategory, RenovationContractorTier } from '@/game/types';

export interface RenovationTemplate {
  id: string;
  category: RenovationCategory;
  label: string;
  description: string;
  cost: number;
  durationMonths: number;
  rentUpliftPct: number;
  resaleUpliftPct: number;
  satisfactionUplift: number;
  riskPct: number;
  conditionDelta: number;
  strategy: 'yield' | 'flip' | 'stability' | 'luxury';
  disruptive: boolean;
  eligibleTypes?: PropertyType[];
}

export interface RenovationContractor {
  id: RenovationContractorTier;
  label: string;
  summary: string;
  costMultiplier: number;
  durationDeltaMonths: number;
  rentUpliftMultiplier: number;
  resaleUpliftMultiplier: number;
  satisfactionDelta: number;
  riskMultiplier: number;
}

export interface RenovationQuote {
  contractor: RenovationContractor;
  cost: number;
  durationMonths: number;
  rentUpliftPct: number;
  resaleUpliftPct: number;
  satisfactionUplift: number;
  riskPct: number;
  conditionDelta: number;
  projectedPaybackMonths: number | null;
}

export const renovationContractors: Record<RenovationContractorTier, RenovationContractor> = {
  budget: {
    id: 'budget',
    label: 'Budget Crew',
    summary: 'Lower entry cost, slower finish, and a higher snag risk.',
    costMultiplier: 0.88,
    durationDeltaMonths: 1,
    rentUpliftMultiplier: 0.82,
    resaleUpliftMultiplier: 0.84,
    satisfactionDelta: -1,
    riskMultiplier: 1.25,
  },
  standard: {
    id: 'standard',
    label: 'Balanced Contractor',
    summary: 'The default Singapore homeowner path: sensible cost, timing, and finish.',
    costMultiplier: 1,
    durationDeltaMonths: 0,
    rentUpliftMultiplier: 1,
    resaleUpliftMultiplier: 1,
    satisfactionDelta: 0,
    riskMultiplier: 1,
  },
  premium: {
    id: 'premium',
    label: 'Premium Design-Build',
    summary: 'Faster and cleaner finish, but heavier upfront cash.',
    costMultiplier: 1.18,
    durationDeltaMonths: -1,
    rentUpliftMultiplier: 1.16,
    resaleUpliftMultiplier: 1.18,
    satisfactionDelta: 2,
    riskMultiplier: 0.8,
  },
};

export const renovationTemplates: RenovationTemplate[] = [
  {
    id: 'flooring-paint',
    category: 'flooring',
    label: 'Flooring and Paint Refresh',
    description: 'A quick cosmetic pass that makes older units feel cleaner without killing cashflow.',
    cost: 8_000,
    durationMonths: 1,
    rentUpliftPct: 3,
    resaleUpliftPct: 1.2,
    satisfactionUplift: 4,
    riskPct: 4,
    conditionDelta: 8,
    strategy: 'stability',
    disruptive: false,
  },
  {
    id: 'kitchen-refresh',
    category: 'kitchen',
    label: 'Kitchen Refresh',
    description: 'Mid-sized carpentry and appliance refresh. Stronger tenant appeal, slower payback.',
    cost: 18_000,
    durationMonths: 2,
    rentUpliftPct: 7,
    resaleUpliftPct: 3.8,
    satisfactionUplift: 7,
    riskPct: 9,
    conditionDelta: 12,
    strategy: 'yield',
    disruptive: true,
  },
  {
    id: 'bathroom-refresh',
    category: 'bathroom',
    label: 'Bathroom Waterproofing Refresh',
    description: 'Targets tenant comfort and future leak risk, especially useful for ageing resale flats.',
    cost: 14_000,
    durationMonths: 2,
    rentUpliftPct: 5,
    resaleUpliftPct: 2.8,
    satisfactionUplift: 9,
    riskPct: 8,
    conditionDelta: 14,
    strategy: 'stability',
    disruptive: true,
  },
  {
    id: 'smart-home-package',
    category: 'smart-home',
    label: 'Smart-Home Package',
    description: 'Digital lock, efficient lighting, sensors, and app controls for PMET or condo tenants.',
    cost: 9_500,
    durationMonths: 1,
    rentUpliftPct: 4,
    resaleUpliftPct: 1.6,
    satisfactionUplift: 5,
    riskPct: 6,
    conditionDelta: 6,
    strategy: 'luxury',
    disruptive: false,
    eligibleTypes: ['Executive Condo', 'Private Condo', 'Landed Terrace', 'Landed Semi-D', 'Landed Bungalow', 'HDB BTO', 'HDB Resale'],
  },
  {
    id: 'layout-optimization',
    category: 'layout',
    label: 'Layout Optimization',
    description: 'A bigger reconfiguration that improves resale story but can overrun if overbuilt.',
    cost: 42_000,
    durationMonths: 3,
    rentUpliftPct: 8,
    resaleUpliftPct: 6.5,
    satisfactionUplift: 6,
    riskPct: 16,
    conditionDelta: 15,
    strategy: 'flip',
    disruptive: true,
    eligibleTypes: ['HDB Resale', 'Executive Condo', 'Private Condo', 'Landed Terrace', 'Landed Semi-D', 'Landed Bungalow'],
  },
  {
    id: 'commercial-fitout',
    category: 'commercial-fitout',
    label: 'Commercial Fit-Out',
    description: 'Improves shop or office usability, but narrows the tenant pool if it gets too bespoke.',
    cost: 65_000,
    durationMonths: 3,
    rentUpliftPct: 12,
    resaleUpliftPct: 4.5,
    satisfactionUplift: 5,
    riskPct: 18,
    conditionDelta: 16,
    strategy: 'yield',
    disruptive: true,
    eligibleTypes: ['Commercial Shop', 'Commercial Office'],
  },
];

export function getRenovationTemplate(templateId: string): RenovationTemplate | undefined {
  return renovationTemplates.find((template) => template.id === templateId);
}

export function getRenovationTemplatesForType(type: PropertyType): RenovationTemplate[] {
  return renovationTemplates.filter((template) => !template.eligibleTypes || template.eligibleTypes.includes(type));
}

export function getRenovationContractor(contractorTier: RenovationContractorTier): RenovationContractor {
  return renovationContractors[contractorTier];
}

export function getRenovationQuote(
  template: RenovationTemplate,
  contractorTier: RenovationContractorTier,
  baselineMonthlyRent: number,
): RenovationQuote {
  const contractor = getRenovationContractor(contractorTier);
  const cost = Math.round(template.cost * contractor.costMultiplier);
  const durationMonths = Math.max(1, template.durationMonths + contractor.durationDeltaMonths);
  const rentUpliftPct = round1(template.rentUpliftPct * contractor.rentUpliftMultiplier);
  const resaleUpliftPct = round1(template.resaleUpliftPct * contractor.resaleUpliftMultiplier);
  const satisfactionUplift = template.satisfactionUplift + contractor.satisfactionDelta;
  const riskPct = Math.max(1, Math.min(40, round1(template.riskPct * contractor.riskMultiplier)));
  const addedMonthlyRent = Math.round(baselineMonthlyRent * (rentUpliftPct / 100));

  return {
    contractor,
    cost,
    durationMonths,
    rentUpliftPct,
    resaleUpliftPct,
    satisfactionUplift,
    riskPct,
    conditionDelta: template.conditionDelta,
    projectedPaybackMonths: addedMonthlyRent > 0 ? Math.ceil(cost / addedMonthlyRent) : null,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
