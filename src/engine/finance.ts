export interface AmortizationStep {
  newBalance: number;
  interestPaid: number;
  principalPaid: number;
  actualPayment: number;
  isPaidOff: boolean;
}

export function calcMonthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)));
}

export function amortizeOneMonth(
  remainingBalance: number,
  monthlyPayment: number,
  annualRatePct: number
): AmortizationStep {
  const monthlyRate = annualRatePct / 100 / 12;
  const interestPaid = remainingBalance * monthlyRate;
  const principalPaid = Math.min(remainingBalance, Math.max(0, monthlyPayment - interestPaid));
  const newBalance = Math.max(0, remainingBalance - principalPaid);
  const isPaidOff = newBalance <= 0;
  const actualPayment = isPaidOff ? remainingBalance + interestPaid : monthlyPayment;

  return {
    newBalance,
    interestPaid,
    principalPaid,
    actualPayment,
    isPaidOff,
  };
}

export function calcTDSR(
  existingMonthlyPayments: number,
  newMonthlyPayment: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return Infinity;
  return (existingMonthlyPayments + newMonthlyPayment) / monthlyIncome;
}
