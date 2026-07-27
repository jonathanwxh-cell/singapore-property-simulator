import {
  LTV_FIRST_LOAN,
  LTV_FIRST_LOAN_REDUCED,
  LTV_SECOND_LOAN,
  LTV_SECOND_LOAN_REDUCED,
  LTV_THIRD_PLUS_LOAN,
  LTV_THIRD_PLUS_LOAN_REDUCED,
  MSR_LIMIT,
} from './constants';

export interface BankLoanLtvContext {
  borrowerAge?: number;
  termYears?: number;
  propertyIsHdb?: boolean;
}

export function requiresReducedLtv(context: BankLoanLtvContext = {}): boolean {
  const maxStandardTerm = context.propertyIsHdb ? 25 : 30;
  return (context.termYears ?? 0) > maxStandardTerm
    || (
      Number.isFinite(context.borrowerAge)
      && Number.isFinite(context.termYears)
      && (context.borrowerAge ?? 0) + (context.termYears ?? 0) > 65
    );
}

export function getLtvCap(existingHousingLoans: number, context: BankLoanLtvContext = {}): number {
  const reduced = requiresReducedLtv(context);
  if (existingHousingLoans === 0) return reduced ? LTV_FIRST_LOAN_REDUCED : LTV_FIRST_LOAN;
  if (existingHousingLoans === 1) return reduced ? LTV_SECOND_LOAN_REDUCED : LTV_SECOND_LOAN;
  return reduced ? LTV_THIRD_PLUS_LOAN_REDUCED : LTV_THIRD_PLUS_LOAN;
}

export function checkMsr(monthlyIncome: number, monthlyDebt: number, isHdb: boolean): { passes: boolean; maxMonthlyPayment: number } {
  if (!isHdb) return { passes: true, maxMonthlyPayment: Infinity };
  const maxPayment = monthlyIncome * MSR_LIMIT;
  return {
    passes: monthlyDebt <= maxPayment,
    maxMonthlyPayment: round2(maxPayment),
  };
}

export function maxBorrowable(
  propertyPrice: number,
  existingHousingLoans: number,
  context: BankLoanLtvContext = {},
): number {
  const ltvCap = getLtvCap(existingHousingLoans, context);
  return round2(propertyPrice * ltvCap);
}

export function minCashRequired(
  propertyPrice: number,
  existingHousingLoans: number,
  context: BankLoanLtvContext = {},
): number {
  if (existingHousingLoans > 0) return round2(propertyPrice * 0.25);
  return round2(propertyPrice * (requiresReducedLtv(context) ? 0.10 : 0.05));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
