import { describe, expect, it } from 'vitest';
import { appendLifeMemory, createLifeMemory } from '@/engine/lifetime/memories';
import { createInitialLifeState, type Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5000,
    cash: 50000,
    cpfOrdinary: 30000,
    cpfSpecial: 10000,
    cpfMedisave: 10000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2026,
    month: 5,
    turnCount: 12,
    totalNetWorth: 100000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    lifeMemories: [],
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 1,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: 'steady', lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

describe('life memory helpers', () => {
  it('creates deterministic memory ids from turn and tag', () => {
    const memory = createLifeMemory(makePlayer(), {
      category: 'home',
      title: 'First keys collected',
      detail: 'The starter home became real.',
      tags: ['first-home'],
    });

    expect(memory.id).toBe('memory-12-first-home');
    expect(memory.year).toBe(2026);
    expect(memory.month).toBe(5);
  });

  it('dedupes memories by id', () => {
    const player = makePlayer();
    const first = appendLifeMemory(player, {
      category: 'home',
      title: 'First keys collected',
      detail: 'The starter home became real.',
      tags: ['first-home'],
    });
    const second = appendLifeMemory(first, {
      category: 'home',
      title: 'First keys collected',
      detail: 'The starter home became real.',
      tags: ['first-home'],
    });

    expect(second.lifeMemories).toHaveLength(1);
  });

  it('keeps only the latest 80 memories', () => {
    const olderMemories = Array.from({ length: 80 }, (_, index) => ({
      id: `memory-${index}-old`,
      turn: index,
      year: 2026,
      month: 1,
      category: 'milestone' as const,
      title: `Old beat ${index}`,
      detail: 'Earlier life beat.',
      tags: [`old-${index}`],
    }));

    const player = appendLifeMemory(makePlayer({ lifeMemories: olderMemories }), {
      category: 'home',
      title: 'New beat',
      detail: 'The latest life beat should stay.',
      tags: ['new-beat'],
    });

    expect(player.lifeMemories).toHaveLength(80);
    expect(player.lifeMemories?.[0].id).toBe('memory-1-old');
    expect(player.lifeMemories?.[79].id).toBe('memory-12-new-beat');
  });
});
