import { getPropertyCategory, properties, type Property } from '@/data/properties';
import {
  normalizeBuyerProfile,
  type CpfUsageMode,
  type MortgageFinancingMode,
  type PendingTaxRelief,
  type Player,
} from '@/game/types';
import { difficultySettings } from '@/game/types';
import { formatCurrency, formatPercent, roundMoney } from '@/lib/format';
import {
  CREDIT_SCORE_FLOOR,
  DEFAULT_MORTGAGE_TERM_YEARS,
  HDB_FLAT_MORTGAGE_TERM_YEARS,
  HDB_CONCESSIONARY_LOAN_INTEREST,
  HDB_CONCESSIONARY_LTV,
  HDB_RESALE_LEVY_ESTIMATE,
  TDSR_LIMIT,
} from './constants';
import { calcMonthlyPayment, calcTDSR } from './finance';
import { selectBankAssessableMonthlyIncome } from './income';
import { getLtvCap, checkMsr, maxBorrowable } from './ltv';
import type { ActionFailReason } from './results';
import { selectMonthlyExpenses } from './selectors';
import {
  buildPendingTaxReliefDraft,
  calculateABSDForProfile,
  calculateABSDRateForProfile,
  calculateBSDForCategory,
} from './stampDuty';

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
  loanTermYears: number;
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
  cpfUsageMode: CpfUsageMode;
  maxCpfOrdinaryUsable: number;
  remainingLeaseYears: number;
  cpfUsageMessage: string | null;
  pendingTaxRelief: PendingTaxRelief | null;
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
  const residentialPropertyCount = countResidentialHoldings(player);
  const residentialHoldings = getResidentialHoldings(player);
  const isOwned = player.properties.some((ownedProperty) => ownedProperty.propertyId === property.id);
  const buyerProfile = normalizeBuyerProfile(player.buyerProfile);
  const propertyCategory = getPropertyCategory(property.type);
  const bsd = roundMoney(calculateBSDForCategory(property.price, propertyCategory));
  const absd = propertyCategory === 'commercial'
    ? 0
    : roundMoney(calculateABSDForProfile(property.price, residentialPropertyCount, buyerProfile.residencyStatus));
  const absdRate = propertyCategory === 'commercial'
    ? 0
    : calculateABSDRateForProfile(residentialPropertyCount, buyerProfile.residencyStatus);
  const hdbResaleLevy = calculateHdbResaleLevy(player, property);
  const cpfLeaseAssessment = assessCpfLeaseUsage({
    property,
    propertyCategory,
    purchaseYear: player.year,
    buyerAge: buyerProfile.age,
    downPayment: roundedDownPayment,
  });
  const pendingTaxRelief = buildPendingTaxReliefDraft({
    maritalStatus: player.maritalStatus,
    residencyStatus: buyerProfile.residencyStatus,
    buyerAge: buyerProfile.age,
    propertyCategory,
    propertyCountBeforePurchase: residentialPropertyCount,
    purchasePropertyId: property.id,
    purchaseTurn: player.turnCount,
    expectedRefundAmount: absd,
    replacementPurchasePrice: property.price,
    existingResidentialProperties: residentialHoldings,
  });
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
  const loanTermYears = getMortgageTermYears(property);
  const monthlyPayment = calcMonthlyPayment(mortgageAmount, loanInterestRate, loanTermYears);
  const assessableMonthlyIncome = selectBankAssessableMonthlyIncome(player);
  const tdsrRatio = mortgageAmount > 0 ? calcTDSR(selectMonthlyExpenses(player), monthlyPayment, assessableMonthlyIncome) : 0;
  const tdsrAllowed = mortgageAmount <= 0 || tdsrRatio <= TDSR_LIMIT;
  const creditAllowed = mortgageAmount <= 0 || player.creditScore >= CREDIT_SCORE_FLOOR;
  const msrCheck = mortgageAmount > 0 && property.isHdb
    ? checkMsr(assessableMonthlyIncome, monthlyPayment, true)
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
      message: `MSR would exceed 30% for HDB/EC purchase. Max monthly payment: ${formatCurrency(msrCheck.maxMonthlyPayment)}. Reduce the loan amount or increase upfront payment.`,
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
    loanTermYears,
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
    cpfUsageMode: cpfLeaseAssessment.mode,
    maxCpfOrdinaryUsable: cpfLeaseAssessment.maxCpfOrdinaryUsable,
    remainingLeaseYears: cpfLeaseAssessment.remainingLeaseYears,
    cpfUsageMessage: cpfLeaseAssessment.message,
    pendingTaxRelief,
  };
}

