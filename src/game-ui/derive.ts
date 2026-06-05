// Human-facing derived values for the UI. Everything routes through the engine
// selectors — the UI never re-implements finance.
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { difficultySettings, type Player } from '@/game/types';
import {
  selectNetWorth,
  selectAvailableCash,
  selectMonthlyRentalIncome,
  selectMonthlyNetCashflow,
  selectMonthlyExpenses,
  selectMonthlyOwnershipCosts,
  selectMonthlyHouseholdLoad,
} from '@/engine/selectors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface PlayerView {
  netWorth: number;
  target: number;
  freedomPct: number;
  takeHome: number;
  rental: number;
  expenses: number;
  ownership: number;
  household: number;
  cashflow: number;
  available: number;
  monthLabel: string;
  propertyCount: number;
}

export function deriveView(player: Player): PlayerView {
  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  return {
    netWorth,
    target,
    freedomPct: Math.max(0, Math.min(100, (netWorth / target) * 100)),
    takeHome: player.salary * TAKE_HOME_RATIO,
    rental: selectMonthlyRentalIncome(player),
    expenses: selectMonthlyExpenses(player),
    ownership: selectMonthlyOwnershipCosts(player),
    household: selectMonthlyHouseholdLoad(player),
    cashflow: selectMonthlyNetCashflow(player, TAKE_HOME_RATIO),
    available: selectAvailableCash(player),
    monthLabel: `${MONTHS[(player.month - 1) % 12]} ${player.year}`,
    propertyCount: player.properties.length,
  };
}

/** A short, human life-stage descriptor for the status strip. */
export function lifeTitle(player: Player): string {
  const n = player.properties.length;
  if (n === 0) return player.age >= 35 ? 'Aspiring owner' : 'Renting & dreaming';
  if (n === 1) return 'Homeowner';
  if (n <= 3) return 'Landlord';
  if (n <= 6) return 'Property investor';
  return 'Property mogul';
}
