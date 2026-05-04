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
  TenantLeaseDecisionId,
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

export interface TenantLeaseOption {
  id: TenantLeaseDecisionId;
  label: string;
  detail: string;
  projectedRent: number;
  rentDelta: number;
  satisfactionDelta: number;
  vacancyRiskDelta: number;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

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
  const listing = getListing(property.propertyId);
  return {
    ...property,
    occupancyStatus: property.occupancyStatus ?? (listing?.isHdb ? 'owner-occupied' : 'vacant'),
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
    occupancyStatus: input.mode === 'room-rental' ? 'owner-occupied' : 'tenanted',
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

export function getTenantLeaseOptions(
  rawProperty: OwnedProperty,
  currentTurn: number,
): TenantLeaseOption[] {
  const property = normalizeOperationProperty(rawProperty);
  const tenant = property.tenant;
  if (!tenant) return [];

  const monthsRemaining = Math.max(0, tenant.leaseEndTurn - currentTurn);
  const currentRent = tenant.contractedRent;
  const currentMode = rentalModes[tenant.rentalMode];
  const currentProfile = getTenantProfile(tenant.profileId);
  const marketRent = Math.round(
    property.monthlyRental
      * (currentMode?.rentMultiplier ?? 1)
      * (currentProfile?.rentMultiplier ?? 1),
  );
  const raisedRent = Math.round(currentRent * 1.08);

  return [
    {
      id: 'renew',
      label: 'Renew Steady',
      detail: monthsRemaining <= 2
        ? 'Lock in another year with minimal drama and a tenant-trust bump.'
        : 'Offer an early renewal to protect occupancy before the lease window gets noisy.',
      projectedRent: currentRent,
      rentDelta: 0,
      satisfactionDelta: 6,
      vacancyRiskDelta: -6,
      tone: 'good',
    },
    {
      id: 'raise-rent',
      label: 'Raise Rent 8%',
      detail: 'Push income, but weak renewal intent can turn this into a vacancy.',
      projectedRent: raisedRent,
      rentDelta: raisedRent - currentRent,
      satisfactionDelta: -8,
      vacancyRiskDelta: 14,
      tone: tenant.renewalIntent < 45 ? 'bad' : 'warn',
    },
    {
      id: 'reset-market',
      label: 'Reset To Market',
      detail: 'Reprice around current market rent to rebuild satisfaction and renewal odds.',
      projectedRent: marketRent,
      rentDelta: marketRent - currentRent,
      satisfactionDelta: 4,
      vacancyRiskDelta: -4,
      tone: marketRent < currentRent ? 'warn' : 'neutral',
    },
    {
      id: 'end-lease',
      label: 'Let Tenant Leave',
      detail: 'Take vacancy now so you can renovate, reposition, or choose a better tenant profile.',
      projectedRent: 0,
      rentDelta: -currentRent,
      satisfactionDelta: 0,
      vacancyRiskDelta: 100,
      tone: 'neutral',
    },
  ];
}

export function applyTenantLeaseDecisionPure(
  player: Player,
  propertyIndex: number,
  decisionId: TenantLeaseDecisionId,
): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = normalizeOperationProperty(player.properties[propertyIndex]);
  const listing = getListing(property.propertyId);
  const tenant = property.tenant;
  if (!listing) return fail('property_not_found', 'Property not found.');
  if (!tenant) return fail('tenant_not_found', 'No active tenant to manage.');

  const option = getTenantLeaseOptions(property, player.turnCount).find((candidate) => candidate.id === decisionId);
  if (!option) return fail('lease_option_not_found', 'Lease decision option not found.');

  const updatedProperties = [...player.properties];
  const isRoomRental = tenant.rentalMode === 'room-rental';
  const vacancyStatus = isRoomRental || (listing.isHdb && (property.mopRemainingMonths ?? 0) > 0)
    ? 'owner-occupied'
    : 'vacant';

  if (decisionId === 'end-lease') {
    updatedProperties[propertyIndex] = {
      ...property,
      tenant: undefined,
      isRented: false,
      occupancyStatus: vacancyStatus,
      vacancyMonths: vacancyStatus === 'vacant' ? (property.vacancyMonths ?? 0) + 1 : 0,
    };

    return ok({
      player: withOperationLog({
        ...player,
        properties: updatedProperties,
      }, {
        propertyId: property.propertyId,
        title: 'Tenant released',
        detail: 'The lease was ended intentionally. Reposition the unit before vacancy drags too long.',
        tone: 'neutral',
      }),
    });
  }

  const intentAfterDecision = clamp(tenant.renewalIntent - option.vacancyRiskDelta, 0, 100);
  const satisfactionAfterDecision = clamp(tenant.satisfaction + option.satisfactionDelta, 0, 100);
  const pushedTooHard = decisionId === 'raise-rent' && intentAfterDecision < 25;

  if (pushedTooHard) {
    updatedProperties[propertyIndex] = {
      ...property,
      tenant: undefined,
      isRented: false,
      occupancyStatus: vacancyStatus,
      vacancyMonths: vacancyStatus === 'vacant' ? (property.vacancyMonths ?? 0) + 1 : 0,
      rentStrategy: 'aggressive',
    };

    return ok({
      player: withOperationLog({
        ...player,
        properties: updatedProperties,
      }, {
        propertyId: property.propertyId,
        title: 'Rent push caused vacancy',
        detail: `The proposed ${option.label.toLowerCase()} broke renewal intent. Re-list or renovate before the next tenant.`,
        tone: 'warn',
      }),
    });
  }

  const nextStrategy = decisionId === 'raise-rent'
    ? 'aggressive'
    : decisionId === 'renew'
      ? tenant.rentStrategy
      : 'market';

  updatedProperties[propertyIndex] = {
    ...property,
    tenant: {
      ...tenant,
      rentStrategy: nextStrategy,
      contractedRent: option.projectedRent,
      askingRent: option.projectedRent,
      satisfaction: satisfactionAfterDecision,
      renewalIntent: intentAfterDecision,
      defaultRiskPct: roundMoney(clamp(tenant.defaultRiskPct + (decisionId === 'raise-rent' ? 1.5 : decisionId === 'renew' ? -0.3 : -0.1), 0.5, 20)),
      leaseStartTurn: player.turnCount,
      leaseEndTurn: player.turnCount + 12,
    },
    isRented: true,
    rentStrategy: nextStrategy,
    occupancyStatus: isRoomRental ? 'owner-occupied' : 'tenanted',
    vacancyMonths: 0,
  };

  return ok({
    player: withOperationLog({
      ...player,
      properties: updatedProperties,
    }, {
      propertyId: property.propertyId,
      title: decisionId === 'renew' ? 'Lease renewed' : decisionId === 'raise-rent' ? 'Lease renewed at higher rent' : 'Lease reset to market',
      detail: `${option.label}: rent ${option.rentDelta >= 0 ? '+' : '-'}S$${Math.abs(option.rentDelta).toLocaleString()}/mo, satisfaction ${option.satisfactionDelta >= 0 ? '+' : ''}${option.satisfactionDelta}.`,
      tone: option.tone,
    }),
  });
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
    label: template.label,
    riskTag: template.riskTag,
    estimatedCost: Math.round(template.baseCost + conditionPenalty),
    satisfactionImpact: template.satisfactionImpact,
    valueImpactPct: template.valueImpactPct,
    recurrenceRiskPct: template.recurrenceRiskPct,
    status: 'open',
  };
}

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
