import { properties } from '@/data/properties';
import { isRunRouteId, runRoutes, runRoutesById } from '@/data/runRoutes';
import {
  difficultySettings,
  type Player,
  type RouteMilestone,
  type RouteMilestoneTemplate,
  type RunArc,
  type RunRoute,
  type RunRouteId,
  type RunRoutePhase,
  type RunRouteScore,
} from '@/game/types';
import { TAKE_HOME_RATIO } from './constants';
import {
  selectAvailableCash,
  selectMonthlyExpenses,
  selectMonthlyNetCashflow,
  selectMonthlyRentalIncome,
  selectNetWorth,
} from './selectors';

const phaseLabels: Record<RunRoutePhase, string> = {
  foundation: 'Foundation',
  acquisition: 'Acquisition',
  ownership: 'Ownership',
  expansion: 'Expansion',
  legacy: 'Legacy',
};

const replayOrder: RunRouteId[] = [
  'bto-upgrader',
  'single-resale',
  'heartland-landlord',
  'pr-private-climber',
  'fire-homeowner',
  'senior-rightsizer',
  'commercial-operator',
  'foreign-investor',
];

const CPF_FULL_RETIREMENT_SUM_2026 = 220_400;

export function inferRunRouteId(player: Player): RunRouteId {
  if (player.runRouteId && isRunRouteId(player.runRouteId)) return player.runRouteId;

  if (ownsCommercialAsset(player)) return 'commercial-operator';
  if (player.properties.some((property) => property.isRented || property.tenant)) return 'heartland-landlord';

  const profile = player.buyerProfile;
  if (profile?.residencyStatus === 'foreigner' || profile?.householdProfile === 'foreigner-investor') {
    return 'foreign-investor';
  }
  if (profile?.householdProfile === 'domestic-partners') return 'fire-homeowner';
  if (profile?.residencyStatus === 'spr') return 'pr-private-climber';
  if ((profile?.age ?? player.age) >= 55 || player.age >= 55) return 'senior-rightsizer';
  if (profile?.householdProfile === 'multi-gen-family') return 'heartland-landlord';
  if (profile?.householdProfile === 'single-35-plus') return 'single-resale';

  return 'bto-upgrader';
}

export function getRouteForPlayer(player: Player): RunRoute {
  return runRoutesById[inferRunRouteId(player)];
}

export function getRunArc(player: Player): RunArc {
  const route = getRouteForPlayer(player);
  const milestones = getRouteMilestones(player);
  const activeMilestone = milestones.find((milestone) => milestone.status === 'active') ?? null;
  const completedCount = milestones.filter((milestone) => milestone.status === 'completed').length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const phase = deriveRunPhase(player);

  return {
    route,
    phase,
    phaseLabel: phaseLabels[phase],
    activeMilestone,
    supportingMilestones: milestones.filter((milestone) => milestone.status !== 'completed' && milestone.id !== activeMilestone?.id).slice(0, 2),
    milestones,
    progressPct,
    lesson: getRouteLesson(route, phase),
    whyItMatters: getWhyItMatters(route.id, phase),
  };
}

export function getRouteMilestones(player: Player): RouteMilestone[] {
  const route = getRouteForPlayer(player);
  let activeAssigned = false;

  return route.milestoneTemplates.map((template) => {
    const progressPct = getMilestoneProgress(player, template);
    const completed = progressPct >= 100;
    const status = completed ? 'completed' : activeAssigned ? 'locked' : 'active';
    if (!completed && !activeAssigned) activeAssigned = true;
    return {
      ...template,
      status,
      progressPct,
    };
  });
}

export function scoreRunRoute(player: Player): RunRouteScore {
  const arc = getRunArc(player);
  const completedMilestones = arc.milestones.filter((milestone) => milestone.status === 'completed').length;
  const totalMilestones = arc.milestones.length;
  const milestoneScore = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 700 : 0;
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const wealthScore = Math.min(200, (selectNetWorth(player) / target) * 200);
  const stabilityScore = Math.max(0, 100 - Math.max(player.life.stress - 40, 0) - player.bankruptcyStrikes * 20);
  const score = Math.round(milestoneScore + wealthScore + stabilityScore);

  return {
    routeId: arc.route.id,
    routeLabel: arc.route.label,
    score,
    completedMilestones,
    totalMilestones,
    summary: `${completedMilestones}/${totalMilestones} route milestones completed on the ${arc.route.shortLabel} arc.`,
    nextLesson: arc.activeMilestone?.detail ?? 'Try a different route to learn a new Singapore property constraint.',
    suggestedNextRouteId: suggestNextRouteId(arc.route.id),
  };
}

