import type { Player, MarketState, GameSettings } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { careers } from '@/data/careers';
import type { Rng } from './rng';
import { rngPick } from './rng';
import { amortizeOneMonth } from './finance';
import { resolveAnnualCareerReview, shouldOfferJobSwitch, shouldRunAnnualCareerReview } from './careerProgression';
import { generateMarketNews } from './marketNews';
import { resolveMonthlyCareerIncome } from './income';
import { selectNetWorth, selectMonthlyRentalIncome } from './selectors';
import { advancePortfolioMonth } from './portfolio';
import { resolveLifeMonth } from './life';
import { getRouteWeightedScenarios } from './scenarioContext';
import {
  TAKE_HOME_RATIO,
  PROPERTY_VALUE_INDEX_SENSITIVITY,
  PROPERTY_VALUE_FLOOR,
  PRICE_INDEX_BOUNDS,
  RENTAL_INDEX_BOUNDS,
  INTEREST_RATE_BOUNDS,
  INSOLVENCY_STRIKES_LIMIT,
  SCENARIO_TRIGGER_PROBABILITY,
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

  const career = careers.find(c => c.id === player.careerId) || careers[0];
  const careerIncome = resolveMonthlyCareerIncome(player, career, rng);

  // CPF - real age-based allocation + interest
  const cpfBalances = { oa: player.cpfOrdinary, sa: player.cpfSpecial, ma: player.cpfMedisave };
  const afterContribution = contributeCpf(cpfBalances, careerIncome.grossIncome, player.age);
  const afterInterest = applyCpfInterest(afterContribution);

  const cpfEmployee = careerIncome.grossIncome * (1 - TAKE_HOME_RATIO);
  const takeHomePay = careerIncome.grossIncome - cpfEmployee;

  // Rental income
  const rentalIncome = selectMonthlyRentalIncome(player);
  const portfolioStep = advancePortfolioMonth(player);

  // Career and life-state resolution
  let lifeResolution = resolveLifeMonth(player, career, rng);
  if (careerIncome.note && lifeResolution.nextLife.lastMonthSummary) {
    const summary = lifeResolution.nextLife.lastMonthSummary;
    lifeResolution = {
      ...lifeResolution,
      nextLife: {
        ...lifeResolution.nextLife,
        lastMonthSummary: {
          ...summary,
          notes: [careerIncome.note, ...summary.notes],
        },
      },
    };
  }

  // Loan amortization
  let totalLoanPayment = 0;
  const updatedLoans = player.loans.map((loan) => {
    if (loan.isPaid) return loan;
    const step = amortizeOneMonth(loan.remainingBalance, loan.monthlyPayment, loan.interestRate);
    totalLoanPayment += step.actualPayment;
    return { ...loan, remainingBalance: step.newBalance, isPaid: step.isPaidOff };
  });

  // Career review and salary growth
  let newSalary = player.salary;
  const newTurnCount = player.turnCount + 1;
  let reviewBonusCash = 0;
  let reviewSalaryDelta = 0;
  let reviewVolatilityModifier = player.careerVolatilityModifier;
  let lastCareerReviewTurn = player.lastCareerReviewTurn;
  let careerProgressionProfile = player.careerProgressionProfile;
  let careerReviewHistory = player.careerReviewHistory;
  const totalOwnershipCosts = portfolioStep.monthlyCosts.maintenance + portfolioStep.monthlyCosts.propertyTax;

  if (newMonth === 1 && shouldRunAnnualCareerReview(newTurnCount)) {
    const momentumMultiplier = 1 + lifeResolution.nextLife.careerMomentum / 400;
    const review = resolveAnnualCareerReview({
      rng,
      salary: player.salary,
      careerGrowthRate: career.growthRate * momentumMultiplier,
      careerRiskFactor: career.riskFactor,
      careerGrowthModifier: player.careerGrowthModifier,
      careerRiskModifier: player.careerRiskModifier,
      careerVolatilityModifier: player.careerVolatilityModifier,
      positiveCashflow:
        takeHomePay +
        rentalIncome +
        lifeResolution.cashDelta -
        totalLoanPayment -
        totalOwnershipCosts -
        lifeResolution.householdCost >= 0,
      underStress: player.cash < 0 || (player.bankruptcyStrikes ?? 0) > 0,
    });
    newSalary = Math.max(1000, Math.round(player.salary * (1 + review.salaryDeltaPct)));
    reviewBonusCash = review.bonusCash;
    reviewSalaryDelta = newSalary - player.salary;
    reviewVolatilityModifier = round2(player.careerVolatilityModifier + review.volatilityDelta);
    lastCareerReviewTurn = newTurnCount;
    careerProgressionProfile = {
      reviewCount: player.careerProgressionProfile.reviewCount + 1,
      lastOutcome: review.outcome,
      lastSalaryDelta: reviewSalaryDelta,
      lastBonus: review.bonusCash,
    };
    careerReviewHistory = [
      ...player.careerReviewHistory,
      {
        turn: newTurnCount,
        outcome: review.outcome,
        salaryDelta: reviewSalaryDelta,
        bonus: review.bonusCash,
      },
    ];
  }

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
  const forkAdjustedProperties = applyOwnershipForkPropertyEffects(portfolioStep.updatedProperties, lifeResolution.propertyEffects);
  const finalProperties = forkAdjustedProperties.map((property) => ({
    ...property,
    currentValue: Math.max(
      PROPERTY_VALUE_FLOOR,
      Math.round(property.currentValue * (1 + (marketPulse.priceChangePct / 100) * PROPERTY_VALUE_INDEX_SENSITIVITY)),
    ),
  }));

  // Cashflow
  const netCashChange =
    takeHomePay +
    rentalIncome +
    lifeResolution.cashDelta -
    totalLoanPayment -
    totalOwnershipCosts -
    lifeResolution.householdCost;
  const newCash = player.cash + netCashChange + reviewBonusCash;

  // Scenarios - priority order: first-home ladder, job switch choice, annual review visibility, then regular cadence
  let scenarioId: string | null = null;
  const jobSwitchDue = shouldOfferJobSwitch(newTurnCount, player.nextJobSwitchTurn);
  if (player.properties.length === 0 && newTurnCount === STARTER_SCENARIO_TURN) {
    scenarioId = 'first-home-window';
  } else if (jobSwitchDue) {
    scenarioId = 'job-switch-opportunity';
  } else if (shouldRunAnnualCareerReview(newTurnCount)) {
    scenarioId = 'career-review';
  } else if (player.turnCount > 0 && newTurnCount % diff.eventFrequency === 0 && rng.next() < SCENARIO_TRIGGER_PROBABILITY) {
    const regularScenarios = getRouteWeightedScenarios(player).filter(
      (scenario) => !['first-home-window', 'job-switch-opportunity', 'career-review'].includes(scenario.id),
    );
    if (regularScenarios.length > 0) {
      scenarioId = rngPick(rng, regularScenarios).id;
    }
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
    life: lifeResolution.nextLife,
    totalRentalIncome: player.totalRentalIncome + rentalIncome,
    totalNetWorth: 0,
    bankruptcyStrikes: player.bankruptcyStrikes ?? 0,
    careerGrowthModifier: player.careerGrowthModifier,
    careerRiskModifier: player.careerRiskModifier,
    careerVolatilityModifier: reviewVolatilityModifier,
    lastCareerReviewTurn: lastCareerReviewTurn,
    nextJobSwitchTurn: scenarioId === 'job-switch-opportunity' ? newTurnCount + 24 : player.nextJobSwitchTurn,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    careerProgressionProfile,
    careerReviewHistory,
    reserve: player.reserve,
    operationHistory: portfolioStep.operationHistory,
  };
  newPlayer.totalNetWorth = selectNetWorth(newPlayer);

  // Game-over detection — measure insolvency against the same cashflow used above
  // (loans + ownership costs + household). Earlier versions only compared loans
  // against take-home, so a player crushed by maintenance + property tax + life
  // costs would not register as insolvent until the loan alone exceeded income.
  const monthlyTakeHome = newSalary * TAKE_HOME_RATIO + rentalIncome + lifeResolution.cashDelta;
  const monthlyLoanPayments = updatedLoans.filter((loan) => !loan.isPaid).reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const monthlyObligations = monthlyLoanPayments + totalOwnershipCosts + lifeResolution.householdCost;
  const isInsolvent = newPlayer.cash < 0 && monthlyTakeHome < monthlyObligations;
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

function applyOwnershipForkPropertyEffects<
  T extends Pick<NonNullable<Player['properties']>[number], 'propertyId' | 'currentValue' | 'conditionScore' | 'tenant'>
>(properties: T[], effects: { propertyId: string; conditionDelta?: number; valueDeltaPct?: number; tenantSatisfactionDelta?: number }[]): T[] {
  if (effects.length === 0) return properties;

  return properties.map((property) => {
    const matchingEffects = effects.filter((effect) => effect.propertyId === property.propertyId);
    if (matchingEffects.length === 0) return property;

    const totalConditionDelta = matchingEffects.reduce((sum, effect) => sum + (effect.conditionDelta ?? 0), 0);
    const totalValuePctDelta = matchingEffects.reduce((sum, effect) => sum + (effect.valueDeltaPct ?? 0), 0);
    const totalTenantSatisfactionDelta = matchingEffects.reduce((sum, effect) => sum + (effect.tenantSatisfactionDelta ?? 0), 0);

    return {
      ...property,
      currentValue: Math.max(
        PROPERTY_VALUE_FLOOR,
        Math.round(property.currentValue * (1 + totalValuePctDelta / 100)),
      ),
      conditionScore: property.conditionScore === undefined
        ? property.conditionScore
        : clamp(property.conditionScore + totalConditionDelta, 0, 100),
      tenant: property.tenant
        ? {
            ...property.tenant,
            satisfaction: clamp(property.tenant.satisfaction + totalTenantSatisfactionDelta, 0, 100),
          }
        : property.tenant,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
