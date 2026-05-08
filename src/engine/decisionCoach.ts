import { lifeActionsById } from '@/data/lifeActions';
import { properties, isResidentialCategory, type Property } from '@/data/properties';
import { scenarios, type ScenarioOption } from '@/data/scenarios';
import type { LifeActionId, Player } from '@/game/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT, TAKE_HOME_RATIO } from './constants';
import { getRunArc } from './runDirector';
import { getDownPaymentAmount, validatePurchase, type PurchaseValidationReason } from './purchase';
import { evaluatePropertyEligibility } from './eligibility';
import { getListingCatalog, type ListingProperty } from './listings';
import { isIncomeHaircutApplied, selectBankAssessableMonthlyIncome } from './income';
import { resolveStarterPropertyForProfile } from './firstHomeStarter';
import {
  selectAvailableCash,
  selectMonthlyNetCashflow,
  selectPotentialHousingGrant,
} from './selectors';
import type { MortgageFinancingMode } from '@/game/types';

export type CoachUrgency = 'critical' | 'warn' | 'good' | 'neutral';

export interface CoachMove {
  id: string;
  title: string;
  detail: string;
  route: string;
  actionLabel: string;
  urgency: CoachUrgency;
  priority: number;
}

export interface NextBestMoveInput {
  player: Player;
  currentScenario?: string | null;
}

export interface DealReadinessInput {
  player: Player;
  property: Property;
  downPaymentPercent: number;
  useCpfOrdinary: boolean;
  financingMode?: MortgageFinancingMode;
}

export interface DealReadiness {
  verdict: 'ready' | 'stretch' | 'blocked';
  headline: string;
  ctaLabel: string;
  primaryBlocker: PurchaseValidationReason | null;
  cashRequired: number;
  cpfApplied: number;
  totalUpfront: number;
  monthlyPayment: number;
  monthlySurplusAfterDebt: number;
  facts: string[];
  warnings: string[];
}

export interface ScenarioOptionAssessment {
  canChoose: boolean;
  tone: 'upside' | 'safe' | 'caution' | 'danger';
  summary: string;
  warning: string | null;
  facts: string[];
}

export interface LifeActionFeedback {
  title: string;
  detail: string;
  expectedEffects: string[];
}

export interface BestNextBuy {
  property: ListingProperty;
  readiness: DealReadiness;
}

