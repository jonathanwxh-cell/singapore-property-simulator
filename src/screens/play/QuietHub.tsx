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
import { getPlaySurfaceState } from '@/engine/playSurface';
import { getMonthlyIntentOptions } from '@/engine/monthlyIntents';
import { getLastTurnRecap } from '@/engine/turnRecap';

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
  const applyMonthlyIntent = useGameStore((s) => s.applyMonthlyIntent);
  const rngSeed = useGameStore((s) => s.rngSeed);
  const toast = useToast();
  const [showMonth, setShowMonth] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const moment = getMoment(player, rngSeed);
  const showMoment = moment && player.lastResolvedMomentTurn !== player.turnCount;
  const board = getPlaySurfaceState({ player });
  const intents = getMonthlyIntentOptions(player);
  const recap = getLastTurnRecap({ player, market, currentScenario: null });

  const chooseMoment = (m: { emoji: string; title: string }, c: MomentChoice) => {
    if (c.cashDelta > 0) playCoin(); else playPop();
    applyMoment(c.cashDelta, c.stressDelta);
    toast({ emoji: m.emoji, tone: c.cashDelta >= 0 ? 'good' : 'neutral', title: m.title, body: c.note });
  };

  const routeAction = (a: MonthAction) => {
    playPop();
    if (a.kind === 'browse' || a.kind === 'deploy') onOpen('buy');
    else onOpen('portfolio', a.propertyIndex);
  };

  const playIntent = (intentId: string) => {
    const intent = intents.find((candidate) => candidate.id === intentId);
    if (!intent) return;
    playPop();
    applyMonthlyIntent(intent);
    const nextPlayer = useGameStore.getState().player;
    toast({
      emoji: '🧭',
      tone: 'good',
      title: `${intent.label} played`,
      body: nextPlayer.life.lastMonthSummary?.notes[0] ?? 'The month advanced with your strategy applied.',
    });
  };

  const inspectIntent = (route: string) => {
    playPop();
    if (route.includes('propert') || route.includes('portfolio')) onOpen('portfolio');
    else if (route.includes('market')) onOpen('buy');
    else onOpen('you');
  };

  const burn = v.cashflow < 0 ? Math.abs(v.cashflow) : 0;
  const runwayMonths = burn > 0 ? Math.floor(v.available / burn) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      <section className="overflow-hidden rounded-[28px] border border-ink/10 bg-gradient-to-br from-ink via-[#243449] to-[#365b68] text-white shadow-sheet">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">{board.label} · {board.monthLabel}</div>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{board.title}</h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-white/72">{board.subtitle}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">{board.scene.label}</div>
              <div className="mt-0.5 max-w-[16rem] text-[12px] font-semibold text-white/85">{board.scene.detail}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Life journey">
            {board.timeline.map((stage) => (
              <div key={stage.id} className="min-w-0">
                <div className={cn(
                  'h-1.5 rounded-full',
                  stage.status === 'past' ? 'bg-money' : stage.status === 'current' ? 'bg-gold' : 'bg-white/15',
                )}>
                  {stage.status === 'current' && (
                    <div className="h-full rounded-full bg-gold" style={{ width: `${stage.progressPct}%` }} />
                  )}
                </div>
                <div className={cn('mt-1 truncate text-[9.5px] font-bold', stage.status === 'current' ? 'text-gold' : 'text-white/55')}>
                  {stage.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/10 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Choose this month’s strategy</div>
              <div className="text-[13px] font-semibold text-white/80">{board.prompt.title}</div>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/65">
              Choice → consequence → recap
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {board.choices.map((choice) => (
              <div
                key={choice.id}
                className={cn(
                  'rounded-2xl border p-3',
                  choice.recommended ? 'border-gold/70 bg-gold/15' : 'border-white/10 bg-white/[0.06]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13.5px] font-bold">{choice.label}</div>
                  {choice.recommended && <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-extrabold text-ink">BEST FIT</span>}
                </div>
                <p className="mt-1 line-clamp-2 min-h-8 text-[11.5px] leading-snug text-white/65">{choice.detail}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => playIntent(choice.intentId ?? choice.id)}
                    className="pl-press min-h-11 flex-1 rounded-xl bg-white px-2.5 py-2 text-[11.5px] font-extrabold text-ink"
                  >
                    Play month
                  </button>
                  <button
                    onClick={() => inspectIntent(choice.route)}
                    className="pl-press min-h-11 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] font-bold text-white/75"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {recap && (
        <div className="overflow-hidden rounded-2xl border border-line-2 bg-white">
          <button
            onClick={() => setShowRecap((value) => !value)}
            aria-expanded={showRecap}
            className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Consequence recap</div>
              <div className="truncate text-[13.5px] font-bold text-ink">{recap.title}</div>
            </div>
            <span className="flex shrink-0 items-center gap-2 text-[12px] font-bold text-grape">
              {showRecap ? 'Hide' : 'See what changed'}
              <ChevronDown size={16} className={cn('transition-transform', showRecap && 'rotate-180')} />
            </span>
          </button>
          {showRecap && (
            <div className="border-t border-line px-3.5 py-3">
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{recap.summary}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                {recap.facts.map((fact) => (
                  <div key={fact.label} className="rounded-xl bg-paper-2 p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{fact.label}</div>
                    <div className="mt-0.5 text-[13px] font-extrabold text-ink">{fact.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[12px] font-semibold text-grape">{recap.nextHint}</div>
            </div>
          )}
        </div>
      )}

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