export function deriveRunPhase(player: Player): RunRoutePhase {
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const netWorth = selectNetWorth(player);

  if (player.turnCount >= 180 || netWorth >= target * 0.85) return 'legacy';
  if (player.properties.length >= 2 || player.ownedPrivateHome || ownsCommercialAsset(player) || selectMonthlyRentalIncome(player) >= 2_500) {
    return 'expansion';
  }
  if (player.properties.length > 0) return 'ownership';
  if (selectAvailableCash(player) + player.cpfOrdinary >= 80_000 || player.turnCount >= 2) return 'acquisition';
  return 'foundation';
}

function getMilestoneProgress(player: Player, template: RouteMilestoneTemplate): number {
  const availableCash = selectAvailableCash(player);
  const reserve = player.reserve?.allocatedCash ?? 0;
  const monthlyExpenses = Math.max(1, selectMonthlyExpenses(player));
  const monthlyDebt = player.loans.reduce((sum, loan) => sum + (loan.isPaid ? 0 : loan.monthlyPayment), 0);
  const debtServiceRatio = player.salary > 0 ? monthlyDebt / player.salary : 1;
  const monthlyNetCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const netWorth = selectNetWorth(player);
  const hasHome = player.properties.length > 0;
  const hasRentedProperty = player.properties.some((property) => property.isRented || property.tenant);
  const goodTenant = player.properties.some((property) => (property.tenant?.satisfaction ?? 0) >= 70);
  const openIssues = player.properties.flatMap((property) => property.openMaintenanceIssues ?? []);
  const noLongVacancy = player.properties.every((property) => (property.vacancyMonths ?? 0) <= 1);

  switch (template.id) {
    case 'cash-buffer':
      return ratioProgress(availableCash, 60_000);
    case 'buy-first-home':
      return hasHome ? 100 : Math.min(95, ratioProgress(availableCash + player.cpfOrdinary, 120_000));
    case 'survive-mop':
      return hasHome && monthlyNetCashflow > 0 ? 100 : hasHome ? 60 : 0;
    case 'upgrade-ready':
      return player.ownedPrivateHome || player.properties.length >= 2 ? 100 : ratioProgress(netWorth, 900_000);
    case 'eligibility-age':
      return (player.buyerProfile?.householdProfile === 'single-35-plus' && player.age >= 35) ? 100 : ratioProgress(player.age, 35);
    case 'six-month-reserve':
      return ratioProgress(reserve, monthlyExpenses * 6);
    case 'manageable-resale':
      return hasHome && debtServiceRatio <= 0.35 ? 100 : hasHome ? 65 : ratioProgress(availableCash + player.cpfOrdinary, 100_000);
    case 'stress-control':
      return hasHome && player.life.stress <= 45 && monthlyNetCashflow >= 0 ? 100 : Math.max(0, 100 - player.life.stress);
    case 'absd-buffer':
      return ratioProgress(availableCash, 140_000);
    case 'private-entry':
      return player.ownedPrivateHome ? 100 : ratioProgress(availableCash + player.cpfOrdinary, 240_000);
    case 'career-growth':
      return ratioProgress(player.salary, 8_500);
    case 'refi-upgrade':
      return player.properties.length >= 2 || debtServiceRatio <= 0.28 ? 100 : Math.max(0, 100 - Math.round(debtServiceRatio * 200));
    case 'liquidity-after-absd':
      return ratioProgress(availableCash, 250_000);
    case 'private-rental':
      return hasRentedProperty ? 100 : hasHome ? 50 : 0;
    case 'concentration-risk':
      return ratioProgress(netWorth - totalPropertyValue(player) * 0.25, 250_000);
    case 'legacy-yield':
      return selectMonthlyRentalIncome(player) >= 4_000 && reserve >= monthlyExpenses * 6 ? 100 : ratioProgress(selectMonthlyRentalIncome(player), 4_000);
    case 'set-reserve':
      return ratioProgress(reserve, Math.max(10_000, monthlyExpenses * 3));
    case 'tenant-satisfaction':
      return goodTenant ? 100 : hasRentedProperty ? 55 : 0;
    case 'repair-quickly':
      return hasHome && openIssues.length === 0 ? 100 : openIssues.length > 0 ? 35 : 0;
    case 'grow-rental-income':
      return ratioProgress(selectMonthlyRentalIncome(player), 2_500);
    case 'buy-commercial':
      return ownsCommercialAsset(player) ? 100 : ratioProgress(availableCash + player.cpfOrdinary, 180_000);
    case 'fitout-risk':
      return ownsCommercialAsset(player) && openIssues.length === 0 ? 100 : ownsCommercialAsset(player) ? 50 : 0;
    case 'low-vacancy':
      return ownsCommercialAsset(player) && noLongVacancy ? 100 : ownsCommercialAsset(player) ? 55 : 0;
    case 'operating-cashflow':
      return ratioProgress(monthlyNetCashflow, 3_000);
    case 'modest-debt':
      return debtServiceRatio <= 0.28 ? 100 : Math.max(0, 100 - Math.round(debtServiceRatio * 180));
    case 'twelve-month-reserve':
      return ratioProgress(reserve, monthlyExpenses * 12);
    case 'pay-down-mortgage':
      return player.loans.some((loan) => loan.type === 'mortgage' && loan.remainingBalance < loan.principal * 0.75) ? 100 : hasHome ? 45 : 0;
    case 'low-stress-legacy':
      return netWorth >= difficultySettings[player.difficulty].targetNetWorth * 0.5 && player.life.stress <= 45 ? 100 : Math.max(0, 100 - player.life.stress);
    case 'cpf-55-check':
      return ratioProgress(player.cpfOrdinary + player.cpfSpecial, CPF_FULL_RETIREMENT_SUM_2026);
    case 'rightsize-cash-runway':
      return ratioProgress(availableCash + reserve, monthlyExpenses * 12);
    case 'lower-debt-home':
      return hasHome && debtServiceRatio <= 0.25 ? 100 : hasHome ? 65 : ratioProgress(availableCash + player.cpfOrdinary, 140_000);
    case 'legacy-income-floor':
      return monthlyNetCashflow >= 1_500 && player.life.stress <= 45 ? 100 : ratioProgress(monthlyNetCashflow, 1_500);
    default:
      return 0;
  }
}