export function getNextBestMoves({ player, currentScenario }: NextBestMoveInput): CoachMove[] {
  const moves: CoachMove[] = [];

  if (currentScenario) {
    const scenario = scenarios.find((candidate) => candidate.id === currentScenario);
    moves.push({
      id: 'resolve-scenario',
      title: scenario ? `Resolve ${scenario.title}` : 'Resolve active scenario',
      detail: 'Choose a scenario response before advancing. Events can move cash, credit, salary, or property values.',
      route: '/scenarios',
      actionLabel: 'Open Scenario',
      urgency: 'critical',
      priority: 100,
    });
  }

  const vacantProperty = player.properties.find((property) => !property.isRented && (property.occupancyStatus ?? 'vacant') === 'vacant');
  if (vacantProperty) {
    moves.push({
      id: 'activate-rental',
      title: 'Put a vacant property to work',
      detail: 'Set a tenant strategy or rent mode so the asset starts generating income instead of only carrying costs.',
      route: `/property/${vacantProperty.propertyId}`,
      actionLabel: 'Set Tenant Plan',
      urgency: 'good',
      priority: 92,
    });
  }

  const openIssueProperty = player.properties.find((property) => (property.openMaintenanceIssues?.length ?? 0) > 0);
  if (openIssueProperty) {
    moves.push({
      id: 'repair-open-issue',
      title: 'Handle open maintenance',
      detail: 'Open repairs drag tenant satisfaction and value. Resolve urgent issues before they compound.',
      route: `/property/${openIssueProperty.propertyId}`,
      actionLabel: 'Review Repairs',
      urgency: 'warn',
      priority: 94,
    });
  }

  const ownerOccupiedHdbDuringMop = player.properties.find((ownedProperty) => {
    const listing = properties.find((property) => property.id === ownedProperty.propertyId);
    return Boolean(
      listing?.isHdb
      && !ownedProperty.tenant
      && (ownedProperty.mopRemainingMonths ?? 0) > 0
      && (ownedProperty.occupancyStatus ?? 'owner-occupied') === 'owner-occupied',
    );
  });
  if (ownerOccupiedHdbDuringMop) {
    moves.push({
      id: 'start-room-rental',
      title: 'Start a MOP-safe room rental',
      detail: 'Whole-flat rental is locked during MOP, but an owner-occupied room lease can teach yield without breaking the simplified rules.',
      route: `/property/${ownerOccupiedHdbDuringMop.propertyId}`,
      actionLabel: 'Start Room Rental',
      urgency: 'good',
      priority: 96,
    });
  }

  if (player.life.stress >= 70 || player.life.energy <= 35) {
    moves.push({
      id: 'recover-life',
      title: 'Recover before pushing harder',
      detail: 'High stress or low energy can make extra income moves backfire. Plan a recovery month to protect the run.',
      route: '/life',
      actionLabel: 'Plan Recovery',
      urgency: 'warn',
      priority: 86,
    });
  }

  const runArc = getRunArc(player);
  if (runArc.activeMilestone) {
    moves.push({
      id: `route-${runArc.activeMilestone.id}`,
      title: runArc.activeMilestone.label,
      detail: `Life Arc: ${runArc.activeMilestone.detail}`,
      route: runArc.activeMilestone.route,
      actionLabel: runArc.activeMilestone.actionLabel,
      urgency: 'neutral',
      priority: 78,
    });
  }

  if (player.properties.length === 0) {
    const bestNextBuy = selectBestNextBuyForPlayer(player);
    const starter = bestNextBuy?.property
      ?? resolveStarterPropertyForProfile(player.buyerProfile)
      ?? [...properties].sort((a, b) => a.price - b.price)[0];
    const readiness = bestNextBuy?.readiness ?? assessDealReadiness({
      player,
      property: starter,
      downPaymentPercent: starter.isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25,
      useCpfOrdinary: true,
      financingMode: starter.isHdb ? 'hdb-concessionary' : 'bank',
    });

    moves.push({
      id: readiness.verdict === 'ready' ? 'buy-first-home' : 'prepare-first-home',
      title: readiness.verdict === 'ready' ? 'You can buy a starter home' : 'Build first-home readiness',
      detail: readiness.verdict === 'ready'
        ? `${starter.name} is affordable now. Review CPF, cash, and loan load before committing.`
        : readiness.headline,
      route: readiness.verdict === 'ready' ? '/properties' : '/life',
      actionLabel: readiness.verdict === 'ready' ? 'Compare Starter Homes' : 'Improve Buying Power',
      urgency: readiness.verdict === 'ready' ? 'good' : 'neutral',
      priority: readiness.verdict === 'ready' ? 82 : 68,
    });
  }

  if (selectAvailableCash(player) < Math.max(10_000, player.salary * 2)) {
    moves.push({
      id: 'build-buffer',
      title: 'Build a safer cash buffer',
      detail: 'Your spendable cash is thin versus monthly income. Use side gigs, schemes, or patience before taking a bigger risk.',
      route: '/life',
      actionLabel: 'Plan Cash Month',
      urgency: 'warn',
      priority: 72,
    });
  }

  moves.push({
    id: 'advance-month',
    title: 'Advance when your plan is set',
    detail: 'Once life actions, deals, and open property issues are handled, advance one month to resolve income, costs, and market moves.',
    route: '/dashboard',
    actionLabel: 'Advance Month',
    urgency: 'neutral',
    priority: 10,
  });

  return moves.sort((a, b) => b.priority - a.priority).slice(0, 4);
}

