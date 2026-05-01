import { LTV_FIRST_LOAN, LTV_SECOND_LOAN, LTV_THIRD_PLUS_LOAN, MSR_LIMIT } from './constants';

export function getLtvCap(existingHousingLoans: number): number {
  if (existingHousingLoans === 0) return LTV_FIRST_LOAN;
  if (existingHousingLoans === 1) return LTV_SECOND_LOAN;
  return LTV_THIRD_PLUS_LOAN;
}

export function checkMsr(monthlyIncome: number, monthlyDebt: number, isHdb: boolean): { passes: boolean; maxMonthlyPayment: number } {
  if (!isHdb) return { passes: true, maxMonthlyPayment: Infinity };
  const maxPayment = monthlyIncome * MSR_LIMIT;
  return {
    passes: monthlyDebt <= maxPayment,
    maxMonthlyPayment: round2(maxPayment),
  };
}

export function maxBorrowable(propertyPrice: number, existingHousingLoans: number): number {
  const ltvCap = getLtvCap(existingHousingLoans);
  return round2(propertyPrice * ltvCap);
}

export function minCashRequired(propertyPrice: number, existingHousingLoans: number): number {
  return round2(propertyPrice - maxBorrowable(propertyPrice, existingHousingLoans));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
