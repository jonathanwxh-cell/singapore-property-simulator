import type { MaintenanceCategory, MaintenanceIssue, MaintenanceSeverity } from '@/game/types';

export interface MaintenanceTemplate {
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  label: string;
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
    baseCost: 2_400,
    satisfactionImpact: -8,
    valueImpactPct: -0.4,
    recurrenceRiskPct: 18,
  },
  {
    category: 'aircon',
    severity: 'major',
    label: 'Aircon Compressor Failure',
    baseCost: 1_600,
    satisfactionImpact: -6,
    valueImpactPct: -0.2,
    recurrenceRiskPct: 14,
  },
  {
    category: 'electrical',
    severity: 'major',
    label: 'Electrical Rewiring Warning',
    baseCost: 3_200,
    satisfactionImpact: -7,
    valueImpactPct: -0.5,
    recurrenceRiskPct: 16,
  },
  {
    category: 'tenant-damage',
    severity: 'minor',
    label: 'Tenant Wear and Tear',
    baseCost: 900,
    satisfactionImpact: -3,
    valueImpactPct: -0.1,
    recurrenceRiskPct: 10,
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
