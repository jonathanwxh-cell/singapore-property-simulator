import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LifeGoalPanel from '../LifeGoalPanel';

describe('LifeGoalPanel', () => {
  it('frames the current route as a Singapore life goal', () => {
    const html = renderToStaticMarkup(createElement(LifeGoalPanel, {
      routeLabel: 'BTO-to-Condo Upgrader',
      routeTagline: 'A practical first-home route.',
    }));

    expect(html).toContain('Your Singapore life');
    expect(html).toContain('BTO-to-Condo Upgrader');
    expect(html).toContain('CPF, MOP, taxes, loans, and market cycles');
  });
});
