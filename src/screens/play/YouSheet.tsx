import { useState } from 'react';
import { useGameStore } from '@/game/useGameStore';
import { careers } from '@/data/careers';
import { residencyOptions, householdOptions } from '@/data/buyerOptions';
import { difficultySettings } from '@/game/types';
import { selectNetWorth } from '@/engine/selectors';
import { Sheet } from '@/ui/Sheet';
import { Money } from '@/ui/Money';
import { Meter } from '@/ui/Card';
import { deriveView, lifeTitle } from '@/game-ui/derive';
import { getLeaderboard } from '@/game-ui/rivals';
import { cn } from '@/lib/utils';

const RULES: { term: string; plain: string }[] = [
  { term: 'CPF', plain: 'Forced savings from your salary. The Ordinary Account can help pay for a home; it also earns interest you keep.' },
  { term: 'ABSD', plain: "Additional Buyer's Stamp Duty — an extra tax on your 2nd, 3rd+ property (and much higher for foreigners). It's what stops endless flipping." },
  { term: 'LTV', plain: 'Loan-to-Value — how much the bank will lend. Max 75% on your first home, less on later ones, so you need a bigger cash deposit each time.' },
  { term: 'MSR', plain: "Mortgage Servicing Ratio — for HDB/EC, your home loan can't exceed 30% of income." },
  { term: 'TDSR', plain: "Total Debt Servicing Ratio — all your debt repayments together can't exceed 55% of income. Borrow too much and the bank simply says no." },
  { term: 'MOP', plain: 'Minimum Occupation Period — you must live in a new HDB flat ~5 years before you can rent the whole unit or sell it.' },
];

function Milestone({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold', done ? 'bg-money-soft text-money' : 'bg-paper-2 text-ink-faint')}>
      <span>{done ? '✅' : '⬜'}</span> {label}
    </div>
  );
}

export function YouSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const v = deriveView(player);
  const [rulesOpen, setRulesOpen] = useState(false);

  const career = careers.find((c) => c.id === player.careerId)?.name ?? 'Worker';
  const residency = residencyOptions.find((r) => r.value === player.buyerProfile?.residencyStatus)?.label ?? '';
  const household = householdOptions.find((h) => h.value === player.buyerProfile?.householdProfile)?.label ?? '';
  const cpfTotal = player.cpfOrdinary + player.cpfSpecial + player.cpfMedisave;
  const netWorth = selectNetWorth(player);

  return (
    <Sheet open={open} onClose={onClose} title={player.name} subtitle={`${lifeTitle(player)} · ${career}`}>
      {/* Identity */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="pl-chip bg-paper-2 text-ink-soft">🪪 {residency}</span>
        <span className="pl-chip bg-paper-2 text-ink-soft">👪 {household}</span>
        <span className="pl-chip bg-paper-2 text-ink-soft">🎚 {difficultySettings[player.difficulty].label}</span>
        <span className="pl-chip bg-paper-2 text-ink-soft">🎂 {player.age}</span>
      </div>

      {/* Freedom */}
      <div className="pl-card mb-3 p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-jakarta text-[14px] font-bold text-ink">Journey to freedom</span>
          <span className="tabnums text-[13px] font-bold text-money">{Math.floor(v.freedomPct)}%</span>
        </div>
        <Meter value={v.freedomPct} />
        <div className="mt-1.5 flex justify-between text-[12px] text-ink-soft">
          <span>Now <Money value={netWorth} compact /></span>
          <span>Goal <Money value={v.target} compact /></span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        {[
          { l: 'Cash', val: <Money value={player.cash} compact /> },
          { l: 'CPF total', val: <Money value={cpfTotal} compact /> },
          { l: 'Monthly salary', val: <Money value={player.salary} /> },
          { l: 'Credit score', val: <span className="tabnums">{player.creditScore}</span> },
          { l: 'Properties', val: player.properties.length },
          { l: 'Rent earned (total)', val: <Money value={player.totalRentalIncome} compact /> },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-line-2 bg-white p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{s.l}</div>
            <div className="text-lg font-extrabold text-ink">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="mb-3">
        <div className="mb-1.5 font-jakarta text-[14px] font-bold text-ink">Milestones</div>
        <div className="grid grid-cols-1 gap-1.5">
          <Milestone done={player.properties.length >= 1} label="🔑 Own your first home" />
          <Milestone done={player.totalRentalIncome > 0} label="🏠 Collect your first rent" />
          <Milestone done={netWorth >= 1_000_000} label="💰 Reach $1M net worth" />
          <Milestone done={player.properties.length >= 3} label="🏢 Build a 3-property portfolio" />
          <Milestone done={v.freedomPct >= 100} label="🏆 Reach financial freedom" />
        </div>
      </div>

      {/* Kiasu leaderboard */}
      <div className="mb-3">
        <div className="mb-1.5 font-jakarta text-[14px] font-bold text-ink">How you compare 👀</div>
        <div className="overflow-hidden rounded-2xl border border-line-2 bg-white">
          {getLeaderboard(player).map((row, i) => (
            <div
              key={row.name + i}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5',
                i > 0 && 'border-t border-line',
                row.you && 'bg-coral/5',
              )}
            >
              <span className="tabnums w-5 text-center text-[13px] font-bold text-ink-faint">{i + 1}</span>
              <span className="text-lg">{row.emoji}</span>
              <span className={cn('flex-1 truncate text-[13.5px] font-bold', row.you ? 'text-coral' : 'text-ink')}>
                {row.you ? `${row.name} (you)` : row.name}
              </span>
              <span className="tabnums text-[13px] font-extrabold text-ink"><Money value={row.netWorth} compact /></span>
            </div>
          ))}
        </div>
      </div>

      {/* On-demand rules */}
      <button onClick={() => setRulesOpen((x) => !x)} className="pl-press flex w-full items-center justify-between rounded-2xl bg-grape/10 px-4 py-3 text-left">
        <span className="font-jakarta text-[14px] font-bold text-grape">📖 The Singapore rules, in plain English</span>
        <span className="text-grape">{rulesOpen ? '▲' : '▼'}</span>
      </button>
      {rulesOpen && (
        <div className="mt-2 space-y-2">
          {RULES.map((r) => (
            <div key={r.term} className="rounded-xl border border-line bg-white p-3">
              <div className="font-jakarta text-[13px] font-bold text-ink">{r.term}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{r.plain}</div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
