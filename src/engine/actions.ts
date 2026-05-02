import { properties } from '@/data/properties';
import type { Loan, OwnedProperty, Player } from '@/game/types';
import { difficultySettings, MAX_CREDIT_SCORE, MIN_CREDIT_SCORE } from '@/game/types';
import type { ActionResult } from './results';
import { fail, ok } from './results';
import {
  CREDIT_SCORE_FLOOR,
  DEFAULT_MORTGAGE_TERM_YEARS,
  TDSR_LIMIT,
  CREDIT_DELTA_LOAN_TAKEN,
  CREDIT_DELTA_LOAN_PAYMENT,
  CREDIT_DELTA_LOAN_PAID_OFF,
  AGENT_COMMISSION_RATE,
  SSD_RATES,
} from './constants';
import { calcMonthlyPayment, calcTDSR } from './finance';
import { selectMonthlyExpenses } from './selectors';
import type { Rng } from './rng';
import type { ScenarioOption } from '@/data/scenarios';
import { formatPercent, roundMoney } from '@/lib/format';
import { validatePurchase } from './purchase';

export interface ScenarioResolution {
  cashDelta: number;
  creditDelta: number;
  propertyValueImpactPct: number;
  interestRateDelta: number;
  followUpText: string;
  success: boolean;
}

export function resolveScenarioOption(option: ScenarioOption, rng: Rng): ScenarioResolution {
  const success = rng.next() <= option.probability;
  if (success) {
    return {
      cashDelta: option.cashImpact,
      creditDelta: option.creditImpact,
      propertyValueImpactPct: option.propertyValueImpact,
      interestRateDelta: option.interestRateImpact ?? 0,
      followUpText: option.followUpText,
      success: true,
    };
  }
  return {
    cashDelta: Math.round(option.cashImpact * 0.5),
    creditDelta: -10,
    propertyValueImpactPct: Math.round(option.propertyValueImpact * 0.5),
    interestRateDelta: Math.round((option.interestRateImpact ?? 0) * 50) / 100,
    followUpText: 'Things did not go as planned. The outcome was worse than expected.',
    success: false,
  };
}

export function buyPropertyPure(
  player: Player,
  propertyId: string,
  downPayment: number,
  cpfOrdinaryUsed = 0,
  loanInterestRate = difficultySettings[player.difficulty].loanInterest,
): ActionResult<{ player: Player }> {
  const property = properties.find(p => p.id === propertyId);
  if (!property) return fail('property_not_found', 'Property not found.');
  const validation = validatePurchase(player, property, downPayment, cpfOrdinaryUsed, loanInterestRate);
  if (!validation.canBuy) {
    const primaryReason = validation.reasons[0];
    return fail(primaryReason.code, primaryReason.message);
  }

  const loanAmount = validation.mortgageAmount;
  const loanId = `loan_t${player.turnCount}_${player.loans.length}`;
  const owned: OwnedProperty = {
    propertyId: property.id,
    purchasePrice: property.price,
    purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
    currentValue: property.price,
    isRented: false,
    monthlyRental: Math.round(property.price * property.rentalYield / 100 / 12),
    renovationLevel: 0,
    loanId: loanAmount > 0 ? loanId : undefined,
  };

  const newLoan: Loan | null = loanAmount > 0
    ? {
        id: loanId,
        type: 'mortgage',
        principal: loanAmount,
        remainingBalance: loanAmount,
        monthlyPayment: validation.monthlyPayment,
        interestRate: loanInterestRate,
        termYears: DEFAULT_MORTGAGE_TERM_YEARS,
        startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
        propertyId: property.id,
        isPaid: false,
      }
    : null;

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash - validation.cashRequired),
      cpfOrdinary: roundMoney(player.cpfOrdinary - validation.cpfOrdinaryUsed),
      properties: [...player.properties, owned],
      loans: newLoan ? [...player.loans, newLoan] : player.loans,
    },
  });
}

export function sellPropertyPure(player: Player, propertyIndex: number): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = player.properties[propertyIndex];
  const saleValue = Math.round(property.currentValue);
  const agentCommission = roundMoney(saleValue * AGENT_COMMISSION_RATE);
  const sellerStampDuty = calculateSellerStampDuty(property.purchaseDate, player.year, player.month, saleValue);
  const sellingCosts = agentCommission + sellerStampDuty;
  const profit = saleValue - property.purchasePrice - sellingCosts;

  let outstandingLoan = 0;
  const updatedLoans = property.loanId
    ? player.loans.map(l => {
        if (l.id === property.loanId) {
          outstandingLoan = l.remainingBalance;
          return { ...l, isPaid: true, remainingBalance: 0 };
        }
        return l;
      })
    : player.loans;

  const netProceeds = saleValue - outstandingLoan - sellingCosts;
  const newProperties = player.properties.filter((_, i) => i !== propertyIndex);

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash + netProceeds),
      properties: newProperties,
      loans: updatedLoans,
      totalPropertySalesProfit: player.totalPropertySalesProfit + profit,
    },
  });
}

