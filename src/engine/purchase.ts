import type { Property } from '@/data/properties';
import { getPropertyCategory } from '@/data/properties';
import { normalizeBuyerProfile, type MortgageFinancingMode, type Player } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { formatCurrency, formatPercent, roundMoney } from '@/lib/format';
import {
  CREDIT_SCORE_FLOOR,
  DEFAULT_MORTGAGE_TERM_YEARS,
  HDB_CONCESSIONARY_LOAN_INTEREST,
  HDB_CONCESSIONARY_LTV,
  HDB_RESALE_LEVY_ESTIMATE,
  TDSR_LIMIT,
} from './constants';
import { calcMonthlyPayment, calcTDSR } from './finance';
import { getLtvCap, checkMsr, maxBorrowable } from './ltv';
import type { ActionFailReason } from './results';
import { selectMonthlyExpenses } from './selectors';
import { calculateABSDForProfile, calculateABSDRateForProfile, calculateBSDForCategory } from './stampDuty';

export interface PurchaseValidationReason {
  code: ActionFailReason;
  message: string;
}

export interface PurchaseValidation {
  canBuy: boolean;
  reasons: PurchaseValidationReason[];
  downPayment: number;
  bsd: number;
  absd: number;
  absdRate: number;
  hdbResaleLevy: number;
  totalUpfront: number;
  shortfall: number;
  mortgageAmount: number;
  monthlyPayment: number;
  loanInterestRate: number;
  financingMode: MortgageFinancingMode;
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
  financingMode: MortgageFinancingMode = 'bank',
): PurchaseValidation {
  const roundedDownPayment = roundMoney(downPayment);
  const propertyCount = player.properties.length;
  const isOwned = player.properties.some((ownedProperty) => ownedProperty.propertyId === property.id);
  const buyerProfile = normalizeBuyerProfile(player.buyerProfile);
  const propertyCategory = getPropertyCategory(property.type);
  const bsd = roundMoney(calculateBSDForCategory(property.price, propertyCategory));
  const absd = propertyCategory === 'commercial'
    ? 0
    : roundMoney(calculateABSDForProfile(property.price, propertyCount, buyerProfile.residencyStatus));
  const absdRate = propertyCategory === 'commercial'
    ? 0
    : calculateABSDRateForProfile(propertyCount, buyerProfile.residencyStatus);
  const hdbResaleLevy = calculateHdbResaleLevy(player, property);
  const totalUpfront = roundMoney(roundedDownPayment + bsd + absd + hdbResaleLevy);
  const shortfall = Math.max(0, roundMoney(totalUpfront - player.cash));
  const mortgageAmount = Math.max(0, roundMoney(property.price - roundedDownPayment));
  const activeHousingLoans = player.loans.filter((loan) => loan.type === 'mortgage' && !loan.isPaid).length;
  const hdbConcessionaryAllowed = property.isHdb && activeHousingLoans === 0;
  const ltvCap = financingMode === 'hdb-concessionary' && hdbConcessionaryAllowed
    ? HDB_CONCESSIONARY_LTV
    : getLtvCap(activeHousingLoans);
  const maxLoan = financingMode === 'hdb-concessionary' && hdbConcessionaryAllowed
    ? roundMoney(property.price * HDB_CONCESSIONARY_LTV)
    : maxBorrowable(property.price, activeHousingLoans);
  const ltvAllowed = mortgageAmount <= maxLoan;
  const diff = difficultySettings[player.difficulty];
  const loanInterestRate = financingMode === 'hdb-concessionary'
    ? HDB_CONCESSIONARY_LOAN_INTEREST
    : diff.loanInterest;
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

  if (financingMode === 'hdb-concessionary' && !hdbConcessionaryAllowed) {
    reasons.push({
      code: 'financing_not_allowed',
      message: 'HDB concessionary loan is only available for HDB listings without another active housing loan in this simplified model.',
    });
  }

  if (roundedDownPayment <= 0 || roundedDownPayment > property.price) {
    reasons.push({
      code: 'invalid_amount',
      message: 'Down payment must be between 1 and the property price.',
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
    bsd,
    absd,
    absdRate,
    hdbResaleLevy,
    totalUpfront,
    shortfall,
    mortgageAmount,
    monthlyPayment,
    loanInterestRate,
    financingMode,
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

export function calculateHdbResaleLevy(player: Player, property: Property): number {
  if (property.type !== 'HDB BTO') return 0;
  if (!player.firstHomePurchased) return 0;
  return HDB_RESALE_LEVY_ESTIMATE;
}
