import { getRenovationTemplate } from '@/data/renovations';
import { maintenanceTemplates, repairChoices, type RepairChoiceId } from '@/data/maintenanceEvents';
import { getTenantProfile, rentalModes, rentStrategies } from '@/data/tenantProfiles';
import type {
  MaintenanceIssue,
  OwnedProperty,
  Player,
  PropertyOperationLogEntry,
  RentalMode,
  RentStrategy,
  ReserveState,
  TenantProfileId,
} from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import { getListingCatalog } from './listings';
import { roundMoney } from '@/lib/format';

const OPERATION_HISTORY_LIMIT = 12;

export interface TenantStrategyInput {
  mode: RentalMode;
  profileId: TenantProfileId;
  rentStrategy: RentStrategy;
}

export interface ReservePlanInput {
  targetMonths: number;
  allocatedCash: number;
  autoTopUpPct: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getListing(propertyId: string) {
  return getListingCatalog().find((listing) => listing.id === propertyId);
}

function withOperationLog(
  player: Player,
  entry: Omit<PropertyOperationLogEntry, 'id' | 'turn'>,
): Player {
  const nextEntry: PropertyOperationLogEntry = {
    id: `op_${player.turnCount}_${(player.operationHistory ?? []).length}_${entry.propertyId ?? 'general'}`,
    turn: player.turnCount,
    ...entry,
  };

  return {
    ...player,
    operationHistory: [nextEntry, ...(player.operationHistory ?? [])].slice(0, OPERATION_HISTORY_LIMIT),
  };
}

export function deriveFloorPlanId(property: OwnedProperty): string {
  const listing = getListing(property.propertyId);
  if (!listing) return 'floorplan-generic';
  if (listing.type === 'Commercial Shop') return 'floorplan-commercial-shop';
  if (listing.type === 'Commercial Office') return 'floorplan-commercial-office';
  if (listing.type.startsWith('Landed')) return 'floorplan-landed';
  if (listing.type === 'Private Condo' || listing.type === 'Executive Condo') {
    return listing.bedrooms <= 2 ? 'floorplan-condo-2-bed' : 'floorplan-condo-3-bed';
  }
  if (listing.bedrooms <= 2) return 'floorplan-hdb-3-room';
  if (listing.bedrooms === 3) return 'floorplan-hdb-4-room';
  return 'floorplan-hdb-5-room';
}

export function normalizeOperationProperty(property: OwnedProperty): OwnedProperty {
  return {
    ...property,
    conditionScore: property.conditionScore ?? 70,
    mopRemainingMonths: property.mopRemainingMonths ?? 0,
    completedRenovations: property.completedRenovations ?? [],
    openMaintenanceIssues: property.openMaintenanceIssues ?? [],
    rentStrategy: property.rentStrategy ?? property.tenant?.rentStrategy ?? 'market',
    floorPlanId: property.floorPlanId ?? deriveFloorPlanId(property),
  };
}

export function createDefaultReserve(): ReserveState {
  return {
    targetMonths: 3,
    allocatedCash: 0,
    autoTopUpPct: 0,
  };
}

export function setReservePlanPure(
  player: Player,
  input: ReservePlanInput,
): ActionResult<{ player: Player }> {
  const targetMonths = Math.round(input.targetMonths);
  const allocatedCash = roundMoney(input.allocatedCash);
  const autoTopUpPct = Math.round(input.autoTopUpPct);

  if (targetMonths < 0 || allocatedCash < 0 || autoTopUpPct < 0 || autoTopUpPct > 100) {
    return fail('invalid_amount', 'Reserve target, allocation, and auto top-up must be valid positive values.');
  }
  if (allocatedCash > player.cash) {
    return fail('insufficient_cash', 'Reserve allocation cannot exceed available cash.');
  }

  const updatedPlayer = withOperationLog({
    ...player,
    reserve: {
      targetMonths,
      allocatedCash,
      autoTopUpPct,
      lastCoveredCost: player.reserve?.lastCoveredCost,
    },
  }, {
    title: 'Emergency reserve updated',
    detail: `S$${allocatedCash.toLocaleString()} marked as protected runway for property surprises.`,
    tone: allocatedCash > 0 ? 'good' : 'warn',
  });

  return ok({ player: updatedPlayer });
}

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
    detail: `S$${template.cost.toLocaleString()} committed for ${template.durationMonths} month(s).`,
    tone: 'neutral',
  });

  return ok({ player: updatedPlayer });
}

