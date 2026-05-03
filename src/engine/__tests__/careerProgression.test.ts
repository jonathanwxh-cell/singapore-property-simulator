import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { resolveAnnualCareerReview, shouldOfferJobSwitch, shouldRunAnnualCareerReview } from '../careerProgression';

describe('career progression', () => {
  it('triggers an annual career review every 12 turns', () => {
    expect(shouldRunAnnualCareerReview(12)).toBe(true);
    expect(shouldRunAnnualCareerReview(11)).toBe(false);
  });

  it('offers a job switch when the next scheduled turn is reached', () => {
    expect(shouldOfferJobSwitch(24, 24)).toBe(true);
    expect(shouldOfferJobSwitch(23, 24)).toBe(false);
  });

  it('returns deterministic annual outcomes for the same seed', () => {
    const a = resolveAnnualCareerReview({
      rng: createRng(42),
      salary: 5000,
      careerGrowthRate: 0.04,
      careerRiskFactor: 0.1,
      careerGrowthModifier: 1,
      careerRiskModifier: 1,
      careerVolatilityModifier: 0,
      positiveCashflow: true,
      underStress: false,
    });

    const b = resolveAnnualCareerReview({
      rng: createRng(42),
      salary: 5000,
      careerGrowthRate: 0.04,
      careerRiskFactor: 0.1,
      careerGrowthModifier: 1,
      careerRiskModifier: 1,
      careerVolatilityModifier: 0,
      positiveCashflow: true,
      underStress: false,
    });

    expect(a).toEqual(b);
  });
});
