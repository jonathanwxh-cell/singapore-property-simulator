import { useGameStore } from '@/game/useGameStore';
import { calcMonthlyPayment, calcTDSR } from '@/engine/finance';
import { TDSR_LIMIT, CREDIT_SCORE_FLOOR } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import { difficultySettings } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { Landmark, Wallet, TrendingDown, Plus, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { formatCompactCurrency, formatCurrency, formatPercent, formatRate, roundMoney } from '@/lib/format';

const LOAN_AMOUNT_MIN = 50000;
const LOAN_AMOUNT_MAX = 5000000;
const LOAN_AMOUNT_STEP = 50000;
const LOAN_TERM_MIN = 5;
const LOAN_TERM_MAX = 35;

export default function Bank() {
  const { player, applyLoan, payLoan } = useGameStore();
  const [loanAmount, setLoanAmount] = useState(LOAN_AMOUNT_MIN);
  const [loanYears, setLoanYears] = useState(25);
  const [payAmount, setPayAmount] = useState(0);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);

  const activeLoans = player.loans.filter(l => !l.isPaid);
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const monthlyPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const selectedLoan = activeLoans.find(l => l.id === selectedLoanId);
  const maxPayment = selectedLoan ? Math.min(player.cash, selectedLoan.remainingBalance) : 0;

  const interestRate = difficultySettings[player.difficulty].loanInterest;
  const estimatedMonthly = calcMonthlyPayment(loanAmount, interestRate, loanYears);
  const tdsr = player.salary > 0 ? calcTDSR(monthlyPayments, estimatedMonthly, player.salary) : 0;

  const openPayForm = (loanId: string) => {
    const loan = activeLoans.find(l => l.id === loanId);
    if (!loan) return;
    setSelectedLoanId(loan.id);
    setPayAmount(roundMoney(Math.min(player.cash, loan.remainingBalance)));
  };

  const handlePaymentChange = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    setPayAmount(roundMoney(Math.max(0, Math.min(safeValue, maxPayment))));
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="page-title text-white mb-6">Bank & Loans</h1>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <GlassCard accentColor="#00F0FF"><Wallet size={18} className="text-cyan-glow mb-2" /><p className="label-text text-text-dim text-[10px]">CPF Ordinary</p><p className="font-mono text-lg text-white">{formatCompactCurrency(player.cpfOrdinary)}</p><p className="text-text-dim text-[10px] mt-1">For housing & investment</p></GlassCard>
          <GlassCard accentColor="#7C4DFF"><Landmark size={18} className="text-purple-glow mb-2" /><p className="label-text text-text-dim text-[10px]">CPF Special</p><p className="font-mono text-lg text-white">{formatCompactCurrency(player.cpfSpecial)}</p><p className="text-text-dim text-[10px] mt-1">For retirement</p></GlassCard>
          <GlassCard accentColor="#FF1744"><TrendingDown size={18} className="text-danger mb-2" /><p className="label-text text-text-dim text-[10px]">CPF Medisave</p><p className="font-mono text-lg text-white">{formatCompactCurrency(player.cpfMedisave)}</p><p className="text-text-dim text-[10px] mt-1">For healthcare</p></GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="section-title text-white mb-4">Active Loans</h3>
            <GlassCard className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div><p className="label-text text-text-dim text-[10px]">Total Outstanding</p><p className="font-mono text-xl text-danger">{formatCurrency(totalDebt)}</p></div>
                <div className="text-right"><p className="label-text text-text-dim text-[10px]">Monthly Payment</p><p className="font-mono text-xl text-warning">{formatCurrency(monthlyPayments)}</p></div>
              </div>
            </GlassCard>

            {activeLoans.length === 0 ? (
              <GlassCard className="text-center py-6"><Landmark size={32} className="text-text-dim mx-auto mb-2" /><p className="text-text-secondary">No active loans. You are debt-free!</p></GlassCard>
            ) : (
              <div className="space-y-3">
                {activeLoans.map((loan) => (
                  <GlassCard key={loan.id} className={selectedLoanId === loan.id ? 'border-cyan-glow/50' : ''}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-rajdhani font-semibold text-white text-sm capitalize">{loan.type} Loan</p><p className="text-text-dim text-[10px] font-mono">Started: {loan.startDate} | {formatRate(loan.interestRate, 1)}</p></div>
                      <div className="text-right"><p className="font-mono text-white">{formatCurrency(loan.remainingBalance)}</p><p className="text-text-dim text-[10px] font-mono">{formatCurrency(loan.monthlyPayment)}/mo</p></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openPayForm(loan.id)} className="flex-1 btn-secondary text-xs py-2">Pay</button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {selectedLoanId && selectedLoan && (
              <GlassCard className="mt-4" accentColor="#00E676">
                <h4 className="font-rajdhani font-semibold text-white mb-3">Make Payment</h4>
                <div className="flex items-center gap-3">
                  <input type="number" value={payAmount} onChange={(e) => handlePaymentChange(Number(e.target.value))}
                    className="flex-1 bg-void-navy border border-glass-border rounded-input px-3 py-2 text-sm text-white font-mono focus:border-cyan-glow focus:outline-none"
                    min={0} max={maxPayment} step={100} />
                  <button onClick={() => { payLoan(selectedLoanId, payAmount); setSelectedLoanId(null); setPayAmount(0); }}
                    disabled={payAmount <= 0 || payAmount > maxPayment} className="btn-primary text-xs py-2 px-4 disabled:opacity-50">Pay</button>
                </div>
                <p className="text-text-dim text-[10px] mt-2">Maximum payable now: {formatCurrency(maxPayment)}</p>
              </GlassCard>
            )}
          </div>

          <div>
            <h3 className="section-title text-white mb-4">Apply for Loan</h3>
            <GlassCard accentColor="#00F0FF">
              <div className="space-y-4">
                <div className="slider-block">
                  <label className="label-text text-text-dim text-xs block mb-2">Loan Amount</label>
                  <input type="range" min={LOAN_AMOUNT_MIN} max={LOAN_AMOUNT_MAX} step={LOAN_AMOUNT_STEP} value={loanAmount}
                    onChange={(e) => { setLoanAmount(Number(e.target.value)); setLoanError(null); }} className="w-full accent-cyan-glow" />
                  <div className="flex justify-between font-mono text-xs text-white mt-1">
                    <span>S$50K</span><span className="text-cyan-glow text-lg">{formatCurrency(loanAmount)}</span><span>S$5M</span>
                  </div>
                </div>
                <div className="slider-block">
                  <label className="label-text text-text-dim text-xs block mb-2">Loan Term: {loanYears} years</label>
                  <input type="range" min={LOAN_TERM_MIN} max={LOAN_TERM_MAX} value={loanYears}
                    onChange={(e) => { setLoanYears(Number(e.target.value)); setLoanError(null); }} className="w-full accent-cyan-glow" />
                  <div className="flex justify-between font-mono text-[10px] text-text-dim mt-1"><span>5yr</span><span>35yr</span></div>
                </div>
                <div className="border-t border-divider pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">Interest Rate</span>
                    <span className="font-mono text-warning">{formatRate(interestRate, 1)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">Est. Monthly</span>
                    <span className="font-mono text-cyan-glow">{formatCurrency(estimatedMonthly)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">TDSR ({formatPercent(TDSR_LIMIT * 100)} cap)</span>
                    <span className={`font-mono ${tdsr > TDSR_LIMIT ? 'text-danger' : 'text-success'}`}>{formatPercent(tdsr * 100, 1)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">LTV (next property)</span>
                    <span className="font-mono text-text-dim">{formatPercent(getLtvCap(activeLoans.filter(l => l.type === 'mortgage').length) * 100)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Total Interest</span>
                    <span className="font-mono text-danger">{formatCurrency(estimatedMonthly * loanYears * 12 - loanAmount)}</span>
                  </div>
                </div>

                {loanError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30">
                    <AlertTriangle size={16} className="text-danger shrink-0" /><p className="text-danger text-xs">{loanError}</p>
                  </div>
                )}

                <button onClick={() => {
                  setLoanError(null);
                  const result = applyLoan(loanAmount, interestRate, loanYears, 'personal');
                  if (!result.ok) setLoanError(result.message);
                }} disabled={tdsr > TDSR_LIMIT || player.creditScore < CREDIT_SCORE_FLOOR}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  <Plus size={16} />Apply for Loan
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
