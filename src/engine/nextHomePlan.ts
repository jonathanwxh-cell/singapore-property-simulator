import { properties, getPropertyCategory, isResidentialCategory, type Property } from '@/data/properties';
import type { OwnedProperty, Player } from '@/game/types';
import { HDB_MOP_MONTHS, TAKE_HOME_RATIO } from './constants';
import {
  selectAvailableCash,
  selectMonthlyNetCashflow,
  selectMonthlyOwnershipCosts,
  selectReservedCash,
} from './selectors';

export type NextHomePhase = 'pre-owner' | 'active-mop' | 'owner-no-mop' | 'post-mop';
export type NextHomeBottleneck = 'first-home' | 'mop' | 'cash' | 'cpf' | 'income' | 'risk-buffer' | 'market-timing' | 'ready';
export type NextHomeFocusId = 'tenant' | 'home-project' | 'income' | 'market' | 'recovery';

export interface NextHomePlan {
  phase: NextHomePhase;
  propertyName: string | null;
  target: Property;
  targetRoute: string;
  targetLabel: string;
  requiredCashAndCpf: number;
  usableCashAndCpf: number;
  availableCash: number;
  cpfOrdinary: number;
  estimatedSaleEquity: number;
  readinessPct: number;
  shortfall: number;
  monthlySavingsRate: number;
  projectedReadyInMonths: number | null;
  mopMonthsRemaining: number;
  mopProgressPct: number;
  paceLabel: string;
  bottleneck: NextHomeBottleneck;
  bottleneckLabel: string;
  recommendedFocusId: NextHomeFocusId;
  recommendedMoveLabel: string;
  summary: string;
}

const CASH_BUFFER = 20_000;
const DEFAULT_MONTHLY_SAVINGS_RATE = 500;

export function getNextHomePlan(player: Player): NextHomePlan {
  const ownedContext = getPrimaryOwnedContext(player);
  const target = resolveNextHomeTarget(player, ownedContext?.listing ?? null);
  const phase = getNextHomePhase(player, ownedContext?.holding ?? null, ownedContext?.listing ?? null);
  const availableCash = selectAvailableCash(player);
  const cpfOrdinary = Math.max(0, player.cpfOrdinary);
  const estimatedSaleEquity = ownedContext ? getEstimatedSaleEquity(player, ownedContext.holding) : 0;
  const requiredCashAndCpf = estimateRequiredCashAndCpf(target);
  const usableCashAndCpf = Math.max(0, Math.round(availableCash + cpfOrdinary + estimatedSaleEquity));
  const readinessPct = Math.min(100, Math.round((usableCashAndCpf / Math.max(1, requiredCashAndCpf)) * 100));
  const shortfall = Math.max(0, requiredCashAndCpf - usableCashAndCpf);
  const monthlySavingsRate = getMonthlySavingsRate(player);
  const projectedReadyInMonths = shortfall === 0
    ? 0
    : monthlySavingsRate > 0
      ? Math.ceil(shortfall / monthlySavingsRate)
      : null;
  const mopMonthsRemaining = phase === 'active-mop' ? ownedContext?.holding.mopRemainingMonths ?? 0 : 0;
  const mopProgressPct = mopMonthsRemaining > 0
    ? Math.min(100, Math.round(((HDB_MOP_MONTHS - mopMonthsRemaining) / HDB_MOP_MONTHS) * 100))
    : 100;
  const bottleneck = getNextHomeBottleneck({
    player,
    phase,
    readinessPct,
    shortfall,
    monthlySavingsRate,
    mopMonthsRemaining,
  });
  const recommendedFocusId = getRecommendedFocus(player, bottleneck, ownedContext?.holding ?? null);

  return {
    phase,
    propertyName: ownedContext?.listing.name ?? null,
    target,
    targetRoute: `/property/${target.id}`,
    targetLabel: getTargetLabel(target),
    requiredCashAndCpf,
    usableCashAndCpf,
    availableCash,
    cpfOrdinary,
    estimatedSaleEquity,
    readinessPct,
    shortfall,
    monthlySavingsRate,
    projectedReadyInMonths,
    mopMonthsRemaining,
    mopProgressPct,
    paceLabel: getPaceLabel(phase, projectedReadyInMonths, mopMonthsRemaining),
    bottleneck,
    bottleneckLabel: getBottleneckLabel(bottleneck),
    recommendedFocusId,
    recommendedMoveLabel: getRecommendedMoveLabel(recommendedFocusId),
    summary: getPlanSummary({ phase, readinessPct, mopMonthsRemaining, projectedReadyInMonths, bottleneck }),
  };
}

