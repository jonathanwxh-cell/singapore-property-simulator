import { properties, type Property } from '@/data/properties';
import type { Player, RunRouteId } from '@/game/types';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT } from './constants';
import { assessDealReadiness, getDealNextFix, type DealReadiness } from './decisionCoach';
import { evaluatePropertyEligibility } from './eligibility';
import { getListingCatalog, type ListingProperty } from './listings';
import { getRouteForPlayer } from './runDirector';

export interface DealComparisonItem {
  id: string;
  name: string;
  type: Property['type'];
  price: number;
  verdict: DealReadiness['verdict'];
  cashRequired: number;
  cpfApplied: number;
  upfrontDuties: number;
  monthlyPayment: number;
  monthlySurplusAfterPurchase: number;
  rentalYieldPct: number;
  routeFitLabel: string;
  routeFitScore: number;
  worstCase: string;
  nextFix: string;
  blockers: string[];
}

export interface DealComparisonSummary {
  bestId: string | null;
  headline: string;
  detail: string;
}

export interface DealComparisonResult {
  items: DealComparisonItem[];
  summary: DealComparisonSummary;
}

export function buildDealComparisons({
  player,
  propertyIds,
}: {
  player: Player;
  propertyIds: string[];
}): DealComparisonResult {
  const catalog = getListingCatalog();
  const uniqueIds = Array.from(new Set(propertyIds));
  const route = getRouteForPlayer(player);
  const items = uniqueIds
    .map((id) => catalog.find((property) => property.id === id))
    .filter((property): property is ListingProperty => Boolean(property))
    .slice(0, 3)
    .map((property) => buildComparisonItem(player, property, route.id));

  return {
    items,
    summary: buildSummary(items),
  };
}

export function getDealComparisonShortlist(player: Player, seedIds: string[] = []): string[] {
  const routeId = getRouteForPlayer(player).id;
  const routeDefaults: Record<RunRouteId, string[]> = {
    'bto-upgrader': ['hdb-bto-0', 'hdb-resale-0', 'condo-4'],
    'single-resale': ['hdb-resale-0', 'condo-4', 'hdb-resale-1'],
    'pr-private-climber': ['condo-4', 'condo-0', 'commercial-3'],
    'foreign-investor': ['condo-4', 'commercial-3', 'commercial-5'],
    'heartland-landlord': ['hdb-resale-0', 'hdb-bto-0', 'condo-4'],
    'commercial-operator': ['commercial-3', 'commercial-5', 'condo-4'],
    'fire-homeowner': ['hdb-bto-0', 'hdb-resale-0', 'condo-4'],
  };
  const readyStarter = properties.find((property) => property.id === 'hdb-bto-0');
  const ids = [
    ...seedIds,
    ...(routeDefaults[routeId] ?? []),
    readyStarter?.id,
  ].filter((id): id is string => Boolean(id));

  return Array.from(new Set(ids)).slice(0, 3);
}

function buildComparisonItem(player: Player, property: ListingProperty, routeId: RunRouteId): DealComparisonItem {
  const financingMode = property.isHdb ? 'hdb-concessionary' : 'bank';
  const readiness = assessDealReadiness({
    player,
    property,
    downPaymentPercent: property.isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25,
    useCpfOrdinary: true,
    financingMode,
  });
  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const routeFitScore = getRouteFitScore(property, routeId, readiness.verdict);
  const routeFitLabel = routeFitScore >= 85
    ? 'Route fit: strong'
    : routeFitScore >= 60
      ? 'Route fit: workable'
      : 'Route fit: advanced';

  return {
    id: property.id,
    name: property.name,
    type: property.type,
    price: property.price,
    verdict: readiness.verdict,
    cashRequired: readiness.cashRequired,
    cpfApplied: readiness.cpfApplied,
    upfrontDuties: Math.max(0, readiness.totalUpfront - Math.round(property.price * (property.isHdb ? 0.1 : 0.25))),
    monthlyPayment: readiness.monthlyPayment,
    monthlySurplusAfterPurchase: readiness.monthlySurplusAfterDebt,
    rentalYieldPct: property.rentalYield,
    routeFitLabel,
    routeFitScore,
    worstCase: getWorstCaseReadout(property),
    nextFix: getDealNextFix(readiness),
    blockers: [
      readiness.primaryBlocker?.message,
      eligibility.blockedReason,
    ].filter((blocker): blocker is string => Boolean(blocker)),
  };
}

function buildSummary(items: DealComparisonItem[]): DealComparisonSummary {
  if (items.length === 0) {
    return {
      bestId: null,
      headline: 'Pick up to three listings to compare before buying.',
      detail: 'The simulator will show cash, duties, monthly pressure, route fit, and worst case side by side.',
    };
  }

  const best = [...items].sort((a, b) =>
    verdictRank(a.verdict) - verdictRank(b.verdict)
    || b.routeFitScore - a.routeFitScore
    || b.monthlySurplusAfterPurchase - a.monthlySurplusAfterPurchase
    || a.cashRequired - b.cashRequired
  )[0];

  return {
    bestId: best.id,
    headline: `${best.name} looks like the clearest practice pick.`,
    detail: `${best.routeFitLabel}, ${formatCompactCurrency(best.cashRequired)} cash required, ${formatCurrency(best.monthlySurplusAfterPurchase)}/mo projected surplus after debt.`,
  };
}

function verdictRank(verdict: DealReadiness['verdict']): number {
  if (verdict === 'ready') return 0;
  if (verdict === 'stretch') return 1;
  return 2;
}

function getRouteFitScore(property: Property, routeId: RunRouteId, verdict: DealReadiness['verdict']): number {
  const base = verdict === 'ready' ? 50 : verdict === 'stretch' ? 35 : 15;
  const routeBonus = (() => {
    switch (routeId) {
      case 'bto-upgrader':
        return property.isHdb || property.type === 'Executive Condo' ? 45 : 10;
      case 'single-resale':
        return property.type === 'HDB Resale' ? 45 : property.isHdb ? 25 : 15;
      case 'pr-private-climber':
        return property.type === 'Private Condo' || property.type === 'Executive Condo' ? 40 : 15;
      case 'foreign-investor':
        return property.type === 'Private Condo' || property.type.startsWith('Commercial') ? 40 : 0;
      case 'heartland-landlord':
        return property.rentalYield >= 4.2 || property.isHdb ? 40 : 20;
      case 'commercial-operator':
        return property.type.startsWith('Commercial') ? 45 : 10;
      case 'fire-homeowner':
        return property.price <= 700_000 || property.isHdb ? 40 : 10;
      default:
        return 20;
    }
  })();
  return Math.max(0, Math.min(100, base + routeBonus));
}

export function getWorstCaseReadout(property: Property): string {
  if (property.isHdb) {
    return 'MOP locks exits and whole-unit rental; budget for room-rental setup, repairs, and a slower upgrade path.';
  }
  if (property.type.startsWith('Commercial')) {
    return 'Vacancy and fit-out costs can wipe out yield; keep reserves before chasing headline rent.';
  }
  if (property.type.startsWith('Landed')) {
    return 'Large repairs plus rate shocks can overwhelm cashflow if you stretch the loan.';
  }
  return 'Rate hikes, ABSD, and vacancy can turn a thin-buffer condo into negative monthly cashflow.';
}
