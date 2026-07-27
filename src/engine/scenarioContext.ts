import { properties } from '@/data/properties';
import { scenarios, type Scenario, type ScenarioRequirement } from '@/data/scenarios';
import type { Player } from '@/game/types';
import { getRouteForPlayer } from './runDirector';
import type { Rng } from './rng';

function playerOwnsAnyProperty(player: Player): boolean {
  return player.properties.length > 0;
}

function playerOwnsRentedProperty(player: Player): boolean {
  return player.properties.some((property) => property.isRented);
}

function playerOwnsAgingLeasehold(player: Player): boolean {
  return player.properties.some((owned) => {
    const property = properties.find((entry) => entry.id === owned.propertyId);
    return (property?.leaseYears ?? 999) <= 75;
  });
}

function playerOwnsPremiumDistrictAsset(player: Player): boolean {
  return player.properties.some((owned) => {
    const property = properties.find((entry) => entry.id === owned.propertyId);
    return property !== undefined && property.districtId <= 10;
  });
}

function playerOwnsCommercialAsset(player: Player): boolean {
  return player.properties.some((owned) => {
    const property = properties.find((entry) => entry.id === owned.propertyId);
    return property?.type === 'Commercial Shop' || property?.type === 'Commercial Office';
  });
}

function meetsRequirement(player: Player, requirement: ScenarioRequirement): boolean {
  switch (requirement) {
    case 'owned-property':
      return playerOwnsAnyProperty(player);
    case 'rented-property':
      return playerOwnsRentedProperty(player);
    case 'aging-leasehold':
      return playerOwnsAgingLeasehold(player);
    case 'premium-district':
      return playerOwnsPremiumDistrictAsset(player);
    case 'commercial-asset':
      return playerOwnsCommercialAsset(player);
    case 'single-only':
      return player.maritalStatus === 'single';
    default:
      return true;
  }
}

export function getEligibleScenarios(player: Player): Scenario[] {
  return scenarios.filter((scenario) =>
    (scenario.requires ?? []).every((requirement) => meetsRequirement(player, requirement))
  );
}

export function getRouteWeightedScenarios(player: Player): Scenario[] {
  const eligible = getEligibleScenarios(player);
  const routeTags = new Set(getRouteForPlayer(player).scenarioTags);
  const routeMatches = eligible.filter((scenario) =>
    (scenario.routeTags ?? []).some((tag) => routeTags.has(tag))
  );

  if (routeMatches.length === 0) return eligible;

  return [...routeMatches, ...routeMatches, ...eligible];
}

const FREQUENCY_WEIGHTS: Record<Scenario['frequency'], number> = {
  common: 8,
  uncommon: 4,
  rare: 2,
  'very-rare': 1,
};

export function pickWeightedScenario(
  player: Player,
  rng: Pick<Rng, 'next'>,
  predicate: (scenario: Scenario) => boolean = () => true,
): Scenario | null {
  const eligible = getEligibleScenarios(player).filter(predicate);
  if (eligible.length === 0) return null;

  const routeTags = new Set(getRouteForPlayer(player).scenarioTags);
  const weighted = eligible.map((scenario) => {
    const routeMatch = (scenario.routeTags ?? []).some((tag) => routeTags.has(tag));
    return {
      scenario,
      weight: FREQUENCY_WEIGHTS[scenario.frequency] * (routeMatch ? 3 : 1),
    };
  });
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rng.next() * totalWeight;

  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor < 0) return entry.scenario;
  }
  return weighted[weighted.length - 1].scenario;
}
