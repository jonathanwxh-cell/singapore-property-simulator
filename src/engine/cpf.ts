import {
  CPF_WAGE_CEILING,
  CPF_OA_INTEREST,
  CPF_SA_INTEREST,
  CPF_MA_INTEREST,
  CPF_EXTRA_INTEREST_THRESHOLD,
  CPF_EXTRA_INTEREST_RATE,
  CPF_EXTRA_INTEREST_OA_CAP,
  CPF_SENIOR_EXTRA_INTEREST_THRESHOLD,
  CPF_SENIOR_EXTRA_INTEREST_RATE,
} from './constants';
import type { BuyerResidencyStatus } from '@/game/types';

export interface CpfBalances {
  oa: number;
  sa: number;
  ma: number;
}

interface CpfRateBracket {
  maxAge: number;
  totalRate: number;
  employeeRate: number;
  allocation: { oa: number; sa: number; ma: number };
}

const FULL_RATE_BRACKETS: readonly CpfRateBracket[] = [
  { maxAge: 35, totalRate: 0.37, employeeRate: 0.20, allocation: { oa: 0.6217, sa: 0.1621, ma: 0.2162 } },
  { maxAge: 45, totalRate: 0.37, employeeRate: 0.20, allocation: { oa: 0.5677, sa: 0.1891, ma: 0.2432 } },
  { maxAge: 50, totalRate: 0.37, employeeRate: 0.20, allocation: { oa: 0.5136, sa: 0.2162, ma: 0.2702 } },
  { maxAge: 55, totalRate: 0.37, employeeRate: 0.20, allocation: { oa: 0.4055, sa: 0.3108, ma: 0.2837 } },
  { maxAge: 60, totalRate: 0.34, employeeRate: 0.18, allocation: { oa: 0.353, sa: 0.3382, ma: 0.3088 } },
  { maxAge: 65, totalRate: 0.25, employeeRate: 0.125, allocation: { oa: 0.14, sa: 0.44, ma: 0.42 } },
  { maxAge: 70, totalRate: 0.165, employeeRate: 0.075, allocation: { oa: 0.0607, sa: 0.303, ma: 0.6363 } },
  { maxAge: Infinity, totalRate: 0.125, employeeRate: 0.05, allocation: { oa: 0.08, sa: 0.08, ma: 0.84 } },
];

const SPR_YEAR_ONE_RATES = [
  { maxAge: 60, totalRate: 0.09, employeeRate: 0.05 },
  { maxAge: 65, totalRate: 0.085, employeeRate: 0.05 },
  { maxAge: Infinity, totalRate: 0.085, employeeRate: 0.05 },
] as const;

const SPR_YEAR_TWO_RATES = [
  { maxAge: 55, totalRate: 0.24, employeeRate: 0.15 },
  { maxAge: 60, totalRate: 0.185, employeeRate: 0.125 },
  { maxAge: 65, totalRate: 0.11, employeeRate: 0.075 },
  { maxAge: Infinity, totalRate: 0.085, employeeRate: 0.05 },
] as const;

export function getCpfAllocation(
  age: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
  sprYear: 1 | 2 | 3 = 3,
): { oa: number; sa: number; ma: number } {
  const rate = getCpfRates(age, residencyStatus, sprYear);
  return {
    oa: rate.totalRate * rate.allocation.oa,
    sa: rate.totalRate * rate.allocation.sa,
    ma: rate.totalRate * rate.allocation.ma,
  };
}

export function getCpfEmployeeRate(
  age: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
  sprYear: 1 | 2 | 3 = 3,
): number {
  return getCpfRates(age, residencyStatus, sprYear).employeeRate;
}

export function getCpfEmployeeContribution(
  monthlySalary: number,
  age: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
  sprYear: 1 | 2 | 3 = 3,
): number {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return 0;
  return round2(Math.min(monthlySalary, CPF_WAGE_CEILING) * getCpfEmployeeRate(age, residencyStatus, sprYear));
}

