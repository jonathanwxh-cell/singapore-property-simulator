import type { Player, MarketState, GameSettings } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { careers } from '@/data/careers';
import { scenarios } from '@/data/scenarios';
import type { Rng } from './rng';
import { rngPick } from './rng';
import { amortizeOneMonth } from './finance';
import { selectNetWorth, selectMonthlyRentalIncome } from './selectors';
import {
  TAKE_HOME_RATIO,
  CPF_TOTAL_CONTRIB_RATIO,
  CPF_OA_PORTION,
  PROPERTY_VALUE_VOL_FACTOR,
  PROPERTY_VALUE_FLOOR,
  PRICE_INDEX_BOUNDS,
  RENTAL_INDEX_BOUNDS,
  INTEREST_RATE_BOUNDS,
  INSOLVENCY_STRIKES_LIMIT,
  SCENARIO_TRIGGER_PROBABILITY,
} from './constants';

export interface AdvanceTurnInput {
  player: Player;
  market: MarketState;
  settings: GameSettings;
  rng: Rng;
}

export interface AdvanceTurnOutput {
  player: Player;
  market: MarketState;
  scenarioId: string | null;
  gameOver: boolean;
  outcome: 'won' | 'lost' | 'ongoing';
}

export function advanceTurn(input: AdvanceTurnInput): AdvanceTurnOutput {
  const { rng } = input;
  const player = input.player;
  const market = input.market;
  const diff = difficultySettings[player.difficulty];

  // Advance time
  let newMonth = player.month + 1;
  let newYear = player.year;
  let newAge = player.age;
  if (newMonth > 12) {
    newMonth = 1;
    newYear++;
    newAge++;
  }

  // CPF
  const cpfContribution = player.salary * CPF_TOTAL_CONTRIB_RATIO;
  const cpfEmployee = player.salary * (1 - TAKE_HOME_RATIO);
  const takeHomePay = player.salary - cpfEmployee;

  // Rental income
  const rentalIncome = selectMonthlyRentalIncome(player);

  // Loan amortization
  let totalLoanPayment = 0;
  const updatedLoans = player.loans.map(loan => {
    if (loan.isPaid) return loan;
    const step = amortizeOneMonth(loan.remainingBalance, loan.monthlyPayment, loan.interestRate);
    totalLoanPayment += step.actualPayment;
    return { ...loan, remainingBalance: step.newBalance, isPaid: step.isPaidOff };
  });

  // Salary growth (annual)
  const career = careers.find(c => c.id === player.careerId) || careers[0];
  let newSalary = player.salary;
  if (newMonth === 1) {
    newSalary = Math.round(player.salary * (1 + career.growthRate * (0.5 + rng.next())));
  }

  // Market dynamics
  const volChange = (rng.next() - 0.5) * 2 * diff.marketVolatility;
  const newPriceIndex = Math.max(PRICE_INDEX_BOUNDS.min, Math.min(PRICE_INDEX_BOUNDS.max, market.priceIndex * (1 + volChange * 0.1)));
  const newRentalIndex = Math.max(RENTAL_INDEX_BOUNDS.min, Math.min(RENTAL_INDEX_BOUNDS.max, market.rentalIndex * (1 + volChange * 0.05)));
  const newInterestRate = Math.max(INTEREST_RATE_BOUNDS.min, Math.min(INTEREST_RATE_BOUNDS.max, market.interestRate + (rng.next() - 0.5) * 0.5));

  // Property values — single volChange multiplier, no priceIndex drift
  const finalProperties = player.properties.map(p => ({
    ...p,
    currentValue: Math.max(PROPERTY_VALUE_FLOOR, Math.round(p.currentValue * (1 + volChange * PROPERTY_VALUE_VOL_FACTOR))),
  }));

  // Cashflow
  const netCashChange = takeHomePay + rentalIncome - totalLoanPayment;
  const newCash = player.cash + netCashChange;
  const newCpfOrdinary = player.cpfOrdinary + cpfContribution * CPF_OA_PORTION;

  // Scenarios — skip on turn 0
  let scenarioId: string | null = null;
  const newTurnCount = player.turnCount + 1;
  if (newTurnCount > 0 && newTurnCount % diff.eventFrequency === 0 && rng.next() < SCENARIO_TRIGGER_PROBABILITY) {
    scenarioId = rngPick(rng, scenarios).id;
  }

  const newPlayer: Player = {
    ...player,
    age: newAge,
    salary: newSalary,
    cash: newCash,
    cpfOrdinary: newCpfOrdinary,
    properties: finalProperties,
    loans: updatedLoans,
    year: newYear,
    month: newMonth,
    turnCount: newTurnCount,
    totalRentalIncome: player.totalRentalIncome + rentalIncome,
    totalNetWorth: 0, // computed below
    bankruptcyStrikes: player.bankruptcyStrikes ?? 0,
  };
  newPlayer.totalNetWorth = selectNetWorth(newPlayer);

  // Game-over detection
  const monthlyTakeHome = newSalary * TAKE_HOME_RATIO + rentalIncome;
  const monthlyDebt = updatedLoans.filter(l => !l.isPaid).reduce((s, l) => s + l.monthlyPayment, 0);
  const isInsolvent = newPlayer.cash < 0 && monthlyTakeHome < monthlyDebt;
  const newStrikes = isInsolvent ? (player.bankruptcyStrikes ?? 0) + 1 : 0;
  newPlayer.bankruptcyStrikes = newStrikes;

  const won = newPlayer.totalNetWorth >= diff.targetNetWorth;
  const lost = newStrikes >= INSOLVENCY_STRIKES_LIMIT;
  const gameOver = won || lost;
  const outcome: AdvanceTurnOutput['outcome'] = won ? 'won' : lost ? 'lost' : 'ongoing';

  const newMarket: MarketState = {
    interestRate: newInterestRate,
    priceIndex: newPriceIndex,
    rentalIndex: newRentalIndex,
    volatility: diff.marketVolatility,
    lastEvent: volChange > 0.05 ? 'boom' : volChange < -0.05 ? 'crash' : 'stable',
  };

  return { player: newPlayer, market: newMarket, scenarioId, gameOver, outcome };
}
