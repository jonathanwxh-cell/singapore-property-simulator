import { describe, expect, it } from 'vitest';
import { lifetimeEndings, lifetimeEndingsById } from '@/data/lifetimeEndings';
import { detectLifetimeEnding, recordLifetimeRun } from '@/engine/lifetime/endings';
import { createInitialLifeState, type Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 55,
    careerId: 'graduate',
    salary: 8000,
    cash: 200000,
    cpfOrdinary: 100000,
    cpfSpecial: 80000,
    cpfMedisave: 60000,
    creditScore: 750,
    properties: [],
    loans: [],
    maritalStatus: 'married',
    children: 0,
    year: 2040,
    month: 1,
    turnCount: 192,
    totalNetWorth: 1000000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
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

describe('lifetime ending definitions', () => {
  it('defines unique ending ids with player-facing copy', () => {
    const ids = lifetimeEndings.map((ending) => ending.id);

    expect(new Set(ids).size).toBe(lifetimeEndings.length);
    expect(lifetimeEndingsById['heartland-hero'].label).toBe('Heartland Hero');
    expect(lifetimeEndingsById['property-tycoon'].spoilerSafeHint).toContain('property');
    expect(lifetimeEndings.every((ending) => ending.summary.length > 20)).toBe(true);
  });
});

describe('detectLifetimeEnding', () => {
  it('detects Cash King for high-liquidity non-owners', () => {
    const result = detectLifetimeEnding(makePlayer({
      cash: 1_800_000,
      totalNetWorth: 2_200_000,
      properties: [],
      firstHomePurchased: false,
    }), 'won');

    expect(result.ending.id).toBe('cash-king');
  });

  it('detects Property Tycoon for broad portfolios', () => {
    const result = detectLifetimeEnding(makePlayer({
      properties: [
        { id: 'a' } as unknown as Player['properties'][number],
        { id: 'b' } as unknown as Player['properties'][number],
        { id: 'c' } as unknown as Player['properties'][number],
      ],
      totalRentalIncome: 500_000,
      totalNetWorth: 5_000_000,
    }), 'won');

    expect(result.ending.id).toBe('property-tycoon');
  });

  it('records completed runs and unlocks the ending collection', () => {
    const player = makePlayer({
      cash: 1_800_000,
      totalNetWorth: 2_200_000,
      properties: [],
      lifeMemories: [{
        id: 'memory-12-first-home',
        turn: 12,
        year: 2026,
        month: 5,
        category: 'home',
        title: 'First keys collected',
        detail: 'The starter home became real.',
        tags: ['first-home'],
      }],
      endingCollection: {
        unlockedEndingIds: [],
        runHistory: [],
      },
    });

    const recorded = recordLifetimeRun(player, 'won', '2026-05-09T00:00:00.000Z');

    expect(recorded.endingCollection?.unlockedEndingIds).toContain('cash-king');
    expect(recorded.endingCollection?.runHistory[0]).toMatchObject({
      endingId: 'cash-king',
      endingLabel: 'Cash King',
      playerName: 'Tester',
      completedAt: '2026-05-09T00:00:00.000Z',
      finalYear: 2040,
      finalMonth: 1,
      finalAge: 55,
      netWorth: 2_200_000,
    });
    expect(recorded.endingCollection?.runHistory[0].memories).toHaveLength(1);
  });
});
