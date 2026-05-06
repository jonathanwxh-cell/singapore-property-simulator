import { properties, isResidentialCategory } from '@/data/properties';
import type { Loan, MortgageFinancingMode, OwnedProperty, Player } from '@/game/types';
import { MAX_CREDIT_SCORE, MIN_CREDIT_SCORE } from '@/game/types';
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
import { selectBankAssessableMonthlyIncome } from './income';
import { selectMonthlyExpenses } from './selectors';
import type { Rng } from './rng';
import type { ScenarioOption } from '@/data/scenarios';
import { formatPercent, roundMoney } from '@/lib/format';
import { validatePurchase } from './purchase';
import { deriveMaintenanceCost, derivePropertyTax } from './portfolio';
import {
  getSalaryCeilingForProperty,
  evaluatePropertyEligibility,
  isPrivateResidentialPropertyType,
  isResidentialPropertyType,
} from './eligibility';

export interface ScenarioResolution {
  cashDelta: number;
  cpfOrdinaryDelta: number;
  creditDelta: number;
  propertyValueImpactPct: number;
  salaryDeltaPct: number;
  careerGrowthModifierDelta: number;
  careerRiskModifierDelta: number;
  careerVolatilityModifierDelta: number;
  followUpText: string;
  success: boolean;
}

function canUseCpfForProperty(propertyId: string): boolean {
  const property = properties.find((candidate) => candidate.id === propertyId);
  return Boolean(property && isResidentialCategory(property.type));
}

function hasResidentialHolding(player: Player): boolean {
  return player.properties.some((ownedProperty) => {
    const listing = properties.find((candidate) => candidate.id === ownedProperty.propertyId);
    return Boolean(listing && isResidentialCategory(listing.type));
  });
}

function getInitialOccupancyStatus(player: Player, property: NonNullable<(typeof properties)[number]>): OwnedProperty['occupancyStatus'] {
  if (!isResidentialCategory(property.type)) return 'vacant';
  return hasResidentialHolding(player) ? 'vacant' : 'owner-occupied';
}

export function resolveScenarioOption(option: ScenarioOption, rng: Rng): ScenarioResolution {
  const success = rng.next() <= option.probability;
  if (success) {
    return {
      cashDelta: option.cashImpact,
      cpfOrdinaryDelta: option.cpfOrdinaryImpact ?? 0,
      creditDelta: option.creditImpact,
      propertyValueImpactPct: option.propertyValueImpact,
      salaryDeltaPct: option.salaryDeltaPct ?? 0,
      careerGrowthModifierDelta: option.careerGrowthModifierDelta ?? 0,
      careerRiskModifierDelta: option.careerRiskModifierDelta ?? 0,
      careerVolatilityModifierDelta: option.careerVolatilityModifierDelta ?? 0,
      followUpText: option.followUpText,
      success: true,
    };
  }
  return {
    cashDelta: Math.round(option.cashImpact * 0.5),
    cpfOrdinaryDelta: Math.round((option.cpfOrdinaryImpact ?? 0) * 0.5),
    creditDelta: -10,
    propertyValueImpactPct: Math.round(option.propertyValueImpact * 0.5),
    salaryDeltaPct: 0,
    careerGrowthModifierDelta: 0,
    careerRiskModifierDelta: 0,
    careerVolatilityModifierDelta: 0,
    followUpText: 'Things did not go as planned. The outcome was worse than expected.',
    success: false,
  };
}

