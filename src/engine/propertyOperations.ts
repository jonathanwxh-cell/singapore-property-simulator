// Orchestrator for the property-operations cluster. This module owns:
//   - the per-month tick (`advancePropertyOperationsMonth`)
//   - landlord-ops summaries / milestones (`getLandlordOpsSummary`)
//   - renovation start (`startRenovationPure`) — closely tied to occupancy/tenant state
//
// Sub-domains live in their own files but are re-exported here so
// existing consumers (`useGameStore`, `Portfolio`, `PropertyDetail`,
// `portfolio.ts`) don't need to change their imports:
//   - tenantOperations.ts       (lease + strategy + decisions)
//   - maintenanceOperations.ts  (open issue resolution)
//   - reserveOperations.ts      (reserve plan + default)
//   - operationsShared.ts       (internal helpers — `clamp`, `getListing`, etc.)

import { getRenovationTemplate } from '@/data/renovations';
import { rentStrategies } from '@/data/tenantProfiles';
import type {
  OwnedProperty,
  Player,
  PropertyOperationLogEntry,
} from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import { roundMoney } from '@/lib/format';
import {
  OPERATION_HISTORY_LIMIT,
  clamp,
  getListing,
  normalizeOperationProperty,
  withOperationLog,
} from './operationsShared';
import { createMaintenanceIssue } from './maintenanceOperations';

// Re-exports — keeps the existing `import { ... } from './propertyOperations'`
// surface intact for `useGameStore`, `portfolio.ts`, `Portfolio.tsx`,
// `PropertyDetail.tsx`. Move external imports to the sub-modules in a
// follow-up if desired; this file is the public API for now.
export { deriveFloorPlanId, normalizeOperationProperty } from './operationsShared';
export { createDefaultReserve, setReservePlanPure } from './reserveOperations';
export type { ReservePlanInput } from './reserveOperations';
export {
  setTenantStrategyPure,
  getTenantLeaseOptions,
  applyTenantLeaseDecisionPure,
} from './tenantOperations';
export type { TenantStrategyInput, TenantLeaseOption } from './tenantOperations';
export { resolveMaintenanceIssuePure } from './maintenanceOperations';

export interface LandlordOpsMilestone {
  id: string;
  label: string;
  detail: string;
  completed: boolean;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface LandlordOpsSummary {
  occupancyRate: number;
  averageTenantSatisfaction: number | null;
  openIssueCount: number;
  urgentIssueCount: number;
  estimatedOpenRepairCost: number;
  reserveProtected: number;
  unprotectedRisk: number;
  expiringLeaseCount: number;
  milestones: LandlordOpsMilestone[];
}

// ============================================================================
// Renovation start
// ============================================================================
export function startRenovationPure(
  player: Player,
  propertyIndex: number,
  templateId: string,
): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const template = getRenovationTemplate(templateId);
  if (!template) return fail('renovation_not_found', 'Renovation plan not found.');

  const property = normalizeOperationProperty(player.properties[propertyIndex]);
  const listing = getListing(property.propertyId);
  if (!listing) return fail('property_not_found', 'Property not found.');
  if (template.eligibleTypes && !template.eligibleTypes.includes(listing.type)) {
    return fail('eligibility_blocked', 'This renovation plan does not fit the property type.');
  }
  if (property.activeRenovation) {
    return fail('renovation_active', 'This property already has an active renovation.');
  }
  if ((property.completedRenovations ?? []).includes(template.category)) {
    return fail('renovation_completed', 'This renovation category is already completed.');
  }
  if (player.cash < template.cost) {
    return fail('insufficient_cash', 'Not enough cash for this renovation.');
  }

  const activeRenovation = {
    id: `reno_${player.turnCount}_${propertyIndex}_${template.id}`,
    templateId: template.id,
    propertyId: property.propertyId,
    category: template.category,
    label: template.label,
    cost: template.cost,
    durationMonths: template.durationMonths,
    remainingMonths: template.durationMonths,
    rentUpliftPct: template.rentUpliftPct,
    resaleUpliftPct: template.resaleUpliftPct,
    satisfactionUplift: template.satisfactionUplift,
    riskPct: template.riskPct,
    conditionDelta: template.conditionDelta,
    status: 'active' as const,
    startedTurn: player.turnCount,
  };

  const updatedProperties = [...player.properties];
  updatedProperties[propertyIndex] = {
    ...property,
    activeRenovation,
    isRented: template.disruptive ? false : property.isRented,
    tenant: template.disruptive ? undefined : property.tenant,
    occupancyStatus: template.disruptive ? 'renovating' : property.occupancyStatus,
  };

  const updatedPlayer = withOperationLog({
    ...player,
    cash: roundMoney(player.cash - template.cost),
    properties: updatedProperties,
  }, {
    propertyId: property.propertyId,
    title: `${template.label} started`,
    detail: `${template.durationMonths} month renovation begun. Tenants paused: ${template.disruptive ? 'yes' : 'no'}.`,
    tone: template.disruptive ? 'warn' : 'good',
  });

