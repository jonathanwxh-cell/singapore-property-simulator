import { scenarios } from '@/data/scenarios';
import { careers } from '@/data/careers';
import type { GameSettings, MarketState, Player } from '@/game/types';
import { difficultySettings } from '@/game/types';
import {
  CPF_OA_PORTION,
  CPF_TOTAL_CONTRIB_RATIO,
  INSOLVENCY_STRIKES_LIMIT,
  INTEREST_RATE_BOUNDS,
  PRICE_INDEX_BOUNDS,
  PROPERTY_VALUE_FLOOR,
  PROPERTY_VALUE_VOL_FACTOR,
  RENTAL_INDEX_BOUNDS,
  SCENARIO_TRIGGER_PROBABILITY,
  TAKE_HOME_RATIO,
} from '@/engine/constants';
import { amortizeOneMonth } from '@/engine/finance';
import { selectMonthlyRentalIncome, selectNetWorth } from '@/engine/selectors';

export interface AdvanceTurnInput {
  player: Player;
  market: MarketState;
  settings: GameSettings;
  rng: () => number;
}

export interface AdvanceTurnOutput {
  player: Player;
  market: MarketState;
  scenarioId: string | null;
  gameOver: boolean;
  outcome: 'won' | 'lost' | 'ongoing';
}

function clamp(value: number, bounds: { min: number; max: number }): number {
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

export function advanceTurn({ player, market, rng }: AdvanceTurnInput): AdvanceTurnOutput {
  const diff = difficultySettings[player.difficulty];
  const nextMonth = player.month === 12 ? 1 : player.month + 1;
  const nextYear = player.month === 12 ? player.year + 1 : player.year;
  const nextAge = player.month === 12 ? player.age + 1 : player.age;
  const rentalIncome = selectMonthlyRentalIncome(player);
  const takeHomePay = player.salary * TAKE_HOME_RATIO;
  const cpfContribution = player.salary * CPF_TOTAL_CONTRIB_RATIO;

  let totalLoanPayment = 0;
  const updatedLoans = player.loans.map(loan => {
    if (loan.isPaid) return loan;
    const step = amortizeOneMonth(loan.remainingBalance, loan.monthlyPayment, loan.interestRate);
    totalLoanPayment += step.actualPayment;
    return {
      ...loan,
      remainingBalance: step.newBalance,
      isPaid: step.isPaidOff,
    };
  });

  const volChange = (rng() - 0.5) * 2 * diff.marketVolatility;
  const finalProperties = player.properties.map(p => ({
    ...p,
    currentValue: Math.max(PROPERTY_VALUE_FLOOR, p.currentValue * (1 + volChange * PROPERTY_VALUE_VOL_FACTOR)),
  }));

  const newPriceIndex = clamp(market.priceIndex * (1 + volChange * 0.1), PRICE_INDEX_BOUNDS);
  const newRentalIndex = clamp(market.rentalIndex * (1 + volChange * 0.05), RENTAL_INDEX_BOUNDS);
  const newInterestRate = clamp(market.interestRate + (rng() - 0.5) * 0.5, INTEREST_RATE_BOUNDS);

  let scenarioId: string | null = null;
  if (player.turnCount > 0 && player.turnCount % diff.eventFrequency === 0 && rng() <= SCENARIO_TRIGGER_PROBABILITY) {
    scenarioId = scenarios[Math.floor(rng() * scenarios.length)]?.id ?? null;
  }

  const career = careers.find(c => c.id === player.careerId) || careers[0];
  const newSalary = nextMonth === 1
    ? Math.round(player.salary * (1 + career.growthRate * (0.5 + rng())))
    : player.salary;

  const newCash = player.cash + takeHomePay + rentalIncome - totalLoanPayment;
  const basePlayer: Player = {
    ...player,
    age: nextAge,
    salary: newSalary,
    cash: newCash,
    cpfOrdinary: [player.cpfOrdinary, cpfContribution * CPF_OA_PORTION].reduce((sum, value) => sum + value, 0),
    properties: finalProperties,
    loans: updatedLoans,
    year: nextYear,
    month: nextMonth,
    turnCount: player.turnCount + 1,
    totalRentalIncome: player.totalRentalIncome + rentalIncome,
  };
  const monthlyDebt = updatedLoans.filter(l => !l.isPaid).reduce((sum, l) => sum + l.monthlyPayment, 0);
  const isInsolvent = basePlayer.cash < 0 && takeHomePay + rentalIncome < monthlyDebt;
  const bankruptcyStrikes = isInsolvent ? player.bankruptcyStrikes + 1 : 0;
  const totalNetWorth = selectNetWorth({ ...basePlayer, bankruptcyStrikes });
  const finalPlayer = { ...basePlayer, bankruptcyStrikes, totalNetWorth };
  const won = finalPlayer.totalNetWorth >= diff.targetNetWorth;
  const lost = bankruptcyStrikes >= INSOLVENCY_STRIKES_LIMIT;

  return {
    player: finalPlayer,
    market: {
      ...market,
      priceIndex: newPriceIndex,
      rentalIndex: newRentalIndex,
      interestRate: newInterestRate,
      volatility: diff.marketVolatility,
      lastEvent: volChange > 0.05 ? 'boom' : volChange < -0.05 ? 'crash' : 'stable',
    },
    scenarioId,
    gameOver: won || lost,
    outcome: won ? 'won' : lost ? 'lost' : 'ongoing',
  };
}
