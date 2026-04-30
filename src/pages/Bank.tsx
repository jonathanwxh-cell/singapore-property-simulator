import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { Landmark, Wallet, TrendingDown, Plus, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Bank() {
  const { player, applyLoan, payLoan } = useGameStore();
  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanYears, setLoanYears] = useState(25);
  const [payAmount, setPayAmount] = useState(0);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);

  const activeLoans = player.loans.filter(l => !l.isPaid);
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const monthlyPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);

  const interestRate = player.difficulty === 'easy' ? 1.5 :
    player.difficulty === 'normal' ? 2.5 :
    player.difficulty === 'hard' ? 3.5 : 4.5;

  const estimatedMonthly = loanAmount > 0
    ? Math.round((loanAmount * (interestRate / 100 / 12)) / (1 - Math.pow(1 + interestRate / 100 / 12, -(loanYears * 12))))
    : 0;

  const tdsr = player.salary > 0 ? (monthlyPayments + estimatedMonthly) / player.salary : 0;
  const tdsrExceeded = tdsr > 0.55;
  const creditTooLow = player.creditScore < 400;

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="page-title text-white mb-6">Bank & Loans</h1>

        {/* CPF Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <GlassCard accentColor="#00F0FF">
            <Wallet size={18} className="text-cyan-glow mb-2" />
            <p className="label-text text-text-dim text-[10px]">CPF Ordinary</p>
            <p className="font-mono text-lg text-white">S${(player.cpfOrdinary / 1000).toFixed(1)}K</p>
            <p className="text-text-dim text-[10px] mt-1">For housing & investment</p>
          </GlassCard>
          <GlassCard accentColor="#7C4DFF">
            <Landmark size={18} className="text-purple-glow mb-2" />
            <p className="label-text text-text-dim text-[10px]">CPF Special</p>
            <p className="font-mono text-lg text-white">S${(player.cpfSpecial / 1000).toFixed(1)}K</p>
            <p className="text-text-dim text-[10px] mt-1">For retirement</p>
          </GlassCard>
          <GlassCard accentColor="#FF1744">
            <TrendingDown size={18} className="text-danger mb-2" />
            <p className="label-text text-text-dim text-[10px]">CPF Medisave</p>
            <p className="font-mono text-lg text-white">S${(player.cpfMedisave / 1000).toFixed(1)}K</p>
            <p className="text-text-dim text-[10px] mt-1">For healthcare</p>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Loan Overview */}
          <div>
            <h3 className="section-title text-white mb-4">Active Loans</h3>
            <GlassCard className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label-text text-text-dim text-[10px]">Total Outstanding</p>
                  <p className="font-mono text-xl text-danger">S${totalDebt.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="label-text text-text-dim text-[10px]">Monthly Payment</p>
                  <p className="font-mono text-xl text-warning">S${monthlyPayments.toLocaleString()}</p>
                </div>
              </div>
            </GlassCard>

            {activeLoans.length === 0 ? (
              <GlassCard className="text-center py-6">
                <Landmark size={32} className="text-text-dim mx-auto mb-2" />
                <p className="text-text-secondary">No active loans. You are debt-free!</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {activeLoans.map((loan) => (
                  <GlassCard key={loan.id} className={selectedLoanId === loan.id ? 'border-cyan-glow/50' : ''}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-rajdhani font-semibold text-white text-sm capitalize">{loan.type} Loan</p>
                        <p className="text-text-dim text-[10px] font-mono">Started: {loan.startDate} | {loan.interestRate}% p.a.</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-white">S${loan.remainingBalance.toLocaleString()}</p>
                        <p className="text-text-dim text-[10px] font-mono">S${loan.monthlyPayment}/mo</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => { setSelectedLoanId(loan.id); setPayAmount(Math.min(player.cash, loan.remainingBalance)); }}
                        className="flex-1 btn-secondary text-xs py-2"
                      >
                        Pay
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Payment panel */}
            {selectedLoanId && (
              <GlassCard className="mt-4" accentColor="#00E676">
                <h4 className="font-rajdhani font-semibold text-white mb-3">Make Payment</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="flex-1 bg-void-navy border border-glass-border rounded-input px-3 py-2 text-sm text-white font-mono focus:border-cyan-glow focus:outline-none"
                    min={1}
                    max={Math.min(player.cash, activeLoans.find(l => l.id === selectedLoanId)?.remainingBalance || 0)}
                  />
                  <button
                    onClick={() => { payLoan(selectedLoanId, payAmount); setSelectedLoanId(null); }}
                    disabled={payAmount <= 0 || payAmount > player.cash}
                    className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                  >
                    Pay
                  </button>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Apply for Loan */}
          <div>
            <h3 className="section-title text-white mb-4">Apply for Loan</h3>
            <GlassCard accentColor="#00F0FF">
              <div className="space-y-4">
                <div>
                  <label className="label-text text-text-dim text-xs block mb-2">Loan Amount</label>
                  <input
                    type="range"
                    min={50000}
                    max={5000000}
                    step={50000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-cyan-glow"
                  />
                  <div className="flex justify-between font-mono text-xs text-white mt-1">
                    <span>S$50K</span>
                    <span className="text-cyan-glow text-lg">S${loanAmount.toLocaleString()}</span>
                    <span>S$5M</span>
                  </div>
                </div>

                <div>
                  <label className="label-text text-text-dim text-xs block mb-2">Loan Term: {loanYears} years</label>
                  <input
                    type="range"
                    min={5}
                    max={35}
                    value={loanYears}
                    onChange={(e) => setLoanYears(Number(e.target.value))}
                    className="w-full accent-cyan-glow"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-text-dim mt-1">
                    <span>5yr</span>
                    <span>35yr</span>
                  </div>
                </div>

                <div className="border-t border-divider pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">Interest Rate</span>
                    <span className="font-mono text-warning">{interestRate}% p.a.</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">Est. Monthly</span>
                    <span className="font-mono text-cyan-glow">S${estimatedMonthly.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary text-sm">TDSR (55% cap)</span>
                    <span className={`font-mono ${tdsrExceeded ? 'text-danger' : 'text-success'}`}>{(tdsr * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Total Interest</span>
                    <span className="font-mono text-danger">S${(estimatedMonthly * loanYears * 12 - loanAmount).toLocaleString()}</span>
                  </div>
                </div>

                {loanError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30">
                    <AlertTriangle size={16} className="text-danger shrink-0" />
                    <p className="text-danger text-xs">{loanError}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setLoanError(null);
                    if (tdsrExceeded) {
                      setLoanError(`TDSR would be ${(tdsr * 100).toFixed(1)}% — exceeds 55% limit. Reduce loan amount or pay down existing debt.`);
                      return;
                    }
                    if (creditTooLow) {
                      setLoanError('Credit score too low (minimum 400). Improve your credit before applying.');
                      return;
                    }
                    const ok = applyLoan(loanAmount, interestRate, loanYears, 'personal');
                    if (!ok) setLoanError('Loan application rejected. Check your TDSR and credit score.');
                  }}
                  disabled={tdsrExceeded || creditTooLow}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} />
                  Apply for Loan
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