  return ok({ player: updatedPlayer });
}

// ============================================================================
// Landlord ops summary (read-only)
// ============================================================================
export function getLandlordOpsSummary(player: Player): LandlordOpsSummary {
  const propertyCount = player.properties.length;
  const occupiedCount = player.properties.filter((property) => property.isRented).length;
  const tenantScores = player.properties
    .map((property) => property.tenant?.satisfaction)
    .filter((score): score is number => typeof score === 'number');
  const openIssues = player.properties.flatMap((property) => property.openMaintenanceIssues ?? []);
  const estimatedOpenRepairCost = openIssues.reduce((sum, issue) => sum + issue.estimatedCost, 0);
  const reserveProtected = Math.max(0, Math.min(player.cash, player.reserve?.allocatedCash ?? 0));
  const expiringLeaseCount = player.properties.filter((property) =>
    property.tenant && property.tenant.leaseEndTurn - player.turnCount <= 2
  ).length;
  const averageTenantSatisfaction = tenantScores.length === 0
    ? null
    : Math.round(tenantScores.reduce((sum, score) => sum + score, 0) / tenantScores.length);
  const unprotectedRisk = Math.max(0, estimatedOpenRepairCost - reserveProtected);

  const milestones: LandlordOpsMilestone[] = [
    {
      id: 'first-tenant',
      label: 'First tenant signed',
      detail: occupiedCount > 0 ? 'You have active rental income on the board.' : 'Sign a lease to start learning the landlord loop.',
      completed: occupiedCount > 0,
      tone: occupiedCount > 0 ? 'good' : 'neutral',
    },
    {
      id: 'tenant-whisperer',
      label: 'Tenant happiness 80+',
      detail: averageTenantSatisfaction !== null ? `Average satisfaction is ${averageTenantSatisfaction}/100.` : 'No tenant satisfaction score yet.',
      completed: averageTenantSatisfaction !== null && averageTenantSatisfaction >= 80,
      tone: averageTenantSatisfaction !== null && averageTenantSatisfaction < 55 ? 'warn' : 'good',
    },
    {
      id: unprotectedRisk > 0 ? 'reserve-gap' : 'reserve-ready',
      label: unprotectedRisk > 0 ? 'Reserve gap exposed' : 'Reserve can absorb open repairs',
      detail: unprotectedRisk > 0
        ? `S$${unprotectedRisk.toLocaleString()} of current repair risk is not protected by reserve.`
        : reserveProtected > 0
          ? 'Current open repairs are covered by earmarked reserve.'
          : 'Set aside reserve before the first large repair arrives.',
      completed: unprotectedRisk === 0 && reserveProtected > 0,
      tone: unprotectedRisk > 0 ? 'warn' : reserveProtected > 0 ? 'good' : 'neutral',
    },
    {
      id: 'steady-occupancy',
      label: 'Portfolio occupancy 80%',
      detail: propertyCount > 0 ? `${Math.round((occupiedCount / propertyCount) * 100)}% of holdings are income-producing.` : 'Buy and operate a property to start occupancy tracking.',
      completed: propertyCount > 0 && occupiedCount / propertyCount >= 0.8,
      tone: propertyCount > 0 && occupiedCount / propertyCount < 0.5 ? 'warn' : 'good',
    },
  ];

  return {
    occupancyRate: propertyCount === 0 ? 0 : Math.round((occupiedCount / propertyCount) * 100),
    averageTenantSatisfaction,
    openIssueCount: openIssues.length,
    urgentIssueCount: openIssues.filter((issue) => issue.severity === 'urgent').length,
    estimatedOpenRepairCost,
    reserveProtected,
    unprotectedRisk,
    expiringLeaseCount,
    milestones,
  };
}

// ============================================================================
// Per-month tick (renovation progress, tenant drift, maintenance roll)
// ============================================================================
function shouldOpenMaintenanceIssue(property: OwnedProperty, nextTurn: number, propertyIndex: number): boolean {
  if ((property.openMaintenanceIssues ?? []).length > 0 || property.activeRenovation) return false;
  if (nextTurn < 4) return false;
  const condition = property.conditionScore ?? 70;
  const cadence = condition < 55 ? 5 : condition < 70 ? 7 : 11;
  const tenantWear = property.tenant?.profileId === 'student-tenants' ? 1 : 0;
  return (nextTurn + propertyIndex + tenantWear) % cadence === 0;
}

