import type { Property } from '@/data/properties';
import type { Player } from '@/game/types';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import type { DealReadiness } from './decisionCoach';
import { selectAvailableCash, selectMonthlyExpenses, selectMonthlyNetCashflow } from './selectors';
import { TAKE_HOME_RATIO } from './constants';

export interface PracticePurchasePlan {
  title: string;
  summary: string;
  riskLevel: 'safe' | 'stretch' | 'blocked';
  cashRequired: number;
  cpfApplied: number;
  projectedCashAfterUpfront: number;
  projectedAvailableCashAfterReserve: number;
  projectedMonthlySurplusAfterPurchase: number;
  nextSteps: string[];
  warnings: string[];
}

export interface BtoTimelineStage {
  label: string;
  monthOffset: number;
  detail: string;
  status: 'ready' | 'next' | 'later' | 'blocked';
}

export interface BtoReadinessPlan {
  headline: string;
  estimatedMonthsToKeys: number;
  stages: BtoTimelineStage[];
  warnings: string[];
  notes: string[];
}

export interface SeniorRightsizingOption {
  label: string;
  detail: string;
  route: string;
}

export interface SeniorRightsizingPlan {
  headline: string;
  cpfRetirementReference: number;
  cpfGapToReference: number;
  monthlyRunwayAfterHousing: number;
  options: SeniorRightsizingOption[];
  warnings: string[];
}

export const CPF_2026_FULL_RETIREMENT_SUM = 220_400;

export function buildPracticePurchasePlan({
  player,
  property,
  readiness,
}: {
  player: Player;
  property: Property;
  readiness: DealReadiness;
}): PracticePurchasePlan {
  const availableCash = selectAvailableCash(player);
  const projectedCashAfterUpfront = Math.round(player.cash - readiness.cashRequired);
  const projectedAvailableCashAfterReserve = Math.round(availableCash - readiness.cashRequired);
  const riskLevel = readiness.verdict === 'ready'
    ? 'safe'
    : readiness.verdict === 'stretch'
      ? 'stretch'
      : 'blocked';
  const warnings = [
    ...(projectedAvailableCashAfterReserve < 10_000
      ? ['Reserve would be thin after upfront cash. Keep emergency money before committing.']
      : []),
    ...(readiness.monthlySurplusAfterDebt < 0
      ? ['Monthly cashflow turns negative after the loan. This is playable only as a deliberate hard-mode move.']
      : []),
    ...(property.isHdb && player.buyerProfile?.householdProfile === 'single-under-35'
      ? ['Single under 35 path should treat HDB as locked and build an alternate plan first.']
      : []),
  ];

  return {
    title: 'Practice purchase simulation',
    summary: `${property.name}: ${formatCompactCurrency(readiness.cashRequired)} cash after CPF, then ${formatCurrency(readiness.monthlySurplusAfterDebt)}/mo projected surplus.`,
    riskLevel,
    cashRequired: readiness.cashRequired,
    cpfApplied: readiness.cpfApplied,
    projectedCashAfterUpfront,
    projectedAvailableCashAfterReserve,
    projectedMonthlySurplusAfterPurchase: readiness.monthlySurplusAfterDebt,
    nextSteps: [
      'Simulate only: no cash, CPF, time, or save data changes here.',
      readiness.verdict === 'blocked'
        ? 'Fix the blocker first, then re-run the practice buy.'
        : 'If the practice numbers feel safe, use the real purchase button below.',
      property.isHdb
        ? 'Check HFE, grants, MOP, and room-rental rules before treating this as an investment.'
        : 'Stress-test rates, vacancy, ABSD, and repair reserves before chasing upside.',
    ],
    warnings,
  };
}

