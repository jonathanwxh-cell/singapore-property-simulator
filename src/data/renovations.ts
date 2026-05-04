import type { PropertyType } from './properties';
import type { RenovationCategory } from '@/game/types';

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
