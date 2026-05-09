import type { MonthlyIntentOption } from './monthlyIntents';
import { getMonthlyIntentOptions } from './monthlyIntents';
import type { CommandCenterState, VitalMetric } from './commandCenter';
import { getCommandCenterState } from './commandCenter';
import { getLifeCampaign, type LifeCampaignTone } from './lifeCampaign';
import { HDB_MOP_MONTHS } from './constants';
import type { Player } from '@/game/types';

export type PlaySurfaceSceneId = 'first-home-search' | 'home-season' | 'portfolio-life' | 'decision-point';
export type PlaySurfaceStageStatus = 'past' | 'current' | 'future';

export interface PlaySurfaceScene {
  id: PlaySurfaceSceneId;
  label: string;
  detail: string;
}

export interface PlaySurfacePrompt {
  title: string;
  detail: string;
  why: string;
  urgency: CommandCenterState['objective']['urgency'];
}

export interface PlaySurfaceStage {
  id: 'foundation' | 'first-home' | 'home-season' | 'upgrade-window' | 'legacy';
  label: string;
  detail: string;
  status: PlaySurfaceStageStatus;
  progressPct: number;
}

export interface PlaySurfaceChoice {
  id: string;
  kind: 'intent' | 'route';
  label: string;
  detail: string;
  upside: string;
  risk: string;
  route: string;
  recommended: boolean;
  tone: MonthlyIntentOption['tone'] | LifeCampaignTone;
  primaryLabel: string;
  secondaryLabel: string;
  intentId?: MonthlyIntentOption['id'];
}

export interface PlaySurfaceState {
  label: 'Life Board';
  title: string;
  subtitle: string;
  monthLabel: string;
  scene: PlaySurfaceScene;
  prompt: PlaySurfacePrompt;
  timeline: PlaySurfaceStage[];
  metrics: VitalMetric[];
  choices: PlaySurfaceChoice[];
  financeModeLabel: string;
  financeModeDetail: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getPlaySurfaceState({
  player,
  currentScenario = null,
}: {
  player: Player;
  currentScenario?: string | null;
}): PlaySurfaceState {
  const commandState = getCommandCenterState(player, currentScenario);
  const campaign = getLifeCampaign(player, currentScenario);
  const activeMopHome = player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0);
  const scene = getScene(player, currentScenario, activeMopHome?.mopRemainingMonths ?? 0);
  const choices = currentScenario
    ? [scenarioChoice(commandState)]
    : getMonthlyIntentOptions(player).map(intentToChoice);

  return {
    label: 'Life Board',
    title: commandState.objective.title,
    subtitle: getSubtitle(player, campaign.storyBeat.detail, activeMopHome?.mopRemainingMonths ?? null),
    monthLabel: `${monthNames[player.month - 1]} ${player.year}`,
    scene,
    prompt: {
      title: campaign.storyBeat.title,
      detail: commandState.objective.detail,
      why: commandState.objective.why,
      urgency: commandState.objective.urgency,
    },
    timeline: getTimeline(player, activeMopHome?.mopRemainingMonths ?? null, campaign.chapter.progressPct),
    metrics: commandState.vitalMetrics,
    choices,
    financeModeLabel: 'Inspect finances',
    financeModeDetail: 'Open the deeper numbers only when the decision needs them.',
  };
}

function getScene(player: Player, currentScenario: string | null, mopMonthsRemaining: number): PlaySurfaceScene {
  if (currentScenario) {
    return {
      id: 'decision-point',
      label: 'Decision point',
      detail: 'A scenario is waiting. Choose a response before time moves.',
    };
  }

  if (mopMonthsRemaining > 0) {
    return {
      id: 'home-season',
      label: 'Home season',
      detail: `${mopMonthsRemaining} MOP month(s) left. Make the wait productive.`,
    };
  }

  if (player.properties.length === 0) {
    return {
      id: 'first-home-search',
      label: 'Viewing weekend',
      detail: 'Cash, CPF, and eligibility are lining up for the first home.',
    };
  }

  return {
    id: 'portfolio-life',
    label: 'Ownership life',
    detail: 'Operate the homes, protect cashflow, and decide what this life is becoming.',
  };
}