export function selectBestNextBuyForPlayer(player: Player): BestNextBuy | null {
  const catalog = getListingCatalog();
  const candidates = catalog.map((property) => ({
    property,
    readiness: assessDealReadiness({
      player,
      property,
      downPaymentPercent: property.isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25,
      useCpfOrdinary: true,
      financingMode: property.isHdb ? 'hdb-concessionary' : 'bank',
    }),
    eligibility: evaluatePropertyEligibility({
      propertyType: property.type,
      salary: player.salary,
      properties: player.properties,
      firstHomePurchased: player.firstHomePurchased,
      ownedPrivateHome: player.ownedPrivateHome,
      buyerProfile: player.buyerProfile,
    }),
  }));

  const profileEligible = candidates.filter((candidate) => !candidate.eligibility.blockedReason);
  const pool = profileEligible.length > 0 ? profileEligible : candidates;
  const verdictScore = { ready: 0, stretch: 1, blocked: 2 };

  const best = [...pool].sort((a, b) =>
    verdictScore[a.readiness.verdict] - verdictScore[b.readiness.verdict]
    || a.readiness.cashRequired - b.readiness.cashRequired
    || a.property.price - b.property.price
  )[0];

  return best ? { property: best.property, readiness: best.readiness } : null;
}

export function assessDealReadiness({
  player,
  property,
  downPaymentPercent,
  useCpfOrdinary,
  financingMode = 'bank',
}: DealReadinessInput): DealReadiness {
  const downPayment = getDownPaymentAmount(property.price, downPaymentPercent);
  const validation = validatePurchase(player, property, downPayment, financingMode);
  const cpfEligible = isResidentialCategory(property.type);
  const cpfApplied = cpfEligible && useCpfOrdinary
    // Keep readiness math aligned with the actual purchase action: CPF OA only
    // offsets the down payment in this simplified model, not duties or levy.
    ? Math.floor(Math.min(player.cpfOrdinary, validation.maxCpfOrdinaryUsable))
    : 0;
  const cashRequired = Math.max(0, validation.totalUpfront - cpfApplied);
  const cashShortfall = Math.max(0, cashRequired - player.cash);
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const monthlySurplusAfterDebt = monthlySurplus - validation.monthlyPayment;
  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const structuralBlocker = validation.reasons.find((reason) => reason.code !== 'insufficient_cash') ?? null;
  const eligibilityBlocker = eligibility.blockedReason
    ? {
        code: eligibility.blockedCode ?? 'eligibility_blocked',
        message: eligibility.blockedReason,
      }
    : null;
  const primaryBlocker = eligibilityBlocker
    ?? structuralBlocker
    ?? (cashShortfall > 0 ? { code: 'insufficient_cash' as const, message: `You need ${formatCurrency(cashShortfall)} more spendable cash after CPF.` } : null);
  const warnings: string[] = [];

  if (monthlySurplusAfterDebt < 0) {
    warnings.push('This deal turns monthly cashflow negative after the new mortgage payment.');
  } else if (monthlySurplusAfterDebt < Math.max(500, player.salary * 0.08)) {
    warnings.push('This deal is affordable, but the monthly buffer is thin.');
  }

  const grantSupport = property.isHdb ? selectPotentialHousingGrant(player) : 0;
  if (grantSupport > 0 && cashShortfall > 0) {
    warnings.push(`Potential first-home support could close up to ${formatCurrency(grantSupport)} of the gap.`);
  }
  const assessableMonthlyIncome = selectBankAssessableMonthlyIncome(player);

  const verdict = primaryBlocker
    ? 'blocked'
    : warnings.length > 0
      ? 'stretch'
      : 'ready';

  return {
    verdict,
    headline: buildDealHeadline(verdict, property, primaryBlocker, cashShortfall),
    ctaLabel: primaryBlocker ? blockerLabel(primaryBlocker, cashShortfall) : 'Buy Property',
    primaryBlocker,
    cashRequired,
    cpfApplied,
    totalUpfront: validation.totalUpfront,
    monthlyPayment: validation.monthlyPayment,
    monthlySurplusAfterDebt,
    facts: [
      `Cash needed after CPF: ${formatCurrency(cashRequired)}`,
      `CPF OA applied: ${formatCurrency(cpfApplied)}`,
      validation.cpfUsageMode === 'full'
        ? 'CPF lease coverage: full OA usage allowed for this upfront step'
        : validation.cpfUsageMode === 'prorated'
          ? `CPF lease coverage: reduced OA usage cap of ${formatCurrency(validation.maxCpfOrdinaryUsable)}`
          : validation.cpfUsageMessage,
      `New mortgage payment: ${formatCurrency(validation.monthlyPayment)}/mo over ${validation.loanTermYears} years`,
      validation.hdbResaleLevy > 0 ? `Estimated resale levy: ${formatCurrency(validation.hdbResaleLevy)}` : null,
      validation.absd > 0 ? `ABSD rate: ${formatPercent(validation.absdRate * 100)}` : null,
      validation.pendingTaxRelief
        ? `ABSD refund path: ${formatCurrency(validation.pendingTaxRelief.expectedRefundAmount)} may return after a qualifying sale within 6 months`
        : null,
      isIncomeHaircutApplied(player) ? `Bank-assessed income: ${formatCurrency(assessableMonthlyIncome)}/mo after self-employed haircut` : null,
      validation.mortgageAmount <= 0 ? 'No new mortgage: TDSR/MSR loan checks do not apply.' : null,
      `TDSR after purchase: ${formatPercent(validation.tdsrRatio * 100, 1)}`,
    ].filter((fact): fact is string => Boolean(fact)),
    warnings,
  };
}

