// Kiasu rivals — pure, deterministic social-comparison flavour derived from
// turn count. Not part of the financial engine; purely a motivation/identity
// layer ("your JC classmate already upgraded to a condo lah").
import type { Player } from '@/game/types';
import { difficultySettings } from '@/game/types';
import { selectNetWorth } from '@/engine/selectors';

export interface Rival {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  netWorth: number;
}

interface RivalSeed {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  start: number;
  growth: number; // annual
}

const RIVAL_SEEDS: RivalSeed[] = [
  { id: 'weiliang', name: 'Wei Liang', emoji: '🤓', blurb: 'Your kiasu JC classmate. Bought a condo before you finished telling NS stories.', start: 120_000, growth: 0.15 },
  { id: 'auntie', name: 'Auntie Tan', emoji: '🧧', blurb: 'Your neighbour. Owns three flats and a hawker stall. Always says she "just lucky".', start: 320_000, growth: 0.10 },
  { id: 'priya', name: 'Priya', emoji: '💼', blurb: 'Ex-colleague turned property agent. Flips units like she flips prata.', start: 80_000, growth: 0.19 },
];

/** Rivals scale gently with difficulty so the ambition matches your target. */
function rivalScale(player: Player): number {
  const target = difficultySettings[player.difficulty].targetNetWorth;
  return 0.6 + (target / 15_000_000) * 0.7;
}

export function getRivals(player: Player): Rival[] {
  const years = Math.max(0, player.turnCount / 12);
  const scale = rivalScale(player);
  return RIVAL_SEEDS.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    blurb: r.blurb,
    netWorth: Math.round(r.start * scale * Math.pow(1 + r.growth, years)),
  }));
}

export interface LeaderRow {
  name: string;
  emoji: string;
  netWorth: number;
  you: boolean;
}

export function getLeaderboard(player: Player): LeaderRow[] {
  const you: LeaderRow = { name: player.name || 'You', emoji: '⭐', netWorth: selectNetWorth(player), you: true };
  const rivals = getRivals(player).map((r) => ({ name: r.name, emoji: r.emoji, netWorth: r.netWorth, you: false }));
  return [...rivals, you].sort((a, b) => b.netWorth - a.netWorth);
}

export function playerRank(player: Player): { rank: number; of: number } {
  const board = getLeaderboard(player);
  return { rank: board.findIndex((r) => r.you) + 1, of: board.length };
}

/** Fired on a month advance: did the player just overtake a rival? */
export function rivalCrossing(beforeNet: number, afterNet: number, player: Player):
  | { emoji: string; title: string; body: string }
  | null {
  if (afterNet <= beforeNet) return null;
  const rivals = getRivals(player);
  // Highest rival we just passed this month.
  const passed = rivals
    .filter((r) => beforeNet < r.netWorth && afterNet >= r.netWorth)
    .sort((a, b) => b.netWorth - a.netWorth)[0];
  if (!passed) return null;
  return {
    emoji: '🏎️',
    title: `You passed ${passed.name}`,
    body: `Your net worth just edged ahead of ${passed.name}'s. Quietly satisfying.`,
  };
}
