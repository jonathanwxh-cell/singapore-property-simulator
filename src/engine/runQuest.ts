import type { Player } from '@/game/types';
import { selectAvailableCash, selectMonthlyNetCashflow } from './selectors';
import { resolveStarterPropertyRoute } from './firstHomeStarter';
import { TAKE_HOME_RATIO } from './constants';

export type FirstRunQuestStepId =
  | 'choose-monthly-intent'
  | 'compare-starter-home'
  | 'practice-purchase'
  | 'operate-first-home';

export interface FirstRunQuestStep {
  id: FirstRunQuestStepId;
  label: string;
  detail: string;
  route: string;
  completed: boolean;
  rewardLabel: string;
}

export interface RewardBeat {
  title: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
}

export interface FirstRunQuest {
  title: string;
  beginnerHint: string;
  progressPct: number;
  activeStep: FirstRunQuestStep | null;
  steps: FirstRunQuestStep[];
  rewardBeat: RewardBeat | null;
}

export function getFirstRunQuest(player: Player, currentScenario: string | null): FirstRunQuest {
  const hasHome = player.firstHomePurchased || player.properties.length > 0;
  const hasTenantOrReserve = player.properties.some((property) => property.tenant || property.isRented)
    || (player.reserve?.allocatedCash ?? 0) >= 5_000;
  const hasCompared = player.turnCount > 1 || hasHome;
  const hasPracticed = player.turnCount > 2 || hasHome;

  const steps: FirstRunQuestStep[] = [
    {
      id: 'choose-monthly-intent',
      label: 'Pick 1 monthly plan',
      detail: 'Choose Earn, Buy, Own, or Learn. Time moves only when you advance.',
      route: '/dashboard',
      completed: player.turnCount > 0 || hasHome,
      rewardLabel: '+ confidence',
    },
    {
      id: 'compare-starter-home',
      label: 'Compare starter homes',
      detail: 'Look at cash, CPF, duties, monthly surplus, and worst case side by side.',
      route: '/properties',
      completed: hasCompared,
      rewardLabel: '+ clarity',
    },
    {
      id: 'practice-purchase',
      label: 'Practice a deal',
      detail: 'Open the starter home and simulate the buy before committing.',
      route: resolveStarterPropertyRoute(player.buyerProfile),
      completed: hasPracticed,
      rewardLabel: '+ readiness',
    },
    {
      id: 'operate-first-home',
      label: 'Make ownership active',
      detail: 'After buying, set reserve, room-rent during MOP, or plan the first repair/upgrade.',
      route: '/portfolio',
      completed: hasHome && hasTenantOrReserve,
      rewardLabel: '+ cashflow',
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const activeStep = currentScenario
    ? {
        id: 'choose-monthly-intent' as const,
        label: 'Resolve the scenario first',
        detail: 'A scenario is waiting. Make that choice before the quest continues.',
        route: '/scenarios',
        completed: false,
        rewardLabel: '+ focus',
      }
    : steps.find((step) => !step.completed) ?? null;

  return {
    title: 'First 3 Moves Quest',
    beginnerHint: 'Follow one next action at a time. The advanced systems stay available, but they do not need to be solved all at once.',
    progressPct: Math.round((completedCount / steps.length) * 100),
    activeStep,
    steps,
    rewardBeat: getRewardBeat(player),
  };
}

function getRewardBeat(player: Player): RewardBeat | null {
  const tenant = player.properties.find((property) => property.tenant);
  if (tenant?.tenant) {
    return {
      title: 'First tenant online',
      detail: `S$${tenant.tenant.contractedRent.toLocaleString()}/mo contracted with ${tenant.tenant.satisfaction}/100 satisfaction.`,
      tone: 'good',
    };
  }

  const latestOperation = player.operationHistory?.[0];
  if (latestOperation?.tone === 'good') {
    return {
      title: latestOperation.title,
      detail: latestOperation.detail,
      tone: 'good',
    };
  }

  if (player.firstHomePurchased || player.properties.length > 0) {
    return {
      title: 'First home secured',
      detail: 'Ownership unlocked landlord ops, reserves, renovations, MOP planning, and eventual upgrade timing.',
      tone: 'good',
    };
  }

  const lastMonth = player.life.lastMonthSummary;
  if (lastMonth && lastMonth.cashDelta > 0) {
    return {
      title: 'Side income landed',
      detail: `Last month added S$${lastMonth.cashDelta.toLocaleString()} before the next housing decision.`,
      tone: 'good',
    };
  }

  const monthlyNet = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  if (player.turnCount > 0 && monthlyNet > 0) {
    return {
      title: 'Positive cashflow month',
      detail: `You kept S$${monthlyNet.toLocaleString()}/mo of breathing room. Available cash is S$${selectAvailableCash(player).toLocaleString()}.`,
      tone: 'good',
    };
  }

  if (player.turnCount > 0 && monthlyNet < 0) {
    return {
      title: 'Cashflow warning',
      detail: 'The run is still alive, but the next best move should protect monthly surplus.',
      tone: 'warn',
    };
  }

  return null;
}
