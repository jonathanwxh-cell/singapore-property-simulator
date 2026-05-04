import { lifeActionsById } from '@/data/lifeActions';
import { properties, isResidentialCategory, type Property } from '@/data/properties';
import { scenarios, type ScenarioOption } from '@/data/scenarios';
import type { LifeActionId, Player } from '@/game/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { TAKE_HOME_RATIO } from './constants';
import { getDownPaymentAmount, validatePurchase, type PurchaseValidationReason } from './purchase';
import {
  selectAvailableCash,
  selectMonthlyNetCashflow,
  selectPotentialHousingGrant,
} from './selectors';

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

  if (player.properties.length === 0) {
    const starter = properties.find((property) => property.id === 'hdb-bto-0') ?? [...properties].sort((a, b) => a.price - b.price)[0];
    const readiness = assessDealReadiness({
      player,
      property: starter,
      downPaymentPercent: 25,
      useCpfOrdinary: true,
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

export function assessDealReadiness({
  player,
  property,
  downPaymentPercent,
  useCpfOrdinary,
}: DealReadinessInput): DealReadiness {
  const downPayment = getDownPaymentAmount(property.price, downPaymentPercent);
  const validation = validatePurchase(player, property, downPayment);
  const cpfEligible = isResidentialCategory(property.type);
  const cpfApplied = cpfEligible && useCpfOrdinary
    ? Math.floor(Math.min(player.cpfOrdinary, validation.totalUpfront))
    : 0;
  const cashRequired = Math.max(0, validation.totalUpfront - cpfApplied);
  const cashShortfall = Math.max(0, cashRequired - player.cash);
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const monthlySurplusAfterDebt = monthlySurplus - validation.monthlyPayment;
  const structuralBlocker = validation.reasons.find((reason) => reason.code !== 'insufficient_cash') ?? null;
  const primaryBlocker = structuralBlocker
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
      `New mortgage payment: ${formatCurrency(validation.monthlyPayment)}/mo`,
      `TDSR after purchase: ${formatPercent(validation.tdsrRatio * 100, 1)}`,
    ],
    warnings,
  };
}

export function assessScenarioOption(player: Player, option: ScenarioOption): ScenarioOptionAssessment {
  const projectedCash = player.cash + option.cashImpact;
  const facts = [
    `Cash ${formatSignedCurrency(option.cashImpact)}`,
    `Property value ${formatSignedPercent(option.propertyValueImpact)}`,
    `Credit ${option.creditImpact >= 0 ? '+' : ''}${option.creditImpact}`,
    `${Math.round(option.probability * 100)}% success chance`,
  ];

  if (option.cashImpact < 0 && projectedCash < 0) {
    return {
      canChoose: false,
      tone: 'danger',
      summary: `${option.label}: cash cost would exceed your buffer`,
      warning: `This would overdraw cash by ${formatCurrency(Math.abs(projectedCash))}. Build cash first or choose a safer response.`,
      facts,
    };
  }

  if (option.cashImpact > 0 || option.propertyValueImpact > 0 || (option.salaryDeltaPct ?? 0) > 0) {
    return {
      canChoose: true,
      tone: 'upside',
      summary: `${option.label}: ${formatSignedCurrency(option.cashImpact)} cash potential`,
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
  if (primaryBlocker.code === 'tdsr_exceeded') return 'Blocked: TDSR';
  if (primaryBlocker.code === 'msr_exceeded') return 'Blocked: MSR';
  if (primaryBlocker.code === 'ltv_exceeded') return 'Raise Down Payment';
  if (primaryBlocker.code === 'credit_too_low') return 'Improve Credit';
  if (primaryBlocker.code === 'already_owned') return 'Already Owned';
  if (primaryBlocker.code === 'insufficient_cash') return `Need ${formatCurrency(shortfall)} More`;
  return 'Not Eligible Yet';
}

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
