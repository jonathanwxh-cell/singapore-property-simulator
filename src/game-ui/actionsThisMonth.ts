// Derives "what's on your plate this month" — the prompts that turn an empty
// "tap Next Month" into a turn with a real decision. Pure/derived.
import { difficultySettings, type Player } from '@/game/types';
import { properties as catalog } from '@/data/properties';
import { selectAvailableCash } from '@/engine/selectors';

export type MonthActionKind = 'browse' | 'rent' | 'lease' | 'maintenance' | 'renovate' | 'deploy';

export interface MonthAction {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  tone: 'good' | 'warn' | 'info';
  kind: MonthActionKind;
  propertyIndex?: number;
}

const shortName = (n: string) => n.split(' ').slice(0, 2).join(' ');

export function getMonthActions(player: Player): MonthAction[] {
  if (player.properties.length === 0) {
    return [{ id: 'browse', emoji: '🏠', title: 'Find your first home', hint: "Browse the market and make your move", tone: 'good', kind: 'browse' }];
  }

  const actions: MonthAction[] = [];
  player.properties.forEach((owned, i) => {
    const listing = catalog.find((p) => p.id === owned.propertyId);
    if (!listing) return;
    const mopActive = listing.isHdb && (owned.mopRemainingMonths ?? 0) > 0;

    if ((owned.openMaintenanceIssues?.length ?? 0) > 0) {
      const issue = owned.openMaintenanceIssues![0];
      actions.push({ id: `maint-${i}`, emoji: '🔧', title: `Fix: ${issue.label ?? 'repair needed'}`, hint: `${shortName(listing.name)} needs a repair`, tone: 'warn', kind: 'maintenance', propertyIndex: i });
    }

    const leaseEnd = owned.tenant?.leaseEndTurn;
    if (typeof leaseEnd === 'number' && leaseEnd - player.turnCount <= 2 && leaseEnd - player.turnCount >= 0) {
      actions.push({ id: `lease-${i}`, emoji: '📝', title: `Lease ending: ${shortName(listing.name)}`, hint: 'Renew, raise rent, or let them go', tone: 'warn', kind: 'lease', propertyIndex: i });
    }

    if (!owned.isRented && !mopActive) {
      actions.push({ id: `rent-${i}`, emoji: '🔑', title: `Rent out ${shortName(listing.name)}`, hint: 'Turn a vacant unit into income', tone: 'good', kind: 'rent', propertyIndex: i });
    }

    // MOP-safe room rental: whole-unit is locked, but a spare room can earn.
    if (mopActive && !owned.tenant) {
      actions.push({ id: `room-${i}`, emoji: '🛏️', title: `Rent a room in ${shortName(listing.name)}`, hint: 'MOP-safe — start earning during the wait', tone: 'good', kind: 'rent', propertyIndex: i });
    }

    if (!owned.activeRenovation && (owned.completedRenovations?.length ?? 0) < 2 && owned.isRented) {
      actions.push({ id: `reno-${i}`, emoji: '🛠️', title: `Upgrade ${shortName(listing.name)}`, hint: 'Renovate to lift rent & value', tone: 'info', kind: 'renovate', propertyIndex: i });
    }
  });

  const target = difficultySettings[player.difficulty].targetNetWorth;
  if (selectAvailableCash(player) > Math.max(80_000, target * 0.02)) {
    actions.push({ id: 'deploy', emoji: '💡', title: 'Put idle cash to work', hint: 'Spare cash is lazy money — buy another place', tone: 'info', kind: 'deploy' });
  }

  const order: Record<MonthAction['tone'], number> = { warn: 0, good: 1, info: 2 };
  return actions.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 4);
}
