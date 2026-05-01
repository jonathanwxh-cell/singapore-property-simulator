export function calcMonthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)));
}

export interface AmortizationStep {
  newBalance: number;
  interestPaid: number;
  principalPaid: number;
  actualPayment: number;
  isPaidOff: boolean;
}

export function amortizeOneMonth(
  remainingBalance: number,
  monthlyPayment: number,
  annualRatePct: number,
): AmortizationStep {
  const monthlyRate = annualRatePct / 100 / 12;
  const interestPortion = remainingBalance * monthlyRate;
  const principalPortion = Math.max(0, monthlyPayment - interestPortion);
  const newBalance = Math.max(0, remainingBalance - principalPortion);
  const isPaidOff = newBalance <= 0;
  const actualPayment = isPaidOff ? remainingBalance + interestPortion : monthlyPayment;
  return { newBalance, interestPaid: interestPortion, principalPaid: principalPortion, actualPayment, isPaidOff };
}

export function calcTDSR(existingMonthlyPayments: number, newMonthlyPayment: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return Infinity;
  return (existingMonthlyPayments + newMonthlyPayment) / monthlyIncome;
}
