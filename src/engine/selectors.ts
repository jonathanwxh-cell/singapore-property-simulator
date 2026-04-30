import type { Player } from '@/game/types';

export function selectNetWorth(player: Player): number {
  const propertyValue = player.properties.reduce((sum, p) => sum + p.currentValue, 0);
  return player.cash + propertyValue + player.cpfOrdinary + player.cpfSpecial + player.cpfMedisave;
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
  return selectMonthlyTakeHome(player, takeHomeRatio) +
    selectMonthlyRentalIncome(player) -
    selectMonthlyExpenses(player);
}
