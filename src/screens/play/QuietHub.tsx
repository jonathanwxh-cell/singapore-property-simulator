import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Player, MarketState } from '@/game/types';
import { useGameStore } from '@/game/useGameStore';
import { Money, Delta } from '@/ui/Money';
import { useToast } from '@/ui/toastContext';
import { deriveView } from '@/game-ui/derive';
import { getMonthActions, type MonthAction } from '@/game-ui/actionsThisMonth';
import { getMoment, type MomentChoice } from '@/game-ui/moments';
import { playPop, playCoin } from '@/ui/sound';
import { cn } from '@/lib/utils';

export type Overlay = 'buy' | 'portfolio' | 'bank' | 'you';

const actionToneClass: Record<MonthAction['tone'], string> = {
  warn: 'border-loss/30 bg-loss-soft',
  good: 'border-money/30 bg-money-soft',
  info: 'border-line-2 bg-white',
};

export function QuietHub({
  player,
  market,
  onOpen,
}: {
  player: Player;
  market: MarketState;
  onOpen: (o: Overlay, focusIndex?: number) => void;
}) {
  const v = deriveView(player);
  const actions = getMonthActions(player);
  const applyMoment = useGameStore((s) => s.applyMoment);
  const rngSeed = useGameStore((s) => s.rngSeed);
  const toast = useToast();
  const [showMonth, setShowMonth] = useState(false);
  const [resolvedMomentTurn, setResolvedMomentTurn] = useState<number | null>(null);

  const moment = getMoment(player, rngSeed);
  const showMoment = moment && resolvedMomentTurn !== player.turnCount;

  const chooseMoment = (m: { emoji: string; title: string }, c: MomentChoice) => {
    if (c.cashDelta > 0) playCoin(); else playPop();
    applyMoment(c.cashDelta, c.stressDelta);
    toast({ emoji: m.emoji, tone: c.cashDelta >= 0 ? 'good' : 'neutral', title: m.title, body: c.note });
    setResolvedMomentTurn(player.turnCount);
  };

  const routeAction = (a: MonthAction) => {
    playPop();
    if (a.kind === 'browse' || a.kind === 'deploy') onOpen('buy');
    else onOpen('portfolio', a.propertyIndex);
  };

  const burn = v.cashflow < 0 ? Math.abs(v.cashflow) : 0;
  const runwayMonths = burn > 0 ? Math.floor(v.available / burn) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      {/* Danger: cash runway — concrete stakes when bleeding money */}
      {burn > 0 && (
        <motion.div
          initial={{ scale: 0.98 }} animate={{ scale: 1 }}
          className="rounded-2xl border border-loss/40 bg-loss-soft p-3.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div className="font-jakarta text-[14px] font-bold text-loss">
              {runwayMonths !== null && runwayMonths <= 0 ? 'Out of cash — sell or cut costs now!' : `Burning money — about ${runwayMonths} month${runwayMonths === 1 ? '' : 's'} of cash left`}
            </div>
          </div>
          <div className="mt-1 pl-7 text-[12px] font-medium text-loss/90">
            You're spending <Money value={burn} />/mo more than you earn. Rent out a place, sell, or pay down a loan before you go broke.
          </div>
        </motion.div>
      )}

      {/* A light life moment — a quick choice most months */}
      {showMoment && moment && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pl-card p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moment.emoji}</span>
            <div className="font-display text-[19px] font-bold leading-tight text-ink">{moment.title}</div>
          </div>
          <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">{moment.text}</p>
          <div className={cn('mt-3 grid gap-2', moment.choices.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {moment.choices.map((c, i) => (
              <button key={i} onClick={() => chooseMoment(moment, c)} className="pl-press rounded-2xl border border-line-2 bg-white p-3 text-left hover:border-coral">
                <div className="text-[13.5px] font-bold text-ink">{c.label}</div>
                {c.cashDelta !== 0 && (
                  <div className={cn('tabnums text-[12px] font-bold', c.cashDelta > 0 ? 'text-money' : 'text-loss')}>
                    {c.cashDelta > 0 ? '+' : '−'}<Money value={Math.abs(c.cashDelta)} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* On your plate — real decisions this month */}
      {actions.length > 0 && (
        <div>
          <div className="mb-1.5 px-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint">On your plate</div>
          <div className="space-y-2">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => routeAction(a)}
                className={cn('pl-press flex w-full items-center gap-3 rounded-2xl border p-3 text-left', actionToneClass[a.tone])}
              >
                <span className="text-xl">{a.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-jakarta text-[14px] font-bold text-ink">{a.title}</div>
                  <div className="truncate text-[12px] text-ink-soft">{a.hint}</div>
                </div>
                <span className="text-ink-faint" aria-hidden>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible "this month" cashflow (kept low-density by default) */}
      <div className="pl-card overflow-hidden">
        <button onClick={() => { playPop(); setShowMonth((x) => !x); }} className="flex w-full items-center justify-between p-3.5 text-left">
          <span className="font-jakarta text-[14px] font-bold text-ink">This month</span>
          <span className="flex items-center gap-1.5">
            <span className={cn('tabnums text-[14px] font-extrabold', v.cashflow >= 0 ? 'text-money' : 'text-loss')}>
              {v.cashflow >= 0 ? '+' : '−'}<Money value={Math.abs(v.cashflow)} />/mo
            </span>
            <ChevronDown size={16} className={cn('text-ink-faint transition-transform', showMonth && 'rotate-180')} />
          </span>
        </button>
        {showMonth && (
          <div className="grid grid-cols-2 gap-y-1.5 border-t border-line px-3.5 py-3 text-[13px]">
            <span className="text-ink-soft">Take-home pay</span><span className="text-right"><Delta value={v.takeHome} compact={false} /></span>
            {v.rental > 0 && (<><span className="text-ink-soft">Rent collected</span><span className="text-right"><Delta value={v.rental} compact={false} /></span></>)}
            {v.expenses > 0 && (<><span className="text-ink-soft">Loan payments</span><span className="text-right"><Delta value={-v.expenses} compact={false} /></span></>)}
            {v.ownership > 0 && (<><span className="text-ink-soft">Upkeep &amp; tax</span><span className="text-right"><Delta value={-v.ownership} compact={false} /></span></>)}
            <span className="text-ink-soft">Living costs</span><span className="text-right"><Delta value={-v.household} compact={false} /></span>
          </div>
        )}
      </div>

      {/* Market headline (one line) */}
      {market.lastHeadline && (
        <div className="rounded-2xl border border-line bg-white/70 px-3.5 py-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">📰 Word on the street</div>
          <div className="text-[13px] font-semibold text-ink">{market.lastHeadline}</div>
        </div>
      )}

      {/* Secondary nav */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { o: 'buy' as const, emoji: '🏠', label: 'Market' },
          { o: 'portfolio' as const, emoji: '🏢', label: 'Places', badge: player.properties.length },
          { o: 'bank' as const, emoji: '🏦', label: 'Bank' },
          { o: 'you' as const, emoji: '📊', label: 'You' },
        ].map((t) => (
          <button key={t.o} onClick={() => { playPop(); onOpen(t.o); }} className="pl-press relative rounded-2xl border border-line-2 bg-white py-2.5 text-center">
            {'badge' in t && (t.badge ?? 0) > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{t.badge}</span>
            )}
            <div className="text-xl">{t.emoji}</div>
            <div className="text-[11px] font-bold text-ink-soft">{t.label}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
