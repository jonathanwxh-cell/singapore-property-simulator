import { lifeActionsById } from '@/data/lifeActions';
import { createInitialLifeIncomeBreakdown, type MarketState, type Player } from '@/game/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { TAKE_HOME_RATIO } from './constants';
import { selectMonthlyNetCashflow } from './selectors';

export type TurnRecapTone = 'good' | 'warn' | 'neutral';

export interface TurnRecapFact {
  label: string;
  value: string;
  detail: string;
  tone: TurnRecapTone;
}

export interface TurnRecap {
  title: string;
  summary: string;
  nextHint: string;
  tone: TurnRecapTone;
  facts: TurnRecapFact[];
  notes: string[];
}

interface TurnRecapInput {
  player: Player;
  market: MarketState;
  currentScenario: string | null;
}

export function getLastTurnRecap({ player, market, currentScenario }: TurnRecapInput): TurnRecap | null {
  const lastMonth = player.life.lastMonthSummary;
  if (!lastMonth || player.turnCount === 0) return null;

  const primaryAction = lifeActionsById[lastMonth.primaryActionId];
  const secondaryAction = lastMonth.secondaryActionId ? lifeActionsById[lastMonth.secondaryActionId] : null;
  const netCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const marketMove = market.monthlyPriceChangePct ?? 0;
  const lifeTone: TurnRecapTone = lastMonth.stressDelta > 5 || lastMonth.energyDelta < -8 ? 'warn' : 'good';
  const cashTone: TurnRecapTone = lastMonth.cashDelta >= 0 ? 'good' : 'warn';
  const marketTone: TurnRecapTone = marketMove > 0 ? 'good' : marketMove < 0 ? 'warn' : 'neutral';
  const overallTone: TurnRecapTone = currentScenario || netCashflow < 0 || lifeTone === 'warn'
    ? 'warn'
    : cashTone === 'good' || marketTone === 'good'
      ? 'good'
      : 'neutral';

  const planLabel = secondaryAction
    ? `${primaryAction?.label ?? 'Monthly plan'} + ${secondaryAction.label}`
    : primaryAction?.label ?? 'Monthly plan';
  const recapLabel = lastMonth.ownershipForkLabel ?? lastMonth.monthlyIntentLabel ?? planLabel;
  const breakdown = lastMonth.incomeBreakdown ?? createInitialLifeIncomeBreakdown();

  return {
    title: `Last month: ${recapLabel}`,
    summary: buildSummary(lastMonth, netCashflow, market.lastHeadline),
    nextHint: currentScenario
      ? 'A scenario appeared. Resolve it before advancing again.'
      : getNextHint(lastMonth, player, netCashflow),
    tone: overallTone,
    facts: [
      {
        label: getCashFactLabel(lastMonth.monthlyIntentTrack),
        value: formatSignedCurrency(lastMonth.cashDelta),
        detail: buildIncomeBreakdownDetail(breakdown),
        tone: cashTone,
      },
      {
        label: 'Energy / stress',
        value: `${formatSignedNumber(lastMonth.energyDelta)} / ${formatSignedNumber(lastMonth.stressDelta)}`,
        detail: 'Energy first, stress second',
        tone: lifeTone,
      },
      {
        label: 'Market move',
        value: formatSignedPercent(marketMove),
        detail: market.lastHeadline ?? 'No major market headline',
        tone: marketTone,
      },
      {
        label: 'Current surplus',
        value: formatCurrency(netCashflow),
        detail: 'After life, debt, property costs, and household load',
        tone: netCashflow >= 0 ? 'good' : 'warn',
      },
    ],
    notes: lastMonth.notes.slice(0, 3),
  };
}

