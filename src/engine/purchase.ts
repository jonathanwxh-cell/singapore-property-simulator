import type { Property } from '@/data/properties';
import type { Player } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { formatCurrency, formatPercent, roundMoney } from '@/lib/format';
import {
  CREDIT_SCORE_FLOOR,
  DEFAULT_MORTGAGE_TERM_YEARS,
  TDSR_LIMIT,
} from './constants';
import { calcMonthlyPayment, calcTDSR } from './finance';
import { getLtvCap, checkMsr, maxBorrowable } from './ltv';
import type { ActionFailReason } from './results';
import { selectMonthlyExpenses } from './selectors';
import { calculateABSD, calculateBSD } from './stampDuty';

export interface PurchaseValidationReason {
  code: ActionFailReason;
  message: string;
}

export interface PurchaseValidation {
  canBuy: boolean;
  reasons: PurchaseValidationReason[];
  downPayment: number;
  cpfOrdinaryUsed: number;
  bsd: number;
  absd: number;
  totalUpfront: number;
  cashRequired: number;
  shortfall: number;
  mortgageAmount: number;
  monthlyPayment: number;
  maxLoan: number;
  ltvCap: number;
  ltvAllowed: boolean;
  tdsrRatio: number;
  tdsrAllowed: boolean;
  msrAllowed: boolean;
  maxMsrPayment: number | null;
  creditAllowed: boolean;
  isOwned: boolean;
  activeHousingLoans: number;
}

export function getDownPaymentAmount(price: number, downPaymentPercent: number): number {
  return roundMoney(price * (downPaymentPercent / 100));
}

export function validatePurchase(
  player: Player,
  property: Property,
  downPayment: number,
  cpfOrdinaryUsed = 0,
  loanInterestRate = difficultySettings[player.difficulty].loanInterest,
): PurchaseValidation {
  const roundedDownPayment = roundMoney(downPayment);
  const roundedCpfUsed = roundMoney(cpfOrdinaryUsed);
  const propertyCount = player.properties.length;
  const isOwned = player.properties.some((ownedProperty) => ownedProperty.propertyId === property.id);
  const bsd = roundMoney(calculateBSD(property.price));
  const absd = roundMoney(calculateABSD(property.price, propertyCount));
  const totalUpfront = roundMoney(roundedDownPayment + bsd + absd);
  const cashRequired = roundMoney(totalUpfront - roundedCpfUsed);
  const shortfall = Math.max(0, roundMoney(cashRequired - player.cash));
  const mortgageAmount = Math.max(0, roundMoney(property.price - roundedDownPayment));
  const activeHousingLoans = player.loans.filter((loan) => loan.type === 'mortgage' && !loan.isPaid).length;
  const ltvCap = getLtvCap(activeHousingLoans);
  const maxLoan = maxBorrowable(property.price, activeHousingLoans);
  const ltvAllowed = mortgageAmount <= maxLoan;
  const monthlyPayment = calcMonthlyPayment(mortgageAmount, loanInterestRate, DEFAULT_MORTGAGE_TERM_YEARS);
  const tdsrRatio = mortgageAmount > 0 ? calcTDSR(selectMonthlyExpenses(player), monthlyPayment, player.salary) : 0;
  const tdsrAllowed = mortgageAmount <= 0 || tdsrRatio <= TDSR_LIMIT;
  const creditAllowed = mortgageAmount <= 0 || player.creditScore >= CREDIT_SCORE_FLOOR;
  const msrCheck = mortgageAmount > 0 && property.isHdb
    ? checkMsr(player.salary, monthlyPayment, true)
    : { passes: true, maxMonthlyPayment: Infinity };
  const msrAllowed = msrCheck.passes;
  const maxMsrPayment = Number.isFinite(msrCheck.maxMonthlyPayment) ? msrCheck.maxMonthlyPayment : null;

  const reasons: PurchaseValidationReason[] = [];

  if (isOwned) {
    reasons.push({
      code: 'already_owned',
      message: 'You already own this property.',
    });
  }

  if (roundedDownPayment <= 0 || roundedDownPayment > property.price) {
    reasons.push({
      code: 'invalid_amount',
      message: 'Down payment must be between 1 and the property price.',
    });
  }

  if (roundedCpfUsed < 0) {
    reasons.push({
      code: 'invalid_amount',
      message: 'CPF OA amount cannot be negative.',
    });
  }

  if (roundedCpfUsed > roundedDownPayment) {
    reasons.push({
      code: 'cpf_exceeded',
      message: 'CPF OA usage cannot exceed the down payment.',
    });
  }

  if (roundedCpfUsed > player.cpfOrdinary) {
    reasons.push({
      code: 'cpf_exceeded',
      message: `CPF OA usage exceeds available balance of ${formatCurrency(player.cpfOrdinary)}.`,
    });
  }

  if (shortfall > 0) {
    reasons.push({
      code: 'insufficient_cash',
      message: `Not enough cash for upfront costs. You need ${formatCurrency(shortfall)} more.`,
    });
  }

  if (!ltvAllowed) {
    reasons.push({
      code: 'ltv_exceeded',
      message: `Loan of ${formatCurrency(mortgageAmount)} exceeds LTV cap of ${formatCurrency(maxLoan)}. Need higher down payment.`,
    });
  }

  if (!tdsrAllowed) {
    reasons.push({
      code: 'tdsr_exceeded',
      message: Number.isFinite(tdsrRatio)
        ? `TDSR would be ${formatPercent(tdsrRatio * 100, 1)}, exceeds ${formatPercent(TDSR_LIMIT * 100)} cap.`
        : 'TDSR cannot be calculated without monthly income.',
    });
  }

  if (!creditAllowed) {
    reasons.push({
      code: 'credit_too_low',
      message: `Credit score ${player.creditScore} below minimum ${CREDIT_SCORE_FLOOR}.`,
    });
  }

  if (!msrAllowed) {
    reasons.push({
      code: 'msr_exceeded',
      message: `MSR would exceed 30% for HDB/EC purchase. Max monthly payment: ${formatCurrency(msrCheck.maxMonthlyPayment)}. Reduce loan amount or extend term.`,
    });
  }

  return {
    canBuy: reasons.length === 0,
    reasons,
    downPayment: roundedDownPayment,
    cpfOrdinaryUsed: roundedCpfUsed,
    bsd,
    absd,
    totalUpfront,
    cashRequired,
    shortfall,
    mortgageAmount,
    monthlyPayment,
    maxLoan,
    ltvCap,
    ltvAllowed,
    tdsrRatio,
    tdsrAllowed,
    msrAllowed,
    maxMsrPayment,
    creditAllowed,
    isOwned,
    activeHousingLoans,
  };
}
