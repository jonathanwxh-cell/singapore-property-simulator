import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { detectLifetimeEnding } from '@/engine/lifetime/endings';
import { useGameStore } from '@/game/useGameStore';
import { LifetimeEndingSummary } from '../GameOver';

describe('GameOver', () => {
  it('renders the lifetime ending summary and recent memories', () => {
    const player = {
      ...useGameStore.getState().player,
      name: 'Summary Tester',
      age: 45,
      cash: 2_000_000,
      totalNetWorth: 2_000_000,
      properties: [],
      lifeMemories: [{
        id: 'memory-12-first-home',
        turn: 12,
        year: 2026,
        month: 5,
        category: 'home' as const,
        title: 'First keys collected',
        detail: 'The starter home became real.',
        tags: ['first-home'],
      }],
    };
    const result = detectLifetimeEnding(player, 'lost');

    const html = renderToStaticMarkup(createElement(LifetimeEndingSummary, { result }));

    expect(html).toContain('This was your Singapore life');
    expect(html).toContain('Cash King');
    expect(html).toContain('Why you got this ending');
    expect(html).toContain('Recent life memories');
    expect(html).toContain('First keys collected');
  });
});
