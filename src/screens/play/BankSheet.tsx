import { useGameStore } from '@/game/useGameStore';
import { Sheet } from '@/ui/Sheet';
import { Btn } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { useToast } from '@/ui/toastContext';
import { playCoin, playFail } from '@/ui/sound';
import { properties as catalog } from '@/data/properties';
import { selectAvailableCash } from '@/engine/selectors';
import { formatPercent, formatCompactCurrency } from '@/lib/format';

export function BankSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const payLoan = useGameStore((s) => s.payLoan);
  const toast = useToast();

  const activeLoans = player.loans.filter((l) => !l.isPaid && l.remainingBalance > 0);
  const totalDebt = activeLoans.reduce((s, l) => s + l.remainingBalance, 0);
  const available = selectAvailableCash(player);

  const pay = (loanId: string, amount: number) => {
    const res = payLoan(loanId, amount);
    if (res.ok) { playCoin(); toast({ emoji: '✅', tone: 'good', title: 'Payment made', body: `${formatCompactCurrency(amount)} off your loan.` }); }
    else { playFail(); toast({ emoji: '🚫', tone: 'bad', title: 'Could not pay', body: res.message }); }
  };

  const creditTone = player.creditScore >= 700 ? 'text-money' : player.creditScore >= 600 ? 'text-gold' : 'text-loss';

  return (
    <Sheet open={open} onClose={onClose} title="The bank">
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div className="pl-card p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Total owed</div>
          <div className="text-xl font-extrabold text-loss"><Money value={totalDebt} compact /></div>
        </div>
        <div className="pl-card p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Credit score</div>
          <div className={`tabnums text-xl font-extrabold ${creditTone}`}>{player.creditScore}</div>
        </div>
      </div>

      {activeLoans.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-5xl">🎉</div>
          <p className="mt-3 text-sm text-ink-soft">Debt-free! Nothing owed to the bank.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[12.5px] text-ink-soft">Paying down early saves interest and frees up your borrowing power for the next deal.</p>
          {activeLoans.map((loan) => {
            const listing = loan.propertyId ? catalog.find((p) => p.id === loan.propertyId) : null;
            const chunk = Math.min(loan.remainingBalance, 25000);
            return (
              <div key={loan.id} className="rounded-2xl border border-line-2 bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-jakarta text-[14px] font-bold text-ink capitalize">{loan.type} loan</div>
                    {listing && <div className="text-[11.5px] text-ink-soft">{listing.name}</div>}
                  </div>
                  <div className="text-right">
                    <div className="tabnums font-extrabold text-ink"><Money value={loan.remainingBalance} compact /></div>
                    <div className="text-[11px] text-ink-soft">{formatPercent(loan.interestRate, 1)} · <Money value={loan.monthlyPayment} />/mo</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn tone="soft" size="sm" className="flex-1" disabled={available < chunk} onClick={() => pay(loan.id, chunk)}>
                    Pay {formatCompactCurrency(chunk)}
                  </Btn>
                  <Btn tone="ink" size="sm" className="flex-1" disabled={available < loan.remainingBalance} onClick={() => pay(loan.id, loan.remainingBalance)}>
                    Pay it off
                  </Btn>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl bg-paper-2 px-3 py-2 text-center text-[12px] font-semibold text-ink-soft">
            Spendable cash: <Money value={available} />
          </div>
        </div>
      )}
    </Sheet>
  );
}
