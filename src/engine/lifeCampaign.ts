import { scenarios } from '@/data/scenarios';
import { difficultySettings, normalizeBuyerProfile, type Player, type RunRoutePhase } from '@/game/types';
import { HDB_MOP_MONTHS, TAKE_HOME_RATIO } from './constants';
import { getNextBestMoves, type CoachUrgency } from './decisionCoach';
import { getFirstRunQuest } from './runQuest';
import { getRunArc } from './runDirector';
import {
  selectAvailableCash,
  selectMonthlyExpenses,
  selectMonthlyNetCashflow,
  selectNetWorth,
  selectReservedCash,
} from './selectors';

export type LifeCampaignTone = 'good' | 'warn' | 'bad' | 'neutral';

export interface LifeCampaignMission {
  label: string;
  detail: string;
  route: string;
  actionLabel: string;
  tone: LifeCampaignTone;
  progressPct: number;
}

export interface LifeCampaignChapter {
  id: RunRoutePhase;
  label: string;
  theme: string;
  progressPct: number;
}

export interface LifeCampaignStoryBeat {
  title: string;
  detail: string;
  tone: LifeCampaignTone;
}

export interface LifeCampaignScore {
  stability: number;
  wealth: number;
  learning: number;
  stress: number;
  overall: number;
}

export interface LifeCampaign {
  id: string;
  title: string;
  subtitle: string;
  chapter: LifeCampaignChapter;
  activeMission: LifeCampaignMission;
  storyBeat: LifeCampaignStoryBeat;
  score: LifeCampaignScore;
  nextChapterLabel: string;
  replayHint: string;
  routeColor: string;
}

const chapterLabels: Record<RunRoutePhase, string> = {
  foundation: 'Foundation',
  acquisition: 'First Home',
  ownership: 'Ownership Pressure',
  expansion: 'Upgrade Or Defend',
  legacy: 'Legacy',
};

const nextChapterLabels: Record<RunRoutePhase, string> = {
  foundation: 'First Home',
  acquisition: 'Ownership Pressure',
  ownership: 'Upgrade Or Defend',
  expansion: 'Legacy',
  legacy: 'Replay',
};

export function getLifeCampaign(player: Player, currentScenario: string | null): LifeCampaign {
  const arc = getRunArc(player);
  const quest = getFirstRunQuest(player, currentScenario);
  const chapterId = deriveCampaignChapter(player, arc.phase);
  const chapter: LifeCampaignChapter = {
    id: chapterId,
    label: chapterLabels[chapterId],
    theme: getChapterTheme(player, chapterId),
    progressPct: getChapterProgress(player, chapterId, arc.progressPct, quest.progressPct),
  };

  return {
    id: arc.route.id,
    title: getCampaignTitle(player, arc.route.label),
    subtitle: getCampaignSubtitle(player, arc.route.tagline),
    chapter,
    activeMission: getActiveMission(player, currentScenario, chapterId, arc.activeMilestone?.progressPct ?? 0),
    storyBeat: getStoryBeat(player, currentScenario, chapterId),
    score: getCampaignScore(player, arc.progressPct, quest.progressPct),
    nextChapterLabel: nextChapterLabels[chapterId],
    replayHint: getReplayHint(player, arc.route.shortLabel),
    routeColor: arc.route.accentColor,
  };
}

function deriveCampaignChapter(player: Player, routePhase: RunRoutePhase): RunRoutePhase {
  if (player.turnCount <= 1 && player.properties.length === 0) return 'foundation';
  if (player.properties.length === 0) return 'acquisition';
  if (routePhase === 'foundation' || routePhase === 'acquisition') return 'ownership';
  return routePhase;
}