export function assessScenarioOption(player: Player, option: ScenarioOption): ScenarioOptionAssessment {
  const projectedCash = player.cash + option.cashImpact;
  const cpfOrdinaryImpact = option.cpfOrdinaryImpact ?? 0;
  const facts = [
    `Cash ${formatSignedCurrency(option.cashImpact)}`,
    cpfOrdinaryImpact !== 0 ? `CPF OA ${formatSignedCurrency(cpfOrdinaryImpact)}` : null,
    `Property value ${formatSignedPercent(option.propertyValueImpact)}`,
    `Credit ${option.creditImpact >= 0 ? '+' : ''}${option.creditImpact}`,
    `${Math.round(option.probability * 100)}% success chance`,
  ].filter((fact): fact is string => Boolean(fact));

  if (option.cashImpact < 0 && projectedCash < 0) {
    return {
      canChoose: false,
      tone: 'danger',
      summary: `${option.label}: cash cost would exceed your buffer`,
      warning: `This would overdraw cash by ${formatCurrency(Math.abs(projectedCash))}. Build cash first or choose a safer response.`,
      facts,
    };
  }

  if (option.cashImpact > 0 || cpfOrdinaryImpact > 0 || option.propertyValueImpact > 0 || (option.salaryDeltaPct ?? 0) > 0) {
    const upsideLabel = cpfOrdinaryImpact > 0 && option.cashImpact <= 0
      ? `${formatSignedCurrency(cpfOrdinaryImpact)} CPF OA support`
      : `${formatSignedCurrency(option.cashImpact)} cash potential`;
    return {
      canChoose: true,
      tone: 'upside',
      summary: `${option.label}: ${upsideLabel}`,
      warning: option.probability < 0.75 ? 'Upside exists, but the outcome is not guaranteed.' : null,
      facts,
    };
  }

  if (option.cashImpact < 0 || option.creditImpact < 0 || option.propertyValueImpact < 0) {
    return {
      canChoose: true,
      tone: 'caution',
      summary: `${option.label}: defensive but costly`,
      warning: 'This option is playable, but it carries a visible cost.',
      facts,
    };
  }

  return {
    canChoose: true,
    tone: 'safe',
    summary: `${option.label}: low immediate cash impact`,
    warning: null,
    facts,
  };
}

export function getLifeActionFeedback(player: Player, actionId: LifeActionId): LifeActionFeedback {
  const action = lifeActionsById[actionId];
  const selected = player.life.selectedPrimaryActionId === actionId || player.life.selectedSecondaryActionId === actionId;
  const expectedEffects = lifeActionExpectedEffects(actionId);

  return {
    title: selected ? `${action.label} planned` : `Plan ${action.label}`,
    detail: selected
      ? 'This choice is queued for the current month. Press Advance Month to resolve its cash, energy, stress, and scheme effects.'
      : 'Selecting this action plans the month; it does not resolve instantly. Press Advance Month after your plan is set.',
    expectedEffects,
  };
}

export function getDealNextFix(readiness: DealReadiness): string {
  const blocker = readiness.primaryBlocker;

  if (!blocker) {
    return readiness.verdict === 'stretch'
      ? 'Playable, but set a reserve or choose a safer monthly plan before committing.'
      : 'Ready. Review the monthly surplus and worst-case notes, then buy if it fits your route.';
  }

  return BLOCKER_INFO[blocker.code]?.hint ?? FALLBACK_BLOCKER_HINT;
}

