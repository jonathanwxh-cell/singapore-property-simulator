import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PlaySurfacePanel from '../PlaySurfacePanel';
import type { PlaySurfaceState } from '@/engine/playSurface';

const state: PlaySurfaceState = {
  label: 'Life Board',
  title: 'Make this month count',
  subtitle: 'A playable month should feel like a choice, not a spreadsheet.',
  monthLabel: 'May 2026',
  scene: {
    id: 'first-home-search',
    label: 'Viewing weekend',
    detail: 'You are still looking for the first home.',
  },
  prompt: {
    title: 'Choose a move',
    detail: 'Pick the move that matches this life.',
    why: 'The math remains available, but the choice comes first.',
    urgency: 'neutral',
  },
  timeline: [
    { id: 'foundation', label: 'Foundation', detail: 'Build runway', status: 'past', progressPct: 100 },
    { id: 'first-home', label: 'First Home', detail: 'Find a fit', status: 'current', progressPct: 40 },
    { id: 'home-season', label: 'Home Season', detail: 'MOP and ownership', status: 'future', progressPct: 0 },
  ],
  metrics: [
    { id: 'available-cash', label: 'Spendable Cash', value: 'S$50K', detail: 'Ready for fees', tone: 'good' },
    { id: 'monthly-surplus', label: 'Monthly Surplus', value: 'S$2K', detail: 'After costs', tone: 'good' },
  ],
  choices: [
    {
      id: 'build-cash',
      kind: 'intent',
      label: 'Build Cash Buffer',
      detail: 'Use the month to grow runway.',
      upside: 'More options',
      risk: 'Energy cost',
      route: '/life',
      recommended: true,
      tone: 'neutral',
      primaryLabel: 'Play this month',
      secondaryLabel: 'Inspect first',
      intentId: 'build-cash',
    },
  ],
  financeModeLabel: 'Inspect finances',
  financeModeDetail: 'Open the deeper numbers only when needed.',
};

describe('PlaySurfacePanel', () => {
  it('renders the life board, timeline, and playable choice language', () => {
    const html = renderToStaticMarkup(createElement(PlaySurfacePanel, {
      state,
      compactMode: false,
      highlighted: false,
      advanceSlot: createElement('button', null, 'Next Month'),
      onPlayChoice: () => undefined,
      onInspectChoice: () => undefined,
      onToggleCompact: () => undefined,
    }));

    expect(html).toContain('Life Board');
    expect(html).toContain('First Home');
    expect(html).toContain('Build Cash Buffer');
    expect(html).toContain('Play this month');
    expect(html).toContain('Inspect finances');
    expect(html).toContain('Next Month');
  });
});