export function contributeCpf(
  balances: CpfBalances,
  monthlySalary: number,
  age: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
  sprYear: 1 | 2 | 3 = 3,
): CpfBalances {
  if (residencyStatus === 'foreigner' || !Number.isFinite(monthlySalary) || monthlySalary <= 0) {
    return { ...balances };
  }
  const cappedSalary = Math.min(monthlySalary, CPF_WAGE_CEILING);
  const allocation = getCpfAllocation(age, residencyStatus, sprYear);

  return {
    oa: round2(balances.oa + cappedSalary * allocation.oa),
    sa: round2(balances.sa + cappedSalary * allocation.sa),
    ma: round2(balances.ma + cappedSalary * allocation.ma),
  };
}

export function applyCpfInterest(balances: CpfBalances, age = 30): CpfBalances {
  const nonOaEligible = Math.min(CPF_EXTRA_INTEREST_THRESHOLD, balances.sa + balances.ma);
  const oaEligible = Math.min(
    CPF_EXTRA_INTEREST_OA_CAP,
    balances.oa,
    Math.max(0, CPF_EXTRA_INTEREST_THRESHOLD - nonOaEligible),
  );
  const extraInterestBase = nonOaEligible + oaEligible;
  const extraInterest = age <= 55
    ? (extraInterestBase * CPF_EXTRA_INTEREST_RATE) / 12
    : (
        Math.min(extraInterestBase, CPF_SENIOR_EXTRA_INTEREST_THRESHOLD) * CPF_SENIOR_EXTRA_INTEREST_RATE
        + Math.max(0, extraInterestBase - CPF_SENIOR_EXTRA_INTEREST_THRESHOLD) * CPF_EXTRA_INTEREST_RATE
      ) / 12;

  return {
    oa: round2(balances.oa * (1 + CPF_OA_INTEREST / 12)),
    sa: round2(balances.sa * (1 + CPF_SA_INTEREST / 12) + extraInterest),
    ma: round2(balances.ma * (1 + CPF_MA_INTEREST / 12)),
  };
}

export function estimateInitialCpf(
  age: number,
  monthlySalary: number,
  residencyStatus: BuyerResidencyStatus = 'sc',
  sprYear: 1 | 2 | 3 = 3,
): CpfBalances {
  const yearsWorked = Math.max(0, age - 25);
  const monthsWorked = yearsWorked * 12;
  if (monthsWorked === 0) return { oa: 0, sa: 0, ma: 0 };

  let balances: CpfBalances = { oa: 0, sa: 0, ma: 0 };
  // Cap at 60 months to model recent work history without overstating early CPF compounding.
  const simulatedMonths = Math.min(monthsWorked, 60);
  for (let m = simulatedMonths; m > 0; m--) {
    const ageAtMonth = Math.max(21, age - m / 12);
    balances = contributeCpf(balances, monthlySalary, ageAtMonth, residencyStatus, sprYear);
    balances = applyCpfInterest(balances, ageAtMonth);
  }
  return {
    oa: round2(balances.oa),
    sa: round2(balances.sa),
    ma: round2(balances.ma),
  };
}

function getCpfRates(
  age: number,
  residencyStatus: BuyerResidencyStatus,
  sprYear: 1 | 2 | 3,
): CpfRateBracket {
  const fullRateBracket = FULL_RATE_BRACKETS.find((bracket) => age <= bracket.maxAge)
    ?? FULL_RATE_BRACKETS[FULL_RATE_BRACKETS.length - 1];
  if (residencyStatus === 'foreigner') {
    return { ...fullRateBracket, totalRate: 0, employeeRate: 0 };
  }
  if (residencyStatus !== 'spr' || sprYear === 3) return fullRateBracket;

  const graduatedRates = sprYear === 1 ? SPR_YEAR_ONE_RATES : SPR_YEAR_TWO_RATES;
  const graduated = graduatedRates.find((bracket) => age <= bracket.maxAge)
    ?? graduatedRates[graduatedRates.length - 1];
  return {
    ...fullRateBracket,
    totalRate: graduated.totalRate,
    employeeRate: graduated.employeeRate,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
