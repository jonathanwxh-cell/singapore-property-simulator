import type { Player } from '@/game/types';

export function selectTotalPropertyValue(player: Player): number {
  return player.properties.reduce((sum, p) => sum + p.currentValue, 0);
}

export function selectOutstandingDebt(player: Player): number {
  return player.loans
    .filter(l => !l.isPaid)
    .reduce((sum, l) => sum + Math.max(0, l.remainingBalance), 0);
}

export function selectNetWorth(player: Player): number {
  return (
    player.cash +
    player.cpfOrdinary +
    player.cpfSpecial +
    player.cpfMedisave +
    selectTotalPropertyValue(player) -
    selectOutstandingDebt(player)
  );
}

export function selectMonthlyRentalIncome(player: Player): number {
  return player.properties
    .filter(p => p.isRented)
    .reduce((sum, p) => sum + p.monthlyRental, 0);
}

export function selectMonthlyTakeHome(player: Player, takeHomeRatio: number): number {
  return player.salary * takeHomeRatio;
}

export function selectMonthlyExpenses(player: Player): number {
  return player.loans.filter(l => !l.isPaid).reduce((sum, l) => sum + l.monthlyPayment, 0);
}

export function selectMonthlyNetCashflow(player: Player, takeHomeRatio: number): number {
  return selectMonthlyTakeHome(player, takeHomeRatio) + selectMonthlyRentalIncome(player) - selectMonthlyExpenses(player);
}