function getSubtitle(player: Player, storyBeatDetail: string, mopMonthsRemaining: number | null): string {
  if (mopMonthsRemaining !== null && mopMonthsRemaining > 0) {
    return `${storyBeatDetail} MOP is not dead time; it is your home season.`;
  }

  if (player.properties.length === 0) {
    return `${storyBeatDetail} Pick one playable move before opening the full rulebook.`;
  }

  return `${storyBeatDetail} Keep the life story moving while the finance engine runs underneath.`;
}

function getTimeline(player: Player, mopMonthsRemaining: number | null, chapterProgressPct: number): PlaySurfaceStage[] {
  const hasHome = player.properties.length > 0;
  const activeMop = mopMonthsRemaining !== null && mopMonthsRemaining > 0;
  const mopProgress = mopMonthsRemaining === null
    ? 0
    : Math.min(100, Math.max(0, Math.round(((HDB_MOP_MONTHS - mopMonthsRemaining) / HDB_MOP_MONTHS) * 100)));

  return [
    {
      id: 'foundation',
      label: 'Foundation',
      detail: player.turnCount <= 1 ? 'Start here' : 'Runway built',
      status: player.turnCount <= 1 && !hasHome ? 'current' : 'past',
      progressPct: player.turnCount <= 1 && !hasHome ? 25 : 100,
    },
    {
      id: 'first-home',
      label: 'First Home',
      detail: hasHome ? 'Keys collected' : 'Find the first fit',
      status: hasHome ? 'past' : player.turnCount > 1 ? 'current' : 'future',
      progressPct: hasHome ? 100 : Math.min(85, Math.max(15, chapterProgressPct)),
    },
    {
      id: 'home-season',
      label: 'Home Season',
      detail: activeMop ? `${mopMonthsRemaining} MOP months left` : hasHome ? 'MOP clear or not applicable' : 'Unlock after first home',
      status: activeMop ? 'current' : hasHome ? 'past' : 'future',
      progressPct: activeMop ? mopProgress : hasHome ? 100 : 0,
    },
    {
      id: 'upgrade-window',
      label: 'Upgrade Window',
      detail: hasHome && !activeMop ? 'Next move is open' : 'Prepare the next move',
      status: hasHome && !activeMop ? 'current' : 'future',
      progressPct: hasHome && !activeMop ? Math.min(85, Math.max(25, chapterProgressPct)) : 0,
    },
    {
      id: 'legacy',
      label: 'Legacy',
      detail: 'Ending and replay identity',
      status: 'future',
      progressPct: 0,
    },
  ];
}

function intentToChoice(intent: MonthlyIntentOption): PlaySurfaceChoice {
  return {
    id: intent.id,
    kind: 'intent',
    label: intent.label,
    detail: intent.detail,
    upside: intent.upside,
    risk: intent.risk,
    route: intent.route,
    recommended: intent.recommended,
    tone: intent.tone,
    primaryLabel: 'Do + Advance Month',
    secondaryLabel: 'Inspect first',
    intentId: intent.id,
  };
}

function scenarioChoice(commandState: CommandCenterState): PlaySurfaceChoice {
  return {
    id: commandState.objective.id,
    kind: 'route',
    label: commandState.objective.title,
    detail: commandState.objective.detail,
    upside: 'Keeps the run moving',
    risk: 'Choice can change money, stress, credit, or property values',
    route: commandState.objective.primaryRoute ?? '/scenarios',
    recommended: true,
    tone: 'warn',
    primaryLabel: 'Choose response',
    secondaryLabel: 'Review context',
  };
}