function getPrimaryOwnedContext(player: Player): { holding: OwnedProperty; listing: Property } | null {
  const contexts = player.properties
    .map((holding) => {
      const listing = properties.find((property) => property.id === holding.propertyId);
      return listing ? { holding, listing } : null;
    })
    .filter((context): context is { holding: OwnedProperty; listing: Property } => Boolean(context));

  return contexts.find(({ holding }) => (holding.mopRemainingMonths ?? 0) > 0)
    ?? contexts.find(({ listing }) => isResidentialCategory(listing.type))
    ?? contexts[0]
    ?? null;
}

function getNextHomePhase(player: Player, holding: OwnedProperty | null, listing: Property | null): NextHomePhase {
  if (!holding || !listing || player.properties.length === 0) return 'pre-owner';
  if ((holding.mopRemainingMonths ?? 0) > 0) return 'active-mop';
  if (listing.isHdb || getPropertyCategory(listing.type) === 'ec') return 'post-mop';
  return 'owner-no-mop';
}

function resolveNextHomeTarget(player: Player, currentListing: Property | null): Property {
  if (!currentListing) {
    return properties.find((property) => property.id === 'hdb-bto-0') ?? properties[0];
  }

  const currentValue = currentListing.price;
  const currentCategory = getPropertyCategory(currentListing.type);

  if (currentCategory === 'commercial') {
    return findCheapest((property) => getPropertyCategory(property.type) === 'commercial' && property.price > currentValue)
      ?? currentListing;
  }

  if (player.runRouteId === 'senior-rightsizer') {
    return findCheapest((property) => property.type === 'HDB Resale' && property.price <= Math.max(650_000, currentValue))
      ?? findCheapest((property) => property.type === 'HDB Resale')
      ?? currentListing;
  }

  if (currentCategory === 'hdb') {
    return findCheapest((property) => property.type === 'Executive Condo')
      ?? findCheapest((property) => property.type === 'Private Condo')
      ?? currentListing;
  }

  if (currentCategory === 'ec') {
    return findCheapest((property) => property.type === 'Private Condo' && property.price > currentValue * 1.05)
      ?? findCheapest((property) => property.type === 'Private Condo')
      ?? currentListing;
  }

  return findCheapest((property) => isResidentialCategory(property.type) && !property.isHdb && property.price > currentValue * 1.05)
    ?? findCheapest((property) => property.type === 'Private Condo')
    ?? currentListing;
}

function findCheapest(predicate: (property: Property) => boolean): Property | null {
  return [...properties].filter(predicate).sort((a, b) => a.price - b.price)[0] ?? null;
}

function estimateRequiredCashAndCpf(target: Property): number {
  const category = getPropertyCategory(target.type);
  const downPaymentPct = category === 'hdb' ? 0.25 : category === 'commercial' ? 0.35 : 0.25;
  const dutyAndFeesPct = category === 'commercial' ? 0.04 : 0.05;
  return Math.round(target.price * (downPaymentPct + dutyAndFeesPct) + CASH_BUFFER);
}

function getEstimatedSaleEquity(player: Player, holding: OwnedProperty): number {
  const loanBalance = player.loans
    .filter((loan) => !loan.isPaid && loan.propertyId === holding.propertyId)
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const saleBuffer = Math.round(holding.currentValue * 0.03);
  return Math.max(0, Math.round(holding.currentValue - loanBalance - saleBuffer));
}

function getMonthlySavingsRate(player: Player): number {
  const baseSurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const recentLifeCash = Math.max(0, player.life.lastMonthSummary?.cashDelta ?? 0);
  return Math.max(0, Math.round(baseSurplus + recentLifeCash));
}

