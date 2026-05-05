import { scenarios } from '@/data/scenarios';
import type { Player } from '@/game/types';
import { formatCurrency } from '@/lib/format';
import { TAKE_HOME_RATIO } from './constants';
import { getNextBestMoves, type CoachMove, type CoachUrgency } from './decisionCoach';
import {
  selectAvailableCash,
  selectMonthlyNetCashflow,
  selectReservedCash,
} from './selectors';

export interface CommandCenterAction {
  label: string;
  route: string;
}

export interface CommandCenterObjective {
  id: string;
  title: string;
  detail: string;
  why: string;
  primaryActionLabel: string;
  primaryRoute?: string;
  secondaryActions: CommandCenterAction[];
  urgency: CoachUrgency;
}

export interface AdvanceMonthState {
  label: 'Next Month' | 'Resolve First';
  detail: string;
  route?: string;
  disabled?: boolean;
  tone: 'ready' | 'blocked' | 'warn';
}

export interface VitalMetric {
  id: 'available-cash' | 'monthly-surplus' | 'readiness';
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface CommandCenterState {
  objective: CommandCenterObjective;
  advance: AdvanceMonthState;
  vitalMetrics: VitalMetric[];
  panelDefaults: Record<string, 'open' | 'collapsed'>;
}

export function getCommandCenterState(player: Player, currentScenario: string | null = null): CommandCenterState {
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const availableCash = selectAvailableCash(player);
  const openIssueProperty = player.properties.find((property) => (property.openMaintenanceIssues?.length ?? 0) > 0);
  const urgentIssueCount = player.properties.reduce((sum, property) => {
    return sum + (property.openMaintenanceIssues?.filter((issue) => issue.severity === 'urgent').length ?? 0);
  }, 0);
  const moves = getNextBestMoves({ player, currentScenario });
  const objective = buildObjective({
    player,
    currentScenario,
    monthlySurplus,
    availableCash,
    openIssuePropertyId: openIssueProperty?.propertyId,
    moves,
  });
  const hasWarnings = monthlySurplus < 0 || urgentIssueCount > 0 || availableCash < Math.max(10_000, player.salary * 1.5);

  return {
    objective,
    advance: currentScenario
      ? {
          label: 'Resolve First',
          detail: 'A scenario choice is waiting. Resolve it before the next month rolls.',
          route: '/scenarios',
          tone: 'blocked',
        }
      : {
          label: 'Next Month',
          detail: hasWarnings
            ? 'You can advance, but the command center has a risk to review first.'
            : 'Plan looks stable. Advance one month when ready.',
          tone: hasWarnings ? 'warn' : 'ready',
        },
    vitalMetrics: buildVitalMetrics(player, currentScenario, monthlySurplus, availableCash, urgentIssueCount),
    panelDefaults: {
      market: 'collapsed',
      route: 'collapsed',
      coach: 'collapsed',
      firstHome: 'collapsed',
      rules: 'collapsed',
      operations: openIssueProperty || urgentIssueCount > 0 ? 'open' : 'collapsed',
      cashflow: monthlySurplus < 0 ? 'open' : 'collapsed',
      portfolio: 'collapsed',
      life: 'collapsed',
      secondaryLife: 'collapsed',
      helperPanels: 'collapsed',
      achievements: 'collapsed',
      filters: 'collapsed',
    },
  };
}

function buildObjective({
  player,
  currentScenario,
  monthlySurplus,
  availableCash,
  openIssuePropertyId,
  moves,
}: {
  player: Player;
  currentScenario: string | null;
  monthlySurplus: number;
  availableCash: number;
  openIssuePropertyId?: string;
  moves: CoachMove[];
}): CommandCenterObjective {
  if (currentScenario) {
    const scenario = scenarios.find((candidate) => candidate.id === currentScenario);
    return {
      id: 'resolve-scenario',
      title: scenario ? `Resolve ${scenario.title}` : 'Resolve active scenario',
      detail: 'A choice is waiting and it can change cash, salary, credit, or property values.',
      why: 'Modern runs stay readable when blockers become one clear mission instead of hidden disabled buttons.',
      primaryActionLabel: 'Open Scenario',
      primaryRoute: '/scenarios',
      secondaryActions: [{ label: 'Review Home', route: '/dashboard' }],
      urgency: 'critical',
    };
  }

  if (monthlySurplus < 0 || availableCash < 5_000) {
    return {
      id: 'stabilize-cashflow',
      title: 'Stabilize this month before bigger moves',
      detail: monthlySurplus < 0
        ? `Monthly surplus is ${formatCurrency(monthlySurplus)}. Adjust life actions, household load, or debt before adding risk.`
        : `Spendable cash is down to ${formatCurrency(availableCash)}. Build runway before the next major commitment.`,
      why: 'Cashflow is the oxygen meter of this game. When it flashes red, every other system gets harder.',
      primaryActionLabel: 'Plan Cash Month',
      primaryRoute: '/life',
      secondaryActions: [
        { label: 'Review Loans', route: '/bank' },
        { label: 'See Portfolio', route: '/portfolio' },
      ],
      urgency: 'warn',
    };
  }

  if (openIssuePropertyId) {
    return {
      id: 'repair-open-issue',
      title: 'Handle property attention first',
      detail: 'A repair or landlord issue is active. Fixing it protects tenant happiness, value, and monthly stability.',
      why: 'Good tycoon games make upkeep visible before it becomes invisible punishment.',
      primaryActionLabel: 'Review Repairs',
      primaryRoute: `/property/${openIssuePropertyId}`,
      secondaryActions: [
        { label: 'Open Portfolio', route: '/portfolio' },
        { label: 'Set Reserve', route: '/portfolio' },
      ],
      urgency: 'warn',
    };
  }

  const primaryMove = moves[0] ?? null;
  if (!primaryMove) {
    return {
      id: 'advance-month',
      title: 'Advance when ready',
      detail: 'No urgent decision is waiting. Roll the calendar to reveal income, costs, scenarios, and market movement.',
      why: 'The month button is the heartbeat. Use it when your plan is set.',
      primaryActionLabel: 'Review Dashboard',
      primaryRoute: '/dashboard',
      secondaryActions: [],
      urgency: 'neutral',
    };
  }

  return moveToObjective(primaryMove, moves.slice(1, 3), player);
}

function moveToObjective(move: CoachMove, secondaryMoves: CoachMove[], player: Player): CommandCenterObjective {
  const whyByMove: Record<string, string> = {
    'buy-first-home': 'Buying is the first major verb. Compare starter homes before opening every advanced system.',
    'prepare-first-home': 'The property ladder is easier when income, CPF, and cash buffer have a visible next step.',
    'activate-rental': 'Owned assets should either support your life or create income. Vacant units are a teaching moment.',
    'repair-open-issue': 'Repairs protect value and tenant satisfaction before they quietly snowball.',
    'build-buffer': 'A buffer makes Singapore property decisions feel strategic instead of brittle.',
    'advance-month': 'If the plan is set, the best move is to let the simulation breathe.',
  };

  return {
    id: move.id,
    title: move.title,
    detail: move.detail,
    why: whyByMove[move.id] ?? (player.properties.length === 0
      ? 'This keeps the first-home climb readable without hiding the deeper simulation.'
      : 'This is the highest-signal move for the current portfolio and life state.'),
    primaryActionLabel: move.actionLabel,
    primaryRoute: move.route,
    secondaryActions: secondaryMoves
      .filter((candidate) => candidate.id !== 'advance-month')
      .map((candidate) => ({
        label: candidate.actionLabel,
        route: candidate.route,
      })),
    urgency: move.urgency,
  };
}

function buildVitalMetrics(
  player: Player,
  currentScenario: string | null,
  monthlySurplus: number,
  availableCash: number,
  urgentIssueCount: number,
): VitalMetric[] {
  const reservedCash = selectReservedCash(player);
  const readiness = currentScenario
    ? { value: 'Blocked', detail: 'Resolve scenario first', tone: 'bad' as const }
    : urgentIssueCount > 0
      ? { value: 'Repair Due', detail: `${urgentIssueCount} urgent issue(s)`, tone: 'warn' as const }
      : player.properties.length === 0
        ? { value: 'First Home', detail: 'Use Buy when ready', tone: 'neutral' as const }
        : { value: 'Operating', detail: `${player.properties.length} owned`, tone: 'good' as const };

  return [
    {
      id: 'available-cash',
      label: 'Spendable Cash',
      value: formatCurrency(availableCash),
      detail: reservedCash > 0 ? `${formatCurrency(reservedCash)} reserved` : 'No reserve set',
      tone: availableCash < Math.max(10_000, player.salary * 1.5) ? 'warn' : 'good',
    },
    {
      id: 'monthly-surplus',
      label: 'Monthly Surplus',
      value: formatCurrency(monthlySurplus),
      detail: monthlySurplus >= 0 ? 'After life, debt, and property costs' : 'Burn rate needs attention',
      tone: monthlySurplus >= 0 ? 'good' : 'bad',
    },
    {
      id: 'readiness',
      label: 'Readiness',
      value: readiness.value,
      detail: readiness.detail,
      tone: readiness.tone,
    },
  ];
}