export function getMortgageTermYears(property: Property): number {
  // HDB-flat affordability uses a 25-year servicing period in the simplified model.
  // Bank-financed HDB flats can have longer packages only with extra LTV/age caveats,
  // which the game does not yet model, so we keep this conservative for education.
  return property.isHdb ? HDB_FLAT_MORTGAGE_TERM_YEARS : DEFAULT_MORTGAGE_TERM_YEARS;
}

export function calculateHdbResaleLevy(player: Player, property: Property): number {
  if (property.type !== 'HDB BTO') return 0;
  if (!hasSubsidizedHousingHistory(player)) return 0;
  return HDB_RESALE_LEVY_ESTIMATE;
}

function countResidentialHoldings(player: Player): number {
  return getResidentialHoldings(player).length;
}

function getResidentialHoldings(player: Player): Array<{ propertyId: string; currentValue: number }> {
  return player.properties.filter((owned) => {
    const property = propertiesById.get(owned.propertyId);
    return Boolean(property && getPropertyCategory(property.type) !== 'commercial');
  }).map((owned) => ({
    propertyId: owned.propertyId,
    currentValue: owned.currentValue,
  }));
}

function hasSubsidizedHousingHistory(player: Player): boolean {
  if (player.usedSubsidizedHousing) return true;
  return player.properties.some((owned) => {
    const property = propertiesById.get(owned.propertyId);
    return Boolean(property && isSubsidizedHousingType(property.type));
  });
}

function isSubsidizedHousingType(propertyType: string): boolean {
  return propertyType === 'HDB BTO' || propertyType === 'Executive Condo';
}

const propertiesById = new Map(properties.map((property) => [property.id, property]));

function assessCpfLeaseUsage(input: {
  property: Property;
  propertyCategory: ReturnType<typeof getPropertyCategory>;
  purchaseYear: number;
  buyerAge: number;
  downPayment: number;
}): {
  mode: CpfUsageMode;
  maxCpfOrdinaryUsable: number;
  remainingLeaseYears: number;
  message: string | null;
} {
  if (input.propertyCategory === 'commercial') {
    return {
      mode: 'blocked',
      maxCpfOrdinaryUsable: 0,
      remainingLeaseYears: 0,
      message: null,
    };
  }

  const propertyAge = Math.max(0, input.purchaseYear - input.property.yearBuilt);
  const remainingLeaseYears = Math.max(0, input.property.leaseYears - propertyAge);

  if (remainingLeaseYears <= 20) {
    return {
      mode: 'blocked',
      maxCpfOrdinaryUsable: 0,
      remainingLeaseYears,
      message: 'Lease is too short for CPF use in this purchase.',
    };
  }

  if (input.buyerAge + remainingLeaseYears >= 95) {
    return {
      mode: 'full',
      maxCpfOrdinaryUsable: input.downPayment,
      remainingLeaseYears,
      message: null,
    };
  }

  const denominator = Math.max(1, 95 - input.buyerAge);
  const ratio = Math.min(1, Math.max(0, remainingLeaseYears / denominator));
  const proratedCpfLimit = roundMoney(input.property.price * ratio);

  return {
    mode: 'prorated',
    maxCpfOrdinaryUsable: Math.max(0, Math.min(input.downPayment, proratedCpfLimit)),
    remainingLeaseYears,
    message: 'Lease is too short for full CPF use. Only a reduced CPF amount is available.',
  };
}