export function setTenantStrategyPure(
  player: Player,
  propertyIndex: number,
  input: TenantStrategyInput,
): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = normalizeOperationProperty(player.properties[propertyIndex]);
  const listing = getListing(property.propertyId);
  const profile = getTenantProfile(input.profileId);
  const mode = rentalModes[input.mode];
  const strategy = rentStrategies[input.rentStrategy];

  if (!listing) return fail('property_not_found', 'Property not found.');
  if (!profile || !mode || !strategy || !profile.allowedModes.includes(input.mode)) {
    return fail('rental_mode_blocked', 'This tenant profile does not fit the selected rental mode.');
  }
  if (property.activeRenovation?.status === 'active') {
    return fail('renovation_active', 'Finish the active renovation before signing a tenant.');
  }
  if (listing.isHdb && (property.mopRemainingMonths ?? 0) > 0 && input.mode !== 'room-rental') {
    return fail('mop_restricted', 'HDB MOP blocks whole-unit rental. Use room rental until MOP ends.');
  }
  if (listing.type.startsWith('Commercial') && !['commercial-lease', 'corporate-lease'].includes(input.mode)) {
    return fail('rental_mode_blocked', 'Commercial properties need commercial or corporate lease tenants.');
  }
  if (!listing.type.startsWith('Commercial') && input.mode === 'commercial-lease') {
    return fail('rental_mode_blocked', 'Commercial leases are only available for shop and office properties.');
  }

  const askingRent = Math.round(property.monthlyRental * mode.rentMultiplier * strategy.rentMultiplier * profile.rentMultiplier);
  const conditionAdjustment = (property.conditionScore ?? 70) >= 80 ? 4 : (property.conditionScore ?? 70) < 55 ? -6 : 0;
  const satisfaction = clamp(profile.baseSatisfaction + strategy.satisfactionDelta + conditionAdjustment, 20, 96);
  const defaultRiskPct = roundMoney(clamp(profile.baseDefaultRiskPct + strategy.defaultRiskDelta + ((property.conditionScore ?? 70) < 55 ? 2 : 0), 0.5, 18));

  const tenant = {
    profileId: input.profileId,
    rentalMode: input.mode,
    leaseStartTurn: player.turnCount,
    leaseEndTurn: player.turnCount + 12,
    satisfaction,
    rentStrategy: input.rentStrategy,
    askingRent,
    contractedRent: askingRent,
    defaultRiskPct,
    renewalIntent: clamp(satisfaction - strategy.vacancyRiskDelta, 10, 98),
  };

  const updatedProperties = [...player.properties];
  updatedProperties[propertyIndex] = {
    ...property,
    tenant,
    rentStrategy: input.rentStrategy,
    isRented: true,
    monthlyRental: property.monthlyRental,
    occupancyStatus: 'tenanted',
    vacancyMonths: 0,
  };

  const updatedPlayer = withOperationLog({
    ...player,
    properties: updatedProperties,
  }, {
    propertyId: property.propertyId,
    title: `${profile.label} lease signed`,
    detail: `${mode.label} at S$${askingRent.toLocaleString()}/mo using a ${strategy.label.toLowerCase()} rent strategy.`,
    tone: input.rentStrategy === 'aggressive' ? 'warn' : 'good',
  });

  return ok({ player: updatedPlayer });
}

export function resolveMaintenanceIssuePure(
  player: Player,
  propertyIndex: number,
  issueId: string,
  choiceId: RepairChoiceId,
): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = normalizeOperationProperty(player.properties[propertyIndex]);
  const issue = (property.openMaintenanceIssues ?? []).find((candidate) => candidate.id === issueId);
  const choice = repairChoices[choiceId];
  if (!issue) return fail('maintenance_not_found', 'Maintenance issue not found.');
  if (!choice) return fail('repair_choice_not_found', 'Repair option not found.');

  const cost = Math.round(issue.estimatedCost * choice.costMultiplier);
  if (player.cash < cost) return fail('insufficient_cash', 'Not enough cash to resolve this maintenance issue.');

  const reserve = player.reserve ?? createDefaultReserve();
  const reserveDraw = Math.min(reserve.allocatedCash, cost);
  const tenant = property.tenant
    ? {
        ...property.tenant,
        satisfaction: clamp(property.tenant.satisfaction + choice.satisfactionDelta - issue.satisfactionImpact * 0.1, 0, 100),
        renewalIntent: clamp(property.tenant.renewalIntent + choice.satisfactionDelta, 0, 100),
      }
    : undefined;

  const updatedProperties = [...player.properties];
  updatedProperties[propertyIndex] = {
    ...property,
    tenant,
    conditionScore: clamp((property.conditionScore ?? 70) + choice.conditionDelta, 0, 100),
    openMaintenanceIssues: (property.openMaintenanceIssues ?? []).filter((candidate) => candidate.id !== issueId),
  };

  const updatedPlayer = withOperationLog({
    ...player,
    cash: roundMoney(player.cash - cost),
    reserve: {
      ...reserve,
      allocatedCash: roundMoney(reserve.allocatedCash - reserveDraw),
      lastCoveredCost: reserveDraw > 0 ? reserveDraw : reserve.lastCoveredCost,
    },
    properties: updatedProperties,
  }, {
    propertyId: property.propertyId,
    title: `${choice.label} completed`,
    detail: reserveDraw > 0
      ? `S$${cost.toLocaleString()} repair paid, with S$${reserveDraw.toLocaleString()} covered by reserve.`
      : `S$${cost.toLocaleString()} repair paid from cash.`,
    tone: choiceId === 'cheap-fix' ? 'warn' : 'good',
  });

  return ok({ player: updatedPlayer });
}

function createMaintenanceIssue(property: OwnedProperty, turn: number, propertyIndex: number): MaintenanceIssue {
  const template = maintenanceTemplates[(turn + propertyIndex) % maintenanceTemplates.length];
  const conditionPenalty = Math.max(0, 70 - (property.conditionScore ?? 70)) * 18;
  return {
    id: `issue_${turn}_${propertyIndex}_${template.category}`,
    propertyId: property.propertyId,
    category: template.category,
    severity: template.severity,
    estimatedCost: Math.round(template.baseCost + conditionPenalty),
    satisfactionImpact: template.satisfactionImpact,
    valueImpactPct: template.valueImpactPct,
    recurrenceRiskPct: template.recurrenceRiskPct,
    status: 'open',
  };
}

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
        occupancyStatus: 'tenanted',
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
    occupancyStatus: 'tenanted',
    vacancyMonths: 0,
    tenant: {
      ...property.tenant,
      satisfaction,
      renewalIntent: clamp(satisfaction - strategy.vacancyRiskDelta, 0, 100),
    },
  };
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
          occupancyStatus: property.tenant ? 'tenanted' : 'vacant',
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