function getActiveMission(
  player: Player,
  currentScenario: string | null,
  chapterId: RunRoutePhase,
  activeMilestoneProgress: number,
): LifeCampaignMission {
  if (currentScenario) {
    const scenario = scenarios.find((candidate) => candidate.id === currentScenario);
    return {
      label: scenario ? `Resolve scenario: ${scenario.title}` : 'Resolve active scenario',
      detail: 'This choice can move cash, salary, credit, property value, or stress. Make it before rolling the month.',
      route: '/scenarios',
      actionLabel: 'Choose Response',
      tone: 'warn',
      progressPct: 0,
    };
  }

  if (chapterId === 'foundation' && player.properties.length === 0) {
    return {
      label: 'Choose one life move before shopping hard',
      detail: 'Pick a cash, career, scheme, or recovery action so the month has intent instead of becoming pure waiting.',
      route: '/life',
      actionLabel: 'Plan Month',
      tone: 'good',
      progressPct: Math.min(95, player.turnCount * 50),
    };
  }

  const urgentIssueProperty = player.properties.find((property) => (property.openMaintenanceIssues?.length ?? 0) > 0);
  if (urgentIssueProperty) {
    return {
      label: 'Handle the property issue first',
      detail: 'A repair or tenant issue is active. Fixing it protects value, satisfaction, and cashflow.',
      route: `/property/${urgentIssueProperty.propertyId}`,
      actionLabel: 'Review Issue',
      tone: 'warn',
      progressPct: 35,
    };
  }

  const mopHome = player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0);
  if (mopHome && chapterId === 'ownership') {
    return {
      label: 'Make MOP months active',
      detail: 'Use reserves, room rental, renovations, or life-income moves so five years does not become dead clicking.',
      route: '/portfolio',
      actionLabel: 'Operate Home',
      tone: 'neutral',
      progressPct: Math.max(10, 100 - Math.round(((mopHome.mopRemainingMonths ?? 0) / HDB_MOP_MONTHS) * 100)),
    };
  }

  const move = getNextBestMoves({ player, currentScenario: null })[0];
  if (move) {
    return {
      label: move.title,
      detail: move.detail,
      route: move.route,
      actionLabel: move.actionLabel,
      tone: urgencyToTone(move.urgency),
      progressPct: activeMilestoneProgress,
    };
  }

  return {
    label: 'Advance the campaign month',
    detail: 'No urgent blocker is active. Roll the calendar after checking the monthly intent.',
    route: '/dashboard',
    actionLabel: 'Review Month',
    tone: 'neutral',
    progressPct: activeMilestoneProgress,
  };
}

function getCampaignTitle(player: Player, routeLabel: string): string {
  const profile = normalizeBuyerProfile(player.buyerProfile);
  if (profile.householdProfile === 'single-parent') return 'Shelter-First Family Campaign';
  if (profile.householdProfile === 'multi-gen-family') return 'Sandwich Family Campaign';
  if (profile.householdProfile === 'domestic-partners') return 'Private-Path Partnership Campaign';
  if (profile.householdProfile === 'foreigner-investor' || profile.residencyStatus === 'foreigner') return 'Global Capital Campaign';
  if (profile.age >= 55) return 'Rightsizing Stability Campaign';
  return `${routeLabel} Campaign`;
}

function getCampaignSubtitle(player: Player, routeTagline: string): string {
  const profile = normalizeBuyerProfile(player.buyerProfile);
  if (profile.householdProfile === 'single-parent') {
    return 'Win by securing shelter, protecting childcare runway, and avoiding fragile debt.';
  }
  if (profile.householdProfile === 'multi-gen-family') {
    return 'Balance space, elder support, children, and repairs without letting reserves evaporate.';
  }
  if (profile.householdProfile === 'domestic-partners') {
    return 'A private-first housing story about partnership, liquidity, and rules-aware alternatives.';
  }
  return routeTagline;
}

function getChapterTheme(player: Player, chapterId: RunRoutePhase): string {
  if (chapterId === 'foundation') return 'Build cashflow, understand rules, and choose one monthly intent.';
  if (chapterId === 'acquisition') return 'Compare deals without letting loan checks, CPF, and duties blur together.';
  if (chapterId === 'ownership') return 'Turn the owned home into an active operation: reserve, tenants, repairs, and MOP.';
  if (chapterId === 'expansion') return player.ownedPrivateHome
    ? 'Defend against over-leverage before chasing the next trophy asset.'
    : 'Decide whether upgrading, renting, or staying stable creates the better life.';
  return 'Close the run with resilient wealth, low stress, and a replay route worth trying.';
}

