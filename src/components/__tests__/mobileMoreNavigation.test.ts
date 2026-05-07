import { describe, expect, it } from 'vitest';
import { getMobileMoreSections, isMobileMorePath } from '../mobileMoreNavigation';

describe('mobile more navigation', () => {
  it('groups secondary tabs into guidance-first sections', () => {
    const sections = getMobileMoreSections();

    expect(sections.map((section) => section.id)).toEqual(['plan-learn', 'progress-setup']);
    expect(sections[0]?.items.map((item) => item.path)).toEqual(['/market', '/bank', '/scenarios']);
    expect(sections[1]?.items.map((item) => item.path)).toEqual(['/saveload', '/leaderboard', '/settings']);
  });

  it('detects whether a route belongs to the More menu', () => {
    expect(isMobileMorePath('/market')).toBe(true);
    expect(isMobileMorePath('/dashboard')).toBe(false);
  });
});
