// Route-aware ending archetype + score breakdown. Pure/derived — gives each
// different build a distinct pay-off to chase (replayability).
import type { Player } from '@/game/types';
import { selectNetWorth } from '@/engine/selectors';
import { properties as catalog, type PropertyType } from '@/data/properties';

export interface EndingSummary {
  title: string;
  blurb: string;
  baseScore: number;
  speedBonus: number;
  score: number;
}

function isCommercial(t: PropertyType) { return t === 'Commercial Shop' || t === 'Commercial Office'; }
function isLanded(t: PropertyType) { return t === 'Landed Terrace' || t === 'Landed Semi-D' || t === 'Landed Bungalow'; }

export function getEnding(player: Player, won: boolean): EndingSummary {
  const net = selectNetWorth(player);
  const baseScore = Math.max(0, Math.round(net / 1000));
  const speedBonus = won ? Math.max(0, Math.round((600 - player.turnCount) * 5)) : 0;
  const score = baseScore + speedBonus;

  const owned = player.properties
    .map((o) => catalog.find((p) => p.id === o.propertyId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const n = owned.length;
  const commercial = owned.filter((p) => isCommercial(p.type)).length;
  const landed = owned.filter((p) => isLanded(p.type)).length;
  const hdb = owned.filter((p) => p.isHdb).length;

  let title = 'The Self-Made';
  let blurb = 'You climbed from renting to freedom your own way.';
  if (!won) {
    title = 'Back to Renting';
    blurb = 'The costs caught up this time — but every mogul has a comeback story.';
  } else if (commercial > 0 && commercial >= n / 2) {
    title = 'The Commercial Baron'; blurb = 'You built your freedom on shophouses and offices.';
  } else if (landed > 0) {
    title = 'The Landed Gentry'; blurb = 'All the way to landed property — the ultimate Singapore dream.';
  } else if (n >= 4) {
    title = 'The Portfolio Mogul'; blurb = 'A whole skyline of units, every one of them yours.';
  } else if (n > 0 && hdb === n) {
    title = 'The Heartland Hero'; blurb = 'Freedom, built entirely from the heartlands.';
  } else if (n === 1) {
    title = 'The One-Home Wonder'; blurb = 'One smart place was all it took.';
  }
  return { title, blurb, baseScore, speedBonus, score };
}

const BEST_KEY = 'pl_best_score';

export function readBestScore(): number {
  try { return Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch { return 0; }
}

/** Returns the prior best, and stores the new one if it's higher. */
export function commitScore(score: number): { prevBest: number; isNewBest: boolean } {
  const prevBest = readBestScore();
  const isNewBest = score > prevBest;
  if (isNewBest) { try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ } }
  return { prevBest, isNewBest };
}