function buildSummary(lastMonth: Player['life']['lastMonthSummary'], netCashflow: number, headline?: string | null): string {
  const cashDelta = lastMonth?.cashDelta ?? 0;
  const cashPhrase = cashDelta >= 0
    ? `Your plan added ${formatCurrency(cashDelta)} before normal salary and costs.`
    : `Your plan spent ${formatCurrency(Math.abs(cashDelta))} before normal salary and costs.`;
  const cashflowPhrase = netCashflow >= 0
    ? `The run is currently generating ${formatCurrency(netCashflow)}/mo.`
    : `The run is currently burning ${formatCurrency(Math.abs(netCashflow))}/mo.`;
  const intentPhrase = getIntentSummaryPrefix(lastMonth?.monthlyIntentTrack);
  return headline
    ? `${intentPhrase} ${cashPhrase} ${cashflowPhrase} Market note: ${headline}.`
    : `${intentPhrase} ${cashPhrase} ${cashflowPhrase}`;
}

function buildIncomeBreakdownDetail(breakdown: ReturnType<typeof createInitialLifeIncomeBreakdown>): string {
  const sources: string[] = [];

  if (breakdown.sideGig > 0) sources.push(`gig ${formatCurrency(breakdown.sideGig)}`);
  if (breakdown.propertyHustle > 0) sources.push(`hustle ${formatCurrency(breakdown.propertyHustle)}`);
  if (breakdown.schemes > 0) sources.push(`schemes ${formatCurrency(breakdown.schemes)}`);
  if (breakdown.focusAtWork > 0) sources.push(`work bonus ${formatCurrency(breakdown.focusAtWork)}`);
  if (breakdown.upskillCost < 0) sources.push(`training ${formatCurrency(Math.abs(breakdown.upskillCost))} cost`);
  if (breakdown.householdSupportCost < 0) sources.push(`household ${formatCurrency(Math.abs(breakdown.householdSupportCost))} cost`);

  return sources.length > 0 ? sources.join(' | ') : 'No extra life-income sources resolved last month';
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return 'S$0';
  return `${value > 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`;
}

function formatSignedNumber(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatSignedPercent(value: number): string {
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${formatPercent(value, 1)}`;
}

function getIntentSummaryPrefix(track: NonNullable<Player['life']['lastMonthSummary']>['monthlyIntentTrack'] | null | undefined): string {
  switch (track) {
    case 'market':
      return 'You spent the month studying target districts and exit timing.';
    case 'home-project':
      return 'You treated the month as home-improvement and sale-readiness time.';
    case 'tenant':
      return 'You used the month to make the owned home work harder for you.';
    case 'income':
      return 'You used the month to build next-home buying power.';
    case 'career':
      return 'You used the month to improve your future earning path.';
    case 'recovery':
      return 'You used the month to stabilize energy before the next push.';
    default:
      return 'You followed the selected monthly plan.';
  }
}

function getNextHint(
  lastMonth: NonNullable<Player['life']['lastMonthSummary']>,
  player: Player,
  netCashflow: number,
): string {
  if (netCashflow < 0) {
    return 'Next best move: stabilize monthly cashflow before adding risk.';
  }
  switch (lastMonth.monthlyIntentTrack) {
    case 'tenant':
      return 'Next best move: review portfolio operations, then roll the next month.';
    case 'home-project':
      return 'Next best move: check property progress or reserve cover before advancing again.';
    case 'market':
      return 'Next best move: compare target districts or continue until the next notable month.';
    case 'income':
      return 'Next best move: keep building runway or pressure-test the next target.';
    case 'recovery':
      return 'Next best move: re-enter a growth month once energy is back.';
    default:
      return player.properties.length === 0
        ? 'Next best move: compare starter homes or build more buying power.'
        : 'Next best move: review portfolio operations, then roll the next month.';
  }
}

function getCashFactLabel(track: NonNullable<Player['life']['lastMonthSummary']>['monthlyIntentTrack'] | null | undefined): string {
  switch (track) {
    case 'market':
      return 'Planning-month cash';
    case 'home-project':
      return 'Home-project cash';
    case 'tenant':
      return 'Ops-month cash';
    case 'income':
      return 'Runway cash';
    case 'career':
      return 'Career-month cash';
    case 'recovery':
      return 'Recovery-month cash';
    default:
      return 'Life action cash';
  }
}
