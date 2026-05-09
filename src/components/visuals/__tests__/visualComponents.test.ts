import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LivingHomeDiorama from '../LivingHomeDiorama';
import PageSceneHero from '../PageSceneHero';
import SingaporeLifeBoardScene from '../SingaporeLifeBoardScene';
import type { LifeBoardVisualState, LivingHomeVisualState } from '@/engine/visuals';

const home: LivingHomeVisualState = {
  propertyId: 'hdb-bto-0',
  name: 'Northstar Grove 3-Room',
  image: '/district-hdb.jpg',
  type: 'HDB 3-Room',
  statusLabel: 'Room tenant active',
  statusDetail: 'Earning S$650/mo with 82/100 tenant happiness.',
  conditionScore: 72,
  mopRemainingMonths: 59,
  monthlyRent: 650,
  tenantSatisfaction: 82,
  openIssueCount: 0,
  activeRenovationLabel: null,
  reserveProtected: true,
  mood: 'earning',
};

const board: LifeBoardVisualState = {
  chapterLabel: 'Home season',
  chapterDetail: '59 MOP month(s) left.',
  avatarStageIndex: 2,
  stages: [
    { id: 'foundation', label: 'Foundation', detail: 'Runway built', status: 'past' },
    { id: 'first-home', label: 'First Home', detail: 'Keys collected', status: 'past' },
    { id: 'home-season', label: 'Home Season', detail: '59 MOP months left', status: 'current' },
    { id: 'upgrade-window', label: 'Upgrade Window', detail: 'Prepare', status: 'future' },
    { id: 'legacy', label: 'Ending', detail: 'Legacy', status: 'future' },
  ],
};

describe('visual components', () => {
  it('renders a living home diorama from ownership state', () => {
    const html = renderToStaticMarkup(createElement(LivingHomeDiorama, { home }));

    expect(html).toContain('Living home');
    expect(html).toContain('Northstar Grove 3-Room');
    expect(html).toContain('Tenant 82');
    expect(html).toContain('Covered');
  });

  it('renders a life board scene with a home and board stages', () => {
    const html = renderToStaticMarkup(createElement(SingaporeLifeBoardScene, {
      board,
      home,
      label: 'Life Board',
      monthLabel: 'Apr 2024',
      title: 'Make MOP productive',
      subtitle: 'Do one useful move this month.',
      sceneLabel: 'Home season',
      sceneDetail: 'A living chapter',
      metrics: [
        { id: 'cash', label: 'Spendable', value: 'S$52K', detail: 'usable', tone: 'good' },
      ],
      compactMode: false,
      onToggleCompact: () => undefined,
    }));

    expect(html).toContain('Life Board');
    expect(html).toContain('Home Season');
    expect(html).toContain('Northstar Grove 3-Room');
    expect(html).toContain('Spendable');
  });

  it('renders page scene heroes for non-dashboard routes', () => {
    const html = renderToStaticMarkup(createElement(PageSceneHero, {
      variant: 'market',
      eyebrow: 'Market map',
      title: 'Singapore market pulse',
      subtitle: 'A map-like read before the numbers.',
      stats: [{ label: 'Price Index', value: '101.2', tone: 'neutral' }],
    }));

    expect(html).toContain('Singapore market pulse');
    expect(html).toContain('Price Index');
    expect(html).toContain('101.2');
  });
});
