import { describe, expect, it } from 'vitest';
import { lifeActionsById } from '@/data/lifeActions';
import { getLifeOutcomeTone, lifeOutcomeVisuals } from '@/data/lifeVisuals';

describe('life visual metadata', () => {
  it('provides an image for every life action', () => {
    expect(lifeActionsById['focus-at-work'].image).toBe('/life-scenes/focus-at-work.svg');
    expect(lifeActionsById.recover.image).toBe('/life-scenes/recover.svg');
  });

  it('classifies a clearly positive month as positive', () => {
    expect(getLifeOutcomeTone({
      primaryActionId: 'take-side-gig',
      secondaryActionId: null,
      cashDelta: 700,
      energyDelta: -4,
      stressDelta: 1,
      reputationDelta: 1,
      careerMomentumDelta: 0,
      householdSupportDelta: 0,
      notes: [],
    })).toBe('positive');
  });

  it('classifies a stress-heavy month as stressed', () => {
    expect(getLifeOutcomeTone({
      primaryActionId: 'focus-at-work',
      secondaryActionId: 'take-side-gig',
      cashDelta: 150,
      energyDelta: -12,
      stressDelta: 9,
      reputationDelta: 2,
      careerMomentumDelta: 3,
      householdSupportDelta: 0,
      notes: [],
    })).toBe('stressed');
  });

  it('keeps a balanced month mapped to the balanced outcome art', () => {
    expect(lifeOutcomeVisuals.balanced.image).toBe('/life-scenes/month-balanced.svg');
  });
});
