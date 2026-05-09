import type { LifeMemory, LifeMemoryCategory, Player } from '@/game/types';

export interface LifeMemoryDraft {
  category: LifeMemoryCategory;
  title: string;
  detail: string;
  tags: string[];
  scoreImpact?: number;
}

const MEMORY_LIMIT = 80;

export function createLifeMemory(player: Player, draft: LifeMemoryDraft): LifeMemory {
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
