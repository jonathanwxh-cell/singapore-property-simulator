import { lifetimeEndingsById, type LifetimeEndingDefinition } from '@/data/lifetimeEndings';
import { difficultySettings, type EndingId, type LifeMemory, type LifetimeRunRecord, type Player } from '@/game/types';

export type RunOutcome = 'won' | 'lost';

export interface LifetimeEndingResult {
  ending: LifetimeEndingDefinition;
  score: number;
  reasons: string[];
  memories: LifeMemory[];
}

function countMemory(player: Player, tag: string): number {
  return (player.lifeMemories ?? []).filter((memory) => memory.tags.includes(tag)).length;
}

function hasMemory(player: Player, tag: string): boolean {
  return countMemory(player, tag) > 0;
}

export function detectLifetimeEnding(player: Player, outcome: RunOutcome): LifetimeEndingResult {
  const netWorthTarget = difficultySettings[player.difficulty].targetNetWorth;
  const propertyCount = player.properties.length;
  const stress = player.life.stress;
  const householdLoad = player.life.householdLoad;
  const memories = player.lifeMemories ?? [];

  const candidates: Array<{ id: EndingId; score: number; reasons: string[] }> = [
    {
      id: 'property-tycoon',
      score: propertyCount >= 3 ? 90 + propertyCount * 5 + Math.min(10, Math.floor(player.totalRentalIncome / 100_000)) : 0,
      reasons: [`Owned ${propertyCount} properties by the end.`],
    },
    {
      id: 'cash-king',
      score: propertyCount === 0 && player.cash >= 1_000_000 ? 95 : 0,
      reasons: ['Stayed liquid instead of joining the property ladder.'],
    },
    {
      id: 'negative-equity',
      score: outcome === 'lost' || player.bankruptcyStrikes >= 2 || hasMemory(player, 'negative-equity') ? 92 : 0,
      reasons: ['Financial stress became the defining lesson.'],
    },
    {
      id: 'fire-at-45',
      score: player.age <= 45 && player.totalNetWorth >= netWorthTarget && stress <= 45 ? 88 : 0,
      reasons: ['Reached the wealth target early without burning out.'],
    },
    {
      id: 'sandwich-generation',
      score: householdLoad >= 3000 || countMemory(player, 'eldercare') >= 2 ? 84 : 0,
      reasons: ['Household obligations shaped the run.'],
    },
    {
      id: 'quiet-achiever',
      score: stress <= 35 && player.bankruptcyStrikes === 0 && player.totalNetWorth >= netWorthTarget * 0.45 ? 80 : 0,
      reasons: ['Stayed stable without chasing maximum leverage.'],
    },
    {
      id: 'heartland-hero',
      score: propertyCount === 1 && player.firstHomePurchased && stress <= 55 ? 78 : 0,
      reasons: ['Built a rooted life around one practical home.'],
    },
  ];

  const fallback = outcome === 'won'
    ? { id: 'quiet-achiever' as EndingId, score: 50, reasons: ['Finished the run with a stable life.'] }
    : { id: 'negative-equity' as EndingId, score: 50, reasons: ['The run ended under financial pressure.'] };

  const winner = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0] ?? fallback;

  return {
    ending: lifetimeEndingsById[winner.id],
    score: winner.score,
    reasons: winner.reasons,
    // Last six memories form the run epilogue; fewer is fine for short runs.
    memories: memories.slice(-6),
  };
}

export function recordLifetimeRun(player: Player, outcome: RunOutcome, completedAt = new Date().toISOString()): Player {
  const result = detectLifetimeEnding(player, outcome);
  const endingCollection = player.endingCollection ?? {
    unlockedEndingIds: [],
    runHistory: [],
  };
  const record: LifetimeRunRecord = {
    // completedAt is included so two runs that finish on the same in-game month
    // with the same ending don't share an id (they would otherwise collide in
    // runHistory and break per-record lookups).
    id: `run-${player.year}-${player.month}-${player.turnCount}-${result.ending.id}-${completedAt}`,
    endingId: result.ending.id,
    endingLabel: result.ending.label,
    playerName: player.name,
    completedAt,
    finalYear: player.year,
    finalMonth: player.month,
    finalAge: player.age,
    netWorth: player.totalNetWorth,
    memories: result.memories,
  };
  const unlockedEndingIds = endingCollection.unlockedEndingIds.includes(result.ending.id)
    ? endingCollection.unlockedEndingIds
    : [...endingCollection.unlockedEndingIds, result.ending.id];

  return {
    ...player,
    endingCollection: {
      unlockedEndingIds,
      runHistory: [record, ...endingCollection.runHistory].slice(0, 20),
    },
  };
}
