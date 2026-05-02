import type { LifeMonthSummary } from '@/game/types';

export type LifeOutcomeTone = 'positive' | 'balanced' | 'stressed';

export interface LifeOutcomeVisual {
  image: string;
  label: string;
  description: string;
}

export const LIFE_SCENE_FALLBACK = '/life-scenes/month-balanced.svg';

export const lifeOutcomeVisuals: Record<LifeOutcomeTone, LifeOutcomeVisual> = {
  positive: {
    image: '/life-scenes/month-positive.svg',
    label: 'Strong Month',
    description: 'Cash moved up and the month stayed under control.',
  },
  balanced: {
    image: '/life-scenes/month-balanced.svg',
    label: 'Steady Month',
    description: 'You made progress, but the month came with normal tradeoffs.',
  },
  stressed: {
    image: '/life-scenes/month-stressed.svg',
    label: 'Heavy Month',
    description: 'The month pushed hard on energy or stress, even if it still moved you forward.',
  },
};

export function getLifeOutcomeTone(summary: LifeMonthSummary): LifeOutcomeTone {
  if (summary.stressDelta >= 6 || summary.energyDelta <= -10 || summary.cashDelta <= -350) {
    return 'stressed';
  }

  if (summary.cashDelta >= 250 && summary.stressDelta <= 4) {
    return 'positive';
  }

  return 'balanced';
}

export function getLifeOutcomeVisual(summary: LifeMonthSummary): LifeOutcomeVisual {
  return lifeOutcomeVisuals[getLifeOutcomeTone(summary)];
}