function advanceTenant(property: OwnedProperty): OwnedProperty {
  if (!property.tenant) {
    if (property.isRented) {
      return {
        ...property,
        occupancyStatus: property.occupancyStatus === 'owner-occupied' ? 'owner-occupied' : 'tenanted',
        vacancyMonths: 0,
      };
    }

    if (property.occupancyStatus === 'owner-occupied') {
      return {
        ...property,
        isRented: false,
        vacancyMonths: 0,
      };
    }

    return {
      ...property,
      isRented: false,
      occupancyStatus: property.occupancyStatus === 'renovating' ? 'renovating' : 'vacant',
      vacancyMonths: property.occupancyStatus === 'renovating' ? property.vacancyMonths ?? 0 : (property.vacancyMonths ?? 0) + 1,
    };
  }

  const strategy = rentStrategies[property.tenant.rentStrategy];
  const issueDrag = (property.openMaintenanceIssues ?? []).length * 4;
  const conditionBonus = (property.conditionScore ?? 70) >= 80 ? 2 : (property.conditionScore ?? 70) < 55 ? -4 : 0;
  const satisfaction = clamp(property.tenant.satisfaction + Math.round(strategy.satisfactionDelta / 4) + conditionBonus - issueDrag, 0, 100);

  return {
    ...property,
    isRented: true,
    occupancyStatus: property.tenant.rentalMode === 'room-rental' ? 'owner-occupied' : 'tenanted',
    vacancyMonths: 0,
    tenant: {
      ...property.tenant,
      satisfaction,
      renewalIntent: clamp(satisfaction - strategy.vacancyRiskDelta, 0, 100),
    },
  };
}

function getPostRenovationOccupancyStatus(property: OwnedProperty): NonNullable<OwnedProperty['occupancyStatus']> {
  const listing = getListing(property.propertyId);
  if (property.tenant) {
    return property.tenant.rentalMode === 'room-rental' ? 'owner-occupied' : 'tenanted';
  }
  if (listing?.isHdb && (property.mopRemainingMonths ?? 0) > 0) {
    return 'owner-occupied';
  }
  return 'vacant';
}

export function advancePropertyOperationsMonth(player: Player): {
  updatedProperties: OwnedProperty[];
  operationHistory: PropertyOperationLogEntry[];
} {
  const nextTurn = player.turnCount + 1;
  const operationHistory = [...(player.operationHistory ?? [])];

  const updatedProperties = player.properties.map((rawProperty, propertyIndex) => {
    let property = normalizeOperationProperty(rawProperty);
    property = {
      ...property,
      mopRemainingMonths: Math.max(0, (property.mopRemainingMonths ?? 0) - 1),
    };

    if (property.activeRenovation) {
      const remainingMonths = property.activeRenovation.remainingMonths - 1;
      if (remainingMonths <= 0) {
        const completed = property.activeRenovation;
        property = {
          ...property,
          activeRenovation: undefined,
          completedRenovations: [...(property.completedRenovations ?? []), completed.category],
          renovationLevel: property.renovationLevel + 1,
          currentValue: roundMoney(property.currentValue * (1 + completed.resaleUpliftPct / 100)),
          monthlyRental: Math.round(property.monthlyRental * (1 + completed.rentUpliftPct / 100)),
          conditionScore: clamp((property.conditionScore ?? 70) + completed.conditionDelta, 0, 100),
          occupancyStatus: getPostRenovationOccupancyStatus(property),
        };
        operationHistory.unshift({
          id: `op_${nextTurn}_${propertyIndex}_reno_done`,
          turn: nextTurn,
          propertyId: property.propertyId,
          title: `${completed.label} completed`,
          detail: `Rent potential and resale value improved after ${completed.durationMonths} month(s).`,
          tone: 'good',
        });
      } else {
        property = {
          ...property,
          activeRenovation: {
            ...property.activeRenovation,
            remainingMonths,
          },
          occupancyStatus: 'renovating',
        };
        return property;
      }
    }

    property = advanceTenant(property);

    if (shouldOpenMaintenanceIssue(property, nextTurn, propertyIndex)) {
      const issue = createMaintenanceIssue(property, nextTurn, propertyIndex);
      property = {
        ...property,
        conditionScore: clamp((property.conditionScore ?? 70) - (issue.severity === 'urgent' ? 8 : issue.severity === 'major' ? 5 : 3), 0, 100),
        currentValue: roundMoney(property.currentValue * (1 + issue.valueImpactPct / 100)),
        tenant: property.tenant
          ? {
              ...property.tenant,
              satisfaction: clamp(property.tenant.satisfaction + issue.satisfactionImpact, 0, 100),
            }
          : undefined,
        openMaintenanceIssues: [...(property.openMaintenanceIssues ?? []), issue],
      };
      operationHistory.unshift({
        id: `op_${nextTurn}_${propertyIndex}_issue`,
        turn: nextTurn,
        propertyId: property.propertyId,
        title: `${issue.category} issue opened`,
        detail: `Estimated repair cost: S$${issue.estimatedCost.toLocaleString()}.`,
        tone: issue.severity === 'urgent' ? 'bad' : 'warn',
      });
    }

    return property;
  });

  return {
    updatedProperties,
    operationHistory: operationHistory.slice(0, OPERATION_HISTORY_LIMIT),
  };
}
