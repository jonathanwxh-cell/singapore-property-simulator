import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { readAutoSave } from '@/game/savePersistence';
import { StatusStrip } from './play/StatusStrip';
import { QuietHub, type Overlay } from './play/QuietHub';
import { DecisionCard } from './play/DecisionCard';
import { BuySheet } from './play/BuySheet';
import { PortfolioSheet } from './play/PortfolioSheet';
import { BankSheet } from './play/BankSheet';
import { YouSheet } from './play/YouSheet';
import { BigButton } from '@/ui/Button';
import { useToast } from '@/ui/Toast';
import { playWoosh, setSoundEnabled } from '@/ui/sound';
import { fireConfetti } from '@/ui/confetti';
import { formatCompactCurrency } from '@/lib/format';
import { selectNetWorth } from '@/engine/selectors';
import { rivalCrossing } from '@/game-ui/rivals';
import { newlyCompletedGoals, getCurrentGoal } from '@/game-ui/goals';
import type { Player, MarketState } from '@/game/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Play() {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.player);
  const market = useGameStore((s) => s.market);
  const currentScenario = useGameStore((s) => s.currentScenario);
  const isGameActive = useGameStore((s) => s.isGameActive);
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const advanceToNextNotableMonth = useGameStore((s) => s.advanceToNextNotableMonth);
  const loadGame = useGameStore((s) => s.loadGame);
  const toast = useToast();

  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(undefined);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const wasActive = useRef(isGameActive);

  const openOverlay = (o: Overlay, idx?: number) => { setFocusIndex(idx); setOverlay(o); };

  // Keep sound in sync with settings.
  useEffect(() => { setSoundEnabled(soundEnabled); }, [soundEnabled]);

  // On a cold load (e.g. refresh), revive the autosave or bounce home — so we
  // never flash the ending screen for someone mid-game.
  useEffect(() => {
    if (useGameStore.getState().isGameActive) return;
    const saved = readAutoSave();
    if (saved) loadGame(saved);
    else navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Latch the scenario locally so the outcome stays on screen even after the
  // store clears `currentScenario` on resolve.
  useEffect(() => { if (currentScenario) setActiveScenario(currentScenario); }, [currentScenario]);

  // Real game-over (active → inactive transition) → ending screen.
  useEffect(() => {
    if (wasActive.current && !isGameActive) navigate('/end');
    wasActive.current = isGameActive;
  }, [isGameActive, navigate]);

  // Resume banner: re-entering an in-progress run.
  useEffect(() => {
    const p = useGameStore.getState().player;
    if (p.turnCount > 0) {
      const g = getCurrentGoal(p);
      toast({ emoji: '👋', tone: 'neutral', title: 'Welcome back', body: g ? `Next goal: ${g.label}` : undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Market threats — make rate hikes & downturns bite (felt stakes).
  const pressure = (after: Player, m: MarketState) => {
    const rateUp = m.monthlyInterestRateChangePct ?? 0;
    const priceDown = m.monthlyPriceChangePct ?? 0;
    const hasLoan = after.loans.some((l) => !l.isPaid && l.remainingBalance > 0);
    if (hasLoan && rateUp > 0.08) {
      toast({ emoji: '⚠️', tone: 'bad', title: 'Interest rates rose', body: 'Your mortgage just got pricier — watch your runway.' });
    } else if (priceDown < -1.2 && after.properties.length > 0) {
      toast({ emoji: '📉', tone: 'bad', title: 'Market downturn', body: 'Property values slipped this month.' });
    }
  };

  // Shared celebration for crossing $1M, completing a goal rung, or overtaking
  // a rival. Confetti is reserved for genuinely earned beats (goal / $1M).
  const celebrate = (before: Player, after: Player) => {
    const beforeNet = selectNetWorth(before);
    const afterNet = selectNetWorth(after);
    const goalsDone = newlyCompletedGoals(before, after).filter((g) => g.id !== 'freedom');
    if (goalsDone.length > 0) {
      const g = goalsDone[goalsDone.length - 1];
      fireConfetti({ count: 80, y: 0.4 });
      toast({ emoji: g.emoji, tone: 'gold', title: `Goal complete — ${g.label}!`, body: g.reward });
    } else if (beforeNet < 1_000_000 && afterNet >= 1_000_000) {
      fireConfetti({ count: 100 });
      toast({ emoji: '💰', tone: 'gold', title: 'Millionaire!', body: 'Your net worth just crossed S$1,000,000.' });
    }
    const cross = rivalCrossing(beforeNet, afterNet, after);
    if (cross) toast({ emoji: cross.emoji, tone: 'gold', title: cross.title, body: cross.body });
  };

  const advance = () => {
    const before = useGameStore.getState().player;
    nextTurn();
    const after = useGameStore.getState().player;
    const afterMarket = useGameStore.getState().market;
    playWoosh();
    const cashDelta = Math.round(after.cash - before.cash);
    const label = `${MONTHS[(after.month - 1) % 12]} ${after.year}`;
    toast({
      emoji: '📅',
      tone: cashDelta >= 0 ? 'good' : 'bad',
      title: `${label} · ${cashDelta >= 0 ? '+' : '−'}${formatCompactCurrency(Math.abs(cashDelta))}`,
      body: afterMarket.lastHeadline ?? 'The month rolls on.',
    });
    pressure(after, afterMarket);
    celebrate(before, after);
  };

  // Fast-forward through quiet months until something notable happens.
  const skipAhead = () => {
    const before = useGameStore.getState().player;
    advanceToNextNotableMonth(6);
    const after = useGameStore.getState().player;
    const months = after.turnCount - before.turnCount;
    if (months <= 0) { advance(); return; }
    const afterMarket = useGameStore.getState().market;
    playWoosh();
    const cashDelta = Math.round(after.cash - before.cash);
    const label = `${MONTHS[(after.month - 1) % 12]} ${after.year}`;
    toast({
      emoji: '⏩',
      tone: cashDelta >= 0 ? 'good' : 'bad',
      title: `Skipped ${months} mo → ${label}`,
      body: afterMarket.lastHeadline ?? 'Time rolls on.',
    });
    celebrate(before, after);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <StatusStrip player={player} market={market} onOpenYou={() => openOverlay('you')} />

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-36 pt-3">
        {activeScenario ? (
          <DecisionCard scenarioId={activeScenario} onResolved={() => setActiveScenario(null)} />
        ) : (
          <QuietHub player={player} market={market} onOpen={openOverlay} />
        )}
      </main>

      {/* Heartbeat */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] safe-bottom bg-gradient-to-t from-paper via-paper/95 to-transparent px-4 pt-6">
        {activeScenario ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-1 rounded-[20px] border border-line-2 bg-white/80 px-4 py-3 text-center text-[13px] font-bold text-ink-soft backdrop-blur"
          >
            👆 Make your choice to continue
          </motion.div>
        ) : (
          <div className="flex items-stretch gap-2">
            <BigButton tone="coral" onClick={advance} sub="Salary in · market moves · life happens" icon={<span className="text-lg">▶</span>} className="flex-1">
              Next Month
            </BigButton>
            <button
              onClick={skipAhead}
              aria-label="Skip ahead through quiet months"
              className="pl-press grid w-16 shrink-0 place-items-center rounded-[20px] border border-line-2 bg-white text-ink-soft shadow-card"
            >
              <span className="text-lg">⏩</span>
              <span className="text-[10px] font-bold">Skip</span>
            </button>
          </div>
        )}
      </div>

      <BuySheet open={overlay === 'buy'} onClose={() => setOverlay(null)} />
      <PortfolioSheet open={overlay === 'portfolio'} onClose={() => setOverlay(null)} focusIndex={focusIndex} />
      <BankSheet open={overlay === 'bank'} onClose={() => setOverlay(null)} />
      <YouSheet open={overlay === 'you'} onClose={() => setOverlay(null)} />
    </div>
  );
}