export function buyPropertyPure(
  player: Player,
  propertyId: string,
  downPayment: number,
  cpfOrdinaryUsed = 0,
  financingMode: MortgageFinancingMode = 'bank',
): ActionResult<{ player: Player }> {
  const property = properties.find(p => p.id === propertyId);
  if (!property) return fail('property_not_found', 'Property not found.');

  const validation = validatePurchase(player, property, downPayment, financingMode);
  const cpfEligible = canUseCpfForProperty(propertyId);
  const allowedCpfUse = cpfEligible ? Math.floor(Math.min(validation.totalUpfront, player.cpfOrdinary)) : 0;
  const cpfToUse = Math.max(0, Math.floor(cpfOrdinaryUsed));

  if (!cpfEligible && cpfToUse > 0) {
    return fail('cpf_not_allowed', 'CPF OA can only be used for residential property purchases.');
  }
  if (cpfToUse > allowedCpfUse) {
    return fail('cpf_exceeded', `CPF OA usage exceeds the eligible amount of S$${allowedCpfUse.toLocaleString()}.`);
  }

  const blockingReason = validation.reasons.find((reason) => reason.code !== 'insufficient_cash');
  if (blockingReason) {
    return fail(blockingReason.code, blockingReason.message);
  }

  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  if (eligibility.blockedReason) {
    return fail(eligibility.blockedCode ?? 'eligibility_blocked', eligibility.blockedReason);
  }

  const cashRequired = roundMoney(validation.totalUpfront - cpfToUse);
  if (player.cash < cashRequired) {
    return fail('insufficient_cash', `Not enough cash for the remaining upfront cost of S$${Math.round(cashRequired).toLocaleString()} after CPF usage.`);
  }

  const salaryCeiling = getSalaryCeilingForProperty(property.type);
  if (salaryCeiling !== null && player.salary > salaryCeiling) {
    return fail('eligibility_blocked', `Monthly salary of S$${player.salary.toLocaleString()} exceeds the S$${salaryCeiling.toLocaleString()} ceiling for this property type.`);
  }
  if (property.type === 'Executive Condo' && player.ownedPrivateHome) {
    return fail('eligibility_blocked', 'Executive condos are blocked after you have owned a private home in this run.');
  }

  const loanAmount = validation.mortgageAmount;
  const loanId = `loan_t${player.turnCount}_${player.loans.length}`;
  const monthlyRental = Math.round(property.price * property.rentalYield / 100 / 12);
  const owned: OwnedProperty = {
    propertyId: property.id,
    purchasePrice: property.price,
    purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
    currentValue: property.price,
    isRented: false,
    monthlyRental,
    renovationLevel: 0,
    loanId: loanAmount > 0 ? loanId : undefined,
    occupancyStatus: getInitialOccupancyStatus(player, property),
    tenantQuality: 50,
    vacancyMonths: 0,
    maintenanceCost: deriveMaintenanceCost({
      propertyId: property.id,
      purchasePrice: property.price,
      purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
      currentValue: property.price,
      isRented: false,
      monthlyRental,
      renovationLevel: 0,
    }),
    propertyTax: derivePropertyTax({
      propertyId: property.id,
      purchasePrice: property.price,
      purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
      currentValue: property.price,
      isRented: false,
      monthlyRental,
      renovationLevel: 0,
    }),
    listingChannel: property.listingChannel,
    conditionScore: 72,
    mopRemainingMonths: property.isHdb ? 60 : 0,
    completedRenovations: [],
    openMaintenanceIssues: [],
    rentStrategy: 'market',
    financingMode: validation.financingMode,
    hdbResaleLevyPaid: validation.hdbResaleLevy,
  };

  const newLoan: Loan | null = loanAmount > 0
    ? {
        id: loanId,
        type: 'mortgage',
        principal: loanAmount,
        remainingBalance: loanAmount,
        interestRate: validation.loanInterestRate,
        monthlyPayment: validation.monthlyPayment,
        termYears: DEFAULT_MORTGAGE_TERM_YEARS,
        startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
        propertyId: property.id,
        isPaid: false,
        financingMode: validation.financingMode,
      }
    : null;

  return ok({
    player: {
      ...player,
      cash: roundMoney(player.cash - cashRequired),
      cpfOrdinary: roundMoney(player.cpfOrdinary - cpfToUse),
      properties: [...player.properties, owned],
      loans: newLoan ? [...player.loans, newLoan] : player.loans,
      firstHomePurchased: isResidentialPropertyType(property.type) ? true : player.firstHomePurchased,
      ownedPrivateHome: isPrivateResidentialPropertyType(property.type) ? true : player.ownedPrivateHome,
    },
  });
}

export function sellPropertyPure(player: Player, propertyIndex: number): ActionResult<{ player: Player }> {
  if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
    return fail('invalid_index', 'Invalid property index.');
  }

  const property = player.properties[propertyIndex];
  const listing = properties.find((candidate) => candidate.id === property.propertyId);
  if (listing?.isHdb && (property.mopRemainingMonths ?? 0) > 0) {
    return fail(
      'mop_restricted',
      `This HDB is still inside MOP (${property.mopRemainingMonths} months left), so selling is blocked in the simplified Singapore rules.`,
    );
  }

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
  const tdsr = calcTDSR(existingPayments, monthlyPayment, selectBankAssessableMonthlyIncome(player));
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
