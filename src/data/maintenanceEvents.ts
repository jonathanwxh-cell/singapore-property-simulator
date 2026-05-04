import type { MaintenanceCategory, MaintenanceIssue, MaintenanceSeverity } from '@/game/types';

export interface MaintenanceTemplate {
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  label: string;
  riskTag: string;
  baseCost: number;
  satisfactionImpact: number;
  valueImpactPct: number;
  recurrenceRiskPct: number;
}

export type RepairChoiceId = 'cheap-fix' | 'proper-repair' | 'insurance-claim';

export interface RepairChoice {
  id: RepairChoiceId;
  label: string;
  description: string;
  costMultiplier: number;
  conditionDelta: number;
  satisfactionDelta: number;
  recurrenceDeltaPct: number;
  status: MaintenanceIssue['status'];
}

export const maintenanceTemplates: MaintenanceTemplate[] = [
  {
    category: 'plumbing',
    severity: 'urgent',
    label: 'Burst Pipe',
    riskTag: 'Emergency plumber',
    baseCost: 2_400,
    satisfactionImpact: -8,
    valueImpactPct: -0.4,
    recurrenceRiskPct: 18,
  },
  {
    category: 'aircon',
    severity: 'major',
    label: 'Aircon Compressor Failure',
    riskTag: 'Tenant comfort',
    baseCost: 1_600,
    satisfactionImpact: -6,
    valueImpactPct: -0.2,
    recurrenceRiskPct: 14,
  },
  {
    category: 'electrical',
    severity: 'major',
    label: 'Electrical Rewiring Warning',
    riskTag: 'Safety compliance',
    baseCost: 3_200,
    satisfactionImpact: -7,
    valueImpactPct: -0.5,
    recurrenceRiskPct: 16,
  },
  {
    category: 'tenant-damage',
    severity: 'minor',
    label: 'Tenant Wear and Tear',
    riskTag: 'Wear and tear',
    baseCost: 900,
    satisfactionImpact: -3,
    valueImpactPct: -0.1,
    recurrenceRiskPct: 10,
  },
  {
    category: 'waterproofing',
    severity: 'major',
    label: 'Bathroom Waterproofing Leak',
    riskTag: 'Neighbour complaint risk',
    baseCost: 4_800,
    satisfactionImpact: -7,
    valueImpactPct: -0.45,
    recurrenceRiskPct: 15,
  },
  {
    category: 'common-area',
    severity: 'minor',
    label: 'Condo MCST Special Levy',
    riskTag: 'Shared facility cost',
    baseCost: 2_200,
    satisfactionImpact: -2,
    valueImpactPct: -0.05,
    recurrenceRiskPct: 8,
  },
  {
    category: 'appliance',
    severity: 'minor',
    label: 'Washer and Fridge Replacement',
    riskTag: 'Appliance lifecycle',
    baseCost: 1_350,
    satisfactionImpact: -4,
    valueImpactPct: -0.08,
    recurrenceRiskPct: 9,
  },
];

export const repairChoices: Record<RepairChoiceId, RepairChoice> = {
  'cheap-fix': {
    id: 'cheap-fix',
    label: 'Cheap Fix',
    description: 'Spend less now, but the issue may come back and tenants notice the shortcut.',
    costMultiplier: 0.55,
    conditionDelta: 3,
    satisfactionDelta: -2,
    recurrenceDeltaPct: 8,
    status: 'repaired',
  },
  'proper-repair': {
    id: 'proper-repair',
    label: 'Proper Repair',
    description: 'Pay the market rate to protect condition, tenant trust, and future resale story.',
    costMultiplier: 1,
    conditionDelta: 10,
    satisfactionDelta: 4,
    recurrenceDeltaPct: -8,
    status: 'repaired',
  },
  'insurance-claim': {
    id: 'insurance-claim',
    label: 'Claim Insurance',
    description: 'Lower immediate cash hit, slower admin, and a decent condition recovery.',
    costMultiplier: 0.35,
    conditionDelta: 7,
    satisfactionDelta: 1,
    recurrenceDeltaPct: -4,
    status: 'insured',
  },
};