function buildDealHeadline(
  verdict: DealReadiness['verdict'],
  property: Property,
  primaryBlocker: PurchaseValidationReason | null,
  cashShortfall: number,
): string {
  if (!primaryBlocker && verdict === 'ready') {
    return `${property.name} is purchase-ready.`;
  }
  if (!primaryBlocker && verdict === 'stretch') {
    return `${property.name} is buyable, but the monthly buffer is tight.`;
  }
  if (primaryBlocker?.code === 'insufficient_cash') {
    return `You need ${formatCurrency(cashShortfall)} more cash for this deal.`;
  }
  return primaryBlocker?.message ?? 'This deal is blocked for now.';
}

function blockerLabel(primaryBlocker: PurchaseValidationReason, shortfall: number): string {
  const info = BLOCKER_INFO[primaryBlocker.code];
  if (!info) return FALLBACK_BLOCKER_LABEL;
  return typeof info.label === 'function' ? info.label(shortfall) : info.label;
}

const FALLBACK_BLOCKER_LABEL = 'Not Eligible Yet';
const FALLBACK_BLOCKER_HINT = 'Open Learn for the rule explanation, then adjust cash, income, debt, or buyer profile before trying again.';

interface BlockerCopy {
  label: string | ((shortfall: number) => string);
  hint: string;
}

const BLOCKER_INFO: Partial<Record<PurchaseValidationReason['code'], BlockerCopy>> = {
  insufficient_cash: {
    label: (shortfall) => `Need ${formatCurrency(shortfall)} More`,
    hint: 'Build spendable cash first: use Build Cash Buffer, side gigs, schemes, or compare cheaper starter homes.',
  },
  tdsr_exceeded: {
    label: 'Blocked: TDSR',
    hint: 'Improve bank-assessed income, reduce other debt, or pick a lower mortgage so TDSR falls back under the cap.',
  },
  msr_exceeded: {
    label: 'Blocked: MSR',
    hint: 'For HDB/EC, raise income or reduce the loan size; MSR is about the monthly mortgage, not just cash on hand.',
  },
  ltv_exceeded: {
    label: 'Raise Down Payment',
    hint: 'Raise the down payment, pick a cheaper unit, or use the HDB loan path when the listing and profile allow it.',
  },
  credit_too_low: {
    label: 'Improve Credit',
    hint: 'Stabilize cashflow and avoid missed payments; a stronger credit score unlocks safer borrowing.',
  },
  financing_not_allowed: {
    label: FALLBACK_BLOCKER_LABEL,
    hint: 'Switch financing mode or clear the active housing loan that blocks this simplified loan path.',
  },
  mop_restricted: {
    label: 'Blocked: MOP',
    hint: 'Wait out MOP or use MOP-safe actions like room rental and cash-building while the flat stays owner-occupied.',
  },
  eligibility_blocked: {
    label: FALLBACK_BLOCKER_LABEL,
    hint: 'This is a profile-rule blocker. Check the Learn hub or choose a route that fits your residency, age, and household.',
  },
  already_owned: {
    label: 'Already Owned',
    hint: 'You already own this listing. Manage tenants, repairs, upgrades, or sale timing from the portfolio.',
  },
};

function lifeActionExpectedEffects(actionId: LifeActionId): string[] {
  const effects: Record<LifeActionId, string[]> = {
    'focus-at-work': ['career momentum up', 'steady salary path', 'low cash risk'],
    'take-side-gig': ['cash up', 'energy down', 'stress up'],
    'property-hustle': ['cash up', 'reputation up', 'stress up'],
    upskill: ['future salary upside', 'cash cost now', 'scheme progress may help'],
    'support-household': ['household stability up', 'stress down', 'cash pressure may rise'],
    'plan-schemes': ['grant progress up', 'admin progress up', 'low immediate cash impact'],
    recover: ['energy up', 'stress down', 'less cash upside this month'],
  };

  return effects[actionId];
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return 'S$0';
  return `${value > 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value: number): string {
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${formatPercent(value, 1)}`;
}