function ownsCommercialAsset(player: Player): boolean {
  return player.properties.some((owned) => {
    const property = properties.find((candidate) => candidate.id === owned.propertyId);
    return property?.type === 'Commercial Shop' || property?.type === 'Commercial Office';
  });
}

function totalPropertyValue(player: Player): number {
  return player.properties.reduce((sum, property) => sum + property.currentValue, 0);
}

function ratioProgress(value: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function getRouteLesson(route: RunRoute, phase: RunRoutePhase): string {
  const phaseIndex: Record<RunRoutePhase, number> = {
    foundation: 0,
    acquisition: 0,
    ownership: 1,
    expansion: 2,
    legacy: 2,
  };
  return route.primaryLessons[phaseIndex[phase]] ?? route.primaryLessons[0] ?? route.tagline;
}

function getWhyItMatters(routeId: RunRouteId, phase: RunRoutePhase): string {
  if (phase === 'foundation') return 'Early choices shape CPF, cash runway, and eligibility before the first big commitment.';
  if (routeId === 'heartland-landlord') return 'Yield only feels good when tenants stay happy and repairs do not ambush your cash.';
  if (routeId === 'commercial-operator') return 'Commercial upside is powerful, but vacancy and fit-out risk punish sloppy operators.';
  if (routeId === 'fire-homeowner') return 'Lower fragility keeps the run alive even when salary, rates, or repairs wobble.';
  if (routeId === 'senior-rightsizer') return 'Later-life property choices should preserve CPF, repair runway, and retirement cashflow before leverage.';
  if (routeId === 'foreign-investor') return 'High ABSD makes liquidity and tenant execution more important than headline price moves.';
  return 'This phase is where affordability turns into ownership discipline and upgrade timing.';
}

function suggestNextRouteId(currentRouteId: RunRouteId): RunRouteId {
  const currentIndex = replayOrder.indexOf(currentRouteId);
  return replayOrder[(currentIndex + 1 + replayOrder.length) % replayOrder.length] ?? runRoutes[0].id;
}
