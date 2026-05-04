import type { Player } from '@/game/types';
import { deriveMaintenanceCost, derivePropertyTax } from './portfolio';

export interface AffordabilityReport {
  shortfall: number;
  blockers: Array<'cash' | 'cashflow' | 'credit'>;
  monthsAtCurrentPace: number | null;
}

export function selectNetWorth(player: Player): number {
  const propertyValue = player.properties.reduce((sum, p) => sum + p.currentValue, 0);
  const outstandingDebt = player.loans
    .filter(loan => !loan.isPaid)
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);
  return player.cash + propertyValue + player.cpfOrdinary + player.cpfSpecial + player.cpfMedisave - outstandingDebt;
}

export function selectMonthlyRentalIncome(player: Player): number {
  return player.properties
    .filter(p => p.isRented)
    .reduce((sum, p) => sum + (p.tenant?.contractedRent ?? p.monthlyRental), 0);
}

export function selectMonthlyTakeHome(player: Player, takeHomeRatio: number): number {
  return player.salary * takeHomeRatio;
}

export function selectMonthlyExpenses(player: Player): number {
  return player.loans.filter(l => !l.isPaid).reduce((sum, l) => sum + l.monthlyPayment, 0);
}

export function selectMonthlyHouseholdLoad(player: Player): number {
  return player.life.householdLoad;
}

export function selectPotentialHousingGrant(player: Player): number {
  if (player.properties.length > 0) {
    return 0;
  }
  return Math.min(25_000, player.life.schemeProgress.firstTimerGrant * 500);
}

export function selectMonthlyOwnershipCosts(player: Player): number {
  return player.properties.reduce((sum, property) => {
    return sum + (property.maintenanceCost ?? deriveMaintenanceCost(property)) + (property.propertyTax ?? derivePropertyTax(property));
  }, 0);
}

export function selectMonthlyNetCashflow(player: Player, takeHomeRatio: number): number {
  return selectMonthlyTakeHome(player, takeHomeRatio)
    + selectMonthlyRentalIncome(player)
    - selectMonthlyExpenses(player)
    - selectMonthlyOwnershipCosts(player)
    - selectMonthlyHouseholdLoad(player);
}

export function selectAffordabilityReport(
  player: Player,
  totalUpfront: number,
  monthlySurplus: number,
  grantSupport = 0,
): AffordabilityReport {
  const effectiveCash = player.cash + grantSupport;
  const shortfall = Math.max(0, totalUpfront - effectiveCash);
  const blockers: AffordabilityReport['blockers'] = [];

  if (shortfall > 0) {
    blockers.push('cash');
  }
  if (monthlySurplus <= 0) {
    blockers.push('cashflow');
  }
  if (player.creditScore < 650) {
    blockers.push('credit');
  }

  return {
    shortfall,
    blockers,
    monthsAtCurrentPace: shortfall === 0 ? 0 : monthlySurplus > 0 ? Math.ceil(shortfall / monthlySurplus) : null,
  };
}
