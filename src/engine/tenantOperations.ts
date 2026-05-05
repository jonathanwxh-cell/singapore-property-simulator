import { getTenantProfile, rentalModes, rentStrategies } from '@/data/tenantProfiles';
import { isCommercialCategory } from '@/data/properties';
import type {
  OwnedProperty,
  Player,
  RentalMode,
  RentStrategy,
  TenantLeaseDecisionId,
  TenantProfileId,
} from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import { roundMoney } from '@/lib/format';
import { clamp, getListing, normalizeOperationProperty, withOperationLog } from './operationsShared';

export interface TenantStrategyInput {
  mode: RentalMode;
  profileId: TenantProfileId;
  rentStrategy: RentStrategy;
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
  if (isCommercialCategory(listing.type) && !['commercial-lease', 'corporate-lease'].includes(input.mode)) {
    return fail('rental_mode_blocked', 'Commercial properties need commercial or corporate lease tenants.');
  }
  if (!isCommercialCategory(listing.type) && input.mode === 'commercial-lease') {
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
  if (tenant.lastLeaseDecisionTurn === currentTurn) return [];

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
  if (tenant.lastLeaseDecisionTurn === player.turnCount) {
    return fail('lease_decision_already_made', 'You already made a lease decision for this property this month. Advance to next month before deciding again.');
  }

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
      rentStrategy: tenant.rentStrategy,
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
      lastLeaseDecisionTurn: player.turnCount,
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
