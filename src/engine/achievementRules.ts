import { achievements } from '@/data/achievements';
import { properties } from '@/data/properties';
import type { Player } from '@/game/types';
import { selectNetWorth } from './selectors';

function ownsDistrict(player: Player, districtId: number): boolean {
  return player.properties.some(owned => {
    const property = properties.find(p => p.id === owned.propertyId);
    return property?.districtId === districtId;
  });
}

function countHdbOcr(player: Player): number {
  return player.properties.filter(owned => {
    const property = properties.find(p => p.id === owned.propertyId);
    return property?.isHdb && property.districtId >= 16;
  }).length;
}

function uniqueDistrictCount(player: Player): number {
  return new Set(
    player.properties
      .map(owned => properties.find(p => p.id === owned.propertyId)?.districtId)
      .filter((districtId): districtId is number => typeof districtId === 'number')
  ).size;
}

export function evaluateAchievements(player: Player): string[] {
  const unlocked = new Set(player.achievements);
  const netWorth = selectNetWorth(player);
  const activeLoans = player.loans.filter(l => !l.isPaid);

  const checks: Record<string, boolean> = {
    'first-property': player.properties.length >= 1,
    'three-properties': player.properties.length >= 3,
    millionaire: netWorth >= 1000000,
    'five-million': netWorth >= 5000000,
    'ten-million': netWorth >= 10000000,
    'fifty-million': netWorth >= 50000000,
    'sentosa-cove': ownsDistrict(player, 4),
    'orchard-owner': ownsDistrict(player, 9) || ownsDistrict(player, 10),
    'hdb-heartland': countHdbOcr(player) >= 3,
    'rental-empire': player.totalRentalIncome >= 50000,
    'debt-free': player.loans.length > 0 && activeLoans.length === 0,
    'ten-turns': player.turnCount >= 10,
    'fifty-turns': player.turnCount >= 50,
    'century-turns': player.turnCount >= 100,
    married: player.maritalStatus === 'married',
    children: player.children >= 2,
    'credit-king': player.creditScore >= 850,
    'all-districts': uniqueDistrictCount(player) >= 10,
  };

  for (const achievement of achievements) {
    if (checks[achievement.id]) unlocked.add(achievement.id);
  }

  return Array.from(unlocked);
}

export function withEvaluatedAchievements(player: Player): Player {
  return { ...player, achievements: evaluateAchievements(player) };
}