function getChapterProgress(player: Player, chapterId: RunRoutePhase, arcProgress: number, questProgress: number): number {
  if (chapterId === 'foundation') return Math.max(questProgress, Math.min(95, player.turnCount * 45));
  if (chapterId === 'acquisition') return player.properties.length > 0 ? 100 : Math.max(questProgress, Math.min(95, arcProgress));
  if (chapterId === 'ownership') {
    const mopHome = player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0);
    if (mopHome) return Math.max(10, 100 - Math.round(((mopHome.mopRemainingMonths ?? 0) / HDB_MOP_MONTHS) * 100));
  }
  return arcProgress;
}

function getStoryBeat(player: Player, currentScenario: string | null, chapterId: RunRoutePhase): LifeCampaignStoryBeat {
  if (currentScenario) {
    return {
      title: 'Story choice waiting',
      detail: 'Resolve the event first. Campaigns stay readable when the next dramatic choice is not hidden behind another tab.',
      tone: 'warn',
    };
  }

  const profile = normalizeBuyerProfile(player.buyerProfile);
  if (profile.householdProfile === 'single-parent') {
    return {
      title: 'Shelter runway matters',
      detail: 'This route treats housing as family security first, investment engine second. Protect cash before chasing upgrades.',
      tone: 'good',
    };
  }
  if (profile.householdProfile === 'multi-gen-family') {
    return {
      title: 'Family load is part of the mortgage',
      detail: 'Multi-gen runs test whether space, family support, repairs, and reserve discipline can coexist.',
      tone: 'neutral',
    };
  }
  if (profile.householdProfile === 'domestic-partners') {
    return {
      title: 'Rules-aware partnership',
      detail: 'The private-first route keeps partnership choices explicit instead of assuming every household fits the same HDB path.',
      tone: 'neutral',
    };
  }

  const mopHome = player.properties.find((property) => (property.mopRemainingMonths ?? 0) > 0);
  if (mopHome) {
    return {
      title: 'MOP chapter unlocked',
      detail: `There are ${mopHome.mopRemainingMonths} MOP month(s) left. The win is making this period productive, not just fast.`,
      tone: 'neutral',
    };
  }

  if (chapterId === 'foundation') {
    return {
      title: 'First moves set the tone',
      detail: 'A clean first month teaches players that Earn, Buy, Own, and Learn are choices, not homework tabs.',
      tone: 'good',
    };
  }

  return {
    title: 'Campaign director online',
    detail: 'The dashboard now turns the deeper simulation into one current chapter and one next mission.',
    tone: 'good',
  };
}

function getCampaignScore(player: Player, arcProgress: number, questProgress: number): LifeCampaignScore {
  const monthlyNet = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);
  const monthlyExpenses = Math.max(1, selectMonthlyExpenses(player) + player.life.householdLoad);
  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const reserveMonths = (availableCash + reservedCash) / monthlyExpenses;

  const stability = clampScore(45 + reserveMonths * 8 + (monthlyNet >= 0 ? 15 : -20) - player.bankruptcyStrikes * 20);
  const wealth = clampScore((netWorth / Math.max(500_000, target * 0.08)) * 100);
  const learning = clampScore((arcProgress * 0.55) + (questProgress * 0.45));
  const stress = clampScore(100 - player.life.stress);
  const overall = Math.round((stability + wealth + learning + stress) / 4);

  return { stability, wealth, learning, stress, overall };
}

function getReplayHint(player: Player, routeShortLabel: string): string {
  const profile = normalizeBuyerProfile(player.buyerProfile);
  if (profile.householdProfile === 'single-parent') return 'Next replay idea: try PR Private Climber to feel ABSD and private-market pressure.';
  if (profile.householdProfile === 'multi-gen-family') return 'Next replay idea: try Senior Rightsizer to compare stability-first choices.';
  if (profile.householdProfile === 'domestic-partners') return 'Next replay idea: try BTO Upgrader to compare how eligibility changes the early game.';
  return `Finish the ${routeShortLabel} arc, then replay as a different household to learn a new constraint.`;
}

function urgencyToTone(urgency: CoachUrgency): LifeCampaignTone {
  if (urgency === 'critical') return 'bad';
  if (urgency === 'warn') return 'warn';
  if (urgency === 'good') return 'good';
  return 'neutral';
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
