import { createInitialLifeIncomeBreakdown, type Player } from '@/game/types';
import { deriveMaintenanceCost, derivePropertyTax } from './portfolio';
import { getCpfEmployeeContribution } from './cpf';

export interface AffordabilityReport {
  shortfall: number;
  blockers: Array<'cash' | 'cashflow' | 'credit'>;
  monthsAtCurrentPace: number | null;
}

export interface MonthlyIncomeMix {
  takeHomePay: number;
  rentalIncome: number;
  recurringIncome: number;
  lastExtraIncome: number;
  lastCostlyLifeMoves: number;
}

export function selectNetWorth(player: Player): number {
  const propertyValue = player.properties.reduce((sum, p) => sum + p.currentValue, 0);
  const outstandingDebt = player.loans
    .filter(loan => !loan.isPaid)
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);
  return player.cash + propertyValue + player.cpfOrdinary + player.cpfSpecial + player.cpfMedisave - outstandingDebt;
}

export function selectReservedCash(player: Player): number {
  return Math.max(0, Math.min(player.cash, player.reserve?.allocatedCash ?? 0));
}

export function selectAvailableCash(player: Player): number {
  return Math.max(0, player.cash - selectReservedCash(player));
}

export function selectMonthlyRentalIncome(player: Player): number {
  return player.properties
    .filter(p => p.isRented)
    .reduce((sum, p) => sum + (p.tenant?.contractedRent ?? p.monthlyRental), 0);
}

export function selectMonthlyTakeHome(player: Player, _legacyTakeHomeRatio?: number): number {
  void _legacyTakeHomeRatio;
  const profile = player.buyerProfile;
  return player.salary - getCpfEmployeeContribution(
    player.salary,
    player.age,
    profile?.residencyStatus ?? 'sc',
    profile?.sprYear ?? 3,
  );
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

export function selectMonthlyNetCashflow(player: Player, takeHomeRatio?: number): number {
  return selectMonthlyTakeHome(player, takeHomeRatio)
    + selectMonthlyRentalIncome(player)
    - selectMonthlyExpenses(player)
    - selectMonthlyOwnershipCosts(player)
    - selectMonthlyHouseholdLoad(player);
}

export function selectMonthlyIncomeMix(player: Player, takeHomeRatio?: number): MonthlyIncomeMix {
  const takeHomePay = selectMonthlyTakeHome(player, takeHomeRatio);
  const rentalIncome = selectMonthlyRentalIncome(player);
  const breakdown = player.life.lastMonthSummary?.incomeBreakdown ?? createInitialLifeIncomeBreakdown();
  const lastExtraIncome = Math.max(0, breakdown.focusAtWork)
    + Math.max(0, breakdown.sideGig)
    + Math.max(0, breakdown.propertyHustle)
    + Math.max(0, breakdown.schemes);
  const lastCostlyLifeMoves = Math.abs(Math.min(0, breakdown.upskillCost)) + Math.abs(Math.min(0, breakdown.householdSupportCost));

  return {
    takeHomePay,
    rentalIncome,
    recurringIncome: takeHomePay + rentalIncome,
    lastExtraIncome,
    lastCostlyLifeMoves,
  };
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
