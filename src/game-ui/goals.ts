// Near-term goal ladder — the "micro-win" layer that gives the distant freedom
// target some closer rungs. Pure/derived from player state; not an engine rule.
import { difficultySettings, type Player } from '@/game/types';
import { selectNetWorth, selectMonthlyRentalIncome } from '@/engine/selectors';

export interface Goal {
  id: string;
  emoji: string;
  label: string;
  reward: string;
  done: boolean;
  /** 0..1 progress toward this rung */
  progress: number;
}

interface GoalSpec {
  id: string;
  emoji: string;
  label: string;
  reward: string;
  done: (p: Player, net: number) => boolean;
  progress: (p: Player, net: number) => number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function getGoalLadder(player: Player): GoalSpec[] {
  const target = difficultySettings[player.difficulty].targetNetWorth;
  return [
    {
      id: 'first-home', emoji: '🔑', label: 'Buy your first home', reward: 'Homeowner status',
      done: (p) => p.properties.length >= 1,
      // never read 100% before you actually own — cap pre-purchase at 90%
      progress: (p) => (p.properties.length >= 1 ? 1 : Math.min(0.9, clamp01(p.cash / 25_000))),
    },
    {
      id: 'nw-250k', emoji: '💵', label: 'Reach $250k net worth', reward: 'On the ladder',
      done: (_p, net) => net >= 250_000,
      progress: (_p, net) => clamp01(net / 250_000),
    },
    {
      id: 'two-places', emoji: '🏘️', label: 'Own 2 properties', reward: 'Mini-landlord',
      done: (p) => p.properties.length >= 2,
      progress: (p) => clamp01(p.properties.length / 2),
    },
    {
      id: 'first-rent', emoji: '🏠', label: 'Collect your first rent', reward: 'Passive income unlocked',
      done: (p) => p.totalRentalIncome > 0,
      progress: (p) => (p.totalRentalIncome > 0 ? 1 : selectMonthlyRentalIncome(p) > 0 ? 0.6 : p.properties.length ? 0.3 : 0),
    },
    {
      id: 'nw-500k', emoji: '📈', label: 'Reach $500k net worth', reward: 'Halfway to a million',
      done: (_p, net) => net >= 500_000,
      progress: (_p, net) => clamp01(net / 500_000),
    },
    {
      id: 'millionaire', emoji: '💰', label: 'Become a millionaire', reward: 'Seven figures',
      done: (_p, net) => net >= 1_000_000,
      progress: (_p, net) => clamp01(net / 1_000_000),
    },
    {
      id: 'four-places', emoji: '🏢', label: 'Own 4 properties', reward: 'Property investor',
      done: (p) => p.properties.length >= 4,
      progress: (p) => clamp01(p.properties.length / 4),
    },
    {
      id: 'nw-quarter', emoji: '🚀', label: `Reach ${money(target * 0.25)} net worth`, reward: 'Quarter of the way',
      done: (_p, net) => net >= target * 0.25,
      progress: (_p, net) => clamp01(net / (target * 0.25)),
    },
    {
      id: 'nw-half', emoji: '🌟', label: `Reach ${money(target * 0.5)} net worth`, reward: 'Halfway to freedom',
      done: (_p, net) => net >= target * 0.5,
      progress: (_p, net) => clamp01(net / (target * 0.5)),
    },
    {
      id: 'freedom', emoji: '🏆', label: 'Reach financial freedom', reward: 'You win',
      done: (_p, net) => net >= target,
      progress: (_p, net) => clamp01(net / target),
    },
  ];
}

function money(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  return `$${Math.round(v / 1000)}k`;
}

export function getGoals(player: Player): Goal[] {
  const net = selectNetWorth(player);
  return getGoalLadder(player).map((g) => ({
    id: g.id, emoji: g.emoji, label: g.label, reward: g.reward,
    done: g.done(player, net), progress: g.progress(player, net),
  }));
}

/** The current rung to chase: the first not-yet-done goal. */
export function getCurrentGoal(player: Player): Goal | null {
  return getGoals(player).find((g) => !g.done) ?? null;
}

export function completedGoalCount(player: Player): number {
  return getGoals(player).filter((g) => g.done).length;
}

/** Returns the goal(s) newly completed between two states (for celebration). */
export function newlyCompletedGoals(before: Player, after: Player): Goal[] {
  const net = selectNetWorth(after);
  const beforeNet = selectNetWorth(before);
  return getGoalLadder(after)
    .filter((g) => !g.done(before, beforeNet) && g.done(after, net))
    .map((g) => ({ id: g.id, emoji: g.emoji, label: g.label, reward: g.reward, done: true, progress: 1 }));
}
