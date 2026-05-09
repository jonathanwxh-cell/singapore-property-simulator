import type { LifeMemory, LifeMemoryCategory, Player } from '@/game/types';

export interface LifeMemoryDraft {
  category: LifeMemoryCategory;
  title: string;
  detail: string;
  tags: string[];
  scoreImpact?: number;
}

// Hard cap so a long run can't grow lifeMemories indefinitely. Older memories
// fall off when this is exceeded; the run epilogue keeps the most recent six
// (see detectLifetimeEnding), so older entries are only used for stats/tagging.
export const MEMORY_LIMIT = 80;

export function createLifeMemory(player: Player, draft: LifeMemoryDraft): LifeMemory {
  // tags can legitimately be empty for category-only memories; fall back to the
  // category so the synthesised id stays stable per (turn, draft).
  const primaryTag = draft.tags[0] ?? draft.category;

  return {
    id: `memory-${player.turnCount}-${primaryTag}`,
    turn: player.turnCount,
    year: player.year,
    month: player.month,
    category: draft.category,
    title: draft.title,
    detail: draft.detail,
    tags: draft.tags,
    scoreImpact: draft.scoreImpact,
  };
}

export function appendLifeMemory(player: Player, draft: LifeMemoryDraft): Player {
  const nextMemory = createLifeMemory(player, draft);
  const existing = player.lifeMemories ?? [];

  if (existing.some((memory) => memory.id === nextMemory.id)) return player;

  return {
    ...player,
    lifeMemories: [...existing, nextMemory].slice(-MEMORY_LIMIT),
  };
}
