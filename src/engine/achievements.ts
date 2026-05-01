import { achievements } from '@/data/achievements';
import { districts } from '@/data/districts';
import { properties } from '@/data/properties';
import type { Player } from '@/game/types';
import { selectNetWorth } from './selectors';

const propertyById = new Map(properties.map(property => [property.id, property]));
const districtById = new Map(districts.map(district => [district.id, district]));

export function deriveUnlockedAchievementIds(player: Player): string[] {
  const unlocked = new Set(player.achievements);
  const netWorth = selectNetWorth(player);
  const ownedProperties = player.properties
    .map(owned => propertyById.get(owned.propertyId))
    .filter((property): property is NonNullable<typeof property> => property !== undefined);
  const ownedDistrictIds = new Set(ownedProperties.map(property => property.districtId));
  const hdbOcrCount = ownedProperties.filter(property => {
    const district = districtById.get(property.districtId);
    return property.isHdb && district?.region === 'OCR';
  }).length;
  const allLoansPaid = player.loans.length > 0 && player.loans.every(loan => loan.isPaid);

  for (const achievement of achievements) {
    if (isAchievementUnlocked(achievement.id, { player, netWorth, ownedDistrictIds, hdbOcrCount, allLoansPaid })) {
      unlocked.add(achievement.id);
    }
  }

  return [...unlocked];
}

function isAchievementUnlocked(
  achievementId: string,
  context: {
    player: Player;
    netWorth: number;
    ownedDistrictIds: Set<number>;
    hdbOcrCount: number;
    allLoansPaid: boolean;
  },
): boolean {
  const { player, netWorth, ownedDistrictIds, hdbOcrCount, allLoansPaid } = context;

  switch (achievementId) {
    case 'first-property':
      return player.properties.length >= 1;
    case 'three-properties':
      return player.properties.length >= 3;
    case 'millionaire':
      return netWorth >= 1_000_000;
    case 'five-million':
      return netWorth >= 5_000_000;
    case 'ten-million':
      return netWorth >= 10_000_000;
    case 'fifty-million':
      return netWorth >= 50_000_000;
    case 'sentosa-cove':
      return ownedDistrictIds.has(4);
    case 'orchard-owner':
      return ownedDistrictIds.has(9) || ownedDistrictIds.has(10);
    case 'hdb-heartland':
      return hdbOcrCount >= 3;
    case 'rental-empire':
      return player.totalRentalIncome >= 50_000;
    case 'debt-free':
      return allLoansPaid;
    case 'ten-turns':
      return player.turnCount >= 10;
    case 'fifty-turns':
      return player.turnCount >= 50;
    case 'century-turns':
      return player.turnCount >= 100;
    case 'married':
      return player.maritalStatus === 'married';
    case 'children':
      return player.children >= 2;
    case 'credit-king':
      return player.creditScore >= 850;
    case 'all-districts':
      return ownedDistrictIds.size >= 10;
    default:
      return false;
  }
}