function getNextHomeBottleneck({
  player,
  phase,
  readinessPct,
  shortfall,
  monthlySavingsRate,
  mopMonthsRemaining,
}: {
  player: Player;
  phase: NextHomePhase;
  readinessPct: number;
  shortfall: number;
  monthlySavingsRate: number;
  mopMonthsRemaining: number;
}): NextHomeBottleneck {
  if (phase === 'pre-owner') return 'first-home';
  if (selectReservedCash(player) < Math.max(CASH_BUFFER, selectMonthlyOwnershipCosts(player) * 3) && player.properties.length > 0) {
    return 'risk-buffer';
  }
  if (phase === 'active-mop' && mopMonthsRemaining > 0 && readinessPct >= 85) return 'mop';
  if (shortfall > 0 && player.cpfOrdinary < CASH_BUFFER) return 'cpf';
  if (shortfall > 0 && readinessPct < 75) return 'cash';
  if (monthlySavingsRate <= DEFAULT_MONTHLY_SAVINGS_RATE) return 'income';
  if (readinessPct >= 95) return 'ready';
  return 'market-timing';
}

function getRecommendedFocus(player: Player, bottleneck: NextHomeBottleneck, holding: OwnedProperty | null): NextHomeFocusId {
  if (player.life.stress >= 75 || player.life.energy <= 35) return 'recovery';
  if (holding && !holding.tenant && (holding.mopRemainingMonths ?? 0) > 0) return 'tenant';
  if (holding && ((holding.conditionScore ?? 75) < 70 || (holding.openMaintenanceIssues ?? []).length > 0)) return 'home-project';
  if (bottleneck === 'cash' || bottleneck === 'cpf' || bottleneck === 'income' || bottleneck === 'risk-buffer') return 'income';
  if (bottleneck === 'mop') return 'home-project';
  return 'market';
}

function getTargetLabel(target: Property): string {
  return `${target.name} (${target.type})`;
}

function getBottleneckLabel(bottleneck: NextHomeBottleneck): string {
  switch (bottleneck) {
    case 'first-home':
      return 'Buy first home';
    case 'mop':
      return 'MOP timeline';
    case 'cash':
      return 'Cash runway';
    case 'cpf':
      return 'CPF OA depth';
    case 'income':
      return 'Monthly surplus';
    case 'risk-buffer':
      return 'Reserve buffer';
    case 'market-timing':
      return 'Market timing';
    case 'ready':
      return 'Ready to plan';
  }
}

function getRecommendedMoveLabel(focusId: NextHomeFocusId): string {
  switch (focusId) {
    case 'tenant':
      return 'Set up MOP-safe room rental';
    case 'home-project':
      return 'Improve the current home';
    case 'income':
      return 'Grow cash and income';
    case 'market':
      return 'Study target districts';
    case 'recovery':
      return 'Recover before pushing';
  }
}

function getPlanSummary({
  phase,
  readinessPct,
  mopMonthsRemaining,
  projectedReadyInMonths,
  bottleneck,
}: {
  phase: NextHomePhase;
  readinessPct: number;
  mopMonthsRemaining: number;
  projectedReadyInMonths: number | null;
  bottleneck: NextHomeBottleneck;
}): string {
  if (phase === 'pre-owner') {
    return 'Build the first-home runway before thinking about the next upgrade.';
  }
  if (phase === 'active-mop' && bottleneck === 'mop') {
    return `${mopMonthsRemaining} MOP month(s) left. Finances are close enough that the best play is improving the current home and timing the exit.`;
  }
  if (projectedReadyInMonths === null) {
    return 'Monthly surplus is weak. Stabilize income and reserve before aiming for the next home.';
  }
  if (readinessPct >= 95) {
    return 'The next-home runway is almost ready. Start comparing exits and target districts.';
  }
  return `At the current pace, this runway needs about ${projectedReadyInMonths} more month(s) of progress.`;
}

function getPaceLabel(
  phase: NextHomePhase,
  projectedReadyInMonths: number | null,
  mopMonthsRemaining: number,
): string {
  if (phase !== 'active-mop') {
    return phase === 'pre-owner' ? 'First-home runway first' : 'No MOP pacing lock';
  }
  if (projectedReadyInMonths === null) {
    return 'Not yet on pace for MOP exit';
  }
  if (projectedReadyInMonths === 0) {
    return 'Ready before MOP ends';
  }
  const delta = mopMonthsRemaining - projectedReadyInMonths;
  if (delta >= 6) {
    return `${delta} month(s) ahead of MOP pace`;
  }
  if (delta >= 0) {
    return 'On pace for MOP exit';
  }
  return `${Math.abs(delta)} month(s) behind MOP pace`;
}
