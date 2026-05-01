import {
  CPF_WAGE_CEILING,
  CPF_OA_INTEREST,
  CPF_SA_INTEREST,
  CPF_MA_INTEREST,
  CPF_EXTRA_INTEREST_THRESHOLD,
  CPF_EXTRA_INTEREST_RATE,
} from './constants';

export interface CpfBalances {
  oa: number;
  sa: number;
  ma: number;
}

const AGE_BRACKETS = [
  { maxAge: 55, oaRate: 0.23, saRate: 0.06, maRate: 0.08 },
  { maxAge: 60, oaRate: 0.16, saRate: 0.105, maRate: 0.105 },
  { maxAge: 65, oaRate: 0.105, saRate: 0.075, maRate: 0.115 },
  { maxAge: 70, oaRate: 0.07, saRate: 0.05, maRate: 0.105 },
  { maxAge: Infinity, oaRate: 0.05, saRate: 0.025, maRate: 0.075 },
];

export function getCpfAllocation(age: number): { oa: number; sa: number; ma: number } {
  for (const bracket of AGE_BRACKETS) {
    if (age <= bracket.maxAge) {
      return { oa: bracket.oaRate, sa: bracket.saRate, ma: bracket.maRate };
    }
  }
  return { oa: 0.05, sa: 0.025, ma: 0.075 };
}

export function contributeCpf(balances: CpfBalances, monthlySalary: number, age: number): CpfBalances {
  const cappedSalary = Math.min(monthlySalary, CPF_WAGE_CEILING);
  const allocation = getCpfAllocation(age);

  return {
    oa: round2(balances.oa + cappedSalary * allocation.oa),
    sa: round2(balances.sa + cappedSalary * allocation.sa),
    ma: round2(balances.ma + cappedSalary * allocation.ma),
  };
}

export function applyCpfInterest(balances: CpfBalances): CpfBalances {
  const combinedOA_SA = balances.oa + balances.sa;
  let extraInterest = 0;
  if (combinedOA_SA < CPF_EXTRA_INTEREST_THRESHOLD) {
    extraInterest = combinedOA_SA * CPF_EXTRA_INTEREST_RATE / 12;
  } else {
    extraInterest = CPF_EXTRA_INTEREST_THRESHOLD * CPF_EXTRA_INTEREST_RATE / 12;
  }

  return {
    oa: round2(balances.oa * (1 + CPF_OA_INTEREST / 12) + extraInterest),
    sa: round2(balances.sa * (1 + CPF_SA_INTEREST / 12)),
    ma: round2(balances.ma * (1 + CPF_MA_INTEREST / 12)),
  };
}

export function estimateInitialCpf(age: number, monthlySalary: number): CpfBalances {
  const yearsWorked = Math.max(0, age - 25);
  const monthsWorked = yearsWorked * 12;
  if (monthsWorked === 0) return { oa: 0, sa: 0, ma: 0 };

  let balances: CpfBalances = { oa: 0, sa: 0, ma: 0 };
  for (let m = 0; m < Math.min(monthsWorked, 60); m++) {
    balances = contributeCpf(balances, monthlySalary, age);
    balances = applyCpfInterest(balances);
  }
  return {
    oa: round2(balances.oa),
    sa: round2(balances.sa),
    ma: round2(balances.ma),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
