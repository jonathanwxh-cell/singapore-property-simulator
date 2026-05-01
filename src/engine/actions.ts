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
} from './constants';
import { calcMonthlyPayment, calcTDSR } from './finance';
import { selectMonthlyExpenses } from './selectors';
import type { Rng } from './rng';
import type { ScenarioOption } from '@/data/scenarios';
import { calculateTotalStampDuty } from './stampDuty';
import { maxBorrowable, checkMsr } from './ltv';
import { formatCurrency, formatPercent, roundMoney } from '@/lib/format';

export interface ScenarioResolution {
  cashDelta: number;
  creditDelta: number;
  propertyValueImpactPct: number;
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
      followUpText: option.followUpText,
      success: true,
    };
  }
  return {
    cashDelta: Math.round(option.cashImpact * 0.5),
    creditDelta: -10,
    propertyValueImpactPct: Math.round(option.propertyValueImpact * 0.5),
    followUpText: 'Things did not go as planned. The outcome was worse than expected.',
    success: false,
  };
}

export function buyPropertyPure(player: Player, propertyId: string, downPayment: number): ActionResult<{ player: Player }> {
  const property = properties.find(p => p.id === propertyId);
  if (!property) return fail('property_not_found', 'Property not found.');
  if (player.properties.some(p => p.propertyId === propertyId)) {
    return fail('already_owned', 'You already own this property.');
  }
  if (downPayment <= 0 || downPayment > property.price) {
    return fail('invalid_amount', 'Down payment must be between 1 and the property price.');
  }

  const roundedDownPayment = roundMoney(downPayment);
  const propertyCount = player.properties.length;
  const stampDuty = roundMoney(calculateTotalStampDuty(property.price, propertyCount));
  const totalUpfront = roundMoney(roundedDownPayment + stampDuty);

  if (player.cash < totalUpfront) {
    const shortfall = Math.max(0, roundMoney(totalUpfront - player.cash));
    return fail('insufficient_cash', `Not enough cash for upfront costs. You need ${formatCurrency(shortfall)} more.`);
  }

  const housingLoans = player.loans.filter(l => l.type === 'mortgage' && !l.isPaid).length;
  const maxLoan = maxBorrowable(property.price, housingLoans);
  const loanAmount = roundMoney(property.price - roundedDownPayment);

  if (loanAmount > maxLoan) {
    return fail('ltv_exceeded', `Loan of ${formatCurrency(loanAmount)} exceeds LTV cap of ${formatCurrency(maxLoan)}. Need higher down payment.`);
  }

  const diff = difficultySettings[player.difficulty];
  const monthlyPayment = calcMonthlyPayment(loanAmount, diff.loanInterest, DEFAULT_MORTGAGE_TERM_YEARS);

  if (loanAmount > 0) {
    const tdsr = calcTDSR(selectMonthlyExpenses(player), monthlyPayment, player.salary);
    if (tdsr > TDSR_LIMIT) {
      return fail('tdsr_exceeded', `TDSR would be ${formatPercent(tdsr * 100, 1)}, exceeds ${formatPercent(TDSR_LIMIT * 100)} cap.`);
    }
    if (player.creditScore < CREDIT_SCORE_FLOOR) {
      return fail('credit_too_low', `Credit score ${player.creditScore} below minimum ${CREDIT_SCORE_FLOOR}.`);
    }
  }

  if (loanAmount > 0 && property.isHdb) {
    const msr = checkMsr(player.salary, monthlyPayment, true);
    if (!msr.passes) {
      return fail('msr_exceeded', `MSR would exceed 30% for HDB/EC purchase. Max monthly payment: ${formatCurrency(msr.maxMonthlyPayment)}. Reduce loan amount or extend term.`);
    }
  }

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
        interestRate: diff.loanInterest,
        monthlyPayment,
        termYears: DEFAULT_MORTGAGE_TERM_YEARS,
        startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
        propertyId: property.id,
        isPaid: false,
      }
    : null;

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash - totalUpfront),
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
  const profit = saleValue - property.purchasePrice;

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

  const netProceeds = saleValue - outstandingLoan;
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
