// Pure (non-React) function that packages the purchaseComputations useMemo logic
// from PropertyDetail.tsx, plus the derived flat values that follow it.
import type { Player, MortgageFinancingMode } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';
import {
  selectAffordabilityReport,
  selectAvailableCash,
  selectMonthlyNetCashflow,
  selectPotentialHousingGrant,
  selectReservedCash,
} from '@/engine/selectors';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT, TAKE_HOME_RATIO } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import { assessDealReadiness, getDealNextFix } from '@/engine/decisionCoach';
import {
  buildBtoReadinessPlan,
  buildPracticePurchasePlan,
  buildSeniorRightsizingPlan,
} from '@/engine/practicePurchase';
import { formatCurrency } from '@/lib/format';

export interface PurchaseReadinessInput {
  player: Player;
  property: ListingProperty;
  financingMode: MortgageFinancingMode;
  downPaymentPercent: number;
  useCpfOrdinary: boolean;
  isOwned: boolean;
  actionError: string | null;
}

export interface PurchaseReadinessResult {
  activeHousingLoans: number;
  effectiveFinancingMode: MortgageFinancingMode;
  minDownPaymentPercent: number;
  effectiveDownPaymentPercent: number;
  validation: ReturnType<typeof validatePurchase>;
  dealReadiness: ReturnType<typeof assessDealReadiness>;
  dealNextFix: ReturnType<typeof getDealNextFix>;
  monthlySurplus: number;
  grantSupport: number;
  affordability: ReturnType<typeof selectAffordabilityReport>;
  eligibility: ReturnType<typeof evaluatePropertyEligibility>;
  eligibilityFlags: ReturnType<typeof deriveEligibilityFlags>;
  practicePlan: ReturnType<typeof buildPracticePurchasePlan>;
  btoReadinessPlan: ReturnType<typeof buildBtoReadinessPlan>;
  seniorRightsizingPlan: ReturnType<typeof buildSeniorRightsizingPlan>;
  cpfEligible: boolean;
  cpfApplied: number;
  cashRequired: number;
  availableCash: number;
  reservedCash: number;
  eligibilityBlocked: boolean;
  cashShortfall: number;
  extraReasons: Array<{ message: string }>;
  canAfford: boolean;
  visibleMessages: string[];
}

export function computePurchaseReadiness(input: PurchaseReadinessInput): PurchaseReadinessResult {
  const { player, property, financingMode, downPaymentPercent, useCpfOrdinary, isOwned, actionError } = input;

  const activeHousingLoans = player.loans.filter(l => l.type === 'mortgage' && !l.isPaid).length;
  const effectiveFinancingMode: MortgageFinancingMode = property.isHdb ? financingMode : 'bank';
  const minDpPct = effectiveFinancingMode === 'hdb-concessionary'
    ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT
    : Math.round((1 - getLtvCap(activeHousingLoans)) * 100);
  const effectiveDpPct = Math.max(downPaymentPercent, minDpPct);
  const downPayment = getDownPaymentAmount(property.price, effectiveDpPct);
  const validation = validatePurchase(player, property, downPayment, effectiveFinancingMode);
  const dealReadiness = assessDealReadiness({ player, property, downPaymentPercent: effectiveDpPct, useCpfOrdinary, financingMode: effectiveFinancingMode });
  const dealNextFix = getDealNextFix(dealReadiness);
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const grantSupport = property.isHdb ? selectPotentialHousingGrant(player) : 0;
  const affordability = selectAffordabilityReport(player, dealReadiness.cashRequired, monthlySurplus, grantSupport);
  const eligibility = evaluatePropertyEligibility({ propertyType: property.type, salary: player.salary, properties: player.properties, firstHomePurchased: player.firstHomePurchased, ownedPrivateHome: player.ownedPrivateHome, buyerProfile: player.buyerProfile });
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const practicePlan = buildPracticePurchasePlan({ player, property, readiness: dealReadiness });
  const btoReadinessPlan = buildBtoReadinessPlan(player, property);
  const seniorRightsizingPlan = buildSeniorRightsizingPlan(player);

  // Derived flat values (lines 158-179 of original PropertyDetail.tsx)
  const cpfEligible = !property.type.startsWith('Commercial');
  const cpfApplied = dealReadiness.cpfApplied;
  const cashRequired = dealReadiness.cashRequired;
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);
  const eligibilityBlocked = Boolean(eligibility.blockedReason);
  const cashShortfall = Math.max(0, cashRequired - player.cash);
  const extraReasons = dealReadiness.warnings.map(w => ({ message: w }));
  const canAfford = dealReadiness.verdict !== 'blocked' && cashShortfall === 0 && extraReasons.length === 0 && !isOwned && !eligibilityBlocked;
  const visibleMessages = Array.from(
    new Set([
      ...(cashShortfall > 0 ? [`You need ${formatCurrency(cashShortfall)} more cash after CPF OA`] : []),
      ...extraReasons.map((reason) => reason.message),
      ...(eligibility.blockedReason ? [eligibility.blockedReason] : []),
      ...(actionError ? [actionError] : []),
    ])
  );

  return {
    activeHousingLoans,
    effectiveFinancingMode,
    minDownPaymentPercent: minDpPct,
    effectiveDownPaymentPercent: effectiveDpPct,
    validation,
    dealReadiness,
    dealNextFix,
    monthlySurplus,
    grantSupport,
    affordability,
    eligibility,
    eligibilityFlags,
    practicePlan,
    btoReadinessPlan,
    seniorRightsizingPlan,
    cpfEligible,
    cpfApplied,
    cashRequired,
    availableCash,
    reservedCash,
    eligibilityBlocked,
    cashShortfall,
    extraReasons,
    canAfford,
    visibleMessages,
  };
}
