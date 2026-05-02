import type { Player, MarketState, GameSettings } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { careers } from '@/data/careers';
import { scenarios } from '@/data/scenarios';
import type { Rng } from './rng';
import { rngPick } from './rng';
import { amortizeOneMonth } from './finance';
import { generateMarketNews } from './marketNews';
import { selectNetWorth, selectMonthlyRentalIncome } from './selectors';
import {
  TAKE_HOME_RATIO,
  PROPERTY_VALUE_VOL_FACTOR,
  PROPERTY_VALUE_FLOOR,
  PRICE_INDEX_BOUNDS,
  RENTAL_INDEX_BOUNDS,
  INTEREST_RATE_BOUNDS,
  INSOLVENCY_STRIKES_LIMIT,
  MARKET_NEWS_FEED_LIMIT,
  STARTER_SCENARIO_TURN,
} from './constants';
import { contributeCpf, applyCpfInterest } from './cpf';

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

  // CPF - real age-based allocation + interest
  const cpfBalances = { oa: player.cpfOrdinary, sa: player.cpfSpecial, ma: player.cpfMedisave };
  const afterContribution = contributeCpf(cpfBalances, player.salary, player.age);
  const afterInterest = applyCpfInterest(afterContribution);

  const cpfEmployee = player.salary * (1 - TAKE_HOME_RATIO);
  const takeHomePay = player.salary - cpfEmployee;

  // Rental income
  const rentalIncome = selectMonthlyRentalIncome(player);

  // Loan amortization
  let totalLoanPayment = 0;
  const updatedLoans = player.loans.map((loan) => {
    if (loan.isPaid) return loan;
    const step = amortizeOneMonth(loan.remainingBalance, loan.monthlyPayment, loan.interestRate);
    totalLoanPayment += step.actualPayment;
    return { ...loan, remainingBalance: step.newBalance, isPaid: step.isPaidOff };
  });

  // Salary growth (annual)
  const career = careers.find((candidate) => candidate.id === player.careerId) || careers[0];
  let newSalary = player.salary;
  if (newMonth === 1) {
    newSalary = Math.round(player.salary * (1 + career.growthRate * (0.5 + rng.next())));
  }

  const newTurnCount = player.turnCount + 1;

  // Market dynamics with actual monthly moves and explanatory headlines
  const marketPulse = generateMarketNews({
    rng,
    turn: newTurnCount,
    month: newMonth,
    year: newYear,
    volatility: diff.marketVolatility,
  });
  const newPriceIndex = Math.max(
    PRICE_INDEX_BOUNDS.min,
    Math.min(PRICE_INDEX_BOUNDS.max, market.priceIndex * (1 + marketPulse.priceChangePct / 100)),
  );
  const newRentalIndex = Math.max(
    RENTAL_INDEX_BOUNDS.min,
    Math.min(RENTAL_INDEX_BOUNDS.max, market.rentalIndex * (1 + marketPulse.rentalChangePct / 100)),
  );
  const newInterestRate = Math.max(
    INTEREST_RATE_BOUNDS.min,
    Math.min(INTEREST_RATE_BOUNDS.max, market.interestRate + marketPulse.rateChangePct),
  );

  // Property values follow the same broader market pulse, but with dampened sensitivity
  const finalProperties = player.properties.map((property) => ({
    ...property,
    currentValue: Math.max(
      PROPERTY_VALUE_FLOOR,
      Math.round(property.currentValue * (1 + (marketPulse.priceChangePct / 100) * PROPERTY_VALUE_VOL_FACTOR * 10)),
    ),
  }));

  // Cashflow
  const netCashChange = takeHomePay + rentalIncome - totalLoanPayment;
  const newCash = player.cash + netCashChange;

  // Scenarios - guarantee an early decision and then fire on cadence instead of chance
  let scenarioId: string | null = null;
  if (player.properties.length === 0 && newTurnCount === STARTER_SCENARIO_TURN) {
    scenarioId = 'first-home-window';
  } else if (player.turnCount > 0 && newTurnCount % diff.eventFrequency === 0) {
    scenarioId = rngPick(rng, scenarios.filter((scenario) => scenario.id !== 'first-home-window')).id;
  }

  const newPlayer: Player = {
    ...player,
    age: newAge,
    salary: newSalary,
    cash: newCash,
    cpfOrdinary: round2(afterInterest.oa),
    cpfSpecial: round2(afterInterest.sa),
    cpfMedisave: round2(afterInterest.ma),
    properties: finalProperties,
    loans: updatedLoans,
    year: newYear,
    month: newMonth,
    turnCount: newTurnCount,
    totalRentalIncome: player.totalRentalIncome + rentalIncome,
    totalNetWorth: 0,
    bankruptcyStrikes: player.bankruptcyStrikes ?? 0,
  };
  newPlayer.totalNetWorth = selectNetWorth(newPlayer);

  // Game-over detection
  const monthlyTakeHome = newSalary * TAKE_HOME_RATIO + rentalIncome;
  const monthlyDebt = updatedLoans.filter((loan) => !loan.isPaid).reduce((sum, loan) => sum + loan.monthlyPayment, 0);
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
    lastEvent: marketPulse.lastEvent,
    monthlyPriceChangePct: marketPulse.priceChangePct,
    monthlyRentalChangePct: marketPulse.rentalChangePct,
    monthlyInterestRateChangePct: marketPulse.rateChangePct,
    lastHeadline: marketPulse.newsItem.headline,
    lastSummary: marketPulse.newsItem.detail,
    newsFeed: [marketPulse.newsItem, ...(market.newsFeed ?? [])].slice(0, MARKET_NEWS_FEED_LIMIT),
  };

  return { player: newPlayer, market: newMarket, scenarioId, gameOver, outcome };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
