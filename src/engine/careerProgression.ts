import type { CareerProgressionProfile } from '@/game/types';
import type { Rng } from './rng';

export interface CareerReviewInput {
  rng: Rng;
  salary: number;
  careerGrowthRate: number;
  careerRiskFactor: number;
  careerGrowthModifier: number;
  careerRiskModifier: number;
  careerVolatilityModifier: number;
  positiveCashflow: boolean;
  underStress: boolean;
}

export interface CareerReviewResult {
  outcome: NonNullable<CareerProgressionProfile['lastOutcome']>;
  salaryDeltaPct: number;
  bonusCash: number;
  volatilityDelta: number;
}

export function shouldRunAnnualCareerReview(turnCount: number): boolean {
  return turnCount > 0 && turnCount % 12 === 0;
}

export function shouldOfferJobSwitch(turnCount: number, nextJobSwitchTurn: number): boolean {
  return turnCount >= nextJobSwitchTurn;
}

export function resolveAnnualCareerReview(input: CareerReviewInput): CareerReviewResult {
  const expectedGrowth = input.careerGrowthRate * input.careerGrowthModifier;
  const adjustedRisk = input.careerRiskFactor * input.careerRiskModifier + input.careerVolatilityModifier;
  const score = input.rng.next()
    + (input.positiveCashflow ? 0.08 : -0.05)
    + (input.underStress ? -0.12 : 0)
    - adjustedRisk * 0.1;

  if (score >= 0.82) {
    return {
      outcome: 'promotion',
      salaryDeltaPct: round4(Math.max(expectedGrowth + 0.07, 0.1)),
      bonusCash: Math.round(input.salary * 1.2),
      volatilityDelta: -0.02,
    };
  }

  if (score >= 0.62) {
    return {
      outcome: 'bonus',
      salaryDeltaPct: round4(Math.max(expectedGrowth + 0.02, 0.04)),
      bonusCash: Math.round(input.salary * 0.75),
      volatilityDelta: 0,
    };
  }

  if (score >= 0.28) {
    return {
      outcome: 'steady',
      salaryDeltaPct: round4(Math.max(expectedGrowth, 0.02)),
      bonusCash: 0,
      volatilityDelta: 0,
    };
  }

  return {
    outcome: 'setback',
    salaryDeltaPct: -0.02,
    bonusCash: 0,
    volatilityDelta: 0.04,
  };
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