export function calculateSellerStampDuty(purchaseDate: string, currentYear: number, currentMonth: number, saleValue: number): number {
  const [purchaseYearRaw, purchaseMonthRaw] = purchaseDate.split('-').map(Number);
  if (!purchaseYearRaw || !purchaseMonthRaw) return 0;
  const monthsHeld = (currentYear - purchaseYearRaw) * 12 + (currentMonth - purchaseMonthRaw);
  const rate = SSD_RATES.find(tier => monthsHeld >= 0 && monthsHeld < tier.maxMonthsHeld)?.rate ?? 0;
  return roundMoney(saleValue * rate);
}

export function applyLoanPure(
  player: Player,
  amount: number,
  interestRate: number,
  termYears: number,
  type: 'mortgage' | 'renovation' | 'personal',
  propertyId?: string,
): ActionResult<{ player: Player }> {
  const roundedAmount = roundMoney(amount);
  if (roundedAmount <= 0 || termYears <= 0) {
    return fail('invalid_amount', 'Loan amount and term must be positive.');
  }
  if (player.creditScore < CREDIT_SCORE_FLOOR) {
    return fail('credit_too_low', `Credit score ${player.creditScore} below minimum ${CREDIT_SCORE_FLOOR}.`);
  }

  const monthlyPayment = calcMonthlyPayment(roundedAmount, interestRate, termYears);
  const existingPayments = selectMonthlyExpenses(player);
  const tdsr = calcTDSR(existingPayments, monthlyPayment, player.salary);
  if (tdsr > TDSR_LIMIT) {
    return fail('tdsr_exceeded', `TDSR would be ${formatPercent(tdsr * 100, 1)}, exceeds ${formatPercent(TDSR_LIMIT * 100)} cap.`);
  }

  const loan: Loan = {
    id: `loan_t${player.turnCount}_${player.loans.length}`,
    type,
    principal: roundedAmount,
    remainingBalance: roundedAmount,
    interestRate,
    monthlyPayment,
    termYears,
    startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
    propertyId,
    isPaid: false,
  };

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash + roundedAmount),
      loans: [...player.loans, loan],
      creditScore: Math.max(MIN_CREDIT_SCORE, player.creditScore + CREDIT_DELTA_LOAN_TAKEN),
    },
  });
}

export function payLoanPure(player: Player, loanId: string, amount: number): ActionResult<{ player: Player }> {
  const loan = player.loans.find(l => l.id === loanId);
  if (!loan) return fail('loan_not_found', 'Loan not found.');
  if (loan.isPaid) return fail('loan_already_paid', 'Loan is already paid off.');
  if (amount <= 0) return fail('invalid_amount', 'Payment must be positive.');

  const actualPayment = roundMoney(Math.min(amount, loan.remainingBalance));
  if (player.cash < actualPayment) {
    return fail('insufficient_cash', 'Not enough cash.');
  }

  const newBalance = roundMoney(Math.max(0, loan.remainingBalance - actualPayment));
  const isPaid = newBalance <= 0;

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash - actualPayment),
      loans: player.loans.map(l =>
        l.id === loanId ? { ...l, remainingBalance: newBalance, isPaid } : l
      ),
      creditScore: Math.min(MAX_CREDIT_SCORE, player.creditScore + (isPaid ? CREDIT_DELTA_LOAN_PAID_OFF : CREDIT_DELTA_LOAN_PAYMENT)),
    },
  });
}

export function renovatePropertyPure(player: Player, propertyIndex: number, cost: number): ActionResult<{ player: Player }> {
  if (cost <= 0) return fail('invalid_amount', 'Renovation cost must be positive.');
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) return fail('invalid_index', 'Invalid property index.');
  if (player.cash < cost) return fail('insufficient_cash', 'Not enough cash.');

  const updatedProperties = [...player.properties];
  updatedProperties[propertyIndex] = {
    ...updatedProperties[propertyIndex],
    renovationLevel: updatedProperties[propertyIndex].renovationLevel + 1,
    currentValue: roundMoney(updatedProperties[propertyIndex].currentValue + cost * 1.5),
    monthlyRental: Math.round(updatedProperties[propertyIndex].monthlyRental * 1.15),
  };

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash - cost),
      properties: updatedProperties,
    },
  });
}
