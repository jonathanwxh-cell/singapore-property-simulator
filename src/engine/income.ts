import type { Career } from '@/data/careers';
import type { Player } from '@/game/types';
import type { Rng } from './rng';

const SELF_EMPLOYED_CAREER_IDS = new Set(['entrepreneur', 'agent']);
const SELF_EMPLOYED_BANK_HAIRCUT = 0.7;

export interface MonthlyCareerIncome {
  grossIncome: number;
  volatilityPct: number;
  bankAssessableIncome: number;
  note: string | null;
}

export function isSelfEmployedCareer(careerId: string): boolean {
  return SELF_EMPLOYED_CAREER_IDS.has(careerId);
}

export function selectBankAssessableMonthlyIncome(player: Player): number {
  if (!isSelfEmployedCareer(player.careerId)) return player.salary;
  return Math.round(player.salary * SELF_EMPLOYED_BANK_HAIRCUT);
}

export function resolveMonthlyCareerIncome(player: Player, career: Career, rng: Pick<Rng, 'next'>): MonthlyCareerIncome {
  const bankAssessableIncome = selectBankAssessableMonthlyIncome(player);

  if (!isSelfEmployedCareer(player.careerId)) {
    return {
      grossIncome: player.salary,
      volatilityPct: 0,
      bankAssessableIncome,
      note: null,
    };
  }

  const volatilityBand = Math.min(0.45, 0.12 + career.riskFactor * 0.35 + Math.max(0, player.careerVolatilityModifier) * 0.5);
  const momentumTilt = Math.max(-0.08, Math.min(0.08, player.life.careerMomentum / 1000));
  const volatilityPct = round4((rng.next() * 2 - 1) * volatilityBand + momentumTilt);
  const grossIncome = Math.max(1000, Math.round(player.salary * (1 + volatilityPct)));
  const direction = volatilityPct >= 0 ? 'spiked' : 'dipped';

  return {
    grossIncome,
    volatilityPct,
    bankAssessableIncome,
    note: `Self-employed income ${direction} this month (${formatSignedPercent(volatilityPct)}); banks assess about 70% of base income for loan checks.`,
  };
}

export function isIncomeHaircutApplied(player: Player): boolean {
  return selectBankAssessableMonthlyIncome(player) < player.salary;
}

function formatSignedPercent(value: number): string {
  const pct = Math.round(value * 1000) / 10;
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