export function buildBtoReadinessPlan(player: Player, property: Property): BtoReadinessPlan | null {
  if (property.type !== 'HDB BTO') return null;

  const hfeReady = player.buyerProfile?.residencyStatus === 'sc'
    && player.buyerProfile.householdProfile !== 'single-under-35'
    && player.buyerProfile.householdProfile !== 'foreigner-investor';
  const constructionMonths = Math.max(9, ((property.yearBuilt - player.year) * 12) + (12 - player.month));
  const estimatedMonthsToKeys = Math.max(9, 6 + constructionMonths);

  const stages: BtoTimelineStage[] = [
    {
      label: 'HFE letter',
      monthOffset: 0,
      detail: 'Confirm flat, grant, and loan eligibility before applying for a new flat.',
      status: hfeReady ? 'ready' : 'blocked',
    },
    {
      label: 'Sales launch and ballot',
      monthOffset: 1,
      detail: 'Pick a launch, submit application, then wait for queue results.',
      status: hfeReady ? 'next' : 'blocked',
    },
    {
      label: 'Book flat',
      monthOffset: 3,
      detail: 'Use queue position to select a unit and pay the option fee.',
      status: 'later',
    },
    {
      label: 'Sign lease',
      monthOffset: 5,
      detail: 'Sign the Agreement for Lease and prepare CPF/cash/payment choices.',
      status: 'later',
    },
    {
      label: 'Construction wait',
      monthOffset: 6,
      detail: `Estimated ${constructionMonths} month(s) until the project is ready in this simplified run.`,
      status: 'later',
    },
    {
      label: 'Key collection',
      monthOffset: estimatedMonthsToKeys,
      detail: 'Pay balance, stamp/legal fees, insurance needs, and start MOP after moving in.',
      status: 'later',
    },
  ];

  return {
    headline: hfeReady
      ? 'HFE-ready BTO path: apply, ballot, book, wait, collect keys.'
      : 'HFE blocker: fix eligibility before treating this BTO as buyable.',
    estimatedMonthsToKeys,
    stages,
    warnings: [
      ...(!hfeReady ? ['Current profile does not cleanly fit the simplified HFE/BTO path.'] : []),
      ...(property.yearBuilt <= player.year ? ['This project is modelled as near-complete, so the wait is compressed for gameplay.'] : []),
    ],
    notes: [
      'This is a simplified game timeline based on the HDB new-flat process.',
      'After key collection, MOP and owner-occupation constraints still matter.',
    ],
  };
}

export function buildSeniorRightsizingPlan(player: Player): SeniorRightsizingPlan | null {
  const profileAge = player.buyerProfile?.age ?? player.age;
  const isSeniorRoute = player.runRouteId === 'senior-rightsizer' || profileAge >= 55 || player.age >= 55;
  if (!isSeniorRoute) return null;

  const cpfRetirementPool = player.cpfOrdinary + player.cpfSpecial;
  const cpfGapToReference = Math.max(0, CPF_2026_FULL_RETIREMENT_SUM - cpfRetirementPool);
  const monthlyRunwayAfterHousing = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const monthlyExpenses = selectMonthlyExpenses(player);
  const reserveMonths = monthlyExpenses > 0
    ? Math.floor(((player.reserve?.allocatedCash ?? 0) + selectAvailableCash(player)) / monthlyExpenses)
    : 12;

  return {
    headline: '55+ rightsizing route: protect retirement income before chasing leverage.',
    cpfRetirementReference: CPF_2026_FULL_RETIREMENT_SUM,
    cpfGapToReference,
    monthlyRunwayAfterHousing,
    options: [
      {
        label: 'right-size into a smaller home',
        detail: 'Compare a lower-maintenance HDB resale or short-lease path before buying another high-debt asset.',
        route: '/properties',
      },
      {
        label: 'monetise housing carefully',
        detail: 'Use this as a learning hook for lease buyback or Silver Housing Bonus-style decisions in later game.',
        route: '/learn',
      },
      {
        label: 'protect repair and medical runway',
        detail: `Aim for at least 12 months of expenses; current rough runway is ${reserveMonths} month(s).`,
        route: '/portfolio',
      },
    ],
    warnings: [
      ...(cpfGapToReference > 0
        ? [`CPF pool is ${formatCurrency(cpfGapToReference)} below the 2026 Full Retirement Sum reference; housing refunds may need to support the Retirement Account first.`]
        : ['CPF pool is above the 2026 Full Retirement Sum reference, but housing cashflow still needs a runway.']),
      ...(monthlyRunwayAfterHousing < 0
        ? ['Monthly cashflow is negative, so rightsizing should reduce debt rather than add leverage.']
        : []),
      'After 55, CPF housing decisions interact with Retirement Account needs; treat this route as stability-first.',
    ],
  };
}
